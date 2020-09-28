import { IRoute } from './interfaces';
import { ViewportInstruction } from './viewport-instruction';

/**
 * @internal - Used when founding route/instructions
 */
export class FoundRoute {
  public constructor(
    public match: IRoute | null = null,
    public matching: string = '',
    public instructions: ViewportInstruction[] = [],
    public remaining: string = '',
    public params: Record<string, unknown> = {},
  ) { }

  public get foundConfiguration(): boolean {
    return this.match !== null;
  }
  public get foundInstructions(): boolean {
    return this.instructions.length > 0;
  }
  public get hasRemaining(): boolean {
    return this.remaining !== null && this.remaining.length > 0;
  }
}
