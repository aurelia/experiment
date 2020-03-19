import { IFileSystem, IProcess, ISystem } from './interfaces';
import { normalize, delimiter, join } from 'path';
import { tmpdir } from 'os';

function trimWrappingQuotes(value: string): string {
  // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
  if (value[0] === '"' && value[value.length - 1] === '"') {
    return value.slice(1, -1);
  }
  return value;
}

export class TempDir {
  public readonly dir: string;
  public readonly path: string;

  public constructor(
    public readonly fs: IFileSystem,
    public readonly name: string,
  ) {
    this.dir = tmpdir();
    this.path = join(this.dir, name);
  }

  public async ensureExists(): Promise<void> {
    await this.fs.ensureDir(this.path);
  }

  public async dispose(): Promise<void> {
    // TODO: make this work
    // await this.fs.rimraf(this.path);
  }
}

export class System implements ISystem {
  public readonly isWin: boolean;
  public readonly isMac: boolean;
  public readonly isLinux: boolean;

  public constructor(
    @IProcess
    private readonly proc: IProcess,
    @IFileSystem
    private readonly fs: IFileSystem,
  ) {
    const platform = proc.platform;
    const env = proc.env;
    this.isWin = platform === 'win32' || env.OSTYPE === 'cygwin' || env.OSTYPE === 'msys';
    this.isMac = platform === 'darwin';
    this.isLinux = !this.isWin && !this.isMac;
  }

  public async which(cmd: string | string[]): Promise<string> {
    if (Array.isArray(cmd)) {
      let err: Error = (void 0)!;
      for (const c of cmd) {
        try {
          // eslint-disable-next-line sonarjs/prefer-immediate-return,no-await-in-loop
          const result = await this.which(c);
          return result;
        } catch (e) {
          err = e;
        }
      }

      throw err;
    }

    const proc = this.proc;
    const env = proc.env;

    if (this.isWin) {
      let paths: string[];

      if (cmd.includes('/') || cmd.includes('\\')) {
        paths = [cmd];
      } else {
        const key = Object.keys(env).find(key => key.toUpperCase() === 'PATH');
        if (key === void 0) {
          paths = [join(proc.cwd(), cmd)];
        } else {
          const envPaths = (env[key]!).split(delimiter).map(trimWrappingQuotes);
          paths = [proc.cwd(), ...envPaths].map(p => join(p, cmd));
        }
      }

      let exts: string[];
      if (env.PATHEXT === void 0) {
        exts = ['.EXE', '.CMD', '.BAT', '.COM'];
      } else {
        exts = env.PATHEXT.split(delimiter);
      }
      const hasValidExt = exts.some(ext => cmd.toLowerCase().endsWith(ext.toLowerCase()));

      for (const path of paths) {
        if (hasValidExt && await this.isExe(path)) {
          return normalize(path);
        }

        for (const ext of exts) {
          const pathWithExt = `${path}${ext}`;
          if (await this.isExe(pathWithExt)) {
            return normalize(pathWithExt);
          }
        }
      }

      for (const path of paths) {
        if (await this.isExe(path)) {
          return normalize(path);
        }
      }
    } else {
      if (cmd.includes('/')) {
        if (await this.isExe(cmd)) {
          return normalize(cmd);
        }
      } else {
        if (env.PATH !== void 0) {
          const paths = env.PATH.split(delimiter).map(trimWrappingQuotes).map(p => join(p, cmd));
          for (const path of paths) {
            if (await this.isExe(path)) {
              return normalize(path);
            }
          }
        }
      }
    }

    const err = new Error(`not found: ${cmd}`);
    (err as Error & { code: string })['code'] = 'ENOENT';

    throw err;
  }

  public generateName(): string {
    return `au-${Date.now()}`;
  }

  private async isExe(path: string): Promise<boolean> {
    const fs = this.fs;
    if (await fs.isReadable(path)) {
      const stat = await fs.stat(path);
      if (this.isWin) {
        return stat.isSymbolicLink() || stat.isFile();
      }

      if (stat.isFile()) {
        const mode = stat.mode;
        const uid = stat.uid;
        const gid = stat.gid;

        const myUid = process.getuid();
        const myGid = process.getgid();

        return (
          (mode & 0o001) > 0 ||
          ((mode & 0o010) > 0 && gid === myGid) ||
          ((mode & 0o100) > 0 && uid === myUid) ||
          ((mode & 0o110) > 0 && myUid === 0)
        );
      }
    }

    return false;
  }
}
