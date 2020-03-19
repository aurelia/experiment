import {
  ILogger,
  DI,
} from '@aurelia/kernel';
import {
  TempDir,
  ISystem,
  IProcess,
  IFileSystem,
} from '@aurelia/runtime-node';

import {
  join,
} from 'path';

import {
  IBrowserSession,
  IBrowser,
} from './interfaces';

export class ChromeBrowserSession implements IBrowserSession {
  public constructor(
    private readonly logger: ILogger,
    private readonly tmp: TempDir,
    public readonly id: string,
    public readonly path: string,
    public readonly args: string[],
  ) {
    this.logger = logger.root.scopeTo('ChromeBrowserSession');
  }

  public async init(): Promise<void> {
    this.logger.debug(`Creating tempDir "${this.tmp.path}"`);

    await this.tmp.ensureExists();
  }

  public async dispose(): Promise<void> {
    this.logger.debug(`Removing tempDir "${this.tmp.path}"`);

    await this.tmp.dispose();
  }
}

const defaultChromeOptions: IChromeOptions = {
  canary: true,
  headless: false,
};

export const IChromeOptions = DI.createInterface<IChromeOptions>('IChromeOptions').withDefault(x => x.instance(defaultChromeOptions));

export interface IChromeOptions {
  readonly canary?: boolean;
  readonly headless?: boolean;
}

export class ChromeBrowser implements IBrowser {
  public readonly name = 'ChromeBrowser';
  protected readonly canary: boolean = false;

  public constructor(
    @ISystem
    private readonly sys: ISystem,
    @IProcess
    private readonly proc: IProcess,
    @IFileSystem
    private readonly fs: IFileSystem,
    @ILogger
    private readonly logger: ILogger,
    @IChromeOptions
    private readonly options: IChromeOptions,
  ) {
    this.options = { ...defaultChromeOptions, ...options };
    this.logger = logger.root.scopeTo('ChromeBrowser');
  }

  public async createSessionContext(
    url: string,
    flags: readonly string[],
  ): Promise<IBrowserSession> {
    const sys = this.sys;
    const proc = this.proc;
    const fs = this.fs;
    const env = proc.env;

    this.logger.debug(`createSessionContext(url=${url},flags=${flags})`);

    let paths: string[];

    const canary = this.options.canary!;
    const headless = this.options.headless!;

    if (env.CHROME_BIN !== void 0) {
      paths = [env.CHROME_BIN];
    } else if (sys.isWin) {
      paths = [
        env.LOCALAPPDATA,
        env.PROGRAMFILES,
        env['PROGRAMFILES(X86)'],
      ].filter(p => p !== void 0).map(p => join(p!, 'Google', canary ? 'Chrome SxS' : 'Chrome', 'Application', 'chrome.exe'));
    } else if (sys.isMac) {
      paths = [join(env.HOME!, 'Applications', canary ? 'Google Chrome Canary.app' : 'Google Chrome.app', 'Contents', 'MacOS', canary ? 'Google Chrome Canary' : 'Google Chrome')];
    } else {
      paths = [canary ? 'google-chrome-canary' : 'google-chrome', canary ? 'google-chrome-unstable' : 'google-chrome-stable'];
    }

    const name = sys.generateName();
    const tmp = new TempDir(fs, name);
    const path = await sys.which(paths);
    const args = [
      `--user-data-dir=${tmp.path}`,
      `--enable-automation`,
      `--no-default-browser-check`,
      `--no-first-run`,
      `--disable-default-apps`,
      `--disable-popup-blocking`,
      `--disable-translate`,
      `--disable-background-timer-throttling`,
      `--disable-renderer-backgrounding`,
      `--disable-device-discovery-notifications`,
      // Headless:
      ...(
        headless
          ? [
            '--headless',
            '--disable-gpu',
            '--disable-dev-shm-usage',
          ]
          : []
      ),

      // Debugging:
      // --remote-debugging-port=9222
      ...flags,
      url,
    ];

    this.logger.debug(`Opening "${path}"`);

    return new ChromeBrowserSession(this.logger, tmp, name, path, args);
  }
}
