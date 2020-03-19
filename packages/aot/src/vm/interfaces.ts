import {
  CompilerOptions,
} from 'typescript';

export interface $CompilerOptions extends CompilerOptions {
  readonly __dirname: string;
}
