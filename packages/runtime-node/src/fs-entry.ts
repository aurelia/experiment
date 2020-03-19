import {
  Writable,
  PLATFORM,
  join,
} from '@aurelia/kernel';

import {
  FileKind,
  IFileSystem,
} from './interfaces';
import {
  normalizePath,
} from './path-utils';

import {
  basename,
  dirname,
} from 'path';
import {
  promises,
} from 'fs';

const { readdir } = promises;

export function isFile(entry: FSEntry): entry is FileEntry {
  return entry.flags === FSFlags.file;
}

export function isDir(entry: FSEntry): entry is DirEntry {
  return entry.flags === FSFlags.dir;
}

// Don't change these values as they correspond to underlying node stat.mode property
export const enum FSFlags {
  fileOrDir = 0b1100000000000000,
  file      = 0b1000000000000000,
  dir       = 0b0100000000000000,
}

export class DirEntry {
  public get flags(): FSFlags.dir { return FSFlags.dir; }
  /**
   * The base name (last path segment) of this entry.
   */
  public readonly name: string;
  /**
   * The resolved `FSEntry` from `realpath`. If this is not a symlink, then this property circularly references this instance.
   */
  public readonly real: DirEntry;
  public readonly isSymlink: boolean;
  private _symlinks: DirEntry[] | undefined = void 0;
  public get symlinks(): readonly DirEntry[] {
    return this._symlinks ?? PLATFORM.emptyArray;
  }
  public get hasSymlinks(): boolean {
    return this.symlinks.length > 0;
  }

  public constructor(
    /**
     * The full, absolute path of this entry.
     */
    public readonly path: string,
    real: DirEntry | undefined,
  ) {
    this.name = basename(path);
    if (real === void 0) {
      this.real = this;
      this.isSymlink = false;
    } else {
      this.real = real;
      this.isSymlink = true;

      if (real._symlinks === void 0) {
        real._symlinks = [this];
      } else {
        real._symlinks.push(this);
      }
    }
  }

  public async getEntries(resolver: FSEntryResolver): Promise<readonly FSEntry[]> {
    const path = this.path;
    const names = await readdir(path);
    return Promise.all(names.map(async name => resolver.getEntry(join(path, name))));
  }

  public dispose(): void {
    if (this.isSymlink) {
      this.real._symlinks!.splice(this.real._symlinks!.indexOf(this), 1);
    } else {
      this._symlinks = void 0;
    }
    (this as Writable<this>).real = (void 0)!;
  }
}

function getExtension(name: string): string {
  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex <= 0) {
    return '';
  }

  const lastPart = name.slice(lastDotIndex);
  switch (lastPart) {
    case '.ts':
      return name.endsWith('.d.ts') ? '.d.ts' : '.ts';
    case '.map': {
      const extensionlessName = name.slice(0, lastDotIndex);
      const secondDotIndex = extensionlessName.lastIndexOf('.');
      if (secondDotIndex === -1) {
        return '.map';
      }
      return name.slice(secondDotIndex);
    }
    default:
      return lastPart;
  }
}

function getFileKind(ext: string): FileKind {
  switch (ext) {
    case '.js':
    case '.ts':
    case '.d.ts':
    case '.jsx':
    case '.tsx':
      return FileKind.Script;
    case '.html':
      return FileKind.Markup;
    case '.css':
      return FileKind.Style;
    case '.json':
      return FileKind.JSON;
    default:
      return FileKind.Unknown;
  }
}

export class FileEntry {
  public get flags(): FSFlags.file { return FSFlags.file; }
  /**
   * The full, absolute path (either real or symlink) to the folder containing the file.
   *
   * @example
   * 'd:/foo/bar.ts' // 'd:/foo' is the dir
   */
  public readonly dir: string;
  /**
   * The base name (last path segment) of this file, including extension.
   *
   * @example
   * './foo/bar.ts' // 'bar.ts' is the name
   */
  public readonly name: string;
  /**
   * The file extension, including the period. For .d.ts files, the whole part ".d.ts" must be included.
   *
   * @example
   * './foo/bar.ts' // '.ts' is the extension
   * './foo/bar.d.ts' // '.d.ts' is the extension
   */
  public readonly ext: string;
  /**
   * The leaf file name, excluding the extension.
   *
   * @example
   * './foo/bar.ts' // 'bar' is the shortName
   */
  public readonly shortName: string;
  /**
   * Similar to `shortName`, but includes the rest of the path including the root.
   *
   * Used for conventional matching, e.g. "try adding .js, .ts, /index.js", etc.
   */
  public readonly shortPath: string;
  public readonly kind: FileKind;
  /**
   * The resolved `FSEntry` from `realpath`. If this is not a symlink, then this property circularly references this instance.
   */
  public readonly real: FileEntry;
  public readonly isSymlink: boolean;
  private _symlinks: FileEntry[] | undefined = void 0;
  public get symlinks(): readonly FileEntry[] {
    return this._symlinks ?? PLATFORM.emptyArray;
  }
  public get hasSymlinks(): boolean {
    return this.symlinks.length > 0;
  }

  public constructor(
    /**
     * The full, absolute path (either real or symlink) of this file.
     */
    public readonly path: string,
    real: FileEntry | undefined,
  ) {
    if (path.includes('\\')) {
      path = this.path = normalizePath(path);
    }
    this.dir = normalizePath(dirname(path));
    this.name = basename(path);
    this.ext = getExtension(this.name);
    this.shortName = this.name.slice(0, -this.ext.length);
    this.shortPath = `${this.dir}/${this.shortName}`;
    this.kind = getFileKind(this.ext);

    if (real === void 0) {
      this.real = this;
      this.isSymlink = false;
    } else {
      this.real = real;
      this.isSymlink = true;

      if (real._symlinks === void 0) {
        real._symlinks = [this];
      } else {
        real._symlinks.push(this);
      }
    }
  }

  public dispose(): void {
    if (this.isSymlink) {
      this.real._symlinks!.splice(this.real._symlinks!.indexOf(this), 1);
    } else {
      this._symlinks = void 0;
    }
    (this as Writable<this>).real = (void 0)!;
  }
}

export type FSEntry = FileEntry | DirEntry;

export class FSEntryResolver {
  private readonly realPathCache: Map<string, string> = new Map();
  private readonly entryCache: Map<string, FSEntry> = new Map();

  public constructor(
    @IFileSystem
    private readonly fs: IFileSystem,
  ) {}

  public async getEntry(path: string): Promise<FSEntry> {
    path = normalizePath(path);

    const entryCache = this.entryCache;
    let entry = entryCache.get(path);
    if (entry === void 0) {
      const realPathCache = this.realPathCache;
      let realPath = realPathCache.get(path);
      if (realPath === void 0) {
        realPathCache.set(path, realPath = normalizePath(await this.fs.realpath(path)));
      }

      let realEntry = entryCache.get(realPath);
      if (realEntry === void 0) {
        const stats = await this.fs.stat(realPath);
        switch (stats.mode & FSFlags.fileOrDir) {
          case FSFlags.file:
            realEntry = new FileEntry(
              /* path */realPath,
              /* real */void 0,
            );
            break;
          case FSFlags.dir:
            realEntry = new DirEntry(
              /* path */realPath,
              /* real */void 0,
            );
            break;
          default:
            throw new Error(`Invalid entry type, mode=${stats.mode}`);
        }
        entryCache.set(realPath, realEntry);
      }

      if (path === realPath) {
        entry = realEntry;
      } else {
        switch (realEntry.flags) {
          case FSFlags.file:
            entry = new FileEntry(
              /* path */realPath,
              /* real */realEntry,
            );
            break;
          case FSFlags.dir:
            entry = new DirEntry(
              /* path */realPath,
              /* real */realEntry,
            );
            break;
        }
        entryCache.set(path, entry);
      }
    }

    return entry;
  }

  public removeEntry(entry: FSEntry): void {
    const realPathCache = this.realPathCache;
    const entryCache = this.entryCache;

    realPathCache.delete(entry.path);
    entryCache.delete(entry.path);
    entry.dispose();
  }
}
