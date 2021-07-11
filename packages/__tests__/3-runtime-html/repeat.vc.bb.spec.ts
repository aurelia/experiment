/* eslint-disable no-await-in-loop */
import { IContainer } from '@aurelia/kernel';
import { Aurelia, CustomElement, ICustomElementController, IPlatform, valueConverter } from '@aurelia/runtime-html';
import { assert, TestContext } from '@aurelia/testing';
import { createSpecFunction, TestExecutionContext, TestFunction } from '../util.js';

describe.only('repeat value-converter integration', function () {
  interface TestSetupContext {
    template: string;
    registrations: any[];
  }
  class RepeaterTestExecutionContext implements TestExecutionContext<any> {
    private _scheduler: IPlatform;
    public constructor(
      public ctx: TestContext,
      public au: Aurelia,
      public container: IContainer,
      public host: HTMLElement,
      public app: App | null,
      public error: Error | null,
    ) { }
    public get platform(): IPlatform { return this._scheduler ?? (this._scheduler = this.container.get(IPlatform)); }
  }

  async function testRepeaterVC(
    testFunction: TestFunction<RepeaterTestExecutionContext>,
    { template, registrations = [] }: Partial<TestSetupContext> = {}
  ) {
    const ctx = TestContext.create();

    const host = ctx.doc.createElement('div');
    ctx.doc.body.appendChild(host);

    const container = ctx.container;
    const au = new Aurelia(container);
    let error: Error | null = null;
    let app: App | null = null;
    try {
      await au
        .register(
          ...registrations,
          IdentityValueConverter,
          OddEvenValueConverter,
          MultipleOfValueConverter,
          NoopBindingBehavior,
        )
        .app({
          host,
          component: CustomElement.define({ name: 'app', isStrictBinding: true, template }, App)
        })
        .start();
      app = au.root.controller.viewModel as App;
    } catch (e) {
      error = e;
    }

    assert.strictEqual(error, null);

    await testFunction(new RepeaterTestExecutionContext(ctx, au, container, host, app, error));

    if (error === null) {
      await au.stop();
    }
    ctx.doc.body.removeChild(host);
  }
  const $it = createSpecFunction(testRepeaterVC);

  class App {
    public arr: number[] = Array.from({ length: 10 }, (_, i) => i + 1);
    public readonly $controller!: ICustomElementController<this>;
  }

  @valueConverter('identity')
  class IdentityValueConverter {
    public toView(value: unknown[]) {
      return value;
    }
  }

  @valueConverter('oddEven')
  class OddEvenValueConverter {
    public toView(value: number[], even: boolean) {
      return value.filter((v) => v % 2 === (even ? 0 : 1));
    }
  }

  @valueConverter('multipleOf')
  class MultipleOfValueConverter {
    public toView(value: number[], n: number) {
      return value.filter((v) => v % n === 0);
    }
  }

  @valueConverter('noop')
  class NoopBindingBehavior { }

  const identityExpected = Array.from({ length: 10 }, (_, i) => `<span>${i + 1}</span>`).join('');
  const oddExpected = Array.from({ length: 10 }, (_, i) => i % 2 === 0 ? `<span>${i + 1}</span>` : '').join('');
  const evenExpected = Array.from({ length: 10 }, (_, i) => i % 2 === 1 ? `<span>${i + 1}</span>` : '').join('');

  type Change = [change: (ctx: RepeaterTestExecutionContext) => void | Promise<void>, expected: string];

  class TestData {
    public readonly changes: Change[];
    public constructor(
      public readonly name: string,
      public readonly template: string,
      public readonly expectedInitial: string,
      ...changes: Change[]
    ) { this.changes = changes; }
  }

  function* getTestData() {
    const identityArrTmplt = `<span repeat.for="item of arr | identity">\${item}</span>`;
    yield new TestData(
      'array mutation - identity VC',
      identityArrTmplt,
      identityExpected,
      [(ctx) => { ctx.app.arr.push(11); }, `${identityExpected}<span>11</span>`],
      [(ctx) => { ctx.app.arr.unshift(12); }, `<span>12</span>${identityExpected}<span>11</span>`],
      [(ctx) => { ctx.app.arr.pop(); }, `<span>12</span>${identityExpected}`],
      [(ctx) => { ctx.app.arr.shift(); }, identityExpected],
    );
    yield new TestData(
      'array instance change - identity VC',
      identityArrTmplt,
      identityExpected,
      [
        (ctx) => { ctx.app.arr = Array.from({ length: 5 }, (_, i) => i * 5); },
        `<span>0</span><span>5</span><span>10</span><span>15</span><span>20</span>`
      ],
    );
    yield new TestData(
      'array instance change -> array mutation - identity VC',
      identityArrTmplt,
      identityExpected,
      [
        (ctx) => { ctx.app.arr = Array.from({ length: 5 }, (_, i) => i * 5); },
        `<span>0</span><span>5</span><span>10</span><span>15</span><span>20</span>`
      ],
      [
        (ctx) => { ctx.app.arr.push(25, 30); },
        `<span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>`
      ],
    );

    const oeVcTrueTmplt = `<span repeat.for="item of arr | oddEven:true">\${item}</span>`;
    yield new TestData(
      'array mutation - oddEven VC',
      oeVcTrueTmplt,
      evenExpected,
      [(ctx) => { ctx.app.arr.push(11, 12); }, `${evenExpected}<span>12</span>`],
      [(ctx) => { ctx.app.arr.unshift(14, 13); }, `<span>14</span>${evenExpected}<span>12</span>`],
      [(ctx) => { ctx.app.arr.pop(); }, `<span>14</span>${evenExpected}`],
      [(ctx) => { ctx.app.arr.shift(); }, evenExpected],
    );

    yield new TestData(
      'array instance change - oddEven VC',
      oeVcTrueTmplt,
      evenExpected,
      [(ctx) => { ctx.app.arr = Array.from({ length: 5 }, (_, i) => i * 5); }, `<span>0</span><span>10</span><span>20</span>`],
      [(ctx) => { ctx.app.arr = Array.from({ length: 5 }, (_, i) => i * 7); }, `<span>0</span><span>14</span><span>28</span>`],
    );

    yield new TestData(
      'change to VC arg - oddEven VC',
      `<let even.bind="true"></let><span repeat.for="item of arr | oddEven:even">\${item}</span>`,
      evenExpected,
      [(ctx) => { ctx.app.$controller.scope.overrideContext.even = false; }, oddExpected,],
    );

    const twoVcTmplt = `<span repeat.for="item of arr | oddEven:true | multipleOf:3">\${item}</span>`;
    yield new TestData(
      'array mutation - oddEven VC - multipleOf VC',
      twoVcTmplt,
      '<span>6</span>',
      [(ctx) => { ctx.app.arr.push(11, 12); }, '<span>6</span><span>12</span>',],
      [(ctx) => { ctx.app.arr.unshift(18, 19, 13, 14); }, '<span>18</span><span>6</span><span>12</span>',],
      [(ctx) => { ctx.app.arr.pop(); }, '<span>18</span><span>6</span>',],
      [(ctx) => { ctx.app.arr.shift(); }, '<span>6</span>',],
    );

    yield new TestData(
      'array instance change - oddEven VC - multipleOf VC',
      twoVcTmplt,
      '<span>6</span>',
      [(ctx) => { ctx.app.arr = Array.from({ length: 10 }, (_, i) => i + 11); }, '<span>12</span><span>18</span>',],
      [(ctx) => { ctx.app.arr = Array.from({ length: 10 }, (_, i) => i + 21); }, '<span>24</span><span>30</span>',],
    );

    yield new TestData(
      'change to VC arg - oddEven VC - multipleOf VC',
      `<let even.bind="false" n.bind="3"></let><span repeat.for="item of arr | oddEven:even | multipleOf:n">\${item}</span>`,
      '<span>3</span><span>9</span>',
      [
        (ctx) => {
          const oc = ctx.app.$controller.scope.overrideContext;
          oc.even = true;
          oc.n = 4;
        },
        '<span>4</span><span>8</span>',
      ],
    );

    const noopBBTmplt = `<span repeat.for="item of arr | noop">\${item}</span>`;
    yield new TestData(
      'array mutation - noop BB',
      noopBBTmplt,
      identityExpected,
      [(ctx) => { ctx.app.arr.push(11); }, `${identityExpected}<span>11</span>`,],
    );
    yield new TestData(
      'array instance change - noop BB',
      noopBBTmplt,
      identityExpected,
      [(ctx) => { ctx.app.arr = Array.from({ length: 5 }, (_, i) => i * 5); }, `<span>0</span><span>5</span><span>10</span><span>15</span><span>20</span>`,],
    );

    const twoVcBBTmplt = `<span repeat.for="item of arr | oddEven:true | multipleOf:3 & noop">\${item}</span>`;
    yield new TestData(
      'array mutation - oddEven VC - multipleOf VC - noop BB',
      twoVcBBTmplt,
      '<span>6</span>',
      [(ctx) => { ctx.app.arr.push(11, 12); }, '<span>6</span><span>12</span>',],
      [(ctx) => { ctx.app.arr.push(13, 14, 18, 19); }, '<span>6</span><span>12</span><span>18</span>',],
    );
    yield new TestData(
      'array instance change - oddEven VC - multipleOf VC - noop BB',
      twoVcBBTmplt,
      '<span>6</span>',
      [(ctx) => { ctx.app.arr = Array.from({ length: 10 }, (_, i) => i + 11); }, '<span>12</span><span>18</span>',],
      [(ctx) => { ctx.app.arr = Array.from({ length: 10 }, (_, i) => i + 21); }, '<span>24</span><span>30</span>',],
    );

    yield new TestData(
      'change to VC arg - oddEven VC - multipleOf VC - noop BB',
      `<let even.bind="false" n.bind="3"></let><span repeat.for="item of arr | oddEven:even | multipleOf:n & noop">\${item}</span>`,
      '<span>3</span><span>9</span>',
      [
        (ctx) => {
          const oc = ctx.app.$controller.scope.overrideContext;
          oc.even = true;
          oc.n = 4;
        },
        '<span>4</span><span>8</span>',
      ],
    );

    yield new TestData(
      'array instance change - array reverse - oddEven VC',
      `<span repeat.for="item of arr.reverse() | oddEven:true">\${item}</span>`,
      '<span>10</span><span>8</span><span>6</span><span>4</span><span>2</span>',
      [(ctx) => { ctx.app.arr = Array.from({ length: 5 }, (_, i) => i * 5); }, `<span>20</span><span>10</span><span>0</span>`,],
      // alternative to push; function call is treated pure, a push won't work here
      [(ctx) => { ctx.app.arr = [...ctx.app.arr, 42]; }, `<span>42</span><span>0</span><span>10</span><span>20</span>`,],
      [(ctx) => { ctx.app.arr = Array.from({ length: 5 }, (_, i) => i * 7); }, `<span>28</span><span>14</span><span>0</span>`,],
    );

    yield new TestData(
      'array instance change - array slice - oddEven VC',
      `<span repeat.for="item of arr.slice(0, 4) | oddEven:true">\${item}</span>`,
      '<span>2</span><span>4</span>',
      [(ctx) => { ctx.app.arr = Array.from({ length: 6 }, (_, i) => i * 5); }, `<span>0</span><span>10</span>`,],
      // alternative to push; function call is treated pure, a push won't work here
      [(ctx) => { ctx.app.arr = [42, 43, ...ctx.app.arr]; }, `<span>42</span><span>0</span>`,],
      [(ctx) => { ctx.app.arr = Array.from({ length: 5 }, (_, i) => i * 7); }, `<span>0</span><span>14</span>`,],
    );
  }

  for (const { name, template, expectedInitial, changes } of getTestData()) {
    $it(name, async function (ctx) {
      const host = ctx.host;
      assert.html.innerEqual(host, expectedInitial, 'initial');
      let i = 1;
      for (const [change, expected] of changes) {
        await change(ctx);
        await ctx.platform.domWriteQueue.yield();
        assert.html.innerEqual(host, expected, `post-mutation#${i++}`);
      }
    }, { template });
  }
});
