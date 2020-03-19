import { join, resolve } from 'path';
import { Char } from '@aurelia/kernel';

export const normalizePath = (function () {
  const cache = new Map<string, string>();
  const regex = /\\/g;
  return function (path: string) {
    let normalized = cache.get(path);
    if (normalized === void 0) {
      cache.set(path, normalized = path.replace(regex, '/'));
    }
    return normalized;
  };
})();

export function joinPath(...paths: string[]): string {
  return normalizePath(join(...paths));
}

export function resolvePath(...paths: string[]): string {
  return normalizePath(resolve(...paths));
}

export function countSlashes(path: string): number {
  let count = 0;
  const len = path.length;

  for (let i = 0; i < len; ++i) {
    if (path.charCodeAt(i) === Char.Slash) {
      ++count;
    }
  }

  return count;
}

/**
 * Returns `true` if this is an absolute POSIX, UNC or DOS path.
 *
 * Assumes path has already been normalized with `normalizePath`
 */
function isRootedDiskPath(path: string): boolean {
  const ch0 = path.charCodeAt(0);
  return (
    ch0 === Char.Slash
    || (
      ch0 >= Char.LowerA
      && ch0 <= Char.LowerZ
      && path.charCodeAt(1) === Char.Colon
    )
  );
}

export function isRelativeModulePath(path: string): boolean {
  const ch0 = path.charCodeAt(0);
  if (ch0 === Char.Dot) {
    const ch1 = path.charCodeAt(1);
    if (ch1 === Char.Dot) {
      return path.charCodeAt(2) === Char.Slash || path.length === 2;
    }

    return ch1 === Char.Slash || path.length === 1;
  }

  return isRootedDiskPath(path);
}
