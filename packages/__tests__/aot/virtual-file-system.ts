/* eslint-disable @typescript-eslint/require-await */
import { IFileSystem, Encoding, FileEntry, IDirent, IStats } from '@aurelia/runtime-node';

function toParts(path: string): string[] {
  // eslint-disable-next-line no-useless-escape
  return path.split(/[\\\/]/);
}

export class VirtualFileSystem implements IFileSystem {
  private readonly root: Map<string, any> = new Map();

  public addFile(path: string, content: string): void {
    const dir = this.getParentDir(path);

    dir.set(toParts(path)[0], content);
  }

  public async realpath(path: string): Promise<string> {
    return path;
  }

  public realpathSync(path: string): string {
    return path;
  }

  public async readdir(path: string): Promise<readonly string[]>;
  public async readdir(path: string, withFileTypes: true): Promise<readonly IDirent[]>;
  public async readdir(path: string, withFileTypes?: true): Promise<readonly string[] | readonly IDirent[]> {
    return this.readdirSync(path, withFileTypes);
  }

  public readdirSync(path: string): readonly string[];
  public readdirSync(path: string, withFileTypes: true): readonly IDirent[];
  public readdirSync(path: string, withFileTypes?: true): readonly string[] | readonly IDirent[] {
    // eslint-disable-next-line no-useless-escape
    const parts = path.split(/[\\\/]/);

    let dir = this.root;
    while (parts.length > 0) {
      const part = parts.shift()!;
      let subdir = dir.get(part);
      if (subdir === void 0) {
        dir.set(part, subdir = new Map());
      }
      dir = subdir;
    }

    const keys = Array.from(dir.keys());
    if (withFileTypes) {
      return keys.map(k => {
        return {
          name: k,
          isFile() {
            return typeof dir.get(k) === 'string';
          },
          isDirectory() {
            return dir.get(k) instanceof Map;
          },
          isSymbolicLink() {
            return false;
          },
        };
      });
    }
    return keys;
  }

  public async mkdir(path: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public mkdirSync(path: string): void {
    throw new Error('Method not implemented.');
  }

  public async isReadable(path: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  public isReadableSync(path: string): boolean {
    throw new Error('Method not implemented.');
  }

  public async fileExists(path: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  public fileExistsSync(path: string): boolean {
    throw new Error('Method not implemented.');
  }

  public async stat(path: string): Promise<IStats> {
    throw new Error('Method not implemented.');
  }

  public statSync(path: string): IStats {
    throw new Error('Method not implemented.');
  }

  public async lstat(path: string): Promise<IStats> {
    throw new Error('Method not implemented.');
  }

  public lstatSync(path: string): IStats {
    throw new Error('Method not implemented.');
  }

  public async readFile(path: string, encoding: Encoding, cache?: boolean, force?: boolean): Promise<string> {
    throw new Error('Method not implemented.');
  }

  public readFileSync(path: string, encoding: Encoding, cache?: boolean, force?: boolean): string {
    throw new Error('Method not implemented.');
  }

  public async ensureDir(path: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public ensureDirSync(path: string): void {
    throw new Error('Method not implemented.');
  }

  public async writeFile(path: string, content: string, encoding: Encoding): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public writeFileSync(path: string, content: string, encoding: Encoding): void {
    throw new Error('Method not implemented.');
  }

  public async rimraf(path: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async getRealPath(path: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  public getRealPathSync(path: string): string {
    throw new Error('Method not implemented.');
  }

  public async getChildren(path: string): Promise<readonly string[]> {
    throw new Error('Method not implemented.');
  }

  public getChildrenSync(path: string): readonly string[] {
    throw new Error('Method not implemented.');
  }

  public async getFiles(dir: string, loadContent?: boolean): Promise<readonly FileEntry[]> {
    throw new Error('Method not implemented.');
  }

  public getFilesSync(dir: string, loadContent?: boolean): readonly FileEntry[] {
    throw new Error('Method not implemented.');
  }

  public async getFile(dir: string, loadContent?: boolean): Promise<FileEntry> {
    throw new Error('Method not implemented.');
  }

  public getFileSync(dir: string, loadContent?: boolean): FileEntry {
    throw new Error('Method not implemented.');
  }

  private getParentDir(path: string): Map<string, any> {
    // eslint-disable-next-line no-useless-escape
    const parts = path.split(/[\\\/]/);

    let dir = this.root;
    while (parts.length > 1) {
      const part = parts.shift()!;
      let subdir = dir.get(part);
      if (subdir === void 0) {
        dir.set(part, subdir = new Map());
      }
      dir = subdir;
    }

    return dir;
  }
}
