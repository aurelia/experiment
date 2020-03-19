/* eslint-disable no-await-in-loop */
import {
  IContainer,
  Key,
  Resolved,
  IResolver,
  Constructable,
  IFactory,
  Transformer,
  Registration,
  ILogger,
  Writable,
  Char,
} from '@aurelia/kernel';
import {
  FileEntry,
  normalizePath,
  joinPath,
  isRelativeModulePath,
  resolvePath,
  FileKind,
  IFileSystem,
  Encoding,
  NPMPackage,
  NPMPackageLoader,
  DirController,
} from '@aurelia/runtime-node';

import {
  JSDOM,
} from 'jsdom';
import {
  createSourceFile,
  ScriptTarget,
  Printer,
  createPrinter,
} from 'typescript';
import {
  dirname,
  basename,
  join,
} from 'path';

import {
  $ESModule,
  $ESScript,
  $DocumentFragment,
  $$ESModuleOrScript,
} from './ast/modules';
import {
  IModule,
  DeferredModule,
  Realm,
} from './realm';
import {
  MaybePromise,
  awaitIfPromise,
  computeCommonRootDirectory,
  trueThunk,
} from './util';
import {
  GlobalOptions,
  IGlobalOptions,
  EntryKind,
} from './global-options';

import {
  $String,
} from './types/string';
import {
  $Error,
} from './types/error';

import {
  $CompilerOptions,
} from './interfaces';
import {
  PatternMatcher,
} from './pattern-matcher';
import {
  TransformationContext,
  HydrateContext,
} from './ast/_shared';

export interface IEmitOptions {
  readonly outDir: string;
}

export class EmitOptions implements IEmitOptions {
  public constructor(
    public readonly outDir: string,
  ) {}

  public static create({
    outDir,
  }: IEmitOptions): EmitOptions {
    return new EmitOptions(
      outDir,
    );
  }
}

export class Workspace implements IContainer {
  public readonly options: GlobalOptions;

  private _jsdom: JSDOM | null = null;
  public get jsdom(): JSDOM {
    let jsdom = this._jsdom;
    if (jsdom === null) {
      jsdom = this._jsdom = new JSDOM('');
    }
    return jsdom;
  }

  private readonly _modules: $ESModule[] = [];
  public get modules(): readonly $ESModule[] {
    return this._modules;
  }

  private readonly _scripts: $ESScript[] = [];
  public get scripts(): readonly $ESScript[] {
    return this._scripts;
  }

  private readonly _files: FileEntry[] = [];
  public get files(): readonly FileEntry[] {
    return this._files;
  }

  public lastCommonRootDir: string = '';
  public dirController: DirController | undefined = void 0;

  private readonly logger: ILogger;
  private readonly fs: IFileSystem;
  private readonly loader: NPMPackageLoader;
  private readonly container: IContainer;

  private readonly compilerOptionsCache: Map<string, $CompilerOptions> = new Map();
  private readonly fileCache: Map<string, FileEntry> = new Map();
  private readonly moduleCache: Map<string, IModule> = new Map();
  private readonly scriptCache: Map<string, $ESScript> = new Map();

  public constructor(
    parentContainer: IContainer,
    options: IGlobalOptions,
  ) {
    this.logger = parentContainer.get(ILogger).root.scopeTo('Workspace');
    this.fs = parentContainer.get(IFileSystem);
    this.loader = parentContainer.get(NPMPackageLoader);
    options = this.options = GlobalOptions.create(options);

    this.container = parentContainer.createChild();
    this.container.register(Registration.instance(GlobalOptions, options));
    this.container.register(Registration.instance(Workspace, this));
  }

  public addModule(m: $ESModule): void {
    this._modules.push(m);
  }

  public addScript(s: $ESScript): void {
    this._scripts.push(s);
  }

  // http://www.ecma-international.org/ecma-262/#sec-hostresolveimportedmodule
  public ResolveImportedModule(
    realm: Realm,
    referencingModule: $ESModule,
    $specifier: $String,
  ): MaybePromise<IModule | $Error> {
    const specifier = normalizePath($specifier['[[Value]]']);
    const isRelative = isRelativeModulePath(specifier);
    const pkg = referencingModule.pkg;

    // Single file scenario; lazily resolve the import
    if (pkg === null) {
      if (!isRelative) {
        throw new Error(`Absolute module resolution not yet implemented for single-file scenario.`);
      }
      // TODO: this is currently just for the 262 test suite but we need to resolve the other stuff properly too for end users that don't want to use the package eager load mechanism
      const dir = referencingModule.$file.dir;
      const name = basename(specifier);
      const path = `${joinPath(dir, name)}.js`;
      const file = new FileEntry(path, void 0);
      return this.getESModule(realm, file, null);
    }

    if (isRelative) {
      this.logger.debug(`[ResolveImport] resolving internal relative module: '${specifier}' for ${referencingModule.$file.name}`);

      const filePath = resolvePath(dirname(referencingModule.$file.path), specifier);

      // Conditional matcher is a perf optimization because this is a very hot path. We can get rid of this once we have efficient glob matching though.
      const matcher = specifier.includes('.')
        ? (x: FileEntry) => (x.shortPath === filePath || x.path === filePath) && x.kind === FileKind.Script
        : (x: FileEntry) => x.shortPath === filePath && x.kind === FileKind.Script;
      let file = awaitIfPromise(
        pkg.controller.findFile(matcher, true),
        trueThunk,
        maybeScriptFile => {
          if (maybeScriptFile === void 0) {
            return awaitIfPromise(
              pkg.controller.findFile(x => (x.shortPath === filePath || x.path === filePath) && x.kind === FileKind.Markup, true),
              trueThunk,
              maybeMarkupFile => {
                if (maybeMarkupFile === void 0) {
                  return awaitIfPromise(
                    pkg.controller.findFile(x => (x.shortPath === filePath || x.path === filePath), true),
                    trueThunk,
                    maybeUnknownFile => {
                      if (maybeUnknownFile === void 0) {
                        throw new Error(`Cannot find file "${filePath}" (imported as "${specifier}" by "${referencingModule.$file.name}")`);
                      }
                      return maybeUnknownFile;
                    },
                  );
                }
                return maybeMarkupFile;
              },
            );
          }
          return maybeScriptFile;
        },
      ) as MaybePromise<FileEntry>;

      return awaitIfPromise(
        file,
        trueThunk,
        $file => {
          switch ($file.kind) {
            case FileKind.Script:
              return this.getESModule(realm, $file, pkg);
            case FileKind.Markup:
              return this.getHTMLModule(realm, $file, pkg);
            default: {
              let deferred = this.moduleCache.get($file.path);
              if (deferred === void 0) {
                deferred = new DeferredModule($file, realm);
                this.moduleCache.set($file.path, deferred);
              }

              return deferred;
            }
          }
        },
      );
    } else {
      const pkgDep = pkg.deps.find(n => n.refName === specifier || specifier.startsWith(`${n.refName}/`));
      if (pkgDep === void 0) {
        this.logger.debug(`[ResolveImport] resolving internal absolute module: '${specifier}' for ${referencingModule.$file.name}`);

        const matcher = PatternMatcher.getOrCreate(referencingModule.compilerOptions, this.container);
        if (matcher !== null) {
          const file = matcher.findMatch(pkg.files, specifier);
          return this.getESModule(realm, file, pkg);
        } else {
          throw new Error(`Cannot resolve absolute file path without path mappings in tsconfig`);
        }
      } else {

        let $externalPkg: MaybePromise<NPMPackage>;
        if (pkg.loader.hasCachedPackage(pkgDep.refName)) {
          this.logger.debug(`[ResolveImport] resolving external absolute module: '${specifier}' for ${referencingModule.$file.name} (${pkgDep.refName} is already cached)`);
          $externalPkg = pkg.loader.getCachedPackage(pkgDep.refName);
        } else {
          this.logger.debug(`[ResolveImport] resolving external absolute module: '${specifier}' for ${referencingModule.$file.name} (${pkgDep.refName} is not yet cached)`);
          $externalPkg = pkg.loader.loadPackage(pkgDep);
        }

        return awaitIfPromise(
          $externalPkg,
          trueThunk,
          externalPkg => {
            if (pkgDep.refName !== specifier) {
              if (externalPkg.entryFile.shortName === specifier) {
                return this.getESModule(realm, externalPkg.entryFile, externalPkg);
              }

              return awaitIfPromise(
                pkg.controller.findFile(x => x.shortPath === externalPkg.dir && x.ext === '.js', true),
                trueThunk,
                maybeFile => {
                  if (maybeFile === void 0) {
                    const indexModulePath = joinPath(externalPkg.dir, 'index');
                    return awaitIfPromise(
                      pkg.controller.findFile(x => x.shortPath === indexModulePath && x.ext === '.js', true),
                      trueThunk,
                      maybeIndexFile => {
                        if (maybeIndexFile === void 0) {
                          const partialAbsolutePath = joinPath('node_modules', specifier);
                          return awaitIfPromise(
                            pkg.controller.findFile(x => x.shortPath.endsWith(partialAbsolutePath) && x.ext === '.js', true),
                            trueThunk,
                            maybeNestedFile => {
                              if (maybeNestedFile === void 0) {
                                throw new Error(`Unable to resolve file "${externalPkg.dir}" or "${indexModulePath}" (refName="${pkgDep.refName}", entryFile="${externalPkg.entryFile.shortPath}", specifier=${specifier})`);
                              }
                              return this.getESModule(realm, maybeNestedFile, externalPkg);
                            },
                          );
                        }
                        return this.getESModule(realm, maybeIndexFile, externalPkg);
                      },
                    );
                  }
                  return this.getESModule(realm, maybeFile, externalPkg);
                },
              ) as MaybePromise<$ESModule>;
            } else {
              this.logger.debug(`Returning external package entryFile: ${externalPkg.entryFile.path} from package: ${externalPkg.pkgName}`);
              return this.getESModule(realm, externalPkg.entryFile, externalPkg);
            }
          },
        );
      }
    }
  }

  public async loadEntryFiles(
    realm: Realm,
  ): Promise<readonly $$ESModuleOrScript[]> {
    const files: $$ESModuleOrScript[] = [];
    const entries = this.options.entries;
    for (const entry of entries) {
      switch (entry.kind) {
        case EntryKind.scriptFile:
          files.push(await this.loadEntryFileFromScriptFile(realm, entry.file));
          break;
        case EntryKind.moduleFile:
          files.push(await this.loadEntryFileFromModuleFile(realm, entry.file, entry.standalone));
          break;
        case EntryKind.packageDir:
          files.push(await this.loadEntryFileFromPackageDir(realm, entry.dir));
          break;
      }
    }

    return files;
  }

  public async loadEntryFileFromScriptFile(
    realm: Realm,
    fileOrPath: string | FileEntry,
  ): Promise<$ESScript> {
    const file = await this.getFile(fileOrPath);

    this.logger.info(`Loading entry file from script file: ${file.path}`);

    return this.getESScript(realm, fileOrPath);
  }

  public async loadEntryFileFromModuleFile(
    realm: Realm,
    fileOrPath: string | FileEntry,
    standalone?: boolean,
  ): Promise<$ESModule> {
    const file = await this.getFile(fileOrPath);

    if (standalone === true) {
      this.logger.info(`Loading entry file from module file (standalone): ${file.path}`);

      return this.getESModule(realm, file, null);
    } else {
      this.logger.info(`Loading entry file from module file: ${file.path}`);

      const pkg = await this.loadEntryPackage(file);
      return this.getESModule(realm, file, pkg);
    }
  }

  public async loadEntryFileFromPackageDir(
    realm: Realm,
    dir: string,
  ): Promise<$ESModule> {
    this.logger.info(`Loading entry file from package dir: "${dir}"`);

    const pkg = await this.loadEntryPackage(dir);
    return this.getESModule(realm, pkg.entryFile, pkg);
  }

  public async emit(
    opts: IEmitOptions,
  ): Promise<void> {
    const options = EmitOptions.create(opts);
    const outDir = options.outDir;
    const fs = this.fs;

    const transformContext = new TransformationContext();
    const printer: Printer = createPrinter({ removeComments: false });

    const inputs = [
      ...this._modules,
      ...this._scripts,
    ];

    const commonRootDir = this.lastCommonRootDir = computeCommonRootDirectory(inputs.map(getDirFromFile));
    const commonRootDirLength = commonRootDir.length;

    this.logger.info(`Emitting ${inputs.length} files (with common root dir: "${commonRootDir}") to: "${outDir}"`);

    const emitObjs = inputs.map(input => EmitObject.create(
      /* fs                  */fs,
      /* input               */input,
      /* transformContext    */transformContext,
      /* printer             */printer,
      /* outDir              */outDir,
      /* commonRootDirLength */commonRootDirLength,
    ));
    await Promise.all(emitObjs.map(x => x.emit()));

    this.logger.info(`Emit finished`);
  }

  // #region IServiceLocator api
  public has<K extends Key>(key: K | Key, searchAncestors: boolean): boolean {
    return this.container.has(key, searchAncestors);
  }

  public get<K extends Key>(key: K | Key): Resolved<K> {
    return this.container.get(key);
  }

  public getAll<K extends Key>(key: K | Key): readonly Resolved<K>[] {
    return this.container.getAll(key);
  }
  // #endregion

  // #region IContainer api
  public register(...params: unknown[]): IContainer {
    return this.container.register(...params);
  }

  public registerResolver<K extends Key, T = K>(key: K, resolver: IResolver<T>): IResolver<T> {
    return this.container.registerResolver(key, resolver);
  }

  public registerTransformer<K extends Key, T = K>(key: K, transformer: Transformer<T>): boolean {
    return this.container.registerTransformer(key, transformer);
  }

  public getResolver<K extends Key, T = K>(key: K | Key, autoRegister?: boolean): IResolver<T> | null {
    return this.container.getResolver(key, autoRegister);
  }

  public getFactory<T extends Constructable>(key: T): IFactory<T> | null {
    return this.container.getFactory(key);
  }

  public createChild(): IContainer {
    return this.container.createChild();
  }

  // #endregion

  public loadEntryPackage(pathOrFile: string | FileEntry): Promise<NPMPackage> {
    this.logger.trace(`loadEntryPackage(path="${typeof pathOrFile === 'string' ? pathOrFile : pathOrFile.path}")`);

    return this.loader.loadEntryPackage(pathOrFile);
  }

  public getHTMLModule(
    realm: Realm,
    file: FileEntry,
    pkg: NPMPackage,
  ): MaybePromise<$DocumentFragment> {
    const hm = this.moduleCache.get(file.path);
    if (hm === void 0) {
      return this.getHTMLModuleCore(realm, file, pkg).then($hm => {
        this.moduleCache.set(file.path, $hm);
        return $hm;
      });
    }

    return hm as $DocumentFragment;
  }

  private async getHTMLModuleCore(
    realm: Realm,
    file: FileEntry,
    pkg: NPMPackage,
  ): Promise<$DocumentFragment> {
    const sourceText = await this.fs.readFile(file.path, Encoding.utf8, true);
    const template = this.jsdom.window.document.createElement('template');
    template.innerHTML = sourceText;
    return new $DocumentFragment(
      /* logger */this.logger,
      /* $file  */file,
      /* node   */template.content,
      /* realm  */realm,
      /* pkg    */pkg,
    );
  }

  public getESScript(
    realm: Realm,
    fileOrPath: FileEntry | string,
  ): MaybePromise<$ESScript> {
    const file = this.getFile(fileOrPath);
    if (file instanceof Promise) {
      return file.then(async $file => {
        const script = await this.getESScriptCore(realm, $file);
        this._scripts.push(script);
        this.scriptCache.set($file.path, script);
        return script;
      });
    }

    const script = this.scriptCache.get(file.path);
    if (script === void 0) {
      return this.getESScriptCore(realm, file).then($script => {
        this._scripts.push($script);
        this.scriptCache.set(file.path, $script);
        return $script;
      });
    }

    return script as $ESScript;
  }

  private async getESScriptCore(
    realm: Realm,
    file: FileEntry,
  ): Promise<$ESScript> {
    const sourceText = await this.fs.readFile(file.path, Encoding.utf8, true);
    const sf = createSourceFile(file.path, sourceText, ScriptTarget.Latest, false);
    return $ESScript.create(
      /* logger */this.logger,
      /* $file  */file,
      /* node   */sf,
      /* realm  */realm,
      /* ws     */this,
    ).hydrate(HydrateContext.None);
  }

  public getESModule(
    realm: Realm,
    file: FileEntry,
    pkg: NPMPackage | null,
  ): MaybePromise<$ESModule> {
    const cachedMod = this.moduleCache.get(file.path);
    if (cachedMod === void 0) {
      return this.getESModuleCore(realm, file, pkg).then(mod => {
        this._modules.push(mod);
        this.moduleCache.set(file.path, mod);

        this.logger.debug(`[getESModule] caching and returning module ${file.path}`);
        return mod;
      });
    }

    this.logger.debug(`[getESModule] returning module ${file.path} from cache`);
    return cachedMod as $ESModule;
  }

  private async getESModuleCore(
    realm: Realm,
    file: FileEntry,
    pkg: NPMPackage | null,
  ): Promise<$ESModule> {
    const compilerOptions = await this.getCompilerOptions(file.path, pkg);
    const sourceText = await this.fs.readFile(file.path, Encoding.utf8, true);
    const sf = createSourceFile(file.path, sourceText, ScriptTarget.Latest, false);
    return $ESModule.create(
      /* logger          */this.logger,
      /* $file           */file,
      /* node            */sf,
      /* realm           */realm,
      /* pkg             */pkg,
      /* compilerOptions */compilerOptions,
      /* ws              */this,
    ).hydrate(HydrateContext.None);
  }

  public getCompilerOptions(
    path: string,
    pkg: NPMPackage | null,
  ): MaybePromise<$CompilerOptions> {
    // TODO: this is a very simple/naive impl, needs more work for inheritance etc
    path = normalizePath(path);

    const cachedOptions = this.compilerOptionsCache.get(path);
    if (cachedOptions === void 0) {
      return this.getCompilerOptionsCore(path, pkg).then(options => {
        this.compilerOptionsCache.set(path, options);
        return options;
      });
    }

    return cachedOptions;
  }

  private async getCompilerOptionsCore(
    path: string,
    pkg: NPMPackage | null,
  ): Promise<$CompilerOptions> {
    const dir = normalizePath(dirname(path));
    if (dir === path || pkg === null/* TODO: maybe still try to find tsconfig? */) {
      return {
        __dirname: '',
      };
    }

    const tsConfigPath = joinPath(path, 'tsconfig.json');
    const tsConfigFile = pkg.files.find(x => x.path === tsConfigPath);
    if (tsConfigFile === void 0) {
      return this.getCompilerOptions(dir, pkg);
    }

    const tsConfigText = await this.fs.readFile(tsConfigFile.path, Encoding.utf8);
    // tsconfig allows some stuff that's not valid JSON, so parse it as a JS object instead
    // eslint-disable-next-line no-new-func
    const tsConfigObj = new Function(`return ${tsConfigText}`)();
    const compilerOptions = tsConfigObj.compilerOptions;
    if (compilerOptions === null || typeof compilerOptions !== 'object') {
      return {
        __dirname: tsConfigFile.dir,
      };
    }

    (compilerOptions as Writable<$CompilerOptions>).__dirname = tsConfigFile.dir;
    return compilerOptions;
  }

  public dispose(): void {
    this.compilerOptionsCache.clear();
    for (const mod of this.moduleCache.values()) {
      mod.dispose();
    }
    this.moduleCache.clear();
    this.scriptCache.clear();
    this.fileCache.clear();
    this._scripts.length = 0;
    this._modules.length = 0;
    this._files.length = 0;
  }

  private getFile(fileOrPath: FileEntry | string): MaybePromise<FileEntry> {
    const cache = this.fileCache;
    let path: string;
    let cachedFile: FileEntry | undefined;

    if (typeof fileOrPath === 'string') {
      path = fileOrPath;
      cachedFile = void 0;
    } else {
      path = fileOrPath.path;
      cachedFile = fileOrPath;
    }

    if (!cache.has(path)) {
      if (cachedFile === void 0) {
        const dir = normalizePath(dirname(path));
        const controller = this.getDirController(dir);
        if (controller instanceof Promise) {
          return controller.then(c => this.findFile(c, path));
        }

        return this.findFile(controller, path);
      }
    } else if (cachedFile === void 0) {
      cachedFile = cache.get(path)!;
    }

    return cachedFile;
  }

  private findFile(ctrl: DirController, path: string): MaybePromise<FileEntry> {
    const file = ctrl.findFile(f => f.path === path, true);
    if (file instanceof Promise) {
      return file.then(f => {
        if (f === void 0) {
          throw new Error(`File not found: ${path}`);
        }
        this._files.push(f);
        this.fileCache.set(path, f);
        return f;
      });
    }

    if (file === void 0) {
      throw new Error(`File not found: ${path}`);
    }
    this._files.push(file);
    this.fileCache.set(path, file);
    return file;
  }

  private dirControllerPromise: Promise<DirController> | undefined = void 0;
  private dirControllerPromiseDir: string | undefined = void 0;
  private getDirController(dir: string): MaybePromise<DirController> {
    dir = normalizePath(dir);
    if (this.dirController === void 0) {
      return this.getDirControllerCore(dir);
    }

    const currentDir = this.dirController.entry.path;
    const commonRootDir = getCommonRootDir(currentDir, dir);
    if (commonRootDir === currentDir) {
      return this.dirController;
    }

    return this.getDirControllerCore(commonRootDir);
  }

  private getDirControllerCore(dir: string): MaybePromise<DirController> {
    if (this.dirControllerPromise !== void 0 && this.dirControllerPromiseDir === dir) {
      return this.dirControllerPromise;
    }

    const dirController = DirController.getOrCreate(this.container, dir);
    if (dirController instanceof Promise) {
      this.dirControllerPromiseDir = dir;
      return this.dirControllerPromise = (async () => {
        this.dirControllerPromise = this.dirControllerPromiseDir = void 0;
        return this.dirController = await dirController;
      })();
    }

    this.dirControllerPromise = this.dirControllerPromiseDir = void 0;
    return this.dirController = dirController;
  }
}

function getCommonRootDir(dir1: string, dir2: string): string {
  const dir1Len = dir1.length;
  let prevSlashIndex = 0;
  for (let j = 0, jj = dir1Len; j < jj; ++j) {
    const ch = dir1.charCodeAt(j);
    if (ch === Char.Slash) {
      prevSlashIndex = j;
    }
    if (ch !== dir2.charCodeAt(j)) {
      return dir1.slice(0, prevSlashIndex);
    }
  }

  return dir1;
}

function comparePathLength(a: { path: { length: number } }, b: { path: { length: number } }): number {
  return a.path.length - b.path.length;
}

function getDirFromFile(value: { $file: { dir: string }}): string {
  return value.$file.dir;
}

class EmitObject {
  public constructor(
    private readonly fs: IFileSystem,
    public readonly input: $$ESModuleOrScript,
    public readonly outPath: string,
    public readonly outContent: string | null,
  ) {}

  public static create(
    fs: IFileSystem,
    input: $$ESModuleOrScript,
    transformContext: TransformationContext,
    printer: Printer,
    outDir: string,
    commonRootDirLength: number,
  ): EmitObject {
    let outPath = join(outDir, input.$file.path.slice(commonRootDirLength));
    if (outPath.endsWith('.ts')) {
      outPath = `${outPath.slice(0, -2)}js`;
    }

    const transformed = input.transform(transformContext);
    if (transformed === void 0) {
      return new EmitObject(
        fs,
        input,
        outPath,
        null,
      );
    }

    const content = printer.printFile(transformed);
    return new EmitObject(
      fs,
      input,
      outPath,
      content,
    );
  }

  public async emit(): Promise<void> {
    if (this.outContent !== null) {
      return this.fs.writeFile(this.outPath, this.outContent, Encoding.utf8);
    }
  }
}
