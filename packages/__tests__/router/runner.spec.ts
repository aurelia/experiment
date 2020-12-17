/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Runner, Step } from '@aurelia/router';
import { assert } from '@aurelia/testing';

const createTimedPromise = (value, time, previousValue?, reject = false): Promise<unknown> => {
  return new Promise((res, rej) => {
    // console.log(`(promise ${value})`);
    setTimeout(() => {
      // console.log(value, `(${previousValue})`);
      if (reject) {
        rej(`REJECTED ${value}`);
      } else {
        res(value);
      }
    }, time);
  });
};

describe.skip('Runner', function () {
  this.timeout(30000);

  const oneTests = [
    { step: 1, result: 1 },
    { step: 'one', result: 'one' },
    { step: () => 'one', result: 'one' },
    { step: createTimedPromise('one', 100), result: 'one' },
    { step: createTimedPromise(createTimedPromise('two', 100), 100), result: 'two' },
    { step: createTimedPromise(createTimedPromise(() => 'three', 100), 100), result: 'three' },
    { step: () => createTimedPromise(createTimedPromise(() => 'four', 100), 100), result: 'four' },
  ];

  for (let i = 0; i < oneTests.length; i++) {
    const test = oneTests[i];
    it(`runs one "${test.step}" => "${test.result}"`, function () {
      const result = Runner.runOne(test.step);
      if (result instanceof Promise) {
        return result.then(resolved => {
          assert.strictEqual(resolved, test.result, `#${i}`);
        }).catch(err => { throw err; });
      } else {
        assert.strictEqual(result, test.result, `#${i}`);
      }
    });
  }

  const tests = [
    {
      steps: [
        (prev) => `one (${prev})`,
        (prev) => `two (${prev})`,
        (prev) => createTimedPromise(`three (${prev})`, 2000),
        (prev) => createTimedPromise(`four (${prev})`, 1000),
      ],
      result: 'four (three (two (one (undefined))))',
      cancelled: 'two (one (undefined))',
      results: ['one (undefined)', 'two (undefined)', 'three (undefined)', 'four (undefined)'],
    },
    {
      steps: [
        (prev) => createTimedPromise(`four (${prev})`, 1000),
        (prev) => createTimedPromise(`three (${prev})`, 2000),
        (prev) => `two (${prev})`,
        (prev) => `one (${prev})`,
      ],
      result: 'one (two (three (four (undefined))))',
      cancelled: 'four (undefined)',
      results: ['four (undefined)', 'three (undefined)', 'two (undefined)', 'one (undefined)'],
    },
  ];
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    it(`runs sequence ${test.steps} => ${test.result}`, function () {
      const stepsPromise = Runner.run(null, ...test.steps) as Promise<unknown>;
      stepsPromise.then(result => {
        assert.strictEqual(result, test.result, `#${i}`);
      }).catch(err => { throw err; });
    });
  }

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    it(`cancels sequence ${test.steps} => ${test.cancelled}`, function () {
      const stepsPromise = Runner.run(null, ...test.steps) as Promise<unknown>;
      setTimeout(() => {
        Runner.cancel(stepsPromise);
      }, 1500);
      stepsPromise.then(result => {
        assert.strictEqual(result, test.cancelled, `#${i}`);
      }).catch(err => { throw err; });
    });
  }

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    it.skip(`runs all ${test.steps} => ${test.results}`, function () {
      const stepsPromise = Runner.runParallel(null, ...test.steps) as Promise<unknown>;
      stepsPromise.then((results: unknown[]) => {
        assert.strictEqual(results.join(','), test.results.join(','), `#${i}`);
      }).catch(err => { throw err; });
    });
  }
  it(`doesn't add ticks`, async function () {
    class Controller {
      public constructor(
        public name: string,
        public children: Controller[] = [],
        public connected = true,
        public bindingTiming = 1,
        public boundTiming = 1,
      ) { }

      public activate(caller: any | null = null, state: string | null = null): void | Promise<void> {
        this.log(`activate.enter [${caller?.id}] [${state}]`);
        return Runner.run<void>(this.connected ? caller : null,
          (_value) => `${state}:${this.name}.activate`,
          (value, step) => this.binding(step, value),
          (value, step) => this.bound(step, value),
          (value, step) => {
            switch (this.children.length) {
              case 0:
                return;
              case 1:
                return this.children[0].activate(step, value);
              default:
                // return Promise.all(this.children.map(child => child.activate(step)));
                // for (let child of this.children) {
                //   child.activate(step);
                // }
                // return step.continue(Runner.run(step, () => { this.children.map(x => x.activate(step)); }));
                // return Runner.run(step, ...this.children.map(x => (_childResolved, childStep) => x.activate(childStep)));
                return Runner.runParallel(this.connected ? step : null, ...this.children.map(x => (childValue, childStep) => x.activate(childStep, childValue)));
            }
          },
          () => { this.log(`activate.leave`); },
        );
      }
      public binding(caller: any, state: string | null): void | Promise<void> {
        this.log(`binding.enter(${this.bindingTiming}) [${caller?.id}] [${state}]`, '  ');
        return Runner.run<void>(this.connected ? caller : null,
          () => wait(this.bindingTiming), // Promise.resolve(), // pretend this is a user hook return value
          () => { this.log(`binding.leave`, '  '); },
          (_value) => `${state}:${this.name}.binding`,
        );
      }
      public bound(caller: any, state: string | null): void | Promise<void> {
        this.log(`bound.enter(${this.bindingTiming}) [${caller?.id}] [${state}]`, '  ');
        return Runner.run<void>(this.connected ? caller : null,
          () => wait(this.boundTiming), // Promise.resolve(), // pretend this is a user hook return value
          () => { this.log(`bound.leave`, '  '); },
          (_value) => `${state}:${this.name}.bound`,
        );
      }

      private log(msg: string, indent = ''): void {
        if (this.name.startsWith('parent')) {
          indent += '    ';
        } else if (this.name.startsWith('child')) {
          indent += '        ';
        }
        console.log(`>>> ${indent}${this.name}.${msg}`)
      }
    }

    async function testIt(components: number, connected = true, defaults = [1, 1], timings: any = {}) {
      const root1 = new Controller('root', [
        new Controller('parent-1', [
          new Controller('child-1.1', [], connected, ...(timings['child-1.1'] ?? defaults)),
          new Controller('child-1.2', [], connected, ...(timings['child-1.2'] ?? defaults)),
          new Controller('child-1.3', [], connected, ...(timings['child-1.3'] ?? defaults)),
          new Controller('child-1.4', [], connected, ...(timings['child-1.4'] ?? defaults)),
        ], connected, ...(timings['parent-1'] ?? defaults)),
        new Controller('parent-2', [
          new Controller('child-2.1', [], connected, ...(timings['child-2.1'] ?? defaults)),
          new Controller('child-2.2', [], connected, ...(timings['child-2.2'] ?? defaults)),
          new Controller('child-2.3', [], connected, ...(timings['child-2.3'] ?? defaults)),
          new Controller('child-2.4', [], connected, ...(timings['child-2.4'] ?? defaults)),
        ], connected, ...(timings['parent-2'] ?? defaults)),
        new Controller('parent-3', [
          new Controller('child-3.1', [], connected, ...(timings['child-3.1'] ?? defaults)),
          new Controller('child-3.2', [], connected, ...(timings['child-3.2'] ?? defaults)),
          new Controller('child-3.3', [], connected, ...(timings['child-3.3'] ?? defaults)),
          new Controller('child-3.4', [], connected, ...(timings['child-3.4'] ?? defaults)),
        ], connected, ...(timings['parent-3'] ?? defaults)),
        new Controller('parent-4', [
          new Controller('child-4.1', [], connected, ...(timings['child-4.1'] ?? defaults)),
          new Controller('child-4.2', [], connected, ...(timings['child-4.2'] ?? defaults)),
          new Controller('child-4.3', [], connected, ...(timings['child-4.3'] ?? defaults)),
          new Controller('child-4.4', [], connected, ...(timings['child-4.4'] ?? defaults)),
        ], connected, ...(timings['parent-4'] ?? defaults)),
      ], connected, ...(timings['root'] ?? defaults));
      let logTicks = true;

      switch (components) {
        case 3:
          root1.children.pop();
          root1.children.forEach(child => child.children.pop());
          break;
        case 2:
          root1.children.pop();
          root1.children.pop();
          root1.children.forEach(child => child.children.pop());
          root1.children.forEach(child => child.children.pop());
          break;
        case 1:
          root1.children.pop();
          root1.children.pop();
          root1.children.pop();
          root1.children.forEach(child => child.children.pop());
          root1.children.forEach(child => child.children.pop());
          root1.children.forEach(child => child.children.pop());
          break;
      }

      const activate = root1.activate(null, 'start');
      const done = `>>> DONE. ticks: #TICKS#; components: ${components}; ${connected ? 'connected' : 'not connected'}; defaults: [${defaults.join(',')}]; ` +
        `timings: ` + Object.keys(timings).map(key => `${key}: [${timings[key].join(',')}]; `);

      let ticks = 0;
      if (activate instanceof Promise) {
        activate.then(async () => {
          logTicks = false;
          console.log(done.replace('#TICKS#', `${ticks}`));
          Step.id = 0;
          Step.runs = {};
          Step.steps = {};
          await Promise.resolve();
        }).catch(err => { throw err; });
      } else {
        logTicks = false;
        console.log(done.replace('#TICKS#', `${ticks}`));
        Step.id = 0;
        Step.runs = {};
        Step.steps = {};
      await Promise.resolve();
      }

      (async function () {
        // let i = 0;
        while (logTicks) {
          await Promise.resolve();
          console.log(`>> tick(${++ticks})`);
          if (ticks >= 100) { logTicks = false; }
        }
      })().catch((err) => { throw err; });

      return activate;
    }

    for (let connected of [true, false]) {
      // await testIt(1, connected);
      // await testIt(2, connected, [0, 0], { 'child-1.1': [0, 0] });
      await testIt(2, connected, [1, 1], { 'child-1.1': [1, 1] });
      // await testIt(2, connected, [0, 0], { 'child-1.1': [1, 1] });
      // await testIt(2, connected, [1, 1], { 'child-1.1': [0, 0] });

      // await testIt(2, connected, [1, 1], { 'child-1.1': [3, 3] });
      // await testIt(2, connected, [3, 3], { 'child-1.1': [1, 1] });
      // await testIt(3, connected);
      // await testIt(4, connected);
    }

    function wait(count: number): void | Promise<void> {
      if (count < 1) {
        return;
      }
      let i = 0;
      let resolve: () => void;
      const p = new Promise<void>(r => {
        resolve = r;
      });
      const next = (): void => {
        if (++i < count) {
          void Promise.resolve().then(next);
        } else {
          resolve();
        }
      };
      next();
      return p;

      //   let i = -1;
      //   // console.log(`${_vm.name}.${name} enter async(${count})`, value);
      //   function next() {
      //     // if (i >= 0) {
      //     //   console.log(`${_vm.name}.${name} tick ${i + 1} async(${count})`, value);
      //     // }
      //     if (++i < count) {
      //       return Promise.resolve().then(next);
      //     }
      //     // console.log(`${_vm.name}.${name} leave async(${count})`, value);
      //   }
      //   return next();
    }
  });
});
