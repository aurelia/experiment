import {
  AttributeFilter,
  Controller,
  LifecycleFlags as LF,
  ITemplateFactory,
  RenderContext,
  Interpolation,
  AccessScopeExpression,
  CustomElement,
  ICustomElementResource,
  ITemplateDefinition,
  ITargetedInstruction,
  BindingStrategy,
  HooksDefinition,
  BindingMode,
  BindingBehaviorExpression,
  HydrateElementInstruction,
  BindingType,
  HydrateTemplateController,
  ToViewBindingInstruction,
  If,
} from '@aurelia/runtime';
import {
  parseExpression,
} from '@aurelia/jit';
import {
  TextBindingInstruction,
} from '@aurelia/runtime-html';
import {
  TestContext,
  assert,
  h,
  CallCollection,
  recordCalls,
  stopRecordingCalls,
} from '@aurelia/testing';
import {
  PLATFORM,
  IRegistry,
  Registration,
  IContainer,
  Key,
  Class,
  kebabCase,
  resetId,
  nextId,
} from '@aurelia/kernel';

describe.skip('controller', function () {
  const buildNotRequired = Object.freeze({ compiler: 'default', required: false });
  const allHooks = Object.freeze(new HooksDefinition({
    created: true,
    binding: true,
    bound: true,
    attaching: true,
    attached: true,
    detaching: true,
    caching: true,
    detached: true,
    unbinding: true,
    unbound: true,
  }));
  const noHooks = Object.freeze(new HooksDefinition({}));
  const noDependencies = PLATFORM.emptyArray as typeof PLATFORM.emptyArray & IRegistry[];
  const noSurrogates = PLATFORM.emptyArray as typeof PLATFORM.emptyArray & ITargetedInstruction[];
  const noAliases = PLATFORM.emptyArray as typeof PLATFORM.emptyArray & ITargetedInstruction[];
  const noShadowOptions = null as { mode: 'closed' | 'open' };

  function addTracingHooks<TProto>(ctor: Class<TProto>): Class<TProto & {
    created(...args: any[]): void;
    binding(...args: any[]): void;
    bound(...args: any[]): void;
    attaching(...args: any[]): void;
    attached(...args: any[]): void;
    detaching(...args: any[]): void;
    caching(...args: any[]): void;
    detached(...args: any[]): void;
    unbinding(...args: any[]): void;
    unbound(...args: any[]): void;
  }> {
    const proto = ctor.prototype as any;

    proto.created = function (...args: any[]): void {
      this.$$calls.addCall(this.id, 'created', ...args);
    };
    proto.binding = function (...args: any[]): void {
      this.$$calls.addCall(this.id, 'binding', ...args);
    };
    proto.bound = function (...args: any[]): void {
      this.$$calls.addCall(this.id, 'bound', ...args);
    };
    proto.attaching = function (...args: any[]): void {
      this.$$calls.addCall(this.id, 'attaching', ...args);
    };
    proto.attached = function (...args: any[]): void {
      this.$$calls.addCall(this.id, 'attached', ...args);
    };
    proto.detaching = function (...args: any[]): void {
      this.$$calls.addCall(this.id, 'detaching', ...args);
    };
    proto.caching = function (...args: any[]): void {
      this.$$calls.addCall(this.id, 'caching', ...args);
    };
    proto.detached = function (...args: any[]): void {
      this.$$calls.addCall(this.id, 'detached', ...args);
    };
    proto.unbinding = function (...args: any[]): void {
      this.$$calls.addCall(this.id, 'unbinding', ...args);
    };
    proto.unbound = function (...args: any[]): void {
      this.$$calls.addCall(this.id, 'unbound', ...args);
    };

    return ctor as any;
  }

  function createDescription(
    name: string,
    template: unknown,
    bindables: string[],
    instructions: ITargetedInstruction[][],
    hooks: Readonly<HooksDefinition>,
  ) {
    return Object.freeze<Required<ITemplateDefinition>>({
      name,
      template,
      captureAttrs: AttributeFilter.none,
      cache: 0,
      build: buildNotRequired,
      bindables: Object.freeze(
        bindables.reduce(
          (acc, cur) => {
            acc[cur] = Object.freeze({
              property: cur,
              attribute: kebabCase(cur),
              callback: `${cur}Changed`,
              mode: BindingMode.oneTime,
            });
            return acc;
          },
          {},
        )
      ) as readonly string[] & string[],
      instructions,
      dependencies: noDependencies,
      surrogates: noSurrogates,
      aliases: noAliases,
      containerless: false,
      isStrictBinding: true,
      shadowOptions: noShadowOptions,
      hasSlots: false,
      strategy: BindingStrategy.getterSetter,
      hooks,
      scopeParts: PLATFORM.emptyArray,
      childrenObservers: PLATFORM.emptyObject
    });
  }

  function createViewModel(
    template: unknown,
    bindables: string[],
    instructions: ITargetedInstruction[][],
  ) {

    const inject: readonly Key[] = Object.freeze([CallCollection]);

    const kind: ICustomElementResource = CustomElement;

    const description = createDescription(
      'view-model',
      template,
      bindables,
      instructions,
      allHooks,
    );

    return addTracingHooks(class $ViewModel {
      public static readonly inject = inject;
      public static readonly kind = kind;
      public static readonly description = description;

      public $controller: Controller<Node>;
      public readonly id: number;
      public readonly $$calls: CallCollection;

      public constructor(
        calls: CallCollection,
      ) {
        this.id = nextId('au$component');

        this.$$calls = calls;
      }

      public static register(container: IContainer): void {
        container.register(Registration.transient('custom-element:view-model', this));
        container.register(Registration.transient(this, this));
      }
    });
  }

  function setup() {
    resetId('au$component');

    const ctx = TestContext.createHTMLTestContext();
    const { container, lifecycle, dom } = ctx;
    const templateFactory = container.get(ITemplateFactory);
    const renderContext = new RenderContext(dom, container, null);
    const $loc = h('div');
    const host = h('div', null, $loc);
    const loc = dom.convertToRenderLocation($loc);
    const calls = container.get(CallCollection);

    recordCalls(Controller, calls);
    recordCalls(If, calls);

    return {
      ctx,
      calls,
      container,
      lifecycle,
      dom,
      templateFactory,
      renderContext,
      host,
      loc,
    };
  }

  function tearDown() {
    stopRecordingCalls(Controller);
    stopRecordingCalls(If);
  }

  describe('forSyntheticView()', function () {
    for (const viewCache of [null, void 0]) {
      it(`throws if viewCache is ${viewCache}`, function () {
        const {
          lifecycle,
        } = setup();

        assert.throws(
          () => {
            Controller.forSyntheticView(
              viewCache,
              lifecycle,
              LF.none,
            );
          },
        );
      });
    }

    it(`correctly executes 1 CustomElement lifecycles`, function () {
      const {
        lifecycle,
        container,
        host,
        calls,
      } = setup();

      const flags = LF.none;

      const ViewModel = createViewModel(
        h(
          'div',
          null,
          h('au-m', { class: 'au' }),
          '',
        ),
        [],
        [
          [
            new TextBindingInstruction(
              new Interpolation(['', ''], [new BindingBehaviorExpression(new AccessScopeExpression('id'), 'oneTime', PLATFORM.emptyArray)])
            ),
          ],
        ],
      );

      const viewModel = container.get(ViewModel);

      const sut = Controller.forCustomElement(viewModel, container, host);

      const expectedCalls = new CallCollection();

      assert.deepStrictEqual(
        calls,
        expectedCalls
          .addCall(1, 'created', LF.getterSetterStrategy),
        '1',
      );

      sut.bind(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          .addCall(2, 'bind', LF.none)
          .addCall(2, 'bindCustomElement', LF.fromBind, sut.scope)
          .addCall(2, 'bindBindings', LF.fromBind, sut.scope)
          .addCall(1, 'binding', LF.fromBind)
          .addCall(2, 'bindControllers', LF.fromBind, sut.scope)
          .addCall(2, 'endBind', LF.fromBind)
          .addCall(2, 'bound', LF.fromBind)
          .addCall(1, 'bound', LF.fromBind),
        '2',
      );

      sut.attach(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          .addCall(2, 'attach', LF.none)
          .addCall(2, 'attachCustomElement', LF.fromAttach)
          .addCall(1, 'attaching', LF.fromAttach)
          .addCall(2, 'attachControllers', LF.fromAttach),
        '3',
      );
      assert.strictEqual(host.textContent, '', '4');

      lifecycle.processRAFQueue(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          .addCall(2, 'mount', LF.fromTick)
          .addCall(2, 'mountCustomElement', LF.fromTick)
          .addCall(2, 'attached', LF.fromTick)
          .addCall(1, 'attached', LF.fromTick),
        '5',
      );
      assert.strictEqual(host.textContent, '1', '6');

      sut.detach(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          .addCall(2, 'detach', LF.none)
          .addCall(2, 'detachCustomElement', LF.fromDetach)
          .addCall(1, 'detaching', LF.fromDetach)
          .addCall(2, 'detachControllers', LF.fromDetach),
        '7',
      );
      assert.strictEqual(host.textContent, '1', '8');

      lifecycle.processRAFQueue(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          .addCall(2, 'unmount', LF.fromTick)
          .addCall(2, 'unmountCustomElement', LF.fromTick)
          .addCall(2, 'detached', LF.fromTick)
          .addCall(1, 'detached', LF.fromTick),
        '9',
      );
      assert.strictEqual(host.textContent, '', '10');

      sut.unbind(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          .addCall(2, 'unbind', LF.none)
          .addCall(2, 'unbindCustomElement', LF.fromUnbind)
          .addCall(1, 'unbinding', LF.fromUnbind)
          .addCall(2, 'unbindControllers', LF.fromUnbind)
          .addCall(2, 'unbindBindings', LF.fromUnbind)
          .addCall(2, 'endUnbind', LF.fromUnbind)
          .addCall(2, 'unbound', LF.fromUnbind)
          .addCall(1, 'unbound', LF.fromUnbind),
        '11',
      );

      tearDown();
    });

    it(`correctly executes 1-1 CustomElement+if lifecycles`, function () {
      const {
        lifecycle,
        container,
        host,
        calls,
      } = setup();

      const flags = LF.none;

      const ViewModel = createViewModel(
        h(
          'div',
          null,
          h('au-m', { class: 'au' }),
          '',
          h('au-m', { class: 'au' }),
        ),
        [],
        [
          [
            new TextBindingInstruction(parseExpression(`\${id&oneTime}`, BindingType.Interpolation)),
          ],
          [
            new HydrateTemplateController(
              createDescription(
                'if',
                h('view-model', { class: 'au' }),
                [],
                [
                  [new HydrateElementInstruction('view-model', [], void 0, void 0)],
                ],
                noHooks,
              ),
              'if',
              [new ToViewBindingInstruction(parseExpression('id===1&oneTime'), 'value')],
            ),
          ],
        ],
      );

      const viewModel = container.get(ViewModel);

      const sut = Controller.forCustomElement(viewModel, container, host);

      const expectedCalls = new CallCollection();

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1
          .addCall(1, 'created', LF.getterSetterStrategy),
        '1',
      );

      sut.bind(flags);

      const ifInstance = sut.controllers[0].bindingContext as unknown as If;
      const secondCustomElementController = ifInstance.ifView.controllers[0];
      const secondIfInstance = secondCustomElementController.controllers[0].bindingContext as unknown as If;

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'bind', LF.none)
          .addCall(2, 'bindCustomElement', LF.fromBind, sut.scope)
          .addCall(2, 'bindBindings', LF.fromBind, sut.scope)

          // if #1
          .addCall(3, 'valueChanged', true, false, LF.none)

          // ce #1
          .addCall(1, 'binding', LF.fromBind)

          // ce #1 controller
          .addCall(2, 'bindControllers', LF.fromBind, sut.scope)

          // if #1 controller
          .addCall(4, 'bind', LF.fromBind, sut.scope)
          .addCall(4, 'bindCustomAttribute', LF.fromBind, sut.scope)

          // if #1
          .addCall(3, 'binding', LF.fromBind)
          .addCall(3, 'swap', true, LF.fromBind)
          .addCall(3, 'updateView', true, LF.fromBind)
          .addCall(3, 'ensureView', void 0, ifInstance.ifFactory, LF.fromBind)

          // ce #2
          .addCall(6, 'created', LF.fromBind | LF.getterSetterStrategy)

          // if #1 ifView
          .addCall(5, 'hold', ifInstance.location)

          // if #1
          .addCall(3, 'activate', ifInstance.ifView, LF.fromBind)
          .addCall(3, 'bindView', LF.fromBind)

          // if #1 ifView
          .addCall(5, 'bind', LF.fromBind, sut.scope)
          .addCall(5, 'bindSynthetic', LF.fromBind, sut.scope)
          .addCall(5, 'bindBindings', LF.fromBind, sut.scope)
          .addCall(5, 'bindControllers', LF.fromBind, sut.scope)

          // ce #2 controller
          .addCall(7, 'bind', LF.fromBind, sut.scope)
          .addCall(7, 'bindCustomElement', LF.fromBind, secondCustomElementController.scope)
          .addCall(7, 'bindBindings', LF.fromBind, secondCustomElementController.scope)

          // ce #2
          .addCall(6, 'binding', LF.fromBind)

          // ce #2 controller
          .addCall(7, 'bindControllers', LF.fromBind, secondCustomElementController.scope)

          // if #2 controller
          .addCall(9, 'bind', LF.fromBind, secondCustomElementController.scope)
          .addCall(9, 'bindCustomAttribute', LF.fromBind, secondCustomElementController.scope)

          // if #2
          .addCall(8, 'binding', LF.fromBind)
          .addCall(8, 'swap', false, LF.fromBind)
          .addCall(8, 'deactivate', LF.fromBind)
          .addCall(8, 'updateView', false, LF.fromBind)
          .addCall(8, 'activate', secondIfInstance.elseView, LF.fromBind)

          // if #2 controller
          .addCall(9, 'endBind', LF.fromBind)

          // ce #2 controller
          .addCall(7, 'endBind', LF.fromBind)

          // if #1 ifView
          .addCall(5, 'endBind', LF.fromBind)

          // if #1 controller
          .addCall(4, 'endBind', LF.fromBind)

          // ce #1 controller
          .addCall(2, 'endBind', LF.fromBind)

          // ce #2 controller
          .addCall(7, 'bound', LF.fromBind)

          // ce #2
          .addCall(6, 'bound', LF.fromBind)

          // ce #1 controller
          .addCall(2, 'bound', LF.fromBind)

          // ce #1
          .addCall(1, 'bound', LF.fromBind),
        '2',
      );

      sut.attach(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'attach', LF.none)
          .addCall(2, 'attachCustomElement', LF.fromAttach)

          // ce #1
          .addCall(1, 'attaching', LF.fromAttach)

          // ce #1 controller
          .addCall(2, 'attachControllers', LF.fromAttach)

          // if #1 controller
          .addCall(4, 'attach', LF.fromAttach)
          .addCall(4, 'attachCustomAttribute', LF.fromAttach)

          // if #1
          .addCall(3, 'attaching', LF.fromAttach)
          .addCall(3, 'attachView', LF.fromAttach)

          // if #1 ifView
          .addCall(5, 'attach', LF.fromAttach)
          .addCall(5, 'attachSynthetic', LF.fromAttach)
          .addCall(5, 'attachControllers', LF.fromAttach)

          // ce #2 controller
          .addCall(7, 'attach', LF.fromAttach)
          .addCall(7, 'attachCustomElement', LF.fromAttach)

          // ce #2
          .addCall(6, 'attaching', LF.fromAttach)

          // ce #2 controller
          .addCall(7, 'attachControllers', LF.fromAttach)

          // if #2 controller
          .addCall(9, 'attach', LF.fromAttach)
          .addCall(9, 'attachCustomAttribute', LF.fromAttach)

          // if #2
          .addCall(8, 'attaching', LF.fromAttach)
          .addCall(8, 'attachView', LF.fromAttach),
        '3',
      );
      assert.strictEqual(host.textContent, '', '4');

      lifecycle.processRAFQueue(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'mount', LF.fromTick)
          .addCall(2, 'mountCustomElement', LF.fromTick)

          // if #1 ifView
          .addCall(5, 'mount', LF.fromTick)
          .addCall(5, 'mountSynthetic', LF.fromTick)

          // ce #2 controller
          .addCall(7, 'mount', LF.fromTick)
          .addCall(7, 'mountCustomElement', LF.fromTick)

          .addCall(7, 'attached', LF.fromTick)

          // ce #2
          .addCall(6, 'attached', LF.fromTick)

          // ce #1 controller
          .addCall(2, 'attached', LF.fromTick)

          // ce #1
          .addCall(1, 'attached', LF.fromTick),
        '5',
      );
      assert.strictEqual(host.textContent, '16', '6');

      sut.detach(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'detach', LF.none)
          .addCall(2, 'detachCustomElement', LF.fromDetach)

          // ce #1
          .addCall(1, 'detaching', LF.fromDetach)

          // ce #1 controller
          .addCall(2, 'detachControllers', LF.fromDetach)

          // if #1 controller
          .addCall(4, 'detach', LF.fromDetach)
          .addCall(4, 'detachCustomAttribute', LF.fromDetach)

          // if #1
          .addCall(3, 'detaching', LF.fromDetach)

          // if #1 ifView
          .addCall(5, 'detach', LF.fromDetach)
          .addCall(5, 'detachSynthetic', LF.fromDetach)
          .addCall(5, 'detachControllers', LF.fromDetach)

          // ce #2 controller
          .addCall(7, 'detach', LF.fromDetach)
          .addCall(7, 'detachCustomElement', LF.fromDetach)

          // ce #2
          .addCall(6, 'detaching', LF.fromDetach)

          // ce #2 controller
          .addCall(7, 'detachControllers', LF.fromDetach)

          // if #2 controller
          .addCall(9, 'detach', LF.fromDetach)
          .addCall(9, 'detachCustomAttribute', LF.fromDetach)

          // if #2
          .addCall(8, 'detaching', LF.fromDetach),
        '7',
      );
      assert.strictEqual(host.textContent, '16', '8');

      lifecycle.processRAFQueue(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'unmount', LF.fromTick)
          .addCall(2, 'unmountCustomElement', LF.fromTick)

          // if #1 ifView
          .addCall(5, 'unmount', LF.fromTick)
          .addCall(5, 'unmountSynthetic', LF.fromTick)

          // ce #2 controller
          .addCall(7, 'unmount', LF.fromTick)
          .addCall(7, 'unmountCustomElement', LF.fromTick)

          .addCall(7, 'detached', LF.fromTick)

          // ce #2
          .addCall(6, 'detached', LF.fromTick)

          // ce #1 controller
          .addCall(2, 'detached', LF.fromTick)

          // ce #1
          .addCall(1, 'detached', LF.fromTick)
        ,
        '9',
      );
      assert.strictEqual(host.textContent, '', '10');

      sut.unbind(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'unbind', LF.none)
          .addCall(2, 'unbindCustomElement', LF.fromUnbind)

          // ce #1
          .addCall(1, 'unbinding', LF.fromUnbind)

          // ce #1 controller
          .addCall(2, 'unbindControllers', LF.fromUnbind)

          // if #1 controller
          .addCall(4, 'unbind', LF.fromUnbind)
          .addCall(4, 'unbindCustomAttribute', LF.fromUnbind)

          // if #1
          .addCall(3, 'unbinding', LF.fromUnbind)

          // if #1 ifView
          .addCall(5, 'unbind', LF.fromUnbind)
          .addCall(5, 'unbindSynthetic', LF.fromUnbind)
          .addCall(5, 'unbindControllers', LF.fromUnbind)

          // ce #2 controller
          .addCall(7, 'unbind', LF.fromUnbind)
          .addCall(7, 'unbindCustomElement', LF.fromUnbind)

          // ce #2
          .addCall(6, 'unbinding', LF.fromUnbind)

          // ce #2 controller
          .addCall(7, 'unbindControllers', LF.fromUnbind)

          // if #2 controller
          .addCall(9, 'unbind', LF.fromUnbind)
          .addCall(9, 'unbindCustomAttribute', LF.fromUnbind)

          // if #2
          .addCall(8, 'unbinding', LF.fromUnbind)

          // if #2 controller
          .addCall(9, 'endUnbind', LF.fromUnbind)

          // ce #2 controller
          .addCall(7, 'unbindBindings', LF.fromUnbind)
          .addCall(7, 'endUnbind', LF.fromUnbind)

          // if #1 ifView
          .addCall(5, 'unbindBindings', LF.fromUnbind)
          .addCall(5, 'endUnbind', LF.fromUnbind)

          // if #1 controller
          .addCall(4, 'endUnbind', LF.fromUnbind)

          // ce #1 controller
          .addCall(2, 'unbindBindings', LF.fromUnbind)
          .addCall(2, 'endUnbind', LF.fromUnbind)

          // ce #2 controller
          .addCall(7, 'unbound', LF.fromUnbind)

          // ce #2
          .addCall(6, 'unbound', LF.fromUnbind)

          // ce #1 controller
          .addCall(2, 'unbound', LF.fromUnbind)

          // ce #1
          .addCall(1, 'unbound', LF.fromUnbind),
        '11',
      );

      tearDown();
    });

    it(`correctly executes 1-1 CustomElement+if with bindables lifecycles`, function () {
      const {
        lifecycle,
        container,
        host,
        calls,
      } = setup();

      const flags = LF.none;

      const ViewModel = createViewModel(
        h(
          'div',
          null,
          h('au-m', { class: 'au' }),
          '',
          h('au-m', { class: 'au' }),
        ),
        [
          'msg',
        ],
        [
          [
            new TextBindingInstruction(parseExpression(`\${msg}`, BindingType.Interpolation)),
          ],
          [
            new HydrateTemplateController(
              createDescription(
                'if',
                h('view-model', { class: 'au' }),
                [],
                [
                  [
                    new HydrateElementInstruction(
                      'view-model',
                      [new ToViewBindingInstruction(parseExpression('msg'), 'msg')],
                      void 0,
                      void 0
                    ),
                  ],
                ],
                noHooks,
              ),
              'if',
              [new ToViewBindingInstruction(parseExpression('id===1&oneTime'), 'value')],
            ),
          ],
        ],
      );

      const viewModel = container.get(ViewModel);
      viewModel['msg'] = 'hi';

      const sut = Controller.forCustomElement(viewModel, container, host);

      const expectedCalls = new CallCollection();

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1
          .addCall(1, 'created', LF.getterSetterStrategy),
        '1',
      );

      sut.bind(flags);

      const ifInstance = sut.controllers[0].bindingContext as unknown as If;
      const secondCustomElementController = ifInstance.ifView.controllers[0];
      const secondIfInstance = secondCustomElementController.controllers[0].bindingContext as unknown as If;

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'bind', LF.none)
          .addCall(2, 'bindCustomElement', LF.fromBind, sut.scope)
          .addCall(2, 'bindBindings', LF.fromBind, sut.scope)

          // if #1
          .addCall(3, 'valueChanged', true, false, LF.none)

          // ce #1
          .addCall(1, 'binding', LF.fromBind)

          // ce #1 controller
          .addCall(2, 'bindControllers', LF.fromBind, sut.scope)

          // if #1 controller
          .addCall(4, 'bind', LF.fromBind, sut.scope)
          .addCall(4, 'bindCustomAttribute', LF.fromBind, sut.scope)

          // if #1
          .addCall(3, 'binding', LF.fromBind)
          .addCall(3, 'swap', true, LF.fromBind)
          .addCall(3, 'updateView', true, LF.fromBind)
          .addCall(3, 'ensureView', void 0, ifInstance.ifFactory, LF.fromBind)

          // ce #2
          .addCall(6, 'created', LF.fromBind | LF.getterSetterStrategy)

          // if #1 ifView
          .addCall(5, 'hold', ifInstance.location)

          // if #1
          .addCall(3, 'activate', ifInstance.ifView, LF.fromBind)
          .addCall(3, 'bindView', LF.fromBind)

          // if #1 ifView
          .addCall(5, 'bind', LF.fromBind, sut.scope)
          .addCall(5, 'bindSynthetic', LF.fromBind, sut.scope)
          .addCall(5, 'bindBindings', LF.fromBind, sut.scope)
          .addCall(5, 'bindControllers', LF.fromBind, sut.scope)

          // ce #2 controller
          .addCall(7, 'bind', LF.fromBind, sut.scope)
          .addCall(7, 'bindCustomElement', LF.fromBind, secondCustomElementController.scope)
          .addCall(7, 'bindBindings', LF.fromBind, secondCustomElementController.scope)

          // ce #2
          .addCall(6, 'binding', LF.fromBind)

          // ce #2 controller
          .addCall(7, 'bindControllers', LF.fromBind, secondCustomElementController.scope)

          // if #2 controller
          .addCall(9, 'bind', LF.fromBind, secondCustomElementController.scope)
          .addCall(9, 'bindCustomAttribute', LF.fromBind, secondCustomElementController.scope)

          // if #2
          .addCall(8, 'binding', LF.fromBind)
          .addCall(8, 'swap', false, LF.fromBind)
          .addCall(8, 'deactivate', LF.fromBind)
          .addCall(8, 'updateView', false, LF.fromBind)
          .addCall(8, 'activate', secondIfInstance.elseView, LF.fromBind)

          // if #2 controller
          .addCall(9, 'endBind', LF.fromBind)

          // ce #2 controller
          .addCall(7, 'endBind', LF.fromBind)

          // if #1 ifView
          .addCall(5, 'endBind', LF.fromBind)

          // if #1 controller
          .addCall(4, 'endBind', LF.fromBind)

          // ce #1 controller
          .addCall(2, 'endBind', LF.fromBind)

          // ce #2 controller
          .addCall(7, 'bound', LF.fromBind)

          // ce #2
          .addCall(6, 'bound', LF.fromBind)

          // ce #1 controller
          .addCall(2, 'bound', LF.fromBind)

          // ce #1
          .addCall(1, 'bound', LF.fromBind),
        '2',
      );

      sut.attach(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'attach', LF.none)
          .addCall(2, 'attachCustomElement', LF.fromAttach)

          // ce #1
          .addCall(1, 'attaching', LF.fromAttach)

          // ce #1 controller
          .addCall(2, 'attachControllers', LF.fromAttach)

          // if #1 controller
          .addCall(4, 'attach', LF.fromAttach)
          .addCall(4, 'attachCustomAttribute', LF.fromAttach)

          // if #1
          .addCall(3, 'attaching', LF.fromAttach)
          .addCall(3, 'attachView', LF.fromAttach)

          // if #1 ifView
          .addCall(5, 'attach', LF.fromAttach)
          .addCall(5, 'attachSynthetic', LF.fromAttach)
          .addCall(5, 'attachControllers', LF.fromAttach)

          // ce #2 controller
          .addCall(7, 'attach', LF.fromAttach)
          .addCall(7, 'attachCustomElement', LF.fromAttach)

          // ce #2
          .addCall(6, 'attaching', LF.fromAttach)

          // ce #2 controller
          .addCall(7, 'attachControllers', LF.fromAttach)

          // if #2 controller
          .addCall(9, 'attach', LF.fromAttach)
          .addCall(9, 'attachCustomAttribute', LF.fromAttach)

          // if #2
          .addCall(8, 'attaching', LF.fromAttach)
          .addCall(8, 'attachView', LF.fromAttach),
        '3',
      );
      assert.strictEqual(host.textContent, '', '4');

      lifecycle.processRAFQueue(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'mount', LF.fromTick)
          .addCall(2, 'mountCustomElement', LF.fromTick)

          // if #1 ifView
          .addCall(5, 'mount', LF.fromTick)
          .addCall(5, 'mountSynthetic', LF.fromTick)

          // ce #2 controller
          .addCall(7, 'mount', LF.fromTick)
          .addCall(7, 'mountCustomElement', LF.fromTick)

          .addCall(7, 'attached', LF.fromTick)

          // ce #2
          .addCall(6, 'attached', LF.fromTick)

          // ce #1 controller
          .addCall(2, 'attached', LF.fromTick)

          // ce #1
          .addCall(1, 'attached', LF.fromTick),
        '5',
      );
      assert.strictEqual(host.textContent, 'hihi', '6');

      sut.detach(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'detach', LF.none)
          .addCall(2, 'detachCustomElement', LF.fromDetach)

          // ce #1
          .addCall(1, 'detaching', LF.fromDetach)

          // ce #1 controller
          .addCall(2, 'detachControllers', LF.fromDetach)

          // if #1 controller
          .addCall(4, 'detach', LF.fromDetach)
          .addCall(4, 'detachCustomAttribute', LF.fromDetach)

          // if #1
          .addCall(3, 'detaching', LF.fromDetach)

          // if #1 ifView
          .addCall(5, 'detach', LF.fromDetach)
          .addCall(5, 'detachSynthetic', LF.fromDetach)
          .addCall(5, 'detachControllers', LF.fromDetach)

          // ce #2 controller
          .addCall(7, 'detach', LF.fromDetach)
          .addCall(7, 'detachCustomElement', LF.fromDetach)

          // ce #2
          .addCall(6, 'detaching', LF.fromDetach)

          // ce #2 controller
          .addCall(7, 'detachControllers', LF.fromDetach)

          // if #2 controller
          .addCall(9, 'detach', LF.fromDetach)
          .addCall(9, 'detachCustomAttribute', LF.fromDetach)

          // if #2
          .addCall(8, 'detaching', LF.fromDetach),
        '7',
      );
      assert.strictEqual(host.textContent, 'hihi', '8');

      lifecycle.processRAFQueue(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'unmount', LF.fromTick)
          .addCall(2, 'unmountCustomElement', LF.fromTick)

          // if #1 ifView
          .addCall(5, 'unmount', LF.fromTick)
          .addCall(5, 'unmountSynthetic', LF.fromTick)

          // ce #2 controller
          .addCall(7, 'unmount', LF.fromTick)
          .addCall(7, 'unmountCustomElement', LF.fromTick)

          .addCall(7, 'detached', LF.fromTick)

          // ce #2
          .addCall(6, 'detached', LF.fromTick)

          // ce #1 controller
          .addCall(2, 'detached', LF.fromTick)

          // ce #1
          .addCall(1, 'detached', LF.fromTick)
        ,
        '9',
      );
      assert.strictEqual(host.textContent, '', '10');

      sut.unbind(flags);

      assert.deepStrictEqual(
        calls,
        expectedCalls
          // ce #1 controller
          .addCall(2, 'unbind', LF.none)
          .addCall(2, 'unbindCustomElement', LF.fromUnbind)

          // ce #1
          .addCall(1, 'unbinding', LF.fromUnbind)

          // ce #1 controller
          .addCall(2, 'unbindControllers', LF.fromUnbind)

          // if #1 controller
          .addCall(4, 'unbind', LF.fromUnbind)
          .addCall(4, 'unbindCustomAttribute', LF.fromUnbind)

          // if #1
          .addCall(3, 'unbinding', LF.fromUnbind)

          // if #1 ifView
          .addCall(5, 'unbind', LF.fromUnbind)
          .addCall(5, 'unbindSynthetic', LF.fromUnbind)
          .addCall(5, 'unbindControllers', LF.fromUnbind)

          // ce #2 controller
          .addCall(7, 'unbind', LF.fromUnbind)
          .addCall(7, 'unbindCustomElement', LF.fromUnbind)

          // ce #2
          .addCall(6, 'unbinding', LF.fromUnbind)

          // ce #2 controller
          .addCall(7, 'unbindControllers', LF.fromUnbind)

          // if #2 controller
          .addCall(9, 'unbind', LF.fromUnbind)
          .addCall(9, 'unbindCustomAttribute', LF.fromUnbind)

          // if #2
          .addCall(8, 'unbinding', LF.fromUnbind)

          // if #2 controller
          .addCall(9, 'endUnbind', LF.fromUnbind)

          // ce #2 controller
          .addCall(7, 'unbindBindings', LF.fromUnbind)
          .addCall(7, 'endUnbind', LF.fromUnbind)

          // if #1 ifView
          .addCall(5, 'unbindBindings', LF.fromUnbind)
          .addCall(5, 'endUnbind', LF.fromUnbind)

          // if #1 controller
          .addCall(4, 'endUnbind', LF.fromUnbind)

          // ce #1 controller
          .addCall(2, 'unbindBindings', LF.fromUnbind)
          .addCall(2, 'endUnbind', LF.fromUnbind)

          // ce #2 controller
          .addCall(7, 'unbound', LF.fromUnbind)

          // ce #2
          .addCall(6, 'unbound', LF.fromUnbind)

          // ce #1 controller
          .addCall(2, 'unbound', LF.fromUnbind)

          // ce #1
          .addCall(1, 'unbound', LF.fromUnbind),
        '11',
      );

      tearDown();
    });
  });
});

/**
 * ```
 * (incomplete notes)
 * - repeater
 *   - array
 *     - add/replace/remove/reorder * start/middle/end/all
 *   - map
 *     - set/remove/clear * start/middle/end/all
 *   - set
 *     - set/remove/clear * start/middle/end/all
 * - if
 *   - under repeater
 *   - above repeater
 * - replaceable
 *   - if on the replaceable
 *   - repeater on the replaceable
 *   - if on the part
 *   - repeater on the part
 * - with
 *   - under any scope
 * - compose
 *   - everything else as sync
 *   - everything else as async
 *
 * content:
 * - shallow observers
 *   - bind/to-view/from-view/two-way/one-time * self/setter / attribute-ns/data-attribute/checked/style/class/svg/value-attribute/select/element-property/element-attribute
 *
 * /call/ref/let/interpolation/listener
 *
 *
 * - ce -> if -> ce
 * - ce -> if -> if
 * - ce -> if -> repeat
 * - ce -> if -> with
 * - ce -> if -> compose
 *
 * - ce -> repeat -> ce
 * - ce -> with -> ce
 * - ce -> compose -> ce
 * - ce -> replace -> ce -> replaceable
 * - ce -> if -> ce
 * - custom-element -> repeat -> view
 *```
 */
