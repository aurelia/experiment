import {
  IContainer,
} from '@aurelia/kernel';

import {
  ExecutionResult,
  IAgent,
} from './vm/agent';
import {
  IGlobalOptions,
} from './vm/global-options';
import {
  Workspace,
} from './vm/workspace';

export class ServiceHost {
  public constructor(
    @IContainer
    private readonly container: IContainer,
    @IAgent
    private readonly agent: IAgent,
  ) {}

  public async execute(opts: IGlobalOptions): Promise<ExecutionResult> {
    return this.agent.RunJobs(new Workspace(this.container, opts));
  }

  public dispose(): void {
    this.agent!.dispose();
  }
}
