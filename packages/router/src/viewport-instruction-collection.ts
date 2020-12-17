/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { ViewportInstruction } from './viewport-instruction.js';
import { IScopeOwner } from './scope.js';
import { arrayRemove } from './utils.js';

/**
 * @internal - Shouldn't be used directly
 */
export class ViewportInstructionCollection extends Array<ViewportInstruction> {
  public get empty(): boolean {
    return this.length === 0;
  }

  public get first(): ViewportInstruction {
    return this[0];
  }

  public getDefaults(): ViewportInstructionCollection {
    return new ViewportInstructionCollection(...this.filter(instruction => instruction.default));
  }
  public getNonDefaults(): ViewportInstructionCollection {
    return new ViewportInstructionCollection(...this.filter(instruction => !instruction.default));
  }

  public getScopeOwners(configuredRoutePath: string | null): IScopeOwner[] {
    return this
      .filter(instr => instr.owner !== null && instr.owner.path === configuredRoutePath)
      .map(instr => instr.owner)
      .filter((value, index, arr) => arr.indexOf(value) === index) as IScopeOwner[];
  }

  public remove(instruction: ViewportInstruction): void {
    arrayRemove(this, value => value === instruction);
  }
}
