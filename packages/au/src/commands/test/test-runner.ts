import {
  ServiceHost,
  Workspace,
} from '@aurelia/aot';
import {
  IFileSystem,
  Encoding,
  RuntimeNodeConfiguration,
  IRequestHandler,
  FileServer,
  normalizePath,
  IHttpServer,
  IProcess,
} from '@aurelia/runtime-node';
import {
  ILogger,
  IContainer,
  LogLevel,
  Registration,
  Char,
  DI,
  transient,
} from '@aurelia/kernel';
import {
  TAPOutput,
  TAPParser,
  ITAPChannel,
  TAPLine,
  TAPLineKind,
  TAPBailOut,
  TAPComment,
  TAPPlan,
  TAPTestPoint,
  TAPVersion,
} from '@aurelia/testing';

import * as WS from 'ws';
import {
  join,
} from 'path';
import {
  ChromeBrowser,
} from './chrome';
import {
  BrowserHost,
} from './host';

import {
  CLICommand,
} from '../../args';
import { EventEmitter } from 'events';

export class TestRunnerConfig {
  public get entryFile(): string {
    return this.cmd.getValue('entryFile');
  }
  public get scratchDir(): string {
    return this.cmd.getValue('scratchDir');
  }
  public get reporter(): 'per-line' | 'progress' {
    return this.cmd.getValue('reporter');
  }
  public get coverage(): boolean {
    return this.cmd.getValue('coverage');
  }
  public get watch(): boolean {
    return this.cmd.getValue('watch');
  }
  public get exit(): boolean {
    return this.cmd.getValue('exit');
  }
  public get logLevel(): 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'none' {
    return this.cmd.getValue('logLevel');
  }

  private constructor(
    private readonly cmd: CLICommand,
  ) {}

  public static from(cmd: CLICommand): TestRunnerConfig {
    return new TestRunnerConfig(cmd);
  }
}

function getLogLevel(str: TestRunnerConfig['logLevel']): LogLevel {
  switch (str) {
    case 'trace': return LogLevel.trace;
    case 'debug': return LogLevel.debug;
    case 'info': return LogLevel.info;
    case 'warn': return LogLevel.warn;
    case 'error': return LogLevel.error;
    case 'fatal': return LogLevel.fatal;
    case 'none': return LogLevel.none;
  }
}

export function computeRelativeDirectory(source: string, target: string): string {
  let prevSlashIndex = 0;
  let slashCount = 0;
  let ch = 0;
  for (let i = 0, ii = source.length; i < ii; ++i) {
    ch = source.charCodeAt(i);
    if (ch === Char.Slash) {
      prevSlashIndex = i;
    }
    if (ch !== target.charCodeAt(i)) {
      for (; i < ii; ++i) {
        if (source.charCodeAt(i) === Char.Slash) {
          ++slashCount;
        }
      }

      break;
    }
  }

  if (ch !== Char.Slash) {
    ++slashCount;
  }
  const prefix = slashCount === 0 ? './' : '../'.repeat(slashCount);
  return `${prefix}${target.slice(prevSlashIndex + 1)}`;
}

export class TestRunner {
  private readonly proc: IProcess;

  public constructor(
    @IContainer
    private readonly container: IContainer,
  ) {
    this.proc = container.get(IProcess);
  }

  public static create(container = DI.createContainer()): TestRunner {
    return new TestRunner(container);
  }

  public async run(config: TestRunnerConfig): Promise<void> {
    const ctx = TestRunnerContext.create(config, this.container);

    const ws = await ctx.emit();
    const rootCtrl = ws.dirController!;

    await ctx.startServer();
    await ctx.navigateToTestFile();

    if (config.watch) {
      rootCtrl.subscribe(async e => {
        await ctx.emit();
        ctx.navigateToTestFile();
      });
    }

    if (config.exit) {
      this.proc.exit();
    }
  }
}

function generateClientPageMarkup(
  testFileUrl: string,
): string {

  return `
  <!DOCTYPE html>
  <html>
    <head>
    </head>
    <body>
      <script type="module">
        import '${testFileUrl}';
      </script>
    </body>
  </html>
  `;
}

type TAPLineKindLookup = {
  [TAPLineKind.bailOut]: TAPBailOut;
  [TAPLineKind.comment]: TAPComment;
  [TAPLineKind.plan]: TAPPlan;
  [TAPLineKind.testPoint]: TAPTestPoint;
  [TAPLineKind.version]: TAPVersion;
};

export interface ITAPEvents {
  on<T extends TAPLineKind>(
    kind: T,
    listener: (line: TAPLineKindLookup[T]) => void,
  ): void;

  off<T extends TAPLineKind>(
    kind: T,
    listener: (line: TAPLineKindLookup[T]) => void,
  ): void;
}

export class TAPChannel implements ITAPChannel, ITAPEvents {
  private readonly ee: EventEmitter = new EventEmitter();

  public send(item: TAPLine): void {
    this.ee.emit(item.kind.toString(), item);
  }

  public on<T extends TAPLineKind>(
    kind: T,
    listener: (line: TAPLineKindLookup[T]) => void,
  ): void {
    this.ee.on(kind.toString(), listener);
  }

  public off<T extends TAPLineKind>(
    kind: T,
    listener: (line: TAPLineKindLookup[T]) => void,
  ): void {
    this.ee.off(kind.toString(), listener);
  }
}

export type TestEventType = '';

@transient
export class TestRunnerContext {
  private realPort: number = -1;
  public entryFile!: string;
  public scratchDir!: string;

  private started: boolean = false;
  private ws: WS = (void 0)!;
  private output: TAPOutput = (void 0)!;

  public constructor(
    @IContainer
    private readonly container: IContainer,
    @IFileSystem
    private readonly fs: IFileSystem,
    private readonly serviceHost: ServiceHost,
    @ILogger
    private readonly logger: ILogger,
    private readonly browser: ChromeBrowser,
    private readonly browserHost: BrowserHost,
    @IHttpServer
    private readonly server: IHttpServer,
    private readonly tap: TAPChannel,
  ) {
    this.tap = container.get(TAPChannel);
  }

  public static create(
    {
      entryFile,
      scratchDir,
      logLevel,
    }: TestRunnerConfig,
    container: IContainer,
  ): TestRunnerContext {
    entryFile = normalizePath(entryFile);
    scratchDir = normalizePath(scratchDir);

    // wireup
    container.register(
      RuntimeNodeConfiguration.create({
        port: 0,
        level: getLogLevel(logLevel),
        root: scratchDir,
      }),
      Registration.singleton(IRequestHandler, FileServer),
    );

    const ctx = container.get(TestRunnerContext);
    ctx.entryFile = entryFile;
    ctx.scratchDir = scratchDir;

    return ctx;
  }

  public async emit(): Promise<Workspace> {
    const scratchDir = this.scratchDir;
    const entryFile = this.entryFile;

    this.logger.info(`Emitting to scratchDir ${scratchDir} from entryFile ${entryFile}`);

    // compile/bundle
    const result = await this.serviceHost.execute({ entries: [{ file: entryFile }] });
    await result.ws.emit({ outDir: scratchDir });

    // generate html file to run
    const clientPageFile = join(scratchDir, 'index.html');

    const testFileUrl = `.${entryFile.replace(result.ws.lastCommonRootDir, '').replace(/\.ts$/, '.js')}`;
    const clientPageMarkup = generateClientPageMarkup(testFileUrl);

    await this.fs.writeFile(clientPageFile, clientPageMarkup, Encoding.utf8);
    return result.ws;
  }

  public async startServer(): Promise<void> {
    this.resetTAPOutput();

    // serve the files
    const { realPort } = await this.server.start(ws => {
      this.ws = ws;
      ws.on('message', (msg: string) => {
        TAPParser.parse(msg, this.output).flush();
      });
    });

    this.realPort = realPort;
  }

  public async navigateToTestFile(): Promise<void> {
    if (!this.started) {
      this.started = true;
      // navigate to the html file
      await this.browserHost.open(this.browser, `http://localhost:${this.realPort}/index.html`);
    } else {
      this.resetTAPOutput();

      this.logger.info(`Refreshing..`);

      this.ws.send('refresh');
    }
  }

  private resetTAPOutput(): void {
    this.output = new TAPOutput(this.container.get(TAPChannel));
  }
}
