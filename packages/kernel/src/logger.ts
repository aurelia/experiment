import { toLookup } from './functions';
import { DI, all, IRegistry, IContainer, Registration } from './di';
import { LogLevel } from './reporter';

/**
 * Flags to enable/disable color usage in the logging output.
 */
export const enum ColorOptions {
  /**
   * Do not use ASCII color codes in logging output.
   */
  noColors = 0,
  /**
   * Use ASCII color codes in logging output. By default, timestamps and the TRC and DBG prefix are colored grey. INF white, WRN yellow, and ERR and FTL red.
   */
  colors = 1,
}

/**
 * The global logger configuration.
 *
 * Properties on this object can be changed during runtime and will affect logging of all components that are housed under the same root DI container as the logger.
 */
export interface ILogConfig {
  /**
   * The global color options.
   */
  colorOptions: ColorOptions;
  /**
   * The global log level. Only log calls with the same level or higher are emitted.
   */
  level: LogLevel;
}

/**
 * Component that creates log event objects based on raw inputs sent to `ILogger`.
 *
 * To customize what data is sent to the sinks, replace the implementation for this interface with your own.
 *
 * @example
 *
 * ```ts
 * export class MyLogEventFactory {
 *   public createLogEvent(logger: ILogger, logLevel: LogLevel, message: string, optionalParams: unknown[]): ILogEvent {
 *     return {
 *       logLevel,
 *       optionalParams,
 *       toString() {
 *         return `[${logger.scope.join('.')}] ${message} ${optionalParams.join(', ')}`;
 *       }
 *     };
 *   }
 * }
 *
 * container.register(Registration.singleton(ILogEventFactory, MyLogEventFactory));
 * ```
 */
export interface ILogEventFactory {
  /**
   * Create a log event object based on the input parameters sent to `ILogger`.
   *
   * @param logger - The `ILogger` that received the message.
   * @param logLevel - The `LogLevel` associated with the `ILogger` method that the message was passed into. E.g. `logger.debug` will result in `LogLevel.debug`
   * @param message - The message (first parameter) that was passed into the logger. If a function was passed into the logger, this will be the return value of that function.
   * @param optionalParams - Additional optional parameters there were passed into the logger, if any.
   *
   * @returns An `ILogEvent` object that, by default, only has a `.toString()` method.
   *
   * This is called by the default console sink to get the message to emit to the console.
   * It could be any object of any shape, as long as the registered sinks understand that shape.
   */
  createLogEvent(logger: ILogger, logLevel: LogLevel, message: string, optionalParams: unknown[]): ILogEvent;
}

/**
 * A logging sink that emits `ILogEvent` objects to any kind of output. This can be the console, a database, a web api, a file, etc.
 *
 * Multiple sinks can be registered, and all events will be emitted to all of them.
 *
 * @example
 * // A buffered file sink that writes once per second:
 *
 * ```ts
 * export class BufferedFileSink {
 *   private readonly buffer: ILogEvent[] = [];
 *
 *   constructor() {
 *     setInterval(() => {
 *       const events = this.buffer.splice(0);
 *       if (events.length > 0) {
 *         fs.appendFileSync('my-log.txt', events.map(e => e.toString()).join('\n'));
 *       }
 *     }, 1000);
 *   }
 *
 *   public emit(event: ILogEvent): void {
 *     this.buffer.push(event);
 *   }
 * }
 *
 * container.register(Registration.singleton(ISink, BufferedFileSink));
 * ```
 */
export interface ISink {
  /**
   * Emit the provided `ILogEvent` to the output interface wrapped by this sink.
   *
   * @param event - The event object to emit. Built-in sinks will call `.toString()` on the event object but custom sinks can do anything they like with the event.
   */
  emit(event: ILogEvent): void;
}

/**
 * The main interface to the logging API.
 *
 * Inject this as a dependency in your components to add centralized, configurable logging capabilities to your application.
 */
export interface ILogger {
  /**
   * The root `ILogger` instance. On the root logger itself, this property circularly references the root. It is never null.
   *
   * When using `.scopeTo`, a new `ILogger` is created. That new logger will have the `root` property set to the global (non-scoped) logger.
   */
  readonly root: ILogger;
  /**
   * The parent `ILogger` instance. On the root logger itself, this property circularly references the root. It is never null.
   *
   * When using `.scopeTo`, a new `ILogger` is created. That new logger will have the `parent` property set to the logger that it was created from.
   */
  readonly parent: ILogger;
  /**
   * The scopes that this logger was created for, if any.
   */
  readonly scope: readonly string[];
  /**
   * The global logger configuration.
   */
  readonly config: ILogConfig;

  /**
   * Write to TRC output, if the configured `LogLevel` is set to `trace`.
   *
   * Intended for the most detailed information about internal app state.
   *
   * @param getMessage - A function to build the message to pass to the `ILogEventFactory`.
   * Only called if the configured `LogLevel` dictates that these messages be emitted.
   * Use this when creating the log message is potentially expensive and should only be done if the log is actually emitted.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  trace(getMessage: () => unknown, ...optionalParams: unknown[]): void;
  /**
   * Write to TRC output, if the configured `LogLevel` is set to `trace`.
   *
   * Intended for the most detailed information about internal app state.
   *
   * @param message - The message to pass to the `ILogEventFactory`.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  trace(message: unknown, ...optionalParams: unknown[]): void;

  /**
   * Write to DBG output, if the configured `LogLevel` is set to `debug` or lower.
   *
   * Intended for information that is useful for debugging during development and has no long-term value.
   *
   * @param getMessage - A function to build the message to pass to the `ILogEventFactory`.
   * Only called if the configured `LogLevel` dictates that these messages be emitted.
   * Use this when creating the log message is potentially expensive and should only be done if the log is actually emitted.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  debug(getMessage: () => unknown, ...optionalParams: unknown[]): void;
  /**
   * Write to DBG output, if the configured `LogLevel` is set to `debug` or lower.
   *
   * Intended for information that is useful for debugging during development and has no long-term value.
   *
   * @param message - The message to pass to the `ILogEventFactory`.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  debug(message: unknown, ...optionalParams: unknown[]): void;

  /**
   * Write to trace UBF, if the configured `LogLevel` is set to `info` or lower.
   *
   * Intended for information about the general flow of the application that has long-term value.
   *
   * @param getMessage - A function to build the message to pass to the `ILogEventFactory`.
   * Only called if the configured `LogLevel` dictates that these messages be emitted.
   * Use this when creating the log message is potentially expensive and should only be done if the log is actually emitted.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  info(getMessage: () => unknown, ...optionalParams: unknown[]): void;
  /**
   * Write to trace UBF, if the configured `LogLevel` is set to `info` or lower.
   *
   * Intended for information about the general flow of the application that has long-term value.
   *
   * @param message - The message to pass to the `ILogEventFactory`.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  info(message: unknown, ...optionalParams: unknown[]): void;

  /**
   * Write to WRN output, if the configured `LogLevel` is set to `warn` or lower.
   *
   * Intended for unexpected circumstances that require attention but do not otherwise cause the current flow of execution to stop.
   *
   * @param getMessage - A function to build the message to pass to the `ILogEventFactory`.
   * Only called if the configured `LogLevel` dictates that these messages be emitted.
   * Use this when creating the log message is potentially expensive and should only be done if the log is actually emitted.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  warn(getMessage: () => unknown, ...optionalParams: unknown[]): void;
  /**
   * Write to WRN output, if the configured `LogLevel` is set to `warn` or lower.
   *
   * Intended for unexpected circumstances that require attention but do not otherwise cause the current flow of execution to stop.
   *
   * @param message - The message to pass to the `ILogEventFactory`.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  warn(message: unknown, ...optionalParams: unknown[]): void;

  /**
   * Write to ERR output, if the configured `LogLevel` is set to `error` or lower.
   *
   * Intended for unexpected circumstances that cause the flow of execution in the current activity to stop but do not cause an app-wide failure.
   *
   * @param getMessage - A function to build the message to pass to the `ILogEventFactory`.
   * Only called if the configured `LogLevel` dictates that these messages be emitted.
   * Use this when creating the log message is potentially expensive and should only be done if the log is actually emitted.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  error(getMessage: () => unknown, ...optionalParams: unknown[]): void;
  /**
   * Write to ERR output, if the configured `LogLevel` is set to `error` or lower.
   *
   * Intended for unexpected circumstances that cause the flow of execution in the current activity to stop but do not cause an app-wide failure.
   *
   * @param message - The message to pass to the `ILogEventFactory`.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  error(message: unknown, ...optionalParams: unknown[]): void;

  /**
   * Write to FTL output, if the configured `LogLevel` is set to `fatal` or lower.
   *
   * Intended for unexpected circumstances that cause an app-wide failure or otherwise require immediate attention.
   *
   * @param getMessage - A function to build the message to pass to the `ILogEventFactory`.
   * Only called if the configured `LogLevel` dictates that these messages be emitted.
   * Use this when creating the log message is potentially expensive and should only be done if the log is actually emitted.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  fatal(getMessage: () => unknown, ...optionalParams: unknown[]): void;
  /**
   * Write to FTL output, if the configured `LogLevel` is set to `fatal` or lower.
   *
   * Intended for unexpected circumstances that cause an app-wide failure or otherwise require immediate attention.
   *
   * @param message - The message to pass to the `ILogEventFactory`.
   * @param optionalParams - Any additional, optional params that should be passed to the `ILogEventFactory`
   */
  fatal(message: unknown, ...optionalParams: unknown[]): void;

  /**
   * Create a new logger with an additional permanent prefix added to the logging outputs.
   * When chained, multiple scopes are separated by a dot.
   *
   * This is preliminary API and subject to change before alpha release.
   *
   * @example
   *
   * ```ts
   * export class MyComponent {
   *   constructor(&#64;ILogger private logger: ILogger) {
   *     this.logger.debug('before scoping');
   *     // console output: '[DBG] before scoping'
   *     this.logger = logger.scopeTo('MyComponent');
   *     this.logger.debug('after scoping');
   *     // console output: '[DBG MyComponent] after scoping'
   *   }
   *
   *   public doStuff(): void {
   *     const logger = this.logger.scopeTo('doStuff()');
   *     logger.debug('doing stuff');
   *     // console output: '[DBG MyComponent.doStuff()] doing stuff'
   *   }
   * }
   * ```
   */
  scopeTo(name: string): ILogger;
}

export const ILogConfig = DI.createInterface<ILogConfig>('ILogConfig').withDefault(x => x.instance(new LogConfig(ColorOptions.noColors, LogLevel.warn)));
export const ISink = DI.createInterface<ISink>('ISink').noDefault();
export const ILogEventFactory = DI.createInterface<ILogEventFactory>('ILogEventFactory').withDefault(x => x.singleton(DefaultLogEventFactory));
export const ILogger = DI.createInterface<ILogger>('ILogger').withDefault(x => x.singleton(DefaultLogger));

export interface IConsoleLike {
  debug(message: string, ...optionalParams: unknown[]): void;
  info(message: string, ...optionalParams: unknown[]): void;
  warn(message: string, ...optionalParams: unknown[]): void;
  error(message: string, ...optionalParams: unknown[]): void;
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
export const format = toLookup({
  red<T extends string>(str: T): T {
    return `\u001b[31m${str}\u001b[39m` as T;
  },
  green<T extends string>(str: T): T {
    return `\u001b[32m${str}\u001b[39m` as T;
  },
  yellow<T extends string>(str: T): T {
    return `\u001b[33m${str}\u001b[39m` as T;
  },
  blue<T extends string>(str: T): T {
    return `\u001b[34m${str}\u001b[39m` as T;
  },
  magenta<T extends string>(str: T): T {
    return `\u001b[35m${str}\u001b[39m` as T;
  },
  cyan<T extends string>(str: T): T {
    return `\u001b[36m${str}\u001b[39m` as T;
  },
  white<T extends string>(str: T): T {
    return `\u001b[37m${str}\u001b[39m` as T;
  },
  grey<T extends string>(str: T): T {
    return `\u001b[90m${str}\u001b[39m` as T;
  },
} as const);

export interface ILogEvent {
  readonly severity: LogLevel;
  readonly optionalParams?: readonly unknown[];
  toString(): string;
}

export class LogConfig implements ILogConfig {
  public constructor(
    public readonly colorOptions: ColorOptions,
    public readonly level: LogLevel,
  ) {}
}

const getLogLevelString = (function () {
  const logLevelString = [
    toLookup({
      TRC: 'TRC',
      DBG: 'DBG',
      INF: 'INF',
      WRN: 'WRN',
      ERR: 'ERR',
      FTL: 'FTL',
      QQQ: '???',
    } as const),
    toLookup({
      TRC: format.grey('TRC'),
      DBG: format.grey('DBG'),
      INF: format.white('INF'),
      WRN: format.yellow('WRN'),
      ERR: format.red('ERR'),
      FTL: format.red('FTL'),
      QQQ: format.grey('???'),
    } as const),
  ] as const;

  return function (level: LogLevel, colorOptions: ColorOptions): string {
    if (level <= LogLevel.trace) {
      return logLevelString[colorOptions].TRC;
    }
    if (level <= LogLevel.debug) {
      return logLevelString[colorOptions].DBG;
    }
    if (level <= LogLevel.info) {
      return logLevelString[colorOptions].INF;
    }
    if (level <= LogLevel.warn) {
      return logLevelString[colorOptions].WRN;
    }
    if (level <= LogLevel.error) {
      return logLevelString[colorOptions].ERR;
    }
    if (level <= LogLevel.fatal) {
      return logLevelString[colorOptions].FTL;
    }
    return logLevelString[colorOptions].QQQ;
  };
})();

function getScopeString(scope: readonly string[], colorOptions: ColorOptions): string {
  if (colorOptions === ColorOptions.noColors) {
    return scope.join('.');
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  return scope.map(format.cyan).join('.');
}

function getIsoString(timestamp: number, colorOptions: ColorOptions): string {
  if (colorOptions === ColorOptions.noColors) {
    return new Date(timestamp).toISOString();
  }
  return format.grey(new Date(timestamp).toISOString());
}

export class DefaultLogEvent implements ILogEvent {
  public constructor(
    public readonly severity: LogLevel,
    public readonly message: string,
    public readonly optionalParams: unknown[],
    public readonly scope: readonly string[],
    public readonly colorOptions: ColorOptions,
    public readonly timestamp: number,
  ) {}

  public toString(): string {
    const { severity, message, scope, colorOptions, timestamp } = this;

    if (scope.length === 0) {
      return `${getIsoString(timestamp, colorOptions)} [${getLogLevelString(severity, colorOptions)}] ${message}`;
    }
    return `${getIsoString(timestamp, colorOptions)} [${getLogLevelString(severity, colorOptions)} ${getScopeString(scope, colorOptions)}] ${message}`;
  }
}

export class DefaultLogEventFactory implements ILogEventFactory {
  public constructor(
    @ILogConfig public readonly config: ILogConfig,
  ) {}

  public createLogEvent(logger: ILogger, level: LogLevel, message: string, optionalParams: unknown[]): ILogEvent {
    return new DefaultLogEvent(level, message, optionalParams, logger.scope, this.config.colorOptions, Date.now());
  }
}

export class ConsoleSink implements ISink {
  public readonly emit: (event: ILogEvent) => void;

  public constructor($console: IConsoleLike) {
    this.emit = function emit(event: ILogEvent): void {
      const optionalParams = event.optionalParams;
      if (optionalParams === void 0 || optionalParams.length === 0) {
        switch (event.severity) {
          case LogLevel.trace:
          case LogLevel.debug:
            return $console.debug(event.toString());
          case LogLevel.info:
            return $console.info(event.toString());
          case LogLevel.warn:
            return $console.warn(event.toString());
          case LogLevel.error:
          case LogLevel.fatal:
            return $console.error(event.toString());
        }
      } else {
        switch (event.severity) {
          case LogLevel.trace:
          case LogLevel.debug:
            return $console.debug(event.toString(), ...optionalParams);
          case LogLevel.info:
            return $console.info(event.toString(), ...optionalParams);
          case LogLevel.warn:
            return $console.warn(event.toString(), ...optionalParams);
          case LogLevel.error:
          case LogLevel.fatal:
            return $console.error(event.toString(), ...optionalParams);
        }
      }
    };
  }
}

export class DefaultLogger implements ILogger {
  public readonly root: ILogger;
  public readonly parent: ILogger;

  public readonly trace: (...args: unknown[]) => void;
  public readonly debug: (...args: unknown[]) => void;
  public readonly info: (...args: unknown[]) => void;
  public readonly warn: (...args: unknown[]) => void;
  public readonly error: (...args: unknown[]) => void;
  public readonly fatal: (...args: unknown[]) => void;

  private readonly scopedLoggers: { [key: string]: ILogger | undefined } = Object.create(null);

  public constructor(
    @ILogConfig public readonly config: ILogConfig,
    @ILogEventFactory private readonly factory: ILogEventFactory,
    @all(ISink) private readonly sinks: ISink[],
    public readonly scope: string[] = [],
    parent: ILogger | null = null,
  ) {
    if (parent === null) {
      this.root = this;
      this.parent = this;
    } else {
      this.root = parent.root;
      this.parent = parent;
    }

    const sinksLen = sinks.length;
    let i = 0;

    const emit = (level: LogLevel, msgOrGetMsg: unknown, optionalParams: unknown[]): void => {
      const message = typeof msgOrGetMsg === 'function' ? msgOrGetMsg() : msgOrGetMsg;
      const event = factory.createLogEvent(this, level, message, optionalParams);
      for (i = 0; i < sinksLen; ++i) {
        sinks[i].emit(event);
      }
    };

    this.trace = function trace(messageOrGetMessage: unknown, ...optionalParams: unknown[]): void {
      if (config.level <= LogLevel.trace) {
        emit(LogLevel.trace, messageOrGetMessage, optionalParams);
      }
    };

    this.debug = function debug(messageOrGetMessage: unknown, ...optionalParams: unknown[]): void {
      if (config.level <= LogLevel.debug) {
        emit(LogLevel.debug, messageOrGetMessage, optionalParams);
      }
    };

    this.info = function info(messageOrGetMessage: unknown, ...optionalParams: unknown[]): void {
      if (config.level <= LogLevel.info) {
        emit(LogLevel.info, messageOrGetMessage, optionalParams);
      }
    };

    this.warn = function warn(messageOrGetMessage: unknown, ...optionalParams: unknown[]): void {
      if (config.level <= LogLevel.warn) {
        emit(LogLevel.warn, messageOrGetMessage, optionalParams);
      }
    };

    this.error = function error(messageOrGetMessage: unknown, ...optionalParams: unknown[]): void {
      if (config.level <= LogLevel.error) {
        emit(LogLevel.error, messageOrGetMessage, optionalParams);
      }
    };

    this.fatal = function fatal(messageOrGetMessage: unknown, ...optionalParams: unknown[]): void {
      if (config.level <= LogLevel.fatal) {
        emit(LogLevel.fatal, messageOrGetMessage, optionalParams);
      }
    };
  }

  public scopeTo(name: string): ILogger {
    const scopedLoggers = this.scopedLoggers;
    let scopedLogger = scopedLoggers[name];
    if (scopedLogger === void 0) {
      scopedLogger = scopedLoggers[name] = new DefaultLogger(this.config, this.factory, this.sinks, this.scope.concat(name), this);
    }
    return scopedLogger;
  }
}

/**
 * A basic `ILogger` configuration that configures a single `console` sink based on provided options.
 *
 * NOTE: You *must* register the return value of `.create` with the container / au instance, not this `LoggerConfiguration` object itself.
 *
 * ```ts
 * // GOOD
 * container.register(LoggerConfiguration.create(console))
 * // GOOD
 * container.register(LoggerConfiguration.create(console, LogLevel.debug))
 * // GOOD
 * container.register(LoggerConfiguration.create({
 *   debug: PLATFORM.noop,
 *   info: PLATFORM.noop,
 *   warn: PLATFORM.noop,
 *   error: msg => {
 *     throw new Error(msg);
 *   }
 * }, LogLevel.debug))
 *
 * // BAD
 * container.register(LoggerConfiguration)
 * ```
 */
export const LoggerConfiguration = toLookup({
  /**
   * @param $console - The `console` object to use. Can be the native `window.console` / `global.console`, but can also be a wrapper or mock that implements the same interface.
   * @param level - The global `LogLevel` to configure. Defaults to `warn` or higher.
   * @param colorOptions - Whether to use colors or not. Defaults to `noColors`. Colors are especially nice in nodejs environments but don't necessarily work (well) in all environments, such as browsers.
   */
  create(
    $console: IConsoleLike,
    level: LogLevel = LogLevel.warn,
    colorOptions = ColorOptions.noColors,
  ): IRegistry {
    return toLookup({
      register(container: IContainer): IContainer {
        return container.register(
          Registration.instance(ILogConfig, new LogConfig(colorOptions, level)),
          Registration.instance(ISink, new ConsoleSink($console)),
        );
      },
    });
  },
});
