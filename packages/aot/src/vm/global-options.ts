import { FileEntry } from '@aurelia/runtime-node';

export interface IFileEntry {
  readonly mode?: 'script' | 'module';
  readonly standalone?: boolean;
  readonly file: string | FileEntry;
}

export interface IDirEntry {
  readonly dir: string;
}

export type IEntry = IFileEntry | IDirEntry;

export const enum EntryKind {
  scriptFile = 1,
  moduleFile = 2,
  packageDir = 3,
}

export class ScriptFileEntry implements IFileEntry {
  public get kind(): EntryKind.scriptFile { return EntryKind.scriptFile; }
  public get mode(): 'script' { return 'script'; }

  public constructor(
    public readonly file: string | FileEntry,
  ) {}
}

export class ModuleFileEntry implements IFileEntry {
  public get kind(): EntryKind.moduleFile { return EntryKind.moduleFile; }
  public get mode(): 'module' { return 'module'; }

  public constructor(
    public readonly standalone: boolean,
    public readonly file: string | FileEntry,
  ) {}
}

export class PackageDirEntry implements IDirEntry {
  public get kind(): EntryKind.packageDir { return EntryKind.packageDir; }
  public get mode(): 'module' { return 'module'; }

  public constructor(
    public readonly dir: string,
  ) {}
}

export type Entry = ScriptFileEntry | ModuleFileEntry | PackageDirEntry;

export interface IGlobalOptions {
  /**
   * Perform instantiation. This initializes the environment and fully resolves the module graph.
   *
   * Useful for any kind of ordinary project-wide static analysis, bundling, etc.
   * Also necessary for performing evaluation.
   *
   * Defaults to `true`.
   */
  readonly instantiate?: boolean;
  /**
   * Perform evaluation. This actually runs (most of) the code based on (not yet implemented) configuration flags.
   *
   * Useful for static site generation, runtime behavior analysis, intelligent tree-shaking, ec.
   * NOT YET READY FOR USE!
   *
   * Defaults to `false`.
   */
  readonly evaluate?: boolean;
  readonly entries: readonly IEntry[];
}

export class GlobalOptions implements IGlobalOptions {
  public constructor(
    public readonly instantiate: boolean,
    public readonly evaluate: boolean,
    public readonly entries: readonly Entry[],
  ) {}

  public static create({
    instantiate,
    evaluate,
    entries,
  }: IGlobalOptions): GlobalOptions {
    return new GlobalOptions(
      instantiate !== false,
      evaluate === true,
      entries.map(e => {
        if ('dir' in e) {
          return new PackageDirEntry(e.dir);
        }
        if (e.mode === 'script') {
          return new ScriptFileEntry(e.file);
        }
        return new ModuleFileEntry(e.standalone === true, e.file);
      }),
    );
  }
}
