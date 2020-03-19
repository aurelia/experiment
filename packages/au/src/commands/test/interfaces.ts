export interface IBrowser {
  readonly name: string;
  createSessionContext(
    url: string,
    flags: readonly string[],
  ): Promise<IBrowserSession>;
}

export interface IBrowserSession {
  readonly id: string;
  readonly path: string;
  readonly args: readonly string[];
  init(): Promise<void>;
  dispose(): Promise<void>;
}
