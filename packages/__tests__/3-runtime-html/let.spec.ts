import { ILogger } from '@aurelia/kernel';
import { assert, createFixture } from '@aurelia/testing';

describe('3-runtime-html/let.spec.ts', function () {
  for (const command of [
    'from-view',
    'two-way',
    'trigger',
    'delegate',
    'one-time',
    'capture',
    'attr'
  ]) {
    it(`throws on non .bind/.to-view: "${command}"`, async function () {
      const { tearDown, start } = createFixture(`<let a.${command}="bc">`, class { }, [], /* no start */false);

      let ex: Error;
      try {
        await start();
      } catch (e) {
        ex = e;
        // assert.includes(e.toString(), `Invalid command ${command} for <let>. Only to-view/bind supported.`);
        assert.strictEqual(
          e.toString().includes(`Invalid command ${command} for <let>. Only to-view/bind supported.`)
          || e.toString().includes(`AUR0704:${command}`),
          true
        );
      }
      assert.instanceOf(ex, Error);
      await tearDown();
    });
  }

  for (const command of ['bind', 'to-view']) {
    it(`camel-cases the target with binding command [${command}]`, async function () {
      const { tearDown, appHost, startPromise } = createFixture(`<let my-prop.${command}="1"></let>\${myProp}`);

      await startPromise;
      assert.visibleTextEqual(appHost, '1');
      await tearDown();
    });
  }

  it('camel-cases the target with interpolation', async function () {
    const { tearDown, appHost, startPromise } = createFixture(`<let my-prop="\${1}"></let>\${myProp}`);

    await startPromise;
    assert.visibleTextEqual(appHost, '1');
    await tearDown();
  });

  it('works with, and warns when encountering literal', async function () {
    const { ctx, tearDown, appHost, start } = createFixture(`<let my-prop="1"></let>\${myProp}`, class { }, [], false);

    const logger = ctx.container.get(ILogger);
    const callArgs = [];
    logger.warn = (fn => (...args: unknown[]) => {
      callArgs.push(args);
      return fn.apply(logger, args);
    })(logger.warn);

    await start();
    assert.visibleTextEqual(appHost, '1');
    if (__DEV__) {
      assert.strictEqual(callArgs.length, 1);
    }
    assert.deepStrictEqual(callArgs[0], [
      `Property my-prop is declared with literal string 1. ` +
      `Did you mean my-prop.bind="1"?`
    ]);
    await tearDown();
  });
});
