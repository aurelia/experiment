import { assert, createFixture, PLATFORM } from '@aurelia/testing';

describe('3-runtime-html/input.spec.ts', function () {
  const isTestingInNode = PLATFORM.navigator.userAgent.includes('jsdom');

  it('works: input[text] value.bind', async function () {
    const { startPromise, appHost, tearDown, component, ctx } = createFixture(
      `<input value.bind="message">`,
      class App {
        public message = 'Hello';
      }
    );
    await startPromise;

    const input= appHost.querySelector('input');
    assert.strictEqual(input.value, 'Hello');

    input.value = 'world';
    input.dispatchEvent(new ctx.Event('change'));
    assert.strictEqual(component.message, 'world');

    component.message = 'hello world';
    ctx.platform.domWriteQueue.flush();
    assert.strictEqual(input.value, 'hello world');

    await tearDown();
  });

  if (!isTestingInNode) {
    it('works: input[number] + value-as-number.bind', async function () {
      const { startPromise, appHost, tearDown, component, ctx } = createFixture(
        `<input type=number value-as-number.bind="count">`,
        class App {
          public count = 0;
        }
      );
      await startPromise;

      const input= appHost.querySelector('input');
      assert.strictEqual(input.value, '0');
      assert.strictEqual(input.valueAsNumber, 0);

      input.value = '100';
      input.dispatchEvent(new ctx.Event('change'));
      assert.strictEqual(component.count, 100);

      await tearDown();
    });

    it('treats file input ".bind" to as ".from-view"', async function () {
      const { startPromise, tearDown, component, ctx } = createFixture(
        `<input type=file files.bind="file">`,
        class App {
          public file = '';
        }
      );
      await startPromise;

      assert.doesNotThrow(() => {
        component.file = 'c:/my-file.txt';
        ctx.platform.domWriteQueue.flush();
      });

      await tearDown();
    });
  }

  it('works: textarea + value.bind', async function () {
    const { startPromise, appHost, tearDown, component, ctx } = createFixture(
      `<textarea value.bind="message">`,
      class App {
        public message = 'Hello';
      }
    );
    await startPromise;

    const input= appHost.querySelector('textarea');
    assert.strictEqual(input.value, 'Hello');

    input.value = 'world';
    input.dispatchEvent(new ctx.Event('change'));
    assert.strictEqual(component.message, 'world');

    component.message = 'hello world';
    ctx.platform.domWriteQueue.flush();
    assert.strictEqual(input.value, 'hello world');

    await tearDown();
  });

  it('works with ??', async function () {
    const { ctx, tearDown, component, appHost, startPromise } = createFixture(
      `<input value.to-view="prop1 ?? prop2" />`,
      class App {
        public prop1 = null;
        public prop2 = 'hello';
      }
    );

    await startPromise;
    const input = appHost.querySelector('input');
    assert.strictEqual(input.value, 'hello');

    component.prop1 = undefined;
    ctx.platform.domWriteQueue.flush();
    assert.strictEqual(input.value, 'hello');

    component.prop1 = 'ola';
    ctx.platform.domWriteQueue.flush();
    assert.strictEqual(input.value, 'ola');

    await tearDown();
  });

  it('works with ?? for member access', async function () {
    const { ctx, tearDown, component, appHost, startPromise } = createFixture(
      `<input value.to-view="prop1.prop3 ?? prop2" />`,
      class App {
        public prop1 = { prop3: null };
        public prop2 = 'hello';
      }
    );

    await startPromise;
    const input = appHost.querySelector('input');
    assert.strictEqual(input.value, 'hello');

    component.prop1.prop3 = undefined;
    ctx.platform.domWriteQueue.flush();
    assert.strictEqual(input.value, 'hello');

    component.prop1.prop3 = 'ola';
    ctx.platform.domWriteQueue.flush();
    assert.strictEqual(input.value, 'ola');

    await tearDown();
  });
});
