import { DI, LogLevel } from '@aurelia/kernel';
import { IHttpContext } from './http-context';
import * as ws from 'ws';
import { FileEntry } from './fs-entry';

export const enum Encoding {
  utf8 = 'utf8',
  utf16le = 'utf16le',
  latin1 = 'latin1',
  base64 = 'base64',
  ascii = 'ascii',
  hex = 'hex',
  raw = 'raw',
}

export const enum FileKind {
  Unknown = 0,
  Script  = 1,
  Markup  = 2,
  Style   = 3,
  JSON    = 4,
}

export interface IStats {
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
  readonly mode: number;
  readonly uid: number;
  readonly gid: number;
}

export interface IDirent {
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
  readonly name: string;
}

export interface IFileSystem {
  realpath(path: string): Promise<string>;
  realpathSync(path: string): string;

  readdir(path: string): Promise<readonly string[]>;
  readdir(path: string, withFileTypes: true): Promise<readonly IDirent[]>;
  readdirSync(path: string): readonly string[];
  readdirSync(path: string, withFileTypes: true): readonly IDirent[];

  mkdir(path: string): Promise<void>;
  mkdirSync(path: string): void;

  isReadable(path: string): Promise<boolean>;
  isReadableSync(path: string): boolean;

  fileExists(path: string): Promise<boolean>;
  fileExistsSync(path: string): boolean;

  stat(path: string): Promise<IStats>;
  statSync(path: string): IStats;

  lstat(path: string): Promise<IStats>;
  lstatSync(path: string): IStats;

  readFile(path: string, encoding: Encoding, cache?: boolean, force?: boolean): Promise<string>;
  readFileSync(path: string, encoding: Encoding, cache?: boolean, force?: boolean): string;

  ensureDir(path: string): Promise<void>;
  ensureDirSync(path: string): void;

  writeFile(path: string, content: string, encoding: Encoding): Promise<void>;
  writeFileSync(path: string, content: string, encoding: Encoding): void;

  rimraf(path: string): Promise<void>;

  getRealPath(path: string): Promise<string>;
  getRealPathSync(path: string): string;

  getChildren(path: string): Promise<readonly string[]>;
  getChildrenSync(path: string): readonly string[];

  getFiles(dir: string, loadContent?: boolean): Promise<readonly FileEntry[]>;
  getFilesSync(dir: string, loadContent?: boolean): readonly FileEntry[];

  getFile(path: string, loadContent?: boolean): Promise<FileEntry>;
  getFileSync(path: string, loadContent?: boolean): FileEntry;
}

export type IProcessEnv = NodeJS.ProcessEnv;

export type IProcess = NodeJS.Process;

export interface ISystem {
  readonly isWin: boolean;
  readonly isMac: boolean;
  readonly isLinux: boolean;
  which(cmd: string | string[]): Promise<string>;
  generateName(): string;
}

export interface IHttpServerOptions {
  readonly root: string;
  readonly port: number;
  readonly hostName: string;
  readonly level: LogLevel;
}

export class StartOutput {
  public constructor(
    public readonly realPort: number,
  ) {}
}

export interface IHttpServer {
  start(configureWsClient?: (client: ws) => void): Promise<StartOutput>;
  stop(): Promise<void>;
}

export interface IRequestHandler {
  handleRequest(context: IHttpContext): Promise<void>;
}

export const IFileSystem = DI.createInterface<IFileSystem>('IFileSystem').noDefault();
export const IProcessEnv = DI.createInterface<IProcessEnv>('IProcessEnv').withDefault(x => x.instance(process.env));
export const IProcess = DI.createInterface<IProcess>('IProcess').withDefault(x => x.instance(process));
export const ISystem = DI.createInterface<ISystem>('ISystem').noDefault();
export const IHttpServerOptions = DI.createInterface<IHttpServerOptions>('IHttpServerOptions').noDefault();
export const IHttpServer = DI.createInterface<IHttpServer>('IHttpServer').noDefault();
export const IRequestHandler = DI.createInterface<IRequestHandler>('IRequestHandler').noDefault();

