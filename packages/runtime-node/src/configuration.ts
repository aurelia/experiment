import { Registration, IContainer, LogLevel, LoggerConfiguration, ColorOptions } from '@aurelia/kernel';
import { IFileSystem, IHttpServer, IHttpServerOptions, ISystem } from './interfaces';
import { NodeFileSystem } from './file-system';
import { HttpServer } from './http-server';
import { System } from './system';
import { IScheduler } from '@aurelia/runtime';
import { NodeScheduler } from './node-scheduler';

const defaultOpts: IHttpServerOptions = {
  hostName: '0.0.0.0',
  port: 8080,
  root: './',
  level: LogLevel.info,
};

export const RuntimeNodeConfiguration = {
  create(opts: Partial<IHttpServerOptions>) {
    opts = { ...defaultOpts, ...opts };
    return {
      register(container: IContainer): IContainer {
        return container.register(
          Registration.singleton(IFileSystem, NodeFileSystem),
          Registration.singleton(ISystem, System),
          Registration.singleton(IHttpServer, HttpServer),
          Registration.singleton(IScheduler, NodeScheduler),
          Registration.instance(IHttpServerOptions, opts),
          LoggerConfiguration.create(console, opts.level, ColorOptions.colors)
        );
      },
    };
  }
};
