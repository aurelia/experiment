import {
  DebugConfiguration,
} from '@aurelia/debug';
import {
  IProcess,
} from '@aurelia/runtime-node';

import {
  ICommandDefinition,
  CommandDefinition,
  CLICommand,
} from './args';
import {
  TestCommand,
} from './commands/test';
import {
  Terminal,
} from './terminal';

export class CLI {
  public readonly cmdDefs: CommandDefinition[] = [];
  public get args(): readonly string[] {
    return this.proc.argv.slice(2);
  }
  public readonly terminal: Terminal;

  public constructor(
    @IProcess public readonly proc: IProcess,
  ) {
    DebugConfiguration.register();
    this.terminal = new Terminal(proc.stdout);
    proc.on('exit', function () {
      console.log('exiting..');
    });
  }

  public addCmd(def: ICommandDefinition): this {
    this.cmdDefs.push(CommandDefinition.create(def));
    return this;
  }

  private promise: Promise<void> = Promise.resolve();
  public run(args: readonly string[]): void {
    const run = async () => {
      const cmd = this.parseCmd(args);
      if (cmd === null) {
        console.log(`Available commands:\n\n${this.cmdDefs.map(x => x.getHelpText()).join('\n\n')}`);
      } else if (cmd.def === null) {
        console.log(`Unknown command: ${cmd.name}\nAvailable commands:\n\n${this.cmdDefs.map(x => x.getHelpText()).join('\n\n')}`);
      } else {
        await cmd.def.execute(cmd);
      }
    };

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    this.promise = this.promise.then(() => run());
  }

  private parseCmd(rawArgs: readonly string[]): CLICommand | null {
    if (rawArgs.length === 0) {
      return null;
    }

    const cmdName = rawArgs[0];
    const cmdDef = this.cmdDefs.find(x => x.name === cmdName) ?? null;
    return CLICommand.parse(cmdName, rawArgs.slice(1), cmdDef);
  }

  private printHelp(): void {
    console.log(`Available commands:\n\n${this.cmdDefs.map(x => x.getHelpText()).join('\n\n')}`);
  }
}

export const cli = new CLI(process);
cli
.addCmd(TestCommand);
