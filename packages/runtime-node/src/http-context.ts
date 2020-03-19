import * as http from 'http';

import {
  IContainer,
  Key,
  Resolved,
  IResolver,
  Transformer,
  Constructable,
  IFactory,
} from '@aurelia/kernel';

export const enum HttpContextState {
  head = 1,
  body = 2,
  end = 3,
}

export interface IHttpContext extends IContainer {
  state: HttpContextState;
  readonly request: http.IncomingMessage;
  readonly response: http.ServerResponse;
  readonly requestBuffer: Buffer;
}

export class HttpContext implements IHttpContext {
  private readonly container: IContainer;

  public state: HttpContextState = HttpContextState.head;

  public constructor(
    container: IContainer,
    public readonly request: http.IncomingMessage,
    public readonly response: http.ServerResponse,
    public readonly requestBuffer: Buffer,
  ) {
    this.container = container.createChild();
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
}
