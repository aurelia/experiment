import {
  ISystem,
  IProcess,
} from '@aurelia/runtime-node';
import {
  ILogger,
} from '@aurelia/kernel';

import {
  spawn,
} from 'child_process';

import {
  IBrowser,
} from './interfaces';

export class BrowserHost {
  public constructor(
    @ISystem
    private readonly sys: ISystem,
    @IProcess
    private readonly proc: IProcess,
    @ILogger
    private readonly logger: ILogger,
  ) {
    this.logger = logger.root.scopeTo('BrowserHost');
  }

  public async open(
    browser: IBrowser,
    url: string,
    ...flags: readonly string[]
  ): Promise<void> {
    const proc = this.proc;
    const logger = this.logger;

    const session = await browser.createSessionContext(url, flags);
    await session.init();

    const childProc = spawn(session.path, session.args);

    childProc.stdout.on('data', chunk => proc.stdout.write(chunk));
    childProc.stderr.on('data', chunk => proc.stderr.write(chunk));

    childProc.on('exit', (code, signal) => {
      logger.debug(`Process ${session.path} [${url}] exited with code ${code} and signal ${signal}`);

      setTimeout(() => {
        session.dispose().then(() => {
          proc.exit(code!);
        }).catch(console.error);
      }, 3000);
    });

    childProc.on('error', err => {
      proc.stderr.write(err.toString());
    });
  }
}
