/* eslint-disable import/no-nodejs-modules */
import {
  DebugConfiguration,
} from '@aurelia/debug';
import {
  resolve,
} from 'path';
import {
  DI,
  LoggerConfiguration,
  LogLevel,
  ColorOptions,
  Registration,
} from '@aurelia/kernel';
import {
  IFileSystem,
  NodeFileSystem,
} from '@aurelia/runtime-node';
import {
  ServiceHost,
} from './service-host';

(async function () {
  DebugConfiguration.register();

  // Just for testing
  const root = resolve(__dirname, '..', '..', '..', '..', 'test', 'realworld');

  const container = DI.createContainer();
  container.register(
    LoggerConfiguration.create(console, LogLevel.debug, ColorOptions.colors),
    Registration.singleton(IFileSystem, NodeFileSystem),
  );

  const host = container.get(ServiceHost);

  await host.execute({ evaluate: true, entries: [{ dir: root }] });

})().catch(err => {
  console.error(err);
  process.exit(1);
});
