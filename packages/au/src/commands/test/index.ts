import { DebugConfiguration } from '@aurelia/debug';

import { ICommandDefinition } from '../../args';
import { TestRunner, TestRunnerConfig } from './test-runner';

export const TestCommand: ICommandDefinition = {
  name: 'test',
  args: [
    {
      name: 'entryFile',
      type: 'string',
    },
    {
      name: 'scratchDir',
      type: 'string',
    },
    {
      name: 'reporter',
      type: 'string',
      options: ['per-line', 'progress'],
      defaultValue: 'progress',
    },
    {
      name: 'coverage',
      type: 'boolean',
      defaultValue: false,
    },
    {
      name: 'watch',
      type: 'boolean',
      defaultValue: false,
    },
    {
      name: 'exit',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'logLevel',
      type: 'string',
      options: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'none'],
      defaultValue: 'info',
    },
  ],
  async execute(cmd) {
    try {
      DebugConfiguration.register();

      const runner = TestRunner.create();
      await runner.run(TestRunnerConfig.from(cmd));

      process.on('exit', function () {
        console.log('exiting..');
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  },
};
