import {
  ILogger,
  IContainer,
} from '@aurelia/kernel';
import {
  FileEntry,
  joinPath,
  resolvePath,
} from '@aurelia/runtime-node';
import {
  $CompilerOptions,
} from './interfaces';

const lookup: WeakMap<$CompilerOptions, PatternMatcher | null> = new WeakMap();

export class PatternMatcher {
  public readonly basePath: string;
  public readonly sources: readonly PatternSource[];
  public readonly rootDir: string;

  private constructor(
    private readonly logger: ILogger,
    public readonly compilerOptions: $CompilerOptions,
  ) {
    this.logger = logger.scopeTo(this.constructor.name);

    this.rootDir = resolvePath(compilerOptions.__dirname);
    this.basePath = joinPath(this.rootDir, compilerOptions.baseUrl!);
    this.sources = Object.keys(compilerOptions.paths!).map(x => new PatternSource(this.logger, this, x));
  }

  public findMatch(files: readonly FileEntry[], specifier: string): FileEntry {
    const sources = this.sources;
    const len = sources.length;
    let match: FileEntry | null;

    for (let i = 0; i < len; ++i) {
      match = sources[i].findMatch(files, specifier);
      if (match === null) {
        this.logger.trace(`Source pattern "${sources[i].pattern}" (path "${sources[i].patternPath}") is NOT a match for specifier "${specifier}"`);
      } else {
        this.logger.debug(`Source pattern "${sources[i].pattern}" is a match for specifier "${specifier}"`);
        return match;
      }
    }

    throw new Error(`Cannot resolve "${specifier}:`);
  }

  public static getOrCreate(
    compilerOptions: $CompilerOptions,
    container: IContainer,
  ): PatternMatcher | null {
    let matcher = lookup.get(compilerOptions);
    if (matcher === void 0) {
      if (compilerOptions.baseUrl !== void 0 && compilerOptions.paths !== void 0) {
        const logger = container.get(ILogger);
        matcher = new PatternMatcher(logger, compilerOptions);
      } else {
        matcher = null;
      }

      lookup.set(compilerOptions, matcher);
    }

    return matcher;
  }
}

class PatternSource {
  public readonly patternPath: string;
  public readonly hasWildcard: boolean;
  public readonly isWildcard: boolean;
  public readonly targets: readonly PatternTarget[];

  public constructor(
    private readonly logger: ILogger,
    public readonly matcher: PatternMatcher,
    public readonly pattern: string,
  ) {
    this.logger = logger.scopeTo(this.constructor.name);

    if (pattern.endsWith('*')) {
      this.hasWildcard = true;
      this.patternPath = pattern.slice(0, -1);
    } else {
      this.hasWildcard = false;
      this.patternPath = pattern;
    }

    this.isWildcard = pattern === '*';

    this.targets = matcher.compilerOptions.paths![pattern].map(x => new PatternTarget(this.logger, this, x));
  }

  public findMatch(files: readonly FileEntry[], specifier: string): FileEntry | null {
    if (this.isWildcard) {
      return this.findMatchCore(files, specifier);
    }

    if (this.hasWildcard) {
      if (specifier.startsWith(this.patternPath)) {
        return this.findMatchCore(files, specifier.replace(this.patternPath, ''));
      }

      return null;
    }

    if (this.patternPath === specifier) {
      return this.findMatchCore(files, specifier);
    }

    return null;
  }

  private findMatchCore(files: readonly FileEntry[], specifier: string): FileEntry | null {
    const targets = this.targets;
    const len = targets.length;
    let target: PatternTarget;
    let match: FileEntry | null = null;

    for (let i = 0; i < len; ++i) {
      target = targets[i];
      match = target.findMatch(files, specifier);
      if (match !== null) {
        return match;
      }
    }

    return null;
  }
}

class PatternTarget {
  public readonly patternPath: string;
  public readonly hasWildcard: boolean;

  public constructor(
    private readonly logger: ILogger,
    public readonly source: PatternSource,
    public readonly pattern: string,
  ) {
    this.logger = logger.scopeTo(this.constructor.name);

    if (pattern.endsWith('*')) {
      this.hasWildcard = true;
      this.patternPath = joinPath(source.matcher.basePath, pattern.slice(0, -1));
    } else {
      this.hasWildcard = false;
      this.patternPath = joinPath(source.matcher.basePath, pattern);
    }
  }

  public findMatch(files: readonly FileEntry[], specifier: string): FileEntry | null {
    const targetPath = this.hasWildcard ? joinPath(this.patternPath, specifier) : this.patternPath;
    const len = files.length;
    let file: FileEntry;

    for (let i = 0; i < len; ++i) {
      file = files[i];
      if (file.shortPath === targetPath || file.path === targetPath) {
        return file;
      }
    }

    return null;
  }
}
