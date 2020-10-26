var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./di", "./functions", "./resource", "@aurelia/metadata"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoggerConfiguration = exports.DefaultLogger = exports.ConsoleSink = exports.DefaultLogEventFactory = exports.DefaultLogEvent = exports.LogConfig = exports.format = exports.sink = exports.LoggerSink = exports.ILogScopes = exports.ILogger = exports.ILogEventFactory = exports.ISink = exports.ILogConfig = exports.ColorOptions = exports.LogLevel = void 0;
    const di_1 = require("./di");
    const functions_1 = require("./functions");
    const resource_1 = require("./resource");
    const metadata_1 = require("@aurelia/metadata");
    var LogLevel;
    (function (LogLevel) {
        /**
         * The most detailed information about internal app state.
         *
         * Disabled by default and should never be enabled in a production environment.
         */
        LogLevel[LogLevel["trace"] = 0] = "trace";
        /**
         * Information that is useful for debugging during development and has no long-term value.
         */
        LogLevel[LogLevel["debug"] = 1] = "debug";
        /**
         * Information about the general flow of the application that has long-term value.
         */
        LogLevel[LogLevel["info"] = 2] = "info";
        /**
         * Unexpected circumstances that require attention but do not otherwise cause the current flow of execution to stop.
         */
        LogLevel[LogLevel["warn"] = 3] = "warn";
        /**
         * Unexpected circumstances that cause the flow of execution in the current activity to stop but do not cause an app-wide failure.
         */
        LogLevel[LogLevel["error"] = 4] = "error";
        /**
         * Unexpected circumstances that cause an app-wide failure or otherwise require immediate attention.
         */
        LogLevel[LogLevel["fatal"] = 5] = "fatal";
        /**
         * No messages should be written.
         */
        LogLevel[LogLevel["none"] = 6] = "none";
    })(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
    /**
     * Flags to enable/disable color usage in the logging output.
     */
    var ColorOptions;
    (function (ColorOptions) {
        /**
         * Do not use ASCII color codes in logging output.
         */
        ColorOptions[ColorOptions["noColors"] = 0] = "noColors";
        /**
         * Use ASCII color codes in logging output. By default, timestamps and the TRC and DBG prefix are colored grey. INF white, WRN yellow, and ERR and FTL red.
         */
        ColorOptions[ColorOptions["colors"] = 1] = "colors";
    })(ColorOptions = exports.ColorOptions || (exports.ColorOptions = {}));
    exports.ILogConfig = di_1.DI.createInterface('ILogConfig').withDefault(x => x.instance(new LogConfig(0 /* noColors */, 3 /* warn */)));
    exports.ISink = di_1.DI.createInterface('ISink').noDefault();
    exports.ILogEventFactory = di_1.DI.createInterface('ILogEventFactory').withDefault(x => x.singleton(DefaultLogEventFactory));
    exports.ILogger = di_1.DI.createInterface('ILogger').withDefault(x => x.singleton(DefaultLogger));
    exports.ILogScopes = di_1.DI.createInterface('ILogScope').noDefault();
    exports.LoggerSink = Object.freeze({
        key: resource_1.Protocol.annotation.keyFor('logger-sink-handles'),
        define(target, definition) {
            metadata_1.Metadata.define(this.key, definition.handles, target.prototype);
            return target;
        },
        getHandles(target) {
            return metadata_1.Metadata.get(this.key, target);
        },
    });
    function sink(definition) {
        return function (target) {
            return exports.LoggerSink.define(target, definition);
        };
    }
    exports.sink = sink;
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    exports.format = functions_1.toLookup({
        red(str) {
            return `\u001b[31m${str}\u001b[39m`;
        },
        green(str) {
            return `\u001b[32m${str}\u001b[39m`;
        },
        yellow(str) {
            return `\u001b[33m${str}\u001b[39m`;
        },
        blue(str) {
            return `\u001b[34m${str}\u001b[39m`;
        },
        magenta(str) {
            return `\u001b[35m${str}\u001b[39m`;
        },
        cyan(str) {
            return `\u001b[36m${str}\u001b[39m`;
        },
        white(str) {
            return `\u001b[37m${str}\u001b[39m`;
        },
        grey(str) {
            return `\u001b[90m${str}\u001b[39m`;
        },
    });
    class LogConfig {
        constructor(colorOptions, level) {
            this.colorOptions = colorOptions;
            this.level = level;
        }
    }
    exports.LogConfig = LogConfig;
    const getLogLevelString = (function () {
        const logLevelString = [
            functions_1.toLookup({
                TRC: 'TRC',
                DBG: 'DBG',
                INF: 'INF',
                WRN: 'WRN',
                ERR: 'ERR',
                FTL: 'FTL',
                QQQ: '???',
            }),
            functions_1.toLookup({
                TRC: exports.format.grey('TRC'),
                DBG: exports.format.grey('DBG'),
                INF: exports.format.white('INF'),
                WRN: exports.format.yellow('WRN'),
                ERR: exports.format.red('ERR'),
                FTL: exports.format.red('FTL'),
                QQQ: exports.format.grey('???'),
            }),
        ];
        return function (level, colorOptions) {
            if (level <= 0 /* trace */) {
                return logLevelString[colorOptions].TRC;
            }
            if (level <= 1 /* debug */) {
                return logLevelString[colorOptions].DBG;
            }
            if (level <= 2 /* info */) {
                return logLevelString[colorOptions].INF;
            }
            if (level <= 3 /* warn */) {
                return logLevelString[colorOptions].WRN;
            }
            if (level <= 4 /* error */) {
                return logLevelString[colorOptions].ERR;
            }
            if (level <= 5 /* fatal */) {
                return logLevelString[colorOptions].FTL;
            }
            return logLevelString[colorOptions].QQQ;
        };
    })();
    function getScopeString(scope, colorOptions) {
        if (colorOptions === 0 /* noColors */) {
            return scope.join('.');
        }
        // eslint-disable-next-line @typescript-eslint/unbound-method
        return scope.map(exports.format.cyan).join('.');
    }
    function getIsoString(timestamp, colorOptions) {
        if (colorOptions === 0 /* noColors */) {
            return new Date(timestamp).toISOString();
        }
        return exports.format.grey(new Date(timestamp).toISOString());
    }
    class DefaultLogEvent {
        constructor(severity, message, optionalParams, scope, colorOptions, timestamp) {
            this.severity = severity;
            this.message = message;
            this.optionalParams = optionalParams;
            this.scope = scope;
            this.colorOptions = colorOptions;
            this.timestamp = timestamp;
        }
        toString() {
            const { severity, message, scope, colorOptions, timestamp } = this;
            if (scope.length === 0) {
                return `${getIsoString(timestamp, colorOptions)} [${getLogLevelString(severity, colorOptions)}] ${message}`;
            }
            return `${getIsoString(timestamp, colorOptions)} [${getLogLevelString(severity, colorOptions)} ${getScopeString(scope, colorOptions)}] ${message}`;
        }
    }
    exports.DefaultLogEvent = DefaultLogEvent;
    let DefaultLogEventFactory = class DefaultLogEventFactory {
        constructor(config) {
            this.config = config;
        }
        createLogEvent(logger, level, message, optionalParams) {
            return new DefaultLogEvent(level, message, optionalParams, logger.scope, this.config.colorOptions, Date.now());
        }
    };
    DefaultLogEventFactory = __decorate([
        __param(0, exports.ILogConfig),
        __metadata("design:paramtypes", [Object])
    ], DefaultLogEventFactory);
    exports.DefaultLogEventFactory = DefaultLogEventFactory;
    class ConsoleSink {
        constructor($console) {
            this.handleEvent = function emit(event) {
                const optionalParams = event.optionalParams;
                if (optionalParams === void 0 || optionalParams.length === 0) {
                    switch (event.severity) {
                        case 0 /* trace */:
                        case 1 /* debug */:
                            return $console.debug(event.toString());
                        case 2 /* info */:
                            return $console.info(event.toString());
                        case 3 /* warn */:
                            return $console.warn(event.toString());
                        case 4 /* error */:
                        case 5 /* fatal */:
                            return $console.error(event.toString());
                    }
                }
                else {
                    switch (event.severity) {
                        case 0 /* trace */:
                        case 1 /* debug */:
                            return $console.debug(event.toString(), ...optionalParams);
                        case 2 /* info */:
                            return $console.info(event.toString(), ...optionalParams);
                        case 3 /* warn */:
                            return $console.warn(event.toString(), ...optionalParams);
                        case 4 /* error */:
                        case 5 /* fatal */:
                            return $console.error(event.toString(), ...optionalParams);
                    }
                }
            };
        }
    }
    exports.ConsoleSink = ConsoleSink;
    let DefaultLogger = class DefaultLogger {
        constructor(
        /**
         * The global logger configuration.
         */
        config, factory, sinks, 
        /**
         * The scopes that this logger was created for, if any.
         */
        scope = [], parent = null) {
            var _a, _b, _c, _d, _e, _f;
            this.config = config;
            this.factory = factory;
            this.scope = scope;
            this.scopedLoggers = Object.create(null);
            let traceSinks;
            let debugSinks;
            let infoSinks;
            let warnSinks;
            let errorSinks;
            let fatalSinks;
            if (parent === null) {
                this.root = this;
                this.parent = this;
                traceSinks = this.traceSinks = [];
                debugSinks = this.debugSinks = [];
                infoSinks = this.infoSinks = [];
                warnSinks = this.warnSinks = [];
                errorSinks = this.errorSinks = [];
                fatalSinks = this.fatalSinks = [];
                for (const $sink of sinks) {
                    const handles = exports.LoggerSink.getHandles($sink);
                    if ((_a = handles === null || handles === void 0 ? void 0 : handles.includes(0 /* trace */)) !== null && _a !== void 0 ? _a : true) {
                        traceSinks.push($sink);
                    }
                    if ((_b = handles === null || handles === void 0 ? void 0 : handles.includes(1 /* debug */)) !== null && _b !== void 0 ? _b : true) {
                        debugSinks.push($sink);
                    }
                    if ((_c = handles === null || handles === void 0 ? void 0 : handles.includes(2 /* info */)) !== null && _c !== void 0 ? _c : true) {
                        infoSinks.push($sink);
                    }
                    if ((_d = handles === null || handles === void 0 ? void 0 : handles.includes(3 /* warn */)) !== null && _d !== void 0 ? _d : true) {
                        warnSinks.push($sink);
                    }
                    if ((_e = handles === null || handles === void 0 ? void 0 : handles.includes(4 /* error */)) !== null && _e !== void 0 ? _e : true) {
                        errorSinks.push($sink);
                    }
                    if ((_f = handles === null || handles === void 0 ? void 0 : handles.includes(5 /* fatal */)) !== null && _f !== void 0 ? _f : true) {
                        fatalSinks.push($sink);
                    }
                }
            }
            else {
                this.root = parent.root;
                this.parent = parent;
                traceSinks = this.traceSinks = parent.traceSinks;
                debugSinks = this.debugSinks = parent.debugSinks;
                infoSinks = this.infoSinks = parent.infoSinks;
                warnSinks = this.warnSinks = parent.warnSinks;
                errorSinks = this.errorSinks = parent.errorSinks;
                fatalSinks = this.fatalSinks = parent.fatalSinks;
            }
        }
        trace(messageOrGetMessage, ...optionalParams) {
            if (this.config.level <= 0 /* trace */) {
                this.emit(this.traceSinks, 0 /* trace */, messageOrGetMessage, optionalParams);
            }
        }
        debug(messageOrGetMessage, ...optionalParams) {
            if (this.config.level <= 1 /* debug */) {
                this.emit(this.debugSinks, 1 /* debug */, messageOrGetMessage, optionalParams);
            }
        }
        info(messageOrGetMessage, ...optionalParams) {
            if (this.config.level <= 2 /* info */) {
                this.emit(this.infoSinks, 2 /* info */, messageOrGetMessage, optionalParams);
            }
        }
        warn(messageOrGetMessage, ...optionalParams) {
            if (this.config.level <= 3 /* warn */) {
                this.emit(this.warnSinks, 3 /* warn */, messageOrGetMessage, optionalParams);
            }
        }
        error(messageOrGetMessage, ...optionalParams) {
            if (this.config.level <= 4 /* error */) {
                this.emit(this.errorSinks, 4 /* error */, messageOrGetMessage, optionalParams);
            }
        }
        fatal(messageOrGetMessage, ...optionalParams) {
            if (this.config.level <= 5 /* fatal */) {
                this.emit(this.fatalSinks, 5 /* fatal */, messageOrGetMessage, optionalParams);
            }
        }
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
         *   constructor(@ILogger private logger: ILogger) {
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
        scopeTo(name) {
            const scopedLoggers = this.scopedLoggers;
            let scopedLogger = scopedLoggers[name];
            if (scopedLogger === void 0) {
                scopedLogger = scopedLoggers[name] = new DefaultLogger(this.config, this.factory, (void 0), this.scope.concat(name), this);
            }
            return scopedLogger;
        }
        emit(sinks, level, msgOrGetMsg, optionalParams) {
            const message = typeof msgOrGetMsg === 'function' ? msgOrGetMsg() : msgOrGetMsg;
            const event = this.factory.createLogEvent(this, level, message, optionalParams);
            for (let i = 0, ii = sinks.length; i < ii; ++i) {
                sinks[i].handleEvent(event);
            }
        }
    };
    __decorate([
        functions_1.bound,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], DefaultLogger.prototype, "trace", null);
    __decorate([
        functions_1.bound,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], DefaultLogger.prototype, "debug", null);
    __decorate([
        functions_1.bound,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], DefaultLogger.prototype, "info", null);
    __decorate([
        functions_1.bound,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], DefaultLogger.prototype, "warn", null);
    __decorate([
        functions_1.bound,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], DefaultLogger.prototype, "error", null);
    __decorate([
        functions_1.bound,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], DefaultLogger.prototype, "fatal", null);
    DefaultLogger = __decorate([
        __param(0, exports.ILogConfig),
        __param(1, exports.ILogEventFactory),
        __param(2, di_1.all(exports.ISink)),
        __param(3, di_1.optional(exports.ILogScopes)),
        __param(4, di_1.ignore),
        __metadata("design:paramtypes", [Object, Object, Array, Array, Object])
    ], DefaultLogger);
    exports.DefaultLogger = DefaultLogger;
    /**
     * A basic `ILogger` configuration that configures a single `console` sink based on provided options.
     *
     * NOTE: You *must* register the return value of `.create` with the container / au instance, not this `LoggerConfiguration` object itself.
     *
     * @example
     * ```ts
     * container.register(LoggerConfiguration.create());
     *
     * container.register(LoggerConfiguration.create({$console: console}))
     *
     * container.register(LoggerConfiguration.create({$console: console, level: LogLevel.debug}))
     *
     * container.register(LoggerConfiguration.create({
     *  $console: {
     *     debug: noop,
     *     info: noop,
     *     warn: noop,
     *     error: msg => {
     *       throw new Error(msg);
     *     }
     *  },
     *  level: LogLevel.debug
     * }))
     *
     * ```
     */
    exports.LoggerConfiguration = functions_1.toLookup({
        /**
         * @param $console - The `console` object to use. Can be the native `window.console` / `global.console`, but can also be a wrapper or mock that implements the same interface.
         * @param level - The global `LogLevel` to configure. Defaults to `warn` or higher.
         * @param colorOptions - Whether to use colors or not. Defaults to `noColors`. Colors are especially nice in nodejs environments but don't necessarily work (well) in all environments, such as browsers.
         */
        create({ $console, level = 3 /* warn */, colorOptions = 0 /* noColors */, sinks = [], } = {}) {
            return functions_1.toLookup({
                register(container) {
                    container.register(di_1.Registration.instance(exports.ILogConfig, new LogConfig(colorOptions, level)));
                    if ($console !== void 0 && $console !== null) {
                        container.register(di_1.Registration.instance(exports.ISink, new ConsoleSink($console)));
                    }
                    for (const $sink of sinks) {
                        container.register(di_1.Registration.singleton(exports.ISink, $sink));
                    }
                    return container;
                },
            });
        },
    });
});
//# sourceMappingURL=logger.js.map