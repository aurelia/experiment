import { IRouter, RouterConfiguration, IRoute, IRouterTitle, ViewportInstruction, routes } from '@aurelia/router';
import { CustomElement, customElement, IPlatform, Aurelia } from '@aurelia/runtime-html';
import { assert, MockBrowserHistoryLocation, TestContext } from '@aurelia/testing';

describe('Router', function () {
  function getModifiedRouter(container) {
    const router = container.get(IRouter) as IRouter;
    const mockBrowserHistoryLocation = new MockBrowserHistoryLocation();
    mockBrowserHistoryLocation.changeCallback = router.navigation.handlePopstate;
    router.navigation.history = mockBrowserHistoryLocation as any;
    router.navigation.location = mockBrowserHistoryLocation as any;
    return router;
  }

  function spyNavigationStates(router, spy) {
    let _pushState;
    let _replaceState;
    if (spy) {
      _pushState = router.navigation.location.pushState;
      router.navigation.location.pushState = function (data, title, path) {
        spy('push', data, title, path);
        _pushState.call(router.navigation.location, data, title, path);
      };
      _replaceState = router.navigation.location.replaceState;
      router.navigation.location.replaceState = function (data, title, path) {
        spy('replace', data, title, path);
        _replaceState.call(router.navigation.location, data, title, path);
      };
    }
    return { _pushState, _replaceState };
  }
  function unspyNavigationStates(router, _push, _replace) {
    if (_push) {
      router.navigation.location.pushState = _push;
      router.navigation.location.replaceState = _replace;
    }
  }

  async function createFixture(config?, App?, stateSpy?) {
    const ctx = TestContext.create();
    const { container, platform } = ctx;

    if (App === void 0) {
      App = CustomElement.define({ name: 'app', template: '<template>left<au-viewport name="left"></au-viewport>right<au-viewport name="right"></au-viewport></template>' });
    }
    const Foo = CustomElement.define({ name: 'foo', template: '<template>Viewport: foo <a href="baz@foo"><span>baz</span></a><au-viewport name="foo"></au-viewport></template>' });
    const Bar = CustomElement.define({ name: 'bar', template: `<template>Viewport: bar Parameter id: [\${id}] Parameter name: [\${name}] <au-viewport name="bar"></au-viewport></template>` }, class {
      public static parameters = ['id', 'name'];
      public id = 'no id';
      public name = 'no name';

      // public static inject = [IRouter];
      // public constructor(private readonly router: IRouter) { }
      // public created() {
      //   console.log('created', 'closest viewport', this.router.getClosestViewport(this));
      // }
      // public canLoad() {
      //   console.log('canLoad', 'closest viewport', this.router.getClosestViewport(this));
      //   return true;
      // }
      public load(params) {
        // console.log('load', 'closest viewport', this.router.getClosestViewport(this));
        if (params.id) { this.id = params.id; }
        if (params.name) { this.name = params.name; }
      }
      // public binding() {
      //   console.log('binding', 'closest viewport', this.router.getClosestViewport(this));
      // }
    });
    const Baz = CustomElement.define({ name: 'baz', template: `<template>Viewport: baz Parameter id: [\${id}] <au-viewport name="baz"></au-viewport></template>` }, class {
      public static parameters = ['id'];
      public id = 'no id';
      public load(params) { if (params.id) { this.id = params.id; } }
    });
    const Qux = CustomElement.define({ name: 'qux', template: '<template>Viewport: qux<au-viewport name="qux"></au-viewport></template>' }, class {
      public canLoad() { return true; }
      public canUnload() {
        if (quxCantUnload > 0) {
          quxCantUnload--;
          return false;
        } else {
          return true;
        }
      }
      public load() { return true; }
      public unload() { return true; }
    });
    const Quux = CustomElement.define({ name: 'quux', template: '<template>Viewport: quux<au-viewport name="quux" scope></au-viewport></template>' });
    const Corge = CustomElement.define({ name: 'corge', template: '<template>Viewport: corge<au-viewport name="corge" used-by="baz"></au-viewport>Viewport: dummy<au-viewport name="dummy"></au-viewport></template>' });

    const Uier = CustomElement.define({ name: 'uier', template: '<template>Viewport: uier</template>' }, class {
      public async canLoad() {
        await wait(500);
        return true;
      }
    });

    const Grault = CustomElement.define(
      {
        name: 'grault', template: '<template><input type="checkbox" checked.two-way="toggle">toggle<div if.bind="toggle">Viewport: grault<au-viewport name="grault" stateful used-by="garply,corge" default="garply"></au-viewport></div></template>'
      },
      class {
        public toggle = false;
      });
    const Garply = CustomElement.define(
      {
        name: 'garply', template: '<template>garply<input checked.two-way="text">text</template>'
      },
      class {
        public text;
      });
    const Waldo = CustomElement.define(
      {
        name: 'waldo', template: '<template>Viewport: waldo<au-viewport name="waldo" stateful used-by="grault,foo" default="grault"></au-viewport></div></template>'
      },
      class { });
    const Plugh = CustomElement.define(
      {
        name: 'plugh', template: `<template>Parameter: \${param} Entry: \${entry}</template>`
      },
      class {
        public param: number;
        public entry: number = 0;
        public reentryBehavior: string = plughReentryBehavior;
        public load(params) {
          console.log('plugh.load', this.entry, this.reentryBehavior, plughReentryBehavior);
          this.param = +params[0];
          this.entry++;
          this.reentryBehavior = plughReentryBehavior;
        }
      });

    const host = ctx.doc.createElement('div');
    ctx.doc.body.appendChild(host as any);

    const au = ctx.wnd['au'] = new Aurelia(container)
      .register(
        !config ? RouterConfiguration : RouterConfiguration.customize(config),
        App)
      .app({ host: host, component: App });

    const router = getModifiedRouter(container);
    const { _pushState, _replaceState } = spyNavigationStates(router, stateSpy);

    container.register(Foo, Bar, Baz, Qux, Quux, Corge, Uier, Grault, Garply, Waldo, Plugh);

    await au.start();

    async function tearDown() {
      unspyNavigationStates(router, _pushState, _replaceState);
      await au.stop();
      ctx.doc.body.removeChild(host);
    }

    return { au, container, platform, host, router, ctx, tearDown };
  }

  it('can be created', async function () {
    this.timeout(5000);

    const { router, tearDown } = await createFixture();

    await tearDown();
  });

  it('loads viewports left and right', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    assert.includes(host.textContent, 'left', `host.textContent`);
    assert.includes(host.textContent, 'right', `host.textContent`);

    await tearDown();
  });

  it('navigates to foo in left', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('foo@left', router, platform);
    assert.includes(host.textContent, 'foo', `host.textContent`);

    await tearDown();
  });

  it('queues navigations', async function () {
    this.timeout(40000);

    const { platform, host, router, tearDown } = await createFixture();

    router.load('uier@left').catch((error) => { throw error; });
    const last = router.load('bar@left');
    // Depending on browser/node, there can be 1 or 2 in the queue here
    assert.notStrictEqual(router['navigator'].queued, 0, `router.navigator.queued`);
    await last;
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);

    await tearDown();
  });

  it('clears viewport', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('foo@left', router, platform);
    assert.includes(host.textContent, 'foo', `host.textContent`);
    await $load('-@left', router, platform);
    assert.notIncludes(host.textContent, 'foo', `host.textContent`);

    await tearDown();
  });

  it('clears all viewports', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('foo@left', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    await $load('bar@right', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    await $load('-', router, platform);
    assert.notIncludes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: bar', `host.textContent`);

    await tearDown();
  });

  it('replaces foo in left', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    const historyLength = router.navigation.history.length;
    await $load('foo@left', router, platform);
    assert.includes(host.textContent, 'foo', `host.textContent`);
    assert.strictEqual(router.navigation.history.length, historyLength + 1, `router.navigation.history.length`);

    await router.load('bar@left', { replace: true });

    assert.includes(host.textContent, 'bar', `host.textContent`);
    assert.strictEqual(router.navigation.history.length, historyLength + 1, `router.navigation.history.length`);

    await tearDown();
  });

  it('navigates to bar in right', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('bar@right', router, platform);
    assert.includes(host.textContent, 'bar', `host.textContent`);

    await tearDown();
  });

  it('navigates to foo in left then bar in right', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('foo@left', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: bar', `host.textContent`);

    await $load('bar@right', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);

    await tearDown();
  });

  it('reloads state when refresh method is called', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('foo@left', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: bar', `host.textContent`);

    await $load('bar@right', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);

    await router.refresh();
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);

    await tearDown();
  });

  it('navigates back and forward with one viewport', async function () {
    this.timeout(40000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('foo@left', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: bar', `host.textContent`);

    await $load('bar@left', router, platform);
    assert.notIncludes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);

    await router.back();

    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: bar', `host.textContent`);

    await router.forward();

    assert.notIncludes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);

    await tearDown();
  });

  it('navigates back and forward with two viewports', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('foo@left', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: bar', `host.textContent`);

    await $load('bar@right', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);

    await router.back();

    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: bar', `host.textContent`);

    await router.forward();

    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);

    await tearDown();
  });

  it('navigates to foo/bar in left/right', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('foo@left+bar@right', router, platform);
    assert.includes(host.textContent, 'foo', `host.textContent`);
    assert.includes(host.textContent, 'bar', `host.textContent`);

    await tearDown();
  });

  it('cancels if not canUnload', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    quxCantUnload = 1;

    await $load('baz@left+qux@right', router, platform);
    assert.includes(host.textContent, 'Viewport: baz', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: qux', `host.textContent`);

    await $load('foo@left+bar@right', router, platform);
    assert.includes(host.textContent, 'Viewport: baz', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: qux', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: bar', `host.textContent`);

    await tearDown();
  });

  it('cancels if not child canUnload', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    quxCantUnload = 1;

    await $load('foo@left/qux@foo+uier@right', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: qux', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: uier', `host.textContent`);

    await $load('bar@left+baz@right', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: qux', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: uier', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: baz', `host.textContent`);

    await tearDown();
  });

  it('navigates to foo/bar in left/right containing baz/qux respectively', async function () {
    this.timeout(15000);

    const { platform, host, router, tearDown } = await createFixture();

    // await $load('foo@left+bar@right+baz@foo+qux@bar', router, platform);
    await $load('foo@left/baz@foo+bar@right/qux@bar', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: baz', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: qux', `host.textContent`);

    await tearDown();
  });

  it('handles anchor click', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture({ useHref: true });

    await $load('foo@left', router, platform);
    assert.includes(host.textContent, 'foo', `host.textContent`);

    (host.getElementsByTagName('SPAN')[0] as HTMLElement).parentElement.click();

    await platform.domWriteQueue.yield();

    assert.includes(host.textContent, 'Viewport: baz', `host.textContent`);

    await tearDown();
  });

  it('handles anchor click with load', async function () {
    this.timeout(5000);

    const tests = [
      { bind: false, value: 'id-name(1)', result: 1 },
      { bind: true, value: "'id-name(2)'", result: 2 },
      { bind: true, value: "{ component: 'id-name', parameters: '3' }", result: 3 },
      { bind: true, value: "{ component: IdName, parameters: '4' }", result: 4 },
    ];

    const IdName = CustomElement.define({ name: 'id-name', template: `|id-name| Parameter id: [\${id}] Parameter name: [\${name}]` }, class {
      public static parameters = ['id', 'name'];
      public id = 'no id';
      public name = 'no name';
      public load(params) {
        if (params.id) { this.id = params.id; }
        if (params.name) { this.name = params.name; }
      }
    });
    @routes([{ path: 'a-route-decorator', component: 'my-decorated-component' }])
    @customElement({
      name: 'app',
      dependencies: [IdName],
      template: `
      ${tests.map(test => `<a load${test.bind ? '.bind' : ''}="${test.value}">${test.value}</a>`).join('<br>')}
      <br>
      <au-viewport></au-viewport>
      `}) class App {
      // Wish the following two lines weren't necessary
      public constructor() { this['IdName'] = IdName; }
    }

    const { host, router, container, tearDown, platform } = await createFixture({ useHref: false }, App);

    container.register(IdName);

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];

      (host.getElementsByTagName('A')[i] as HTMLElement).click();

      await platform.domWriteQueue.yield();

      assert.includes(host.textContent, '|id-name|', `host.textContent`);
      assert.includes(host.textContent, `Parameter id: [${test.result}]`, `host.textContent`);

      await router.back();
      assert.notIncludes(host.textContent, '|id-name|', `host.textContent`);
    }

    await tearDown();
  });

  it('understands used-by', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('corge@left', router, platform);
    assert.includes(host.textContent, 'Viewport: corge', `host.textContent`);

    await $load('corge@left/baz', router, platform);
    assert.includes(host.textContent, 'Viewport: baz', `host.textContent`);

    await tearDown();
  });

  it('does not update fullStatePath on wrong history entry', async function () {
    this.timeout(40000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('foo@left', router, platform);
    await $load('bar@left', router, platform);
    await $load('baz@left', router, platform);

    await tearDown();
  });

  it('parses parameters after component', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('bar(123)@left', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [123]', `host.textContent`);

    await $load('bar(456)@left', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [456]', `host.textContent`);

    await tearDown();
  });

  it('parses named parameters after component', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('bar(id=123)@left', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [123]', `host.textContent`);

    await $load('bar(id=456)@left', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [456]', `host.textContent`);

    await tearDown();
  });

  it('parses parameters after component individually', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('bar(123)@left', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [123]', `host.textContent`);

    await $load('bar(456)@right', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [123]', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [456]', `host.textContent`);

    await tearDown();
  });

  it('parses parameters without viewport', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('corge@left/baz(123)', router, platform);
    assert.includes(host.textContent, 'Viewport: corge', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: baz', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [123]', `host.textContent`);

    await tearDown();
  });

  it('parses named parameters without viewport', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('corge@left/baz(id=123)', router, platform);

    assert.includes(host.textContent, 'Viewport: corge', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: baz', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [123]', `host.textContent`);

    await tearDown();
  });

  it('parses multiple parameters after component', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('bar(123,OneTwoThree)@left', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [123]', `host.textContent`);
    assert.includes(host.textContent, 'Parameter name: [OneTwoThree]', `host.textContent`);

    await $load('bar(456,FourFiveSix)@left', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [456]', `host.textContent`);
    assert.includes(host.textContent, 'Parameter name: [FourFiveSix]', `host.textContent`);

    await tearDown();
  });

  it('parses multiple name parameters after component', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('bar(id=123,name=OneTwoThree)@left', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [123]', `host.textContent`);
    assert.includes(host.textContent, 'Parameter name: [OneTwoThree]', `host.textContent`);

    await $load('bar(name=FourFiveSix,id=456)@left', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [456]', `host.textContent`);
    assert.includes(host.textContent, 'Parameter name: [FourFiveSix]', `host.textContent`);

    await tearDown();
  });

  it('parses querystring', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('bar@left?id=123', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [123]', `host.textContent`);

    await $load('bar@left?id=456&name=FourFiveSix', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [456]', `host.textContent`);
    assert.includes(host.textContent, 'Parameter name: [FourFiveSix]', `host.textContent`);

    await tearDown();
  });

  it('overrides querystring with parameter', async function () {
    this.timeout(5000);

    let locationPath: string;
    let browserTitle: string;
    const locationCallback = (type, data, title, path) => {
      // console.log(type, data, title, path);
      locationPath = path;
      browserTitle = title;
    };

    const { platform, host, router, tearDown } = await createFixture(void 0, void 0, locationCallback);

    let url = 'bar(456)@left?id=123';
    await $load(url, router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [456]', `host.textContent`);

    url = 'bar(456,FourFiveSix)@left?id=123&name=OneTwoThree';
    await $load(url, router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [456]', `host.textContent`);
    assert.includes(host.textContent, 'Parameter name: [FourFiveSix]', `host.textContent`);

    url = 'bar(name=SevenEightNine,id=789)@left?id=123&name=OneTwoThree';
    await $load(url, router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.includes(host.textContent, 'Parameter id: [789]', `host.textContent`);
    assert.includes(host.textContent, 'Parameter name: [SevenEightNine]', `host.textContent`);

    await tearDown();
  });

  it('uses default reentry behavior', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('plugh(123)@left', router, platform);
    assert.includes(host.textContent, 'Parameter: 123', `host.textContent`);
    assert.includes(host.textContent, 'Entry: 1', `host.textContent`);

    await $load('plugh(123)@left', router, platform);
    assert.includes(host.textContent, 'Parameter: 123', `host.textContent`);
    assert.includes(host.textContent, 'Entry: 1', `host.textContent`);

    await $load('plugh(456)@left', router, platform);
    assert.includes(host.textContent, 'Parameter: 456', `host.textContent`);
    assert.includes(host.textContent, 'Entry: 1', `host.textContent`);

    await $load('plugh(456)@left', router, platform);
    assert.includes(host.textContent, 'Parameter: 456', `host.textContent`);
    assert.includes(host.textContent, 'Entry: 1', `host.textContent`);

    await tearDown();
  });

  it('uses overriding reentry behavior', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    plughReentryBehavior = 'default';
    // This should default
    await $load('plugh(123)@left', router, platform);
    assert.includes(host.textContent, 'Parameter: 123', `host.textContent`);
    assert.includes(host.textContent, 'Entry: 1', `host.textContent`);

    let component = router.allViewports()[0].content.content.componentInstance;
    component.reentryBehavior = 'load';
    // This should load
    await $load('plugh(123)@left', router, platform);
    assert.includes(host.textContent, 'Parameter: 123', `host.textContent`);
    assert.includes(host.textContent, 'Entry: 2', `host.textContent`);

    component.reentryBehavior = 'refresh';
    // This should refresh
    await $load('plugh(456)@left', router, platform);
    assert.includes(host.textContent, 'Parameter: 456', `host.textContent`);
    assert.includes(host.textContent, 'Entry: 1', `host.textContent`);
    component = router.allViewports()[0].content.content.componentInstance;

    component.reentryBehavior = 'default';
    // This should default
    await $load('plugh(456)@left', router, platform);
    assert.includes(host.textContent, 'Parameter: 456', `host.textContent`);
    assert.includes(host.textContent, 'Entry: 1', `host.textContent`);

    component.reentryBehavior = 'load';
    // This should load
    await $load('plugh(123)@left', router, platform);
    assert.includes(host.textContent, 'Parameter: 123', `host.textContent`);
    assert.includes(host.textContent, 'Entry: 2', `host.textContent`);

    component.reentryBehavior = 'disallow';
    // This should disallow
    await $load('plugh(456)@left', router, platform);
    assert.includes(host.textContent, 'Parameter: 123', `host.textContent`);
    assert.includes(host.textContent, 'Entry: 2', `host.textContent`);

    await tearDown();
  });

  it('loads default when added by if condition becoming true', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('grault@left', router, platform);
    assert.includes(host.textContent, 'toggle', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: grault', `host.textContent`);
    assert.notIncludes(host.textContent, 'garply', `host.textContent`);

    (host as any).getElementsByTagName('INPUT')[0].click();

    await platform.domWriteQueue.yield();

    assert.includes(host.textContent, 'Viewport: grault', `host.textContent`);
    assert.includes(host.textContent, 'garply', `host.textContent`);

    (host as any).getElementsByTagName('INPUT')[0].click();

    await platform.domWriteQueue.yield();

    assert.notIncludes(host.textContent, 'Viewport: grault', `host.textContent`);
    assert.notIncludes(host.textContent, 'garply', `host.textContent`);

    (host as any).getElementsByTagName('INPUT')[0].click();

    await platform.domWriteQueue.yield();

    assert.includes(host.textContent, 'Viewport: grault', `host.textContent`);
    assert.includes(host.textContent, 'garply', `host.textContent`);

    await tearDown();
  });

  // if (PLATFORM.isBrowserLike) {
  // TODO: figure out why this works in nodejs locally but not in CI and fix it
  it.skip('keeps input when stateful', async function () {
    this.timeout(15000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('grault@left', router, platform);
    assert.includes(host.textContent, 'toggle', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: grault', `host.textContent`);
    assert.notIncludes(host.textContent, 'garply', `host.textContent`);

    (host as any).getElementsByTagName('INPUT')[0].click();

    await platform.domWriteQueue.yield();

    assert.includes(host.textContent, 'Viewport: grault', `host.textContent`);
    assert.includes(host.textContent, 'garply', `host.textContent`);

    (host as any).getElementsByTagName('INPUT')[1].value = 'asdf';

    await platform.domWriteQueue.yield();

    // NOT going to work since it loads non-stateful parent grault
    await $load('grault@left/corge@grault', router, platform);

    assert.notIncludes(host.textContent, 'garply', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: corge', `host.textContent`);

    await $load('grault@left/garply@grault', router, platform);

    assert.notIncludes(host.textContent, 'Viewport: corge', `host.textContent`);
    assert.includes(host.textContent, 'garply', `host.textContent`);

    assert.strictEqual((host as any).getElementsByTagName('INPUT')[1].value, 'asdf', `(host as any).getElementsByTagName('INPUT')[1].value`);

    await tearDown();
  });
  // }
  it.skip('keeps input when grandparent stateful', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('waldo@left', router, platform);
    assert.includes(host.textContent, 'Viewport: waldo', `host.textContent`);
    assert.includes(host.textContent, 'toggle', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: grault', `host.textContent`);
    assert.notIncludes(host.textContent, 'garply', `host.textContent`);

    (host as any).getElementsByTagName('INPUT')[0].click();

    await platform.domWriteQueue.yield();

    assert.includes(host.textContent, 'Viewport: grault', `host.textContent`);
    assert.includes(host.textContent, 'garply', `host.textContent`);

    (host as any).getElementsByTagName('INPUT')[1].value = 'asdf';

    await $load('waldo@left/foo@waldo', router, platform);

    assert.notIncludes(host.textContent, 'Viewport: grault', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);

    await $load('waldo@left/grault@waldo', router, platform);

    assert.notIncludes(host.textContent, 'Viewport: corge', `host.textContent`);
    assert.includes(host.textContent, 'Viewport: grault', `host.textContent`);
    assert.includes(host.textContent, 'garply', `host.textContent`);

    assert.strictEqual((host as any).getElementsByTagName('INPUT')[1].value, 'asdf', `(host as any).getElementsByTagName('INPUT')[1].value`);

    await tearDown();
  });

  it.skip('keeps children\'s custom element\'s input when navigation history stateful', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown, container } = await createFixture({ statefulHistoryLength: 2 });

    const GrandGrandChild = CustomElement.define({ name: 'grandgrandchild', template: '|grandgrandchild|<input>' }, null);
    const GrandChild = CustomElement.define({ name: 'grandchild', template: '|grandchild|<input> <grandgrandchild></grandgrandchild>', dependencies: [GrandGrandChild] }, null);
    const Child = CustomElement.define({ name: 'child', template: '|child|<input> <input type="checkbox" checked.bind="toggle"> <div if.bind="toggle"><input> <au-viewport name="child"></au-viewport></div>', dependencies: [GrandChild] }, class { public toggle = true; });
    const ChildSibling = CustomElement.define({ name: 'sibling', template: '|sibling|' }, null);
    const Parent = CustomElement.define({ name: 'parent', template: '<br><br>|parent|<input> <au-viewport name="parent"></au-viewport>', dependencies: [Child, ChildSibling] }, null);
    container.register(Parent);

    const values = ['parent', 'child', false, 'child-hidden', 'grandchild', 'grandgrandchild'];

    await $load('parent@left/child@parent/grandchild@child', router, platform);

    assert.includes(host.textContent, '|parent|', `host.textContent`);
    assert.includes(host.textContent, '|child|', `host.textContent`);
    assert.includes(host.textContent, '|grandchild|', `host.textContent`);
    assert.includes(host.textContent, '|grandgrandchild|', `host.textContent`);

    let inputs = host.getElementsByTagName('INPUT') as HTMLCollectionOf<HTMLInputElement>;
    for (let i = 0; i < inputs.length; i++) {
      if (typeof values[i] === 'string') {
        inputs[i].value = values[i] as string;
      }
    }
    for (let i = 0; i < inputs.length; i++) {
      if (typeof values[i] === 'string') {
        assert.strictEqual(inputs[i].value, values[i], `host.getElementsByTagName('INPUT')[${i}].value`);
      }
    }

    await $load('parent@left/sibling@parent', router, platform);

    assert.includes(host.textContent, '|parent|', `host.textContent`);
    assert.includes(host.textContent, '|sibling|', `host.textContent`);
    assert.notIncludes(host.textContent, '|child|', `host.textContent`);
    assert.notIncludes(host.textContent, '|grandchild|', `host.textContent`);
    assert.notIncludes(host.textContent, '|grandgrandchild|', `host.textContent`);

    await router.back();

    assert.includes(host.textContent, '|parent|', `host.textContent`);
    assert.includes(host.textContent, '|child|', `host.textContent`);
    assert.includes(host.textContent, '|grandchild|', `host.textContent`);
    assert.includes(host.textContent, '|grandgrandchild|', `host.textContent`);
    assert.notIncludes(host.textContent, '|sibling|', `host.textContent`);

    inputs = inputs = host.getElementsByTagName('INPUT') as HTMLCollectionOf<HTMLInputElement>;
    for (let i = 0; i < inputs.length; i++) {
      if (typeof values[i] === 'string') {
        assert.strictEqual(inputs[i].value, values[i], `host.getElementsByTagName('INPUT')[${i}].value`);
      }
    }

    await tearDown();
  });

  // TODO: Fix scoped viewports!
  it.skip('loads scoped viewport', async function () {
    this.timeout(5000);

    const { platform, host, router, tearDown } = await createFixture();

    await $load('quux@left', router, platform);
    assert.includes(host.textContent, 'Viewport: quux', `host.textContent`);

    await $load('quux@quux!', router, platform);
    assert.includes(host.textContent, 'Viewport: quux', `host.textContent`);

    await $load('quux@left/foo@quux!', router, platform);
    assert.includes(host.textContent, 'Viewport: foo', `host.textContent`);

    (host.getElementsByTagName('SPAN')[0] as HTMLElement).click();

    await platform.domWriteQueue.yield();

    assert.includes(host.textContent, 'Viewport: baz', `host.textContent`);

    await $load('bar@left', router, platform);
    assert.includes(host.textContent, 'Viewport: bar', `host.textContent`);
    assert.notIncludes(host.textContent, 'Viewport: quux', `host.textContent`);

    await tearDown();
  });

  describe('local deps', function () {
    this.timeout(5000);

    async function $setup(dependencies: any[] = [], stateSpy?) {
      const ctx = TestContext.create();

      const { container, platform } = ctx;

      const App = CustomElement.define({ name: 'app', template: '<au-viewport></au-viewport>', dependencies }, null);

      const host = ctx.doc.createElement('div');
      ctx.doc.body.appendChild(host as any);
      const component = new App();

      const au = ctx.wnd['au'] = new Aurelia(container)
        .register(RouterConfiguration)
        .app({ host: host, component: App });

      const router = container.get(IRouter);
      const mockBrowserHistoryLocation = new MockBrowserHistoryLocation();
      mockBrowserHistoryLocation.changeCallback = router.navigation.handlePopstate;
      router.navigation.history = mockBrowserHistoryLocation as any;
      router.navigation.location = mockBrowserHistoryLocation as any;

      await au.start();

      async function $teardown() {
        await au.stop();
        ctx.doc.body.removeChild(host);

        au.dispose();
      }

      return { ctx, container, platform, host, component, au, router, $teardown };
    }

    it('verify that the test isn\'t broken', async function () {
      const Local = CustomElement.define({ name: 'local', template: 'local' }, null);
      const Global = CustomElement.define({ name: 'global', template: 'global' }, null);
      const { platform, container, host, router, $teardown } = await $setup([Local]);

      container.register(Global);

      await $load('global', router, platform);

      assert.match(host.textContent, /.*global.*/, `host.textContent`);

      await $teardown();
    });

    it('navigates to locally registered dep', async function () {
      const Local = CustomElement.define({ name: 'local', template: 'local' }, null);
      const { platform, host, router, $teardown } = await $setup([Local]);

      await $load('local', router, platform);

      assert.match(host.textContent, /.*local.*/, `host.textContent`);

      await $teardown();
    });

    it('navigates to locally registered dep - nested', async function () {
      const Local2 = CustomElement.define({ name: 'local2', template: 'local2' }, class { });
      const Local1 = CustomElement.define({ name: 'local1', template: 'local1<au-viewport name="one"></au-viewport>', dependencies: [Local2] }, null);
      const { platform, host, router, $teardown } = await $setup([Local1]);

      await $load('local1/local2', router, platform);

      assert.match(host.textContent, /.*local1.*local2.*/, `host.textContent`);

      await $teardown();
    });

    it('navigates to locally registered dep - double nested - case #1', async function () {
      const Global3 = CustomElement.define({ name: 'global3', template: 'global3' }, null);
      const Local2 = CustomElement.define({ name: 'local2', template: 'local2<au-viewport name="two" used-by="global3"></au-viewport>' }, null);
      const Local1 = CustomElement.define({ name: 'local1', template: 'local1<au-viewport name="one" used-by="local2"></au-viewport>', dependencies: [Local2] }, null);
      const { platform, host, router, container, $teardown } = await $setup([Local1]);
      container.register(Global3);

      await $load('local1/local2/global3', router, platform);

      assert.match(host.textContent, /.*local1.*local2.*global3.*/, `host.textContent`);

      await $teardown();
    });

    it('navigates to locally registered dep - double nested - case #2', async function () {
      const Local3 = CustomElement.define({ name: 'local3', template: 'local3' }, null);
      const Global2 = CustomElement.define({ name: 'global2', template: 'global2<au-viewport name="two" used-by="local3"></au-viewport>', dependencies: [Local3] }, null);
      const Local1 = CustomElement.define({ name: 'local1', template: 'local1<au-viewport name="one" used-by="global2"></au-viewport>' }, null);
      const { platform, host, router, container, $teardown } = await $setup([Local1]);
      container.register(Global2);

      await $load('local1/global2/local3', router, platform);

      assert.match(host.textContent, /.*local1.*global2.*local3.*/, `host.textContent`);

      await $teardown();
    });

    it('navigates to locally registered dep - double nested - case #3', async function () {
      const Local3 = CustomElement.define({ name: 'local3', template: 'local3' }, null);
      const Local2 = CustomElement.define({ name: 'local2', template: 'local2<au-viewport name="two" used-by="local3"></au-viewport>', dependencies: [Local3] }, null);
      const Global1 = CustomElement.define({ name: 'global1', template: 'global1<au-viewport name="one" used-by="local2"></au-viewport>', dependencies: [Local2] }, null);
      const { platform, host, router, container, $teardown } = await $setup();
      container.register(Global1);

      await $load('global1/local2/local3', router, platform);

      assert.match(host.textContent, /.*global1.*local2.*local3.*/, `host.textContent`);

      await $teardown();
    });

    it('navigates to locally registered dep - double nested - case #4', async function () {
      const Local3 = CustomElement.define({ name: 'local3', template: 'local3' }, null);
      const Local2 = CustomElement.define({ name: 'local2', template: 'local2<au-viewport name="two" used-by="local3"></au-viewport>', dependencies: [Local3] }, null);
      const Local1 = CustomElement.define({ name: 'local1', template: 'local1<au-viewport name="one" used-by="local2"></au-viewport>', dependencies: [Local2] }, null);
      const { platform, host, router, $teardown } = await $setup([Local1]);

      await $load('local1/local2/local3', router, platform);

      assert.match(host.textContent, /.*local1.*local2.*local3.*/, `host.textContent`);

      await $teardown();
    });

    it('navigates to locally registered dep - conflicting scoped siblings - case #1', async function () {
      const Conflict1 = CustomElement.define({ name: 'conflict', template: 'conflict1' }, null);
      const Local1 = CustomElement.define({ name: 'local1', template: 'local1<au-viewport name="one"></au-viewport>', dependencies: [Conflict1] }, null);
      const Conflict2 = CustomElement.define({ name: 'conflict', template: 'conflict2' }, null);
      const Local2 = CustomElement.define({ name: 'local2', template: 'local2<au-viewport name="two"></au-viewport>', dependencies: [Conflict2] }, null);
      const { platform, host, router, $teardown } = await $setup([Local1, Local2]);

      await $load('local1@default/conflict@one', router, platform);

      assert.match(host.textContent, /.*local1.*conflict1.*/, `host.textContent`);

      await $load('local2@default/conflict@two', router, platform);

      assert.match(host.textContent, /.*local2.*conflict2.*/, `host.textContent`);

      await $teardown();
    });

    it('navigates to locally registered dep - conflicting scoped siblings - case #2', async function () {
      const Conflict1 = CustomElement.define({ name: 'conflict', template: 'conflict1' }, null);
      const Global1 = CustomElement.define({ name: 'global1', template: 'global1<au-viewport name="one"></au-viewport>', dependencies: [Conflict1] }, null);
      const Conflict2 = CustomElement.define({ name: 'conflict', template: 'conflict2' }, null);
      const Global2 = CustomElement.define({ name: 'global2', template: 'global2<au-viewport name="two"></au-viewport>', dependencies: [Conflict2] }, null);
      const { platform, host, router, container, $teardown } = await $setup();
      container.register(Global1, Global2);

      await $load('global1@default/conflict@one', router, platform);

      assert.match(host.textContent, /.*global1.*conflict1.*/, `host.textContent`);

      await $load('global2@default/conflict@two', router, platform);

      assert.match(host.textContent, /.*global2.*conflict2.*/, `host.textContent`);

      await $teardown();
    });

    it('navigates to locally registered dep - conflicting scoped siblings - case #3', async function () {
      const Conflict1 = CustomElement.define({ name: 'conflict', template: 'conflict1' }, null);
      const Local1 = CustomElement.define({ name: 'local1', template: 'local1<au-viewport name="one"></au-viewport>', dependencies: [Conflict1] }, null);
      const Conflict2 = CustomElement.define({ name: 'conflict', template: 'conflict2' }, null);
      const Global2 = CustomElement.define({ name: 'global2', template: 'global2<au-viewport name="two"></au-viewport>', dependencies: [Conflict2] }, null);
      const { platform, host, router, container, $teardown } = await $setup([Local1]);
      container.register(Global2);

      await $load('local1@default/conflict@one', router, platform);

      assert.match(host.textContent, /.*local1.*conflict1.*/, `host.textContent`);

      await $load('global2@default/conflict@two', router, platform);

      assert.match(host.textContent, /.*global2.*conflict2.*/, `host.textContent`);

      await $teardown();
    });

    describe('navigates to locally registered dep recursively', function () {
      interface RouteSpec {
        segments: string[];
        texts: string[];
      }
      const routeSpecs: RouteSpec[] = [
        {
          segments: ['global1', 'conflict'],
          texts: ['global1', 'conflict1']
        },
        {
          // note: custom elements always have themselves registered in their own $context, so should be able to navigate to self without registering anywhere
          segments: ['global1', 'conflict', 'conflict'],
          texts: ['global1', 'conflict1', 'conflict1']
        },
        {
          segments: ['local2', 'conflict'],
          texts: ['local2', 'conflict2']
        },
        {
          segments: ['local2', 'conflict', 'conflict'],
          texts: ['local2', 'conflict2', 'conflict2']
        },
        {
          segments: ['local2', 'global1', 'conflict'],
          texts: ['local2', 'global1', 'conflict1']
        },
        {
          segments: ['local2', 'global1', 'conflict', 'conflict'],
          texts: ['local2', 'global1', 'conflict1', 'conflict1']
        },
        {
          segments: ['local2', 'local2', 'conflict', 'conflict'],
          texts: ['local2', 'local2', 'conflict2', 'conflict2']
        },
        {
          segments: ['local2', 'conflict', 'global1', 'conflict'],
          texts: ['local2', 'conflict2', 'global1', 'conflict1']
        },
        {
          segments: ['local2', 'conflict', 'local2', 'conflict'],
          texts: ['local2', 'conflict2', 'local2', 'conflict2']
        }
      ];

      for (const routeSpec of routeSpecs) {
        const { segments, texts } = routeSpec;
        const path = segments.join('/');
        const expectedText = new RegExp(`.*${texts.join('.*')}.*`);

        it(`path: ${path}, expectedText: ${expectedText}`, async function () {
          const Conflict1 = CustomElement.define({ name: 'conflict', template: 'conflict1<au-viewport></au-viewport>' }, null);
          const Global1 = CustomElement.define({ name: 'global1', template: 'global1<au-viewport name="one"></au-viewport>', dependencies: [Conflict1] }, null);
          const Conflict2 = CustomElement.define({ name: 'conflict', template: 'conflict2<au-viewport></au-viewport>' }, null);
          const Local2 = CustomElement.define({ name: 'local2', template: 'local2<au-viewport name="two"></au-viewport>', dependencies: [Conflict2] }, null);
          const { platform, host, router, container, $teardown } = await $setup([Local2]);
          container.register(Global1);

          await $load(path, router, platform);

          assert.match(host.textContent, expectedText, `host.textContent`);

          await $teardown();
        });
      }
    });
  });

  describe('can define fallback component', function () {
    this.timeout(30000);

    async function $setup(App, config?, stateSpy?) {
      const ctx = TestContext.create();

      const { container, platform } = ctx;

      const host = ctx.doc.createElement('div');
      ctx.doc.body.appendChild(host as any);

      const au = new Aurelia(container)
        .register(
          !config ? RouterConfiguration : RouterConfiguration.customize(config),
          App)
        .app({ host: host, component: App });

      const router = getModifiedRouter(container);
      const { _pushState, _replaceState } = spyNavigationStates(router, stateSpy);

      await au.start();

      async function $teardown() {
        unspyNavigationStates(router, _pushState, _replaceState);
        await au.stop();
        ctx.doc.body.removeChild(host);

        au.dispose();
      }

      return { ctx, container, platform, host, au, router, $teardown };
    }

    const names = ['parent', 'child', 'grandchild'];
    const dependencies = [];
    for (let i = 0, ii = names.length; i < ii; i++) {
      const name = names[i];
      const fallback = i < ii - 1 ? names[i + 1] : null;
      const viewport = fallback ? `<au-viewport name="${name}" fallback="${fallback}"}></au-viewport>` : '';
      const template = `!${name}\${param ? ":" + param : ""}!${viewport}`;
      dependencies.push(CustomElement.define({ name, template }, class {
        public static parameters = ['id'];
        public param: string;
        public load(params) {
          if (params.id !== void 0) {
            this.param = params.id;
          }
        }
      }));
    }

    const App = CustomElement.define({
      name: 'app',
      template: '<au-viewport fallback="parent"></au-viewport>',
      dependencies
    });

    const tests = [
      { path: 'parent(a)@default', result: '!parent:a!', url: 'a' },
      { path: 'b@default', result: '!parent:b!', url: 'b' },
      { path: 'parent(c)@default/child(d)@parent', result: '!parent:c!!child:d!', url: 'c/d' },
      { path: 'e@default/f@parent', result: '!parent:e!!child:f!', url: 'e/f' },
      { path: 'parent(g)@default/child(h)@parent/grandchild(i)@child', result: '!parent:g!!child:h!!grandchild:i!', url: 'g/h/i' },
      { path: 'j@default/k@parent/l@child', result: '!parent:j!!child:k!!grandchild:l!', url: 'j/k/l' },
    ];

    for (const test of tests) {
      it(`to load route ${test.path} => ${test.url}`, async function () {
        let locationPath: string;
        const { platform, container, host, router, $teardown } = await $setup(App, void 0, (type, data, title, path) => {
          locationPath = path;
        });
        await $load(test.path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${test.url}`, 'location.path');
        await $teardown();
      });
    }
    it(`to load above routes in sequence`, async function () {
      let locationPath: string;
      const { platform, container, host, router, $teardown } = await $setup(App, void 0, (type, data, title, path) => {
        locationPath = path;
      });
      for (const test of tests) {
        await $load(test.path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${test.url}`, 'location.path');
      }
      await $teardown();
    });

    for (const test of tests) {
      const path = test.path.replace(/@\w+/g, '');
      const url = test.url.replace(/@\w+/g, '');
      it(`to load route ${path} => ${url}`, async function () {
        let locationPath: string;
        const { platform, container, host, router, $teardown } = await $setup(App, void 0, (type, data, title, path) => {
          locationPath = path;
        });
        await $load(path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${url}`, 'location.path');
        await $teardown();
      });
    }
    it(`to load above routes in sequence`, async function () {
      let locationPath: string;
      const { platform, container, host, router, $teardown } = await $setup(App, void 0, (type, data, title, path) => {
        locationPath = path;
      });
      for (const test of tests) {
        const path = test.path.replace(/@\w+/g, '');
        const url = test.url.replace(/@\w+/g, '');
        await $load(path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${url}`, 'location.path');
      }
      await $teardown();
    });
  });

  describe('can use configuration', function () {
    this.timeout(30000);

    async function $setup(config?, dependencies: any[] = [], routes: IRoute[] = [], stateSpy?) {
      const ctx = TestContext.create();

      const { container, platform } = ctx;

      const App = CustomElement.define({
        name: 'app',
        template: '<au-viewport></au-viewport>',
        dependencies
      }, class {
        public static routes: IRoute[] = routes;
      });

      const host = ctx.doc.createElement('div');
      ctx.doc.body.appendChild(host as any);

      const au = new Aurelia(container)
        .register(
          !config ? RouterConfiguration : RouterConfiguration.customize(config),
          App)
        .app({ host: host, component: App });

      const router = getModifiedRouter(container);
      const { _pushState, _replaceState } = spyNavigationStates(router, stateSpy);

      await au.start();

      async function $teardown() {
        unspyNavigationStates(router, _pushState, _replaceState);
        await au.stop();
        ctx.doc.body.removeChild(host);

        au.dispose();
      }

      return { ctx, container, platform, host, au, router, $teardown, App };
    }

    function $removeViewport(instructions) {
      if (Array.isArray(instructions)) {
        for (const instruction of instructions) {
          instruction.viewport = null;
          instruction.viewportName = null;
          if (Array.isArray(instruction.nextScopeInstructions)) {
            $removeViewport(instruction.nextScopeInstructions);
          }
        }
      }
    }

    const Parent = CustomElement.define({ name: 'parent', template: '!parent!<au-viewport name="parent"></au-viewport>' }, class {
      public static routes: IRoute[] = [
        { path: 'child-config', instructions: [{ component: 'child', viewport: 'parent' }], title: 'ChildConfig' },
      ];
    });
    const Parent2 = CustomElement.define({ name: 'parent2', template: '!parent2!<au-viewport name="parent2"></au-viewport>' }, class {
      public static routes: IRoute[] = [
        { path: 'child-config', instructions: [{ component: 'child', viewport: 'parent2' }], title: 'ChildConfig' },
        // { path: ':id', instructions: [{ component: 'child', viewport: 'parent' }] },
      ];
    });
    const Child = CustomElement.define({ name: 'child', template: `!child\${param ? ":" + param : ""}!<au-viewport name="child"></au-viewport>` }, class {
      public static routes: IRoute[] = [
        { path: 'grandchild-config', instructions: [{ component: 'grandchild', viewport: 'child' }], title: 'GrandchildConfig' },
      ];
      public param: string;
      public load(params) {
        if (params.id !== void 0) {
          this.param = params.id;
        }
      }
    });
    const Child2 = CustomElement.define({ name: 'child2', template: `!child2\${param ? ":" + param : ""}!<au-viewport name="child2"></au-viewport>` }, class {
      public static routes: IRoute[] = [
        { path: 'grandchild-config', instructions: [{ component: 'grandchild', viewport: 'child2' }], title: 'GrandchildConfig' },
      ];
      public static parameters = ['id'];
      public static title = (vm) => vm.param !== void 0 ? vm.param : 'Child2';
      public param: string;
      public load(params) {
        if (params.id !== void 0) {
          this.param = params.id;
        }
      }
    });

    const Grandchild = CustomElement.define({ name: 'grandchild', template: '!grandchild!' });
    const Grandchild2 = CustomElement.define({ name: 'grandchild2', template: '!grandchild2!' }, class { public static title: string = 'TheGrandchild2'; });

    const tests = [
      { path: '/parent-config', result: '!parent!', url: 'parent-config', title: 'ParentConfig | Aurelia' },
      { path: '/parent2@default', result: '!parent2!', url: 'parent2', title: 'Parent2 | Aurelia' },

      { path: '/parent-config/child-config', result: '!parent!!child!', url: 'parent-config/child-config', title: 'ParentConfigChildConfig | Aurelia' },
      { path: '/parent2@default/child2@parent2', result: '!parent2!!child2!', url: 'parent2/child2', title: 'Parent2 > Child2 | Aurelia' },

      { path: '/parent-config/child2@parent', result: '!parent!!child2!', url: 'parent-config/child2@parent', title: 'ParentConfigChild2@ParentConfig | Aurelia' }, // Specific config
      { path: '/parent2@default/child-config', result: '!parent2!!child!', url: 'parent2/child-config', title: 'Parent2 > ChildConfig | Aurelia' },

      { path: '/parent-config/child-config/grandchild-config', result: '!parent!!child!!grandchild!', url: 'parent-config/child-config/grandchild-config', title: 'ParentConfigChildConfig > GrandchildConfig | Aurelia' },
      { path: '/parent2@default/child2@parent2/grandchild2@child2', result: '!parent2!!child2!!grandchild2!', url: 'parent2/child2/grandchild2', title: 'Parent2 > Child2 > TheGrandchild2 | Aurelia' },

      { path: '/parent-config/child-config/grandchild2@child', result: '!parent!!child!!grandchild2!', url: 'parent-config/child-config/grandchild2', title: 'ParentConfigChildConfig > TheGrandchild2 | Aurelia' },
      { path: '/parent2@default/child2@parent2/grandchild-config', result: '!parent2!!child2!!grandchild!', url: 'parent2/child2/grandchild-config', title: 'Parent2 > Child2 > GrandchildConfig | Aurelia' },

      { path: '/parent-config/child2@parent/grandchild-config', result: '!parent!!child2!!grandchild!', url: 'parent-config/child2@parent/grandchild-config', title: 'ParentConfigChild2@ParentConfig > GrandchildConfig | Aurelia' }, // Specific config
      { path: '/parent2@default/child-config/grandchild2@child', result: '!parent2!!child!!grandchild2!', url: 'parent2/child-config/grandchild2', title: 'Parent2 > ChildConfig > TheGrandchild2 | Aurelia' },

      { path: '/parent-config/child2@parent/grandchild2@child2', result: '!parent!!child2!!grandchild2!', url: 'parent-config/child2@parent/grandchild2', title: 'ParentConfigChild2@ParentConfig > TheGrandchild2 | Aurelia' }, // Specific config
      { path: '/parent2@default/child-config/grandchild-config', result: '!parent2!!child!!grandchild!', url: 'parent2/child-config/grandchild-config', title: 'Parent2 > ChildConfig > GrandchildConfig | Aurelia' },

      { path: '/parent-config/abc', result: '!parent!!child:abc!', url: 'parent-config/abc', title: 'ParentConfigabcConfig | Aurelia' },
      { path: '/parent2@default/child2(abc)@parent2', result: '!parent2!!child2:abc!', url: 'parent2/child2(abc)', title: 'Parent2 > abc | Aurelia' },

      // { path: '/parent-config/child2(abc)@parent', result: '!parent!!child2:abc!' },
      // { path: '/parent2@default/abc', result: '!parent2!!child:abc!' },

      { path: '/parent-config/abc/grandchild-config', result: '!parent!!child:abc!!grandchild!', url: 'parent-config/abc/grandchild-config', title: 'ParentConfigabcConfig > GrandchildConfig | Aurelia' },
      { path: '/parent2@default/child2(abc)@parent2/grandchild2@child2', result: '!parent2!!child2:abc!!grandchild2!', url: 'parent2/child2(abc)/grandchild2', title: 'Parent2 > abc > TheGrandchild2 | Aurelia' },

      { path: '/parent-config/abc/grandchild2@child', result: '!parent!!child:abc!!grandchild2!', url: 'parent-config/abc/grandchild2', title: 'ParentConfigabcConfig > TheGrandchild2 | Aurelia' },
      { path: '/parent2@default/child2(abc)@parent2/grandchild-config', result: '!parent2!!child2:abc!!grandchild!', url: 'parent2/child2(abc)/grandchild-config', title: 'Parent2 > abc > GrandchildConfig | Aurelia' },

      // { path: '/parent-config/child2(abc)@parent/grandchild-config', result: '!parent!!child2:abc!!grandchild!' },
      // { path: '/parent2@default/abc/grandchild2@child', result: '!parent2!!child:abc!!grandchild2!' },

      // { path: '/parent-config/child2(abc)@parent/grandchild2@child2', result: '!parent!!child2:abc!!grandchild2!' },
      // { path: '/parent2@default/abc/grandchild-config', result: '!parent2!!child:abc!!grandchild!' },
    ];
    const appDependencies = [Parent, Parent2, Child, Child2, Grandchild, Grandchild2];
    const appRoutes: IRoute[] = [
      { path: 'parent-config', component: 'parent', viewport: 'default', title: 'ParentConfig' },
      { path: 'parent-config/:id', instructions: [{ component: 'parent', viewport: 'default', children: [{ component: 'child', viewport: 'parent' }] }], title: (route) => `ParentConfig${route.params.id !== void 0 ? route.params.id : ':id'}Config` },
      { path: 'parent-config/child-config', instructions: [{ component: 'parent', viewport: 'default', children: [{ component: 'child', viewport: 'parent' }] }], title: 'ParentConfigChildConfig' },
      { path: 'parent-config/child2', instructions: [{ component: 'parent', viewport: 'default', children: [{ component: 'child2', viewport: 'parent' }] }], title: 'ParentConfigChild2Config' },
      { path: 'parent-config/child2@parent', instructions: [{ component: 'parent', viewport: 'default', children: [{ component: 'child2', viewport: 'parent' }] }], title: 'ParentConfigChild2@ParentConfig' },
      // { path: 'parent-config/child2(abc)', instructions: [{ component: 'parent', viewport: 'default', children: [{ component: 'child2', viewport: 'parent', parameters: { id: '$id' } }] }] },
      // { path: 'parent-config/child2(abc)@parent', instructions: [{ component: 'parent', viewport: 'default', children: [{ component: 'child2', viewport: 'parent', parameters: { id: '$id' } }] }] },
    ];

    let locationPath: string;
    let browserTitle: string;
    const locationCallback = (type, data, title, path) => {
      // console.log(type, data, title, path);
      locationPath = path;
      browserTitle = title;
    };
    for (const test of tests) {
      it(`to load route ${test.path} => ${test.url}`, async function () {
        const { platform, host, router, $teardown } = await $setup(void 0, appDependencies, appRoutes, locationCallback);

        await $load(test.path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${test.url}`, 'location.path');
        assert.strictEqual(browserTitle, test.title, 'browser.title');

        await $teardown();
      });
    }
    it(`to load above routes in sequence`, async function () {
      const { platform, host, router, $teardown } = await $setup(void 0, appDependencies, appRoutes, locationCallback);

      for (const test of tests) {
        await $load(test.path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${test.url}`, 'location.path');
        assert.strictEqual(browserTitle, test.title, 'browser.title');
      }
      await $teardown();
    });

    for (const test of tests) {
      const path = test.path.replace(/@\w+/g, '');
      const url = test.url.replace(/@\w+/g, '');
      const title = test.title.replace(/@Parent/g, '');
      it(`to load route ${path} => ${url}`, async function () {
        const { platform, host, router, $teardown } = await $setup(void 0, appDependencies, appRoutes, locationCallback);

        await $load(path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${url}`, 'location.path');
        assert.strictEqual(browserTitle, title, 'browser.title');

        await $teardown();
      });
    }
    it(`to load above routes in sequence`, async function () {
      const { platform, host, router, $teardown } = await $setup(void 0, appDependencies, appRoutes, locationCallback);

      for (const test of tests) {
        const path = test.path.replace(/@\w+/g, '');
        const url = test.url.replace(/@\w+/g, '');
        const title = test.title.replace(/@Parent/g, '');
        await $load(path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${url}`, 'location.path');
        assert.strictEqual(browserTitle, title, 'browser.title');
      }
      await $teardown();
    });

    let removedViewports = false;
    for (const test of tests) {
      it(`to load route (without viewports) ${test.path} => ${test.url}`, async function () {
        const { platform, host, router, $teardown, App } = await $setup(void 0, appDependencies, appRoutes, locationCallback);

        if (!removedViewports) {
          removedViewports = true;
          for (const type of [App, Parent, Parent2, Child, Child2]) {
            for (const route of type.routes) {
              $removeViewport(route.instructions);
            }
          }
        }

        await $load(test.path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${test.url}`, 'location.path');
        assert.strictEqual(browserTitle, test.title, 'browser.title');

        await $teardown();
      });
    }
    it(`to load above routes (without viewports) in sequence`, async function () {
      const { platform, host, router, $teardown, App } = await $setup(void 0, appDependencies, appRoutes, locationCallback);

      for (const test of tests) {
        await $load(test.path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${test.url}`, 'location.path');
        assert.strictEqual(browserTitle, test.title, 'browser.title');
      }
      await $teardown();
    });

    for (const test of tests) {
      const path = test.path.replace(/@\w+/g, '');
      const url = test.url.replace(/@\w+/g, '');
      const title = test.title.replace(/@Parent/g, '');
      it(`to load route (without viewports) ${path} => ${url}`, async function () {
        const { platform, host, router, $teardown } = await $setup(void 0, appDependencies, appRoutes, locationCallback);

        await $load(path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${url}`, 'location.path');
        assert.strictEqual(browserTitle, title, 'browser.title');

        await $teardown();
      });
    }
    it(`to load above routes (without viewports) in sequence`, async function () {
      const { platform, host, router, $teardown } = await $setup(void 0, appDependencies, appRoutes, locationCallback);

      for (const test of tests) {
        const path = test.path.replace(/@\w+/g, '');
        const url = test.url.replace(/@\w+/g, '');
        const title = test.title.replace(/@Parent/g, '');
        await $load(path, router, platform);
        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        assert.strictEqual(locationPath, `#/${url}`, 'location.path');
        assert.strictEqual(browserTitle, title, 'browser.title');
      }
      await $teardown();
    });
  });

  describe('can use title configuration', function () {
    this.timeout(30000);

    async function $setup(config?, dependencies: any[] = [], routes: IRoute[] = [], stateSpy?) {
      const ctx = TestContext.create();

      const { container, platform } = ctx;

      const App = CustomElement.define({
        name: 'app',
        template: '<au-viewport></au-viewport>',
        dependencies
      }, class {
        public static routes: IRoute[] = routes;
      });

      const host = ctx.doc.createElement('div');
      ctx.doc.body.appendChild(host as any);

      const au = new Aurelia(container)
        .register(
          !config ? RouterConfiguration : RouterConfiguration.customize(config),
          App)
        .app({ host: host, component: App });

      const router = getModifiedRouter(container);
      const { _pushState, _replaceState } = spyNavigationStates(router, stateSpy);

      await au.start();

      async function $teardown() {
        unspyNavigationStates(router, _pushState, _replaceState);
        await au.stop();
        ctx.doc.body.removeChild(host);

        au.dispose();
      }

      return { ctx, container, platform, host, au, router, $teardown, App };
    }

    function $removeViewport(instructions) {
      for (const instruction of instructions) {
        instruction.viewport = null;
        instruction.viewportName = null;
        if (Array.isArray(instruction.nextScopeInstructions)) {
          $removeViewport(instruction.nextScopeInstructions);
        }
      }
    }

    const Parent = CustomElement.define({ name: 'my-parent', template: '!my-parent!<au-viewport name="parent"></au-viewport>' }, class {
      public static title: string = 'TheParent';
      public static routes: IRoute[] = [
        { path: 'child-config', instructions: [{ component: 'my-child', viewport: 'parent' }], title: 'TheChildConfig' },
      ];
    });
    const Parent2 = CustomElement.define({ name: 'my-parent2', template: '!my-parent2!<au-viewport name="parent2"></au-viewport>' }, class {
      public static routes: IRoute[] = [
        { path: 'child-config', instructions: [{ component: 'my-child', viewport: 'parent2' }], title: 'TheChildConfig' },
      ];
    });
    const Child = CustomElement.define({ name: 'my-child', template: `!my-child\${param ? ":" + param : ""}!<au-viewport name="child"></au-viewport>` }, class {
      public static title = (vm) => `TheChild${vm.param !== void 0 ? `(${vm.param})` : ''}`;
      public param: string;
      public load(params) {
        if (params.id !== void 0) {
          this.param = params.id;
        }
      }
    });
    const Child2 = CustomElement.define({ name: 'my-child2', template: `!my-child2\${param ? ":" + param : ""}!<au-viewport name="child2"></au-viewport>` }, class {
      public static parameters: string[] = ['id'];
      public static title = (vm) => `TheChild2${vm.param !== void 0 ? `(${vm.param})` : ''}`;
      public param: string;
      public load(params) {
        if (params.id !== void 0) {
          this.param = params.id;
        }
      }
    });

    const titleConfigs: (IRouterTitle | string)[] = [
      `\${componentTitles}\${appTitleSeparator}Aurelia2`,
      { appTitle: `Test\${appTitleSeparator}\${componentTitles}`, appTitleSeparator: ' : ', componentTitleOrder: 'top-down', componentTitleSeparator: ' + ', useComponentNames: true },
      { componentTitleOrder: 'bottom-up', componentTitleSeparator: ' < ', useComponentNames: true, componentPrefix: 'my-' },
      { useComponentNames: false },
      { transformTitle: (title, instruction) => title.length === 0 ? '' : instruction instanceof ViewportInstruction ? `C:${title}` : `R:${title}` },
      { useComponentNames: false, transformTitle: (title, instruction) => title.length === 0 ? '' : instruction instanceof ViewportInstruction ? `C:${title}` : `R:${title}` },
    ];

    const tests = [
      { path: '/parent-config', result: '!my-parent!', url: 'parent-config', },
      { path: '/my-parent2@default', result: '!my-parent2!', url: 'my-parent2', },

      { path: '/parent-config/child-config', result: '!my-parent!!my-child!', url: 'parent-config/child-config', },
      { path: '/my-parent2@default/my-child2@parent2', result: '!my-parent2!!my-child2!', url: 'my-parent2/my-child2', },

      { path: '/parent-config/my-child2@parent', result: '!my-parent!!my-child2!', url: 'parent-config/my-child2@parent', }, // Specific config
      { path: '/my-parent2@default/child-config', result: '!my-parent2!!my-child!', url: 'my-parent2/child-config', },

      { path: '/parent-config/abc', result: '!my-parent!!my-child:abc!', url: 'parent-config/abc', },
      { path: '/my-parent2@default/my-child2(abc)@parent2', result: '!my-parent2!!my-child2:abc!', url: 'my-parent2/my-child2(abc)', },
    ];

    const titles = [
      [
        'TheParentConfig | Aurelia2',
        'My parent2 | Aurelia2',

        'TheParentConfigChildConfig | Aurelia2',
        'My parent2 > TheChild2 | Aurelia2',

        'TheParentConfigChild2@ParentConfig | Aurelia2',
        'My parent2 > TheChildConfig | Aurelia2',

        'TheParentConfig(abc)Config | Aurelia2',
        'My parent2 > TheChild2(abc) | Aurelia2',
      ],
      [
        'Test : TheParentConfig',
        'Test : My parent2',

        'Test : TheParentConfigChildConfig',
        'Test : My parent2 + TheChild2',

        'Test : TheParentConfigChild2@ParentConfig',
        'Test : My parent2 + TheChildConfig',

        'Test : TheParentConfig(abc)Config',
        'Test : My parent2 + TheChild2(abc)',
      ],
      [
        'TheParentConfig | Aurelia',
        'Parent2 | Aurelia',

        'TheParentConfigChildConfig | Aurelia',
        'TheChild2 < Parent2 | Aurelia',

        'TheParentConfigChild2@ParentConfig | Aurelia',
        'TheChildConfig < Parent2 | Aurelia',

        'TheParentConfig(abc)Config | Aurelia',
        'TheChild2(abc) < Parent2 | Aurelia',
      ],
      [
        'TheParentConfig | Aurelia',
        'Aurelia',

        'TheParentConfigChildConfig | Aurelia',
        'TheChild2 | Aurelia',

        'TheParentConfigChild2@ParentConfig | Aurelia',
        'TheChildConfig | Aurelia',

        'TheParentConfig(abc)Config | Aurelia',
        'TheChild2(abc) | Aurelia',
      ],
      [
        'R:TheParentConfig | Aurelia',
        'C:My parent2 | Aurelia',

        'R:TheParentConfigChildConfig | Aurelia',
        'C:My parent2 > C:TheChild2 | Aurelia',

        'R:TheParentConfigChild2@ParentConfig | Aurelia',
        'C:My parent2 > R:TheChildConfig | Aurelia',

        'R:TheParentConfig(abc)Config | Aurelia',
        'C:My parent2 > C:TheChild2(abc) | Aurelia',
      ],
      [
        'R:TheParentConfig | Aurelia',
        'Aurelia',

        'R:TheParentConfigChildConfig | Aurelia',
        'C:TheChild2 | Aurelia',

        'R:TheParentConfigChild2@ParentConfig | Aurelia',
        'R:TheChildConfig | Aurelia',

        'R:TheParentConfig(abc)Config | Aurelia',
        'C:TheChild2(abc) | Aurelia',
      ],
    ];

    const appDependencies = [Parent, Parent2, Child, Child2];
    const appRoutes: IRoute[] = [
      { path: 'parent-config', component: 'my-parent', viewport: 'default', title: 'TheParentConfig' },
      { path: 'parent-config/:id', instructions: [{ component: 'my-parent', viewport: 'default', children: [{ component: 'my-child', viewport: 'parent' }] }], title: (route) => `TheParentConfig(${route.params.id !== void 0 ? route.params.id : ':id'})Config` },
      { path: 'parent-config/child-config', instructions: [{ component: 'my-parent', viewport: 'default', children: [{ component: 'my-child', viewport: 'parent' }] }], title: 'TheParentConfigChildConfig' },
      { path: 'parent-config/child2', instructions: [{ component: 'my-parent', viewport: 'default', children: [{ component: 'my-child2', viewport: 'parent' }] }], title: 'TheParentConfigChild2Config' },
      { path: 'parent-config/my-child2@parent', instructions: [{ component: 'my-parent', viewport: 'default', children: [{ component: 'my-child2', viewport: 'parent' }] }], title: 'TheParentConfigChild2@ParentConfig' },
    ];

    let locationPath: string;
    let browserTitle: string;
    const locationCallback = (type, data, title, path) => {
      // console.log(type, data, title, path);
      locationPath = path;
      browserTitle = title;
    };
    for (let i = 0; i < titleConfigs.length; i++) {
      const config = titleConfigs[i];
      for (let j = 0; j < tests.length; j++) {
        const test = tests[j];
        it(`to load route ${test.path} => ${test.url}`, async function () {
          const { platform, host, router, $teardown } = await $setup({ title: config }, appDependencies, appRoutes, locationCallback);

          await $load(test.path, router, platform);
          assert.strictEqual(host.textContent, test.result, `host.textContent`);
          assert.strictEqual(locationPath, `#/${test.url}`, 'location.path');
          assert.strictEqual(browserTitle, titles[i][j], 'browser.title');

          await $teardown();
        });
      }
    }
  });

  describe('can use viewport scope', function () {
    this.timeout(30000);

    async function $setup(config?, dependencies: any[] = [], routes: IRoute[] = [], stateSpy?) {
      const ctx = TestContext.create();

      const { container, platform } = ctx;

      const App = CustomElement.define({
        name: 'app',
        template: '<au-viewport name="app"></au-viewport>',
        dependencies
      }, class {
        public static routes: IRoute[] = routes;
      });

      const host = ctx.doc.createElement('div');
      ctx.doc.body.appendChild(host as any);

      const au = new Aurelia(container)
        .register(
          !config ? RouterConfiguration : RouterConfiguration.customize(config),
          App)
        .app({ host: host, component: App });

      const router = getModifiedRouter(container);
      const { _pushState, _replaceState } = spyNavigationStates(router, stateSpy);

      await au.start();

      async function $teardown() {
        unspyNavigationStates(router, _pushState, _replaceState);
        await au.stop();
        ctx.doc.body.removeChild(host);

        au.dispose();
      }

      return { ctx, container, platform, host, au, router, $teardown, App };
    }

    function $removeViewport(instructions) {
      for (const instruction of instructions) {
        instruction.viewport = null;
        instruction.viewportName = null;
        if (Array.isArray(instruction.nextScopeInstructions)) {
          $removeViewport(instruction.nextScopeInstructions);
        }
      }
    }

    const part = '<au-viewport-scope><a load="my-one">One</a><a load="my-two">Two</a>:<au-viewport default="my-zero"></au-viewport></au-viewport-scope>';
    const Siblings = CustomElement.define({ name: 'my-siblings', template: `!my-siblings!${part}|${part}` }, class { });
    const Zero = CustomElement.define({ name: 'my-zero', template: '!my-zero!' }, class { });
    const One = CustomElement.define({ name: 'my-one', template: '!my-one!' }, class { });
    const Two = CustomElement.define({ name: 'my-two', template: '!my-two!' }, class { });

    const appDependencies = [Siblings, Zero, One, Two];

    let locationPath: string;
    let browserTitle: string;
    const locationCallback = (type, data, title, path) => {
      // console.log(type, data, title, path);
      locationPath = path;
      browserTitle = title;
    };

    const tests = [
      { anchor: 0, result: '!my-siblings!OneTwo:!my-one!|OneTwo:', url: 'my-siblings/my-one', title: '', name: 'first my-one' },
      { anchor: 1, result: '!my-siblings!OneTwo:!my-two!|OneTwo:', url: 'my-siblings/my-two', title: '', name: 'first my-two' },
      { anchor: 2, result: '!my-siblings!OneTwo:|OneTwo:!my-one!', url: 'my-siblings/my-two', title: '', name: 'second my-one' },
      { anchor: 3, result: '!my-siblings!OneTwo:|OneTwo:!my-two!', url: 'my-siblings/my-two', title: '', name: 'second my-two' },
    ];

    for (let j = 0; j < tests.length; j++) {
      const test = tests[j];
      it.skip(`to load sibling routes ${test.name}`, async function () {
        const { platform, host, router, $teardown } = await $setup({}, appDependencies, [], locationCallback);

        await $load('/my-siblings', router, platform);
        await platform.domWriteQueue.yield();

        (host.getElementsByTagName('A')[test.anchor] as HTMLElement).click();
        await platform.domWriteQueue.yield();

        assert.strictEqual(host.textContent, test.result, `host.textContent`);
        // // assert.strictEqual(locationPath, `#/${test.url}`, 'location.path');
        // // assert.strictEqual(browserTitle, test.title, 'browser.title');

        await $teardown();
      });
    }
  });
});

let quxCantUnload = 0;
let plughReentryBehavior = 'default';

const $load = async (path: string, router: IRouter, platform: IPlatform) => {
  await router.load(path);
  platform.domWriteQueue.flush();
};

const wait = async (time = 500) => {
  await new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};
