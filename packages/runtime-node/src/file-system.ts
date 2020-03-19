import {
  accessSync,
  constants,
  exists,
  existsSync,
  lstatSync,
  mkdirSync,
  promises,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'fs';
import {
  dirname,
  join,
} from 'path';
import {
  ILogger,
  Char,
} from '@aurelia/kernel';

import {
  IFileSystem,
  Encoding,
  IDirent,
  IStats,
} from './interfaces';
import {
  FileEntry, FSFlags,
} from './fs-entry';
import {
  normalizePath,
  joinPath,
} from './path-utils';

const {
  access,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rmdir,
  stat,
  unlink,
  writeFile,
} = promises;

function compareFilePath(a: FileEntry, b: FileEntry) {
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
}

function shouldTraverse(path: string) {
  // By default convention we don't traverse any path that starts with a dot because those shouldn't contain application code
  // For example: .git, .vscode, .circleci, etc.
  // We also exclude node_modules. But everything else is traversed by default.
  // TODO: make this configurable
  return path.charCodeAt(0) !== Char.Dot && path !== 'node_modules';
}

const tick = {
  current: void 0 as (undefined | Promise<void>),
  wait() {
    if (tick.current === void 0) {
      tick.current = new Promise(function (resolve) {
        setTimeout(function () {
          tick.current = void 0;
          resolve();
        }, 0);
      });
    }
    return tick.current;
  }
};

export class NodeFileSystem implements IFileSystem {
  private readonly childrenCache: Map<string, string[]> = new Map();
  private readonly realPathCache: Map<string, string> = new Map();
  private readonly contentCache: Map<string, string> = new Map();

  private pendingReads: number = 0;
  private maxConcurrentReads: number = 0;

  public constructor(
    @ILogger private readonly logger: ILogger,
  ) {
    this.logger = logger.scopeTo(this.constructor.name);
    this.logger.info('constructor');
  }

  public async realpath(path: string): Promise<string> {
    this.logger.trace(`realpath(path: ${path})`);

    return realpath(path);
  }

  public realpathSync(path: string): string {
    this.logger.trace(`realpathSync(path: ${path})`);

    return realpathSync(path);
  }

  public async readdir(path: string): Promise<readonly string[]>;
  public async readdir(path: string, withFileTypes: true): Promise<readonly IDirent[]>;
  public async readdir(path: string, withFileTypes?: true): Promise<readonly string[] | readonly IDirent[]> {
    this.logger.trace(`readdir(path: ${path}, withFileTypes: ${withFileTypes})`);

    if (withFileTypes === true) {
      return readdir(path, { withFileTypes: true });
    }

    return readdir(path);
  }

  public readdirSync(path: string): readonly string[];
  public readdirSync(path: string, withFileTypes: true): readonly IDirent[];
  public readdirSync(path: string, withFileTypes?: true): readonly string[] | readonly IDirent[] {
    this.logger.trace(`readdirSync(path: ${path}, withFileTypes: ${withFileTypes})`);

    if (withFileTypes === true) {
      return readdirSync(path, { withFileTypes: true });
    }

    return readdirSync(path);
  }

  public async mkdir(path: string): Promise<void> {
    this.logger.trace(`mkdir(path: ${path})`);

    return mkdir(path, { recursive: true });
  }

  public mkdirSync(path: string): void {
    this.logger.trace(`mkdirSync(path: ${path})`);

    mkdirSync(path, { recursive: true });
  }

  public async isReadable(path: string): Promise<boolean> {
    this.logger.trace(`isReadable(path: ${path})`);

    try {
      await access(path, constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  public isReadableSync(path: string): boolean {
    this.logger.trace(`isReadableSync(path: ${path})`);

    try {
      accessSync(path, constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  public async fileExists(path: string): Promise<boolean> {
    this.logger.trace(`fileExists(path: ${path})`);

    try {
      return (await stat(path)).isFile();
    } catch (err) {
      return false;
    }
  }

  public fileExistsSync(path: string): boolean {
    this.logger.trace(`fileExistsSync(path: ${path})`);

    try {
      return statSync(path).isFile();
    } catch (err) {
      return false;
    }
  }

  public async stat(path: string): Promise<IStats> {
    this.logger.trace(`stat(path: ${path})`);

    return stat(path);
  }

  public statSync(path: string): IStats {
    this.logger.trace(`statSync(path: ${path})`);

    return statSync(path);
  }

  public async lstat(path: string): Promise<IStats> {
    this.logger.trace(`lstat(path: ${path})`);

    return lstat(path);
  }

  public lstatSync(path: string): IStats {
    this.logger.trace(`lstatSync(path: ${path})`);

    return lstatSync(path);
  }

  public async readFile(path: string, encoding: Encoding, cache: boolean = false, force: boolean = false): Promise<string> {
    this.logger.trace(`readFile(path: ${path}, encoding: ${encoding}, cache: ${cache}, force: ${force})`);

    const contentCache = this.contentCache;

    let content = contentCache.get(path);
    if (content === void 0 || force) {
      try {
        while (this.maxConcurrentReads > 0 && this.maxConcurrentReads < this.pendingReads) {
          // eslint-disable-next-line no-await-in-loop
          await tick.wait();
        }
        ++this.pendingReads;
        content = await readFile(path, encoding) as string;
        --this.pendingReads;
      } catch (err) {
        if (err.code === 'EMFILE') {
          --this.pendingReads;
          this.maxConcurrentReads = this.pendingReads;
          await tick.wait();
          // eslint-disable-next-line @typescript-eslint/return-await
          return this.readFile(path, encoding, cache, force);
        }
        throw err;
      }

      if (cache) {
        contentCache.set(path, content);
      }
    }

    return content;
  }

  public readFileSync(path: string, encoding: Encoding, cache: boolean = false, force: boolean = false): string {
    this.logger.trace(`readFileSync(path: ${path}, encoding: ${encoding}, cache: ${cache}, force: ${force})`);

    const contentCache = this.contentCache;
    let content = contentCache.get(path);
    if (content === void 0 || force) {
      content = readFileSync(path, encoding);
      if (cache) {
        contentCache.set(path, content);
      }
    }

    return content;
  }

  public async ensureDir(path: string): Promise<void> {
    this.logger.trace(`ensureDir(path: ${path})`);

    if (await new Promise<boolean>(res => { exists(path, res); })) {
      return;
    }

    return this.mkdir(path);
  }

  public ensureDirSync(path: string): void {
    this.logger.trace(`ensureDirSync(path: ${path})`);

    if (existsSync(path)) {
      return;
    }

    this.mkdirSync(path);
  }

  public async writeFile(path: string, content: string, encoding: Encoding): Promise<void> {
    this.logger.trace(`writeFile(path: ${path}, content: ${content}, encoding: ${encoding})`);

    await this.ensureDir(dirname(path));

    return writeFile(path, content, { encoding });
  }

  public writeFileSync(path: string, content: string, encoding: Encoding): void {
    this.logger.trace(`readFileSync(path: ${path}, content: ${content}, encoding: ${encoding})`);

    this.ensureDirSync(dirname(path));

    writeFileSync(path, content, encoding);
  }

  public async rimraf(path: string): Promise<void> {
    this.logger.trace(`rimraf(path: ${path})`);

    try {
      const stats = await lstat(path);
      if (stats.isDirectory()) {
        await Promise.all((await readdir(path)).map(async x => this.rimraf(join(path, x))));
        await rmdir(path);
      } else if (stats.isFile() || stats.isSymbolicLink()) {
        await unlink(path);
      }
    } catch (err) {
      this.logger.error(`rimraf failed`, err);
    }
  }

  public async getRealPath(path: string): Promise<string> {
    path = normalizePath(path);

    const realPathCache = this.realPathCache;
    let real = realPathCache.get(path);
    if (real === void 0) {
      real = normalizePath(await realpath(path));
      realPathCache.set(path, real);
    }

    return real;
  }

  public getRealPathSync(path: string): string {
    path = normalizePath(path);

    const realPathCache = this.realPathCache;
    let real = realPathCache.get(path);
    if (real === void 0) {
      real = normalizePath(realpathSync(path));
      realPathCache.set(path, real);
    }

    return real;
  }

  public async getChildren(path: string): Promise<string[]> {
    const childrenCache = this.childrenCache;
    let children = childrenCache.get(path);
    if (children === void 0) {
      children = (await readdir(path)).filter(shouldTraverse);
      childrenCache.set(path, children);
    }

    return children;
  }

  public getChildrenSync(path: string): string[] {
    const childrenCache = this.childrenCache;
    let children = childrenCache.get(path);
    if (children === void 0) {
      children = readdirSync(path).filter(shouldTraverse);
      childrenCache.set(path, children);
    }

    return children;
  }

  public async getFiles(root: string, loadContent: boolean = false): Promise<FileEntry[]> {
    const files: FileEntry[] = [];
    const seen = new Set<string>();

    const walk = async (dir: string, name: string): Promise<void> => {
      const path = await this.getRealPath(joinPath(dir, name));

      if (!seen.has(path)) {
        seen.add(path);

        const stats = await stat(path);

        switch (stats.mode & FSFlags.fileOrDir) {
          case FSFlags.file: {
            if (loadContent) {
              await this.readFile(path, Encoding.utf8, true);
            }
            const file = new FileEntry(path, void 0);
            if (file.ext.length > 0) {
              files.push(file);
            }
            break;
          }
          case FSFlags.dir: {
            await Promise.all((await this.getChildren(path)).map(async x => walk(path, x)));
            break;
          }
          default:
            throw new Error(`Invalid entry type, mode=${stats.mode}`);
        }
      }
    };

    await Promise.all((await this.getChildren(root)).map(async x => walk(root, x)));

    return files.sort(compareFilePath);
  }

  public getFilesSync(root: string, loadContent: boolean = false): FileEntry[] {
    const files: FileEntry[] = [];
    const seen = new Set<string>();

    const walk = (dir: string, name: string): void => {
      const path = this.getRealPathSync(joinPath(dir, name));

      if (!seen.has(path)) {
        seen.add(path);

        const stats = statSync(path);

        switch (stats.mode & FSFlags.fileOrDir) {
          case FSFlags.file: {
            if (loadContent) {
              this.readFileSync(path, Encoding.utf8, true);
            }
            const file = new FileEntry(path, void 0);
            if (file.ext.length > 0) {
              files.push(file);
            }
            break;
          }
          case FSFlags.dir: {
            this.getChildrenSync(path).forEach(x => { walk(path, x); });
            break;
          }
          default:
            throw new Error(`Invalid entry type, mode=${stats.mode}`);
        }
      }
    };

    this.getChildrenSync(root).forEach(x => { walk(root, x); });

    return files.sort(compareFilePath);
  }

  public async getFile(path: string, loadContent: boolean = false): Promise<FileEntry> {
    if (!(await this.isReadable(path))) {
      throw new Error(`FileEntry does not exit: "${path}"`);
    }

    path = await this.getRealPath(path);
    const stats = await stat(path);

    if (!stats.isFile()) {
      throw new Error(`Not a file: "${path}"`);
    }

    const file = new FileEntry(path, void 0);
    if (loadContent) {
      await this.readFile(path, Encoding.utf8, true);
    }
    return file;
  }

  public getFileSync(path: string, loadContent: boolean = false): FileEntry {
    if (!this.isReadableSync(path)) {
      throw new Error(`FileEntry does not exit: "${path}"`);
    }

    path = this.getRealPathSync(path);
    const stats = statSync(path);

    if (!stats.isFile()) {
      throw new Error(`Not a file: "${path}"`);
    }

    const file = new FileEntry(path, void 0);
    if (loadContent) {
      this.readFileSync(path, Encoding.utf8, true);
    }
    return file;
  }
}

