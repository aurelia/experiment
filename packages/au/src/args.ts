export class CLICommand {
  public constructor(
    public readonly name: string,
    public readonly args: Map<string, CLIArgument>,
    public readonly def: CommandDefinition | null,
  ) {}

  public static parse(
    cmdName: string,
    rawArgs: readonly string[],
    cmdDef: CommandDefinition | null,
  ): CLICommand {
    const rawArgsMap = new Map<string, unknown[]>();

    let argValues: unknown[];
    for (let i = 0, ii = rawArgs.length; i < ii; ++i) {
      const argName = rawArgs[i];
      const argValue = rawArgs[i + 1];

      if (argName.startsWith('-')) {
        // If there is no value (either no next string or the next string is a new arg name), interpret it as the boolean value `true`
        if (argValue === void 0 || argValue.startsWith('-')) {
          argValues = [true];
        } else {
          argValues = [argValue];
          ++i;

          for (let j = i + 1; j < ii; ++j) {
            const rawArg = rawArgs[j];
            if (rawArg !== void 0 && !rawArg.startsWith('-')) {
              argValues.push(rawArg);
              ++i;
            } else {
              break;
            }
          }
        }

        if (rawArgsMap.has(argName)) {
          rawArgsMap.get(argName)!.push(...argValues);
        } else {
          rawArgsMap.set(argName, argValues);
        }
      }
    }

    const argsMap = new Map<string, CLIArgument>();

    for (const name of rawArgsMap.keys()) {
      const arg = CLIArgument.parse(
        name,
        rawArgsMap.get(name)!,
        cmdDef?.findArg(name) ?? null,
      );

      argsMap.set(normalizeName(arg.name), arg);
    }

    return new CLICommand(cmdName, argsMap, cmdDef);
  }

  public getValue<T>(argName: string): T {
    argName = normalizeName(argName);
    if (this.args.has(argName)) {
      return this.args.get(argName)!.value as unknown as T;
    }
    if (this.def !== null) {
      const argDef = this.def.findArg(argName);
      if (argDef !== null) {
        return argDef.getDefaultValue() as unknown as T;
      }
    }
    throw new Error(`No value provided for argName ${argName} and no default value found`);
  }
}

export class CLIArgument<T extends ArgType = ArgType> {
  public constructor(
    public readonly name: string,
    public readonly type: T,
    public readonly value: ArgTypeMap[T],
    public readonly def: ArgumentDefinition | null,
  ) {}

  public static parse(
    key: string,
    values: readonly unknown[],
    def: ArgumentDefinition | null,
  ): CLIArgument {
    if (def === null) {
      if (values.length === 1) {
        if (values[0] === true) {
          return new CLIArgument(normalizeName(key), 'boolean', values[0], null);
        }
        return new CLIArgument(normalizeName(key), 'string', String(values[0]), null);
      }
      return new CLIArgument(normalizeName(key), 'string[]', values.map(String), null);
    }
    return new CLIArgument(def.name, def.type, def.coerce(values), def);
  }
}

export interface ICommandDefinition {
  readonly name: string;
  readonly args: readonly IArgumentDefinition[];
  readonly description?: string | null;
  readonly execute: (cmd: CLICommand) => Promise<void>;
}

export class CommandDefinition implements ICommandDefinition {
  private readonly argNames: { [key: string]: ArgumentDefinition };
  private readonly argAliases: { [key: string]: ArgumentDefinition };

  public constructor(
    public readonly name: string,
    public readonly args: readonly ArgumentDefinition[],
    public readonly description: string | null,
    public readonly execute: (cmd: CLICommand) => Promise<void>,
  ) {
    const argNames: { [key: string]: ArgumentDefinition } = this.argNames = {};
    const argAliases: { [key: string]: ArgumentDefinition } = this.argAliases = {};
    for (const arg of args) {
      argNames[normalizeName(arg.name)] = arg;
      if (arg.alias !== null) {
        argAliases[normalizeName(arg.alias)] = arg;
      }
    }
  }

  public static create(def: ICommandDefinition): CommandDefinition {
    return new CommandDefinition(
      def.name,
      def.args.map(ArgumentDefinition.create),
      def.description ?? null,
      def.execute,
    );
  }

  public findArg(name: string): ArgumentDefinition | null {
    if (name.startsWith('-')) {
      if (name[1] === '-') {
        return this.argNames[normalizeName(name.slice(2))] ?? null;
      }
      return this.argAliases[normalizeName(name.slice(1))] ?? null;
    }
    return this.argNames[normalizeName(name)] ?? null;
  }

  public getHelpText(): string {
    const {
      name,
      args,
      description,
    } = this;

    let t = `${name}`;

    if (description !== null) {
      t = `\n${description}`;
    }

    t = `\n${args.map(x => x.getHelpText()).join('\n')}`;

    return t;
  }
}

export type ArgType = keyof ArgTypeMap;

export type ArgTypeMap = {
  'boolean': boolean;
  'string': string;
  'number': number;
  'boolean[]': boolean[];
  'string[]': string[];
  'number[]': number[];
};

export interface IArgumentDefinition<T extends ArgType = ArgType> {
  readonly name: string;
  readonly type: T;
  readonly defaultValue?: ArgTypeMap[T] | (() => ArgTypeMap[T]) | null;
  readonly options?: readonly ArgTypeMap[T][] | null;
  readonly alias?: string | null;
  readonly description?: string | null;
}

export class ArgumentDefinition<T extends ArgType = ArgType> implements IArgumentDefinition<T> {
  public constructor(
    public readonly name: string,
    public readonly type: T,
    public readonly defaultValue: ArgTypeMap[T] | (() => ArgTypeMap[T]) | null,
    public readonly options: readonly ArgTypeMap[T][] | null,
    public readonly alias: string | null,
    public readonly description: string | null,
  ) {}

  public static create<T extends ArgType = ArgType>(def: IArgumentDefinition<T>): ArgumentDefinition<T> {
    return new ArgumentDefinition(
      def.name,
      def.type,
      def.defaultValue ?? null,
      def.options ?? null,
      def.alias ?? null,
      def.description ?? null,
    );
  }

  public coerce(rawValues: readonly unknown[]): ArgTypeMap[T] {
    switch (this.type) {
      case 'boolean': return Boolean(rawValues[rawValues.length - 1]) as ArgTypeMap[T];
      case 'boolean[]': return rawValues.map(Boolean) as ArgTypeMap[T];
      case 'number': return Number(rawValues[rawValues.length - 1]) as ArgTypeMap[T];
      case 'number[]': return rawValues.map(Number) as ArgTypeMap[T];
      case 'string': return String(rawValues[rawValues.length - 1]) as ArgTypeMap[T];
      case 'string[]': return rawValues.map(String) as ArgTypeMap[T];
      default: throw new Error(`Invalid type: ${this.type}`);
    }
  }

  public getDefaultValue(): ArgTypeMap[T] | null {
    const defaultValue = this.defaultValue;

    if (defaultValue === null) {
      return null;
    }

    if (typeof defaultValue === 'function') {
      return defaultValue();
    }

    return defaultValue;
  }

  public getHelpText(): string {
    const {
      name,
      type,
      options,
      alias,
      description,
    } = this;

    let t = `  --${name}`;

    if (alias !== null) {
      t = `${t} (alias: -${alias})`;
    }

    if (description !== null) {
      t = `\n    > ${description}`;
    }

    t = `\n    type: ${type}`;

    const defaultValue = this.getDefaultValue();
    if (defaultValue !== null) {
      t = `\n    default: ${JSON.stringify(defaultValue)}`;
    }

    if (options !== null) {
      t = `\n    options: ${JSON.stringify(options)}`;
    }

    return t;
  }
}

const dashRE = /-/g;
function normalizeName(name: string): string {
  return name.replace(dashRE, '').toLowerCase();
}
