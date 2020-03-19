/* eslint-disable no-await-in-loop */
import {
  JobQueue,
  Job,
} from './job';
import {
  ILogger,
  IDisposable,
  Writable,
  DI,
} from '@aurelia/kernel';
import {
  Realm,
  ExecutionContext,
} from './realm';
import {
  CompletionType,
  $Any,
} from './types/_shared';
import {
  $Empty,
} from './types/empty';
import {
  $ESModule,
  $$ESModuleOrScript,
  $ESScript,
} from './ast/modules';
import {
  Workspace,
} from './workspace';

export class ExecutionResult implements IDisposable {
  public constructor(
    public readonly ws: Workspace,
    public readonly result: $Any,
  ) {}

  public dispose(): void {
    this.ws.dispose();
  }
}

export const IAgent = DI.createInterface<IAgent>('IAgent').withDefault(x => x.singleton(Agent));
export interface IAgent extends IDisposable {
  RunJobs(ws: Workspace): Promise<ExecutionResult>;
}

// http://www.ecma-international.org/ecma-262/#sec-agents
export class Agent implements IAgent {
  public readonly ScriptJobs: JobQueue;
  public readonly PromiseJobs: JobQueue;

  public constructor(
    @ILogger
    public readonly logger: ILogger,
  ) {
    this.logger = logger.root.scopeTo('Agent');
    this.ScriptJobs = new JobQueue(logger, 'Script');
    this.PromiseJobs = new JobQueue(logger, 'Promise');
  }

  // http://www.ecma-international.org/ecma-262/#sec-runjobs
  // 8.6 RunJobs ( )
  public async RunJobs(ws: Workspace): Promise<ExecutionResult> {
    // 1. Perform ? InitializeHostDefinedRealm().
    const realm = Realm.Create(ws, this.PromiseJobs);
    const intrinsics = realm['[[Intrinsics]]'];
    const stack = realm.stack;
    // We always have 1 synthetic root context which should not be considered to be a part of the stack.
    // It's exclusively used for initializing intrinsics, to conform to the method signatures.
    const rootCtx = stack.top;

    // 2. In an implementation-dependent manner, obtain the ECMAScript source texts (see clause 10) and any associated host-defined values for zero or more ECMAScript scripts and/or ECMAScript modules. For each such sourceText and hostDefined, do
    const files = await ws.loadEntryFiles(realm);
    for (const file of files) {
      // 2. a. If sourceText is the source code of a script, then
      if (file.isScript) {
        // 2. a. i. Perform EnqueueJob("ScriptJobs", ScriptEvaluationJob, « sourceText, hostDefined »).
        this.ScriptJobs.EnqueueJob(rootCtx, new ScriptEvaluationJob(realm, file));
      }
      // 2. b. Else sourceText is the source code of a module,
      else {
        // 2. b. i. Perform EnqueueJob("ScriptJobs", TopLevelModuleEvaluationJob, « sourceText, hostDefined »).
        this.ScriptJobs.EnqueueJob(rootCtx, new TopLevelModuleEvaluationJob(realm, file));
      }
    }

    const ctx = rootCtx;
    let lastFile: $$ESModuleOrScript | null = null;

    // 3. Repeat,
    while (true) {
      // 3. a. Suspend the running execution context and remove it from the execution context stack.
      if (ctx !== rootCtx) {
        ctx.suspend();
        stack.pop();
      }

      let nextPending: Job;

      // 3. b. Assert: The execution context stack is now empty.
      // 3. c. Let nextQueue be a non-empty Job Queue chosen in an implementation-defined manner. If all Job Queues are empty, the result is implementation-defined.
      if (this.ScriptJobs.isEmpty) {
        if (this.PromiseJobs.isEmpty) {
          this.logger.debug(`Finished successfully`);
          return new ExecutionResult(
            ws,
            new $Empty(realm, CompletionType.normal, intrinsics.empty, lastFile),
          );
        } else {
          // 3. d. Let nextPending be the PendingJob record at the front of nextQueue. Remove that record from nextQueue.
          nextPending = this.PromiseJobs.queue.shift()!;
        }
      } else {
        // 3. d. Let nextPending be the PendingJob record at the front of nextQueue. Remove that record from nextQueue.
        nextPending = this.ScriptJobs.queue.shift()!;
      }

      // 3. e. Let newContext be a new execution context.
      const newContext = new ExecutionContext(nextPending['[[Realm]]']);

      // 3. f. Set newContext's Function to null.
      newContext.Function = intrinsics.null;

      // 3. g. Set newContext's Realm to nextPending.[[Realm]].
      // 3. h. Set newContext's ScriptOrModule to nextPending.[[ScriptOrModule]].
      lastFile = newContext.ScriptOrModule = nextPending['[[ScriptOrModule]]'];

      // 3. i. Push newContext onto the execution context stack; newContext is now the running execution context.
      stack.push(newContext);

      // 3. j. Perform any implementation or host environment defined job initialization using nextPending.
      // 3. k. Let result be the result of performing the abstract operation named by nextPending.[[Job]] using the elements of nextPending.[[Arguments]] as its arguments.
      const result = await nextPending.Run(newContext);

      // 3. l. If result is an abrupt completion, perform HostReportErrors(« result.[[Value]] »).
      if (result.isAbrupt) {
        this.logger.warn(`Job completed with errors`);
        return new ExecutionResult(
          ws,
          result,
        );
      }
    }
  }

  public dispose(this: Writable<Partial<Agent>>): void {
    this.PromiseJobs!.dispose();
    this.ScriptJobs!.dispose();
    this.PromiseJobs = void 0;
    this.ScriptJobs = void 0;
    this.logger = void 0;
  }
}

export class TopLevelModuleEvaluationJob extends Job<$ESModule> {
  public constructor(
    realm: Realm,
    mos: $ESModule,
  ) {
    super(realm.logger.scopeTo('TopLevelModuleEvaluationJob'), realm, mos);
  }

  // http://www.ecma-international.org/ecma-262/#sec-toplevelmoduleevaluationjob
  // 15.2.1.20 Runtime Semantics: TopLevelModuleEvaluationJob ( sourceText , hostDefined )
  public async Run(ctx: ExecutionContext): Promise<$Any> {
    this.logger.debug(`Run(#${ctx.id})`);

    const m = this['[[ScriptOrModule]]'];
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];
    const options = realm.options;

    // 1. Assert: sourceText is an ECMAScript source text (see clause 10).
    // 2. Let realm be the current Realm Record.
    // 3. Let m be ParseModule(sourceText, realm, hostDefined).
    // 4. If m is a List of errors, then
      // 4. a. Perform HostReportErrors(m).
      // 4. b. Return NormalCompletion(undefined).

    // 5. Perform ? m.Instantiate().
    if (options.instantiate) {
      const result = await m.Instantiate(ctx);
      if (result.isAbrupt) {
        return result;
      }

      if (options.evaluate) {
        // 6. Assert: All dependencies of m have been transitively resolved and m is ready for evaluation.
        // 7. Return ? m.Evaluate().
        return m.EvaluateModule(ctx);
      } else {
        this.logger.debug(`Skipping evaluate`);
        return result;
      }
    } else {
      this.logger.debug(`Skipping instantiate`);
      return intrinsics.empty;
    }
  }
}

export class ScriptEvaluationJob extends Job<$ESScript> {
  public constructor(
    realm: Realm,
    mos: $ESScript,
  ) {
    super(realm.logger.scopeTo('ScriptEvaluationJob'), realm, mos);
  }

  // http://www.ecma-international.org/ecma-262/#sec-scriptevaluationjob
  // 15.1.12 Runtime Semantics: ScriptEvaluationJob ( sourceText , hostDefined )
  public async Run(ctx: ExecutionContext): Promise<$Any> {
    this.logger.debug(`Run(#${ctx.id})`);

    const m = this['[[ScriptOrModule]]'];
    const realm = ctx.Realm;
    const intrinsics = realm['[[Intrinsics]]'];
    const options = realm.options;

    // 1. Assert: sourceText is an ECMAScript source text (see clause 10).
    // 2. Let realm be the current Realm Record.

    if (options.instantiate) {
      // 3. Let s be ParseScript(sourceText, realm, hostDefined).
      // 4. If s is a List of errors, then
        // 4. a. Perform HostReportErrors(s).
        // 4. b. Return NormalCompletion(undefined).

      if (options.evaluate) {
        // 5. Return ? ScriptEvaluation(s).
        return m.EvaluateScript(ctx);
      } else {
        this.logger.debug(`Skipping evaluate`);
        return intrinsics.empty;
      }
    } else {
      this.logger.debug(`Skipping instantiate`);
      return intrinsics.empty;
    }
  }
}
