import {
  DI,
  LogLevel,
  ColorOptions,
  Registration,
  IContainer,
  ILogger,
  PLATFORM,
  format,
  IDisposable,
  Writable,
  ILogEvent,
  ILogConfig,
  LogConfig,
  ISink,
  ConsoleSink,
  bound,
} from '@aurelia/kernel';
import {
  ServiceHost,
  $Any,
} from '@aurelia/aot';
import {
  IFileSystem,
  NodeFileSystem,
  FileEntry,
  Encoding,
} from '@aurelia/runtime-node';
import {
  resolve,
  join,
} from 'path';
import {
  appendFileSync,
} from 'fs';

class TestMetadataNegative {
  public constructor(
    public readonly phase: 'parse' | 'early' | 'resolution' | 'runtime',
    public readonly type: string,
  ) {}
}

class TestMetadata {
  public constructor(
    public readonly negative: TestMetadataNegative | null,
    public readonly features: readonly string[],
    public readonly flags: readonly string[],
  ) {}

  public static from(content: string): TestMetadata | null {
    const start = content.indexOf('/*---');
    const end = content.indexOf('---*/');
    if (start >= 0 && end >= start) {
      const banner = content.slice(start + '/*---'.length, end);
      const lines = banner.split('\n');

      let negative: TestMetadataNegative | null = null;
      const negativeIndex = lines.findIndex(l => l.startsWith('negative:'));
      if (negativeIndex >= 0) {
        const [, phase] = lines[negativeIndex + 1].split(': ');
        const [, type] = lines[negativeIndex + 2].split(': ');
        negative = new TestMetadataNegative(phase as 'parse' | 'early' | 'resolution' | 'runtime', type);
      }

      let features: string[] = [];
      const featuresIndex = lines.findIndex(l => l.startsWith('features: '));
      if (featuresIndex >= 0) {
        const featureList = lines[featuresIndex].split(': ');
        features = featureList[1].slice(1, -2).split(', ');
      }

      let flags: string[] = [];
      const flagsIndex = lines.findIndex(l => l.startsWith('flags: '));
      if (flagsIndex >= 0) {
        const flagList = lines[flagsIndex].split(': ');
        flags = flagList[1].slice(1, -2).split(', ');
      }

      return new TestMetadata(negative, features, flags);
    }

    return null;
  }
}

const excludedFeatures = [
  'import.meta',
  // Not yet implemented, see https://tc39.es/proposal-dynamic-import
  'dynamic-import',
];

class TestCase implements IDisposable {
  public readonly meta: TestMetadata | null;
  public readonly files: readonly FileEntry[];

  private _host: ServiceHost | null = null;
  public get host(): ServiceHost {
    let host = this._host;
    if (host === null) {
      host = this._host = this.container.get(ServiceHost);
    }
    return host;
  }

  public constructor(
    public readonly container: IContainer,
    public readonly logger: ILogger,
    public readonly file: FileEntry,
    public readonly prerequisites: readonly FileEntry[],
  ) {
    const fs = container.get(IFileSystem);
    this.meta = TestMetadata.from(fs.readFileSync(file.path, Encoding.utf8));
    this.files = [...prerequisites, file];
  }

  // eslint-disable-next-line @typescript-eslint/promise-function-async
  public async run(): Promise<$Any> {
    return (await this.host.execute({
      evaluate: true,
      entries: this.files.map(x => ({ file: x, mode: 'script' })),
    })).result;
  }

  public dispose(
    this: Writable<Partial<TestCase>>
  ): void {
    this.meta = void 0;
    this.files = void 0;
    if (this['_host'] !== null) {
      this['_host']!.dispose();
      this['_host'] = void 0;
    }
    this.container = void 0;
    this.logger = void 0;
    this.file = void 0;
    this.prerequisites = void 0;
  }
}

function compareFiles(a: FileEntry, b: FileEntry): number {
  const aPath = a.path.toLowerCase();
  const bPath = b.path.toLowerCase();
  const aLen = aPath.length;
  const bLen = bPath.length;
  let aCh = 0;
  let bCh = 0;

  for (let i = 0; i < aLen; ++i) {
    if (i <= bLen) {
      aCh = aPath.charCodeAt(i);
      bCh = bPath.charCodeAt(i);
      if (aCh < bCh) {
        return -1;
      } else if (aCh > bCh) {
        return 1;
      }
    } else {
      return 1;
    }
  }
  return -1;
}

class TestStats {
  public pass: number = 0;
  public fail: number = 0;
  public error: number = 0;
  public skip: number = 0;

  private get $pass(): string { return this.pass.toString().padStart(4, ' '); }
  private get $fail(): string { return this.fail.toString().padStart(4, ' '); }
  private get $error(): string { return this.error.toString().padStart(4, ' '); }
  private get $skip(): string { return this.skip.toString().padStart(4, ' '); }

  public total: number = 0;

  public get isDone(): boolean {
    return this.pass + this.fail + this.error + this.skip === this.total;
  }

  public get isPass(): boolean {
    return this.fail === 0 && this.error === 0;
  }

  public constructor(
    public readonly dir: string,
    public readonly name: string,
  ) {}

  public toString(): string {
    return `${this.isPass ? format.green('PASS') : format.red('FAIL')} - [pass:${this.$pass} fail:${this.$fail} error:${this.$error} skip:${this.$skip}] - ${this.name}`;
  }
}

class TestReporter {
  private readonly dirs: Record<string, TestStats> = {};
  private readonly totals: TestStats = new TestStats('', 'Total');

  public constructor(
    private readonly logger: ILogger,
  ) {}

  public register(tc: TestCase): TestCase {
    const dirs = this.dirs;
    const totals = this.totals;
    const file = tc.file;
    let stats = dirs[file.dir];
    if (stats === void 0) {
      stats = dirs[file.dir] = new TestStats(file.dir, file.path.split('/').slice(0, -1).join('/'));
    }
    ++totals.total;
    ++stats.total;
    return tc;
  }

  public pass(tc: TestCase): void {
    this.progress(tc, 'pass');
  }

  public fail(tc: TestCase): void {
    this.progress(tc, 'fail');
  }

  public error(tc: TestCase): void {
    this.progress(tc, 'error');
  }

  public skip(tc: TestCase): void {
    this.progress(tc, 'skip');
  }

  private progress(tc: TestCase, type: 'pass' | 'fail' | 'error' | 'skip'): void {
    const stats = this.dirs[tc.file.dir];
    const totals = this.totals;
    ++stats[type];
    ++totals[type];
    if (stats.isDone) {
      this.report(stats);
    }
    if (totals.isDone) {
      this.reportTotals(totals);
    }
  }

  private report(stats: TestStats): void {
    this.logger.info(stats.toString());
  }

  private reportTotals(stats: TestStats): void {
    this.logger.info(`------ FINISHED -------`);
    this.logger.info(stats.toString());
  }
}

function toString(x: { toString(): string }): string {
  return x.toString();
}

const utf8Encoding = { encoding: 'utf8' };

export class BufferedFileSink {
  private readonly buffer: ILogEvent[] = [];
  private queued: boolean = false;

  public emit(event: ILogEvent): void {
    const buffer = this.buffer;

    buffer.push(event);

    if (buffer.length > 100) {
      this.flush(false);
    } else if (!this.queued) {
      this.queued = true;
      process.nextTick(this.flush, true);
    }
  }

  @bound
  private flush(fromTick: boolean): void {
    const buffer = this.buffer;

    if (fromTick) {
      this.queued = false;
    }
    if (buffer.length > 0) {
      const output = buffer.map(toString).join('\n');
      buffer.length = 0;
      appendFileSync('aot.log', output, utf8Encoding);
    }
  }
}

class TestRunner {
  public readonly container: IContainer;
  public readonly fs: IFileSystem;
  public readonly logger: ILogger;

  public constructor() {
    const container = this.container = DI.createContainer();
    container.register(
      Registration.instance(ILogConfig, new LogConfig(ColorOptions.noColors, LogLevel.info)),
      Registration.instance(ISink, new BufferedFileSink()),
      Registration.instance(ISink, new ConsoleSink(console)),
      Registration.singleton(IFileSystem, NodeFileSystem),
    );
    this.fs = container.get(IFileSystem);
    this.logger = container.get(ILogger).scopeTo('TestRunner');
  }

  public async load(): Promise<void> {
    const fs = this.fs;
    const logger = this.logger;

    const root = resolve(__dirname, '..', '..', '..', 'test262');

    const testDir = join(root, 'test');
    const annexBDir = join(testDir, 'annexB');
    const builtInsDir = join(testDir, 'built-ins', 'Array');
    const intl402Dir = join(testDir, 'intl402');
    const languageDir = join(testDir, 'language');

    const harnessDir = join(root, 'harness');
    const harnessFiles = await fs.getFiles(harnessDir, true);
    const staFile = harnessFiles.find(x => x.name === 'sta.js');
    const assertFile = harnessFiles.find(x => x.name === 'assert.js');
    const prerequisites = [staFile, assertFile];

    const now = PLATFORM.now();

    const files: FileEntry[] = [
      // ...(await fs.getFiles(join(languageDir, 'eval-code', 'indirect'), true)).filter(x => x.shortName.endsWith('realm'))
    ];
    for (const dir of [
      // annexBDir,
      // builtInsDir,
      // intl402Dir,
      languageDir,
    ]) {
      logger.info(`Loading test files from ${dir}`);

      files.push(...(await fs.getFiles(dir, true)).filter(x => !x.shortName.endsWith('FIXTURE')));
    }

    logger.info(`Discovered ${files.length} test files in ${Math.round(PLATFORM.now() - now)}ms`);

    const reporter = new TestReporter(logger);

    let testCases = files
      .slice()
      .sort(compareFiles)
      .map(x => reporter.register(new TestCase(this.container, logger, x, prerequisites)));

    testCases = testCases
      .filter(tc => {
        switch (tc.meta?.negative?.phase?.trim()) {
          case 'early':
          case 'parse':
            // These error types should be caught by typescript
            reporter.skip(tc);
            tc.dispose();
            return false;
        }

        if (excludedFeatures.some(x => tc.meta.features.includes(x))) {
          reporter.skip(tc);
          tc.dispose();
          return false;
        }

        return true;
      });

    for (const tc of testCases) {
      try {
        const result = await tc.run();

        if (tc.meta.negative === null) {
          if (result.isAbrupt) {
            reporter.fail(tc);

            let message: string;
            let stack: string;
            let type: string;
            const value = result['[[Value]]'];
            if (value instanceof Error) {
              message = value.message;
              stack = value.stack;
              type = value.name;
            } else {
              message = (value as unknown as string);
              stack = result.stack;
              type = (result as unknown as { Type: string }).Type;
            }
            logger.error(`${format.red('FAIL')} - ${tc.file.path}\n  Expected no error, but got: ${type}: ${message}\n${stack}\n`);
          } else {
            reporter.pass(tc);

            logger.debug(`${format.green('PASS')} - ${tc.file.path}`);
          }
        } else {
          if (result.isAbrupt) {
            if (result['[[Value]]'].name === tc.meta.negative.type) {
              reporter.pass(tc);

              logger.debug(`${format.green('PASS')} - ${tc.file.path}`);
            } else {
              reporter.fail(tc);

              logger.error(`${format.red('FAIL')} - ${tc.file.path} (expected error ${tc.meta.negative.type}, but got: ${result['[[Value]]'].name})`);
            }
          } else {
            reporter.fail(tc);

            logger.error(`${format.red('FAIL')} - ${tc.file.path} (expected error ${tc.meta.negative.type}, but got none)`);
          }
        }
      } catch (err) {
        reporter.error(tc);

        logger.fatal(`${format.red('Host error')}: ${err.message}\n${err.stack}\n\nTest file: ${tc.file.path}\n${tc.meta?.negative?.phase}`);
      } finally {
        tc.dispose();
      }
    }
  }
}

(async function () {
  const runner = new TestRunner();

  await runner.load();
})().catch(err => {
  console.error(err);
  process.exit(-1);
});
