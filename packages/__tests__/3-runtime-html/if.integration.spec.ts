import {
  AccessScopeExpression,
  BindingContext,
  Else,
  If,
  Scope,
  LifecycleFlags,
  ViewFactory,
  Controller,
  CustomElementDefinition,
  getRenderContext,
  IHydratableController,
  IRenderLocation,
  PropertyBindingRendererRegistration,
  TextBindingRendererRegistration,
  TextBindingInstruction,
  Interpolation,
  IWorkTracker,
  INodeObserverLocatorRegistration,
  DefinitionRenderer,
} from '@aurelia/runtime-html';
import {
  eachCartesianJoin,
  assert,
  PLATFORM,
  createContainer,
} from '@aurelia/testing';
import { Writable } from '@aurelia/kernel';

describe(`If/Else`, function () {
  function runActivateLifecycle(sut: If, flags: LifecycleFlags, scope: Scope): void {
    void sut.$controller.activate(sut.$controller, null, flags, scope);
  }
  function runDeactivateLifecycle(sut: If, flags: LifecycleFlags): void {
    void sut.$controller.deactivate(sut.$controller, null, flags);
  }

  interface Spec {
    t: string;
  }
  interface DuplicateOperationSpec extends Spec {
    activateTwice: boolean;
    deactivateTwice: boolean;
  }
  interface BindSpec extends Spec {
    ifPropName: string;
    elsePropName: string;
    ifText: string;
    elseText: string;

    value1: any;
    value2: any;
  }
  interface MutationSpec extends Spec {
    newValue1: any;
    newValue2: any;
  }
  interface FlagsSpec extends Spec {
    activateFlags1: LifecycleFlags;
    deactivateFlags1: LifecycleFlags;

    activateFlags2: LifecycleFlags;
    deactivateFlags2: LifecycleFlags;
  }

  const duplicateOperationSpecs: DuplicateOperationSpec[] = [
    { t: '1', activateTwice: false, deactivateTwice: false },
    { t: '2', activateTwice: true,  deactivateTwice: false },
    { t: '3', activateTwice: true,  deactivateTwice: true  },
    { t: '4', activateTwice: false, deactivateTwice: true  },
  ];

  const bindSpecs: BindSpec[] = [
    { t: '1', ifPropName: 'ifValue', elsePropName: 'elseValue', ifText: 'foo', elseText: 'bar', value1: true,  value2: true  },
    { t: '2', ifPropName: 'ifValue', elsePropName: 'elseValue', ifText: 'foo', elseText: 'bar', value1: true,  value2: false },
    { t: '3', ifPropName: 'ifValue', elsePropName: 'elseValue', ifText: 'foo', elseText: 'bar', value1: false, value2: true  },
    { t: '4', ifPropName: 'ifValue', elsePropName: 'elseValue', ifText: 'foo', elseText: 'bar', value1: false, value2: false },
  ];

  const none = LifecycleFlags.none;
  const bind = LifecycleFlags.fromBind;
  const unbind = LifecycleFlags.fromUnbind;

  const mutationSpecs: MutationSpec[] = [
    { t: '01', newValue1: false, newValue2: false, },
    { t: '02', newValue1: false, newValue2: true,  },
    { t: '03', newValue1: true,  newValue2: false, },
    { t: '04', newValue1: true,  newValue2: true,  },
  ];

  const flagsSpecs: FlagsSpec[] = [
    { t: '1', activateFlags1: none,            deactivateFlags1: none,              activateFlags2: none,            deactivateFlags2: none,              },
    { t: '2', activateFlags1: bind,            deactivateFlags1: unbind,            activateFlags2: bind,            deactivateFlags2: unbind,            },
  ];

  const container = createContainer().register(
    INodeObserverLocatorRegistration,
    PropertyBindingRendererRegistration,
    TextBindingRendererRegistration,
  );

  const marker = PLATFORM.document.createElement('au-m');
  marker.className = 'au';
  const text = PLATFORM.document.createTextNode('');
  const textTemplate = PLATFORM.document.createElement('template');
  textTemplate.content.append(marker, text);

  eachCartesianJoin(
    [duplicateOperationSpecs, bindSpecs, mutationSpecs, flagsSpecs],
    (duplicateOperationSpec, bindSpec, mutationSpec, flagsSpec) => {
      it(`verify if/else behavior - duplicateOperationSpec ${duplicateOperationSpec.t}, bindSpec ${bindSpec.t}, mutationSpec ${mutationSpec.t}, flagsSpec ${flagsSpec.t}, `, function () {
        const { activateTwice, deactivateTwice } = duplicateOperationSpec;
        const { ifPropName, elsePropName, ifText, elseText, value1, value2 } = bindSpec;
        const { newValue1, newValue2 } = mutationSpec;
        const { activateFlags1, deactivateFlags1, activateFlags2, deactivateFlags2 } = flagsSpec;

        // common stuff
        const baseFlags: LifecycleFlags = LifecycleFlags.none;

        const host = PLATFORM.document.createElement('div');
        const ifLoc = PLATFORM.document.createComment('au-end') as IRenderLocation;
        const elseLoc = PLATFORM.document.createComment('au-end') as IRenderLocation;
        ifLoc.$start = PLATFORM.document.createComment('au-start');
        elseLoc.$start = PLATFORM.document.createComment('au-start');
        host.append(ifLoc.$start, ifLoc, elseLoc.$start, elseLoc);

        // const ifContext = getRenderContext(
        //   CustomElementDefinition.create({
        //     name: void 0,
        //     template: textTemplate.content.cloneNode(true),
        //     instructions: [
        //       [
        //         new TextBindingInstruction(new Interpolation(['', ''], [new AccessScopeExpression(ifPropName)]), false),
        //       ],
        //     ],
        //     needsCompile: false,
        //   }),
        //   container,
        // );
        // const elseContext = getRenderContext(
        //   CustomElementDefinition.create({
        //     name: void 0,
        //     template: textTemplate.content.cloneNode(true),
        //     instructions: [
        //       [
        //         new TextBindingInstruction(new Interpolation(['', ''], [new AccessScopeExpression(elsePropName)]), false),
        //       ],
        //     ],
        //     needsCompile: false,
        //   }),
        //   container,
        // );

        const work = container.get(IWorkTracker);
        // const ifFactory = new ViewFactory('if-view', ifContext);
        // const elseFactory = new ViewFactory('else-view', elseContext);
        debugger;
        const ifFactory = new DefinitionRenderer(PLATFORM).getViewFactory(
          CustomElementDefinition.create({
            name: void 0,
            template: textTemplate.content.cloneNode(true),
            instructions: [
              [
                new TextBindingInstruction(new Interpolation(['', ''], [new AccessScopeExpression(ifPropName)]), false),
              ],
            ],
            needsCompile: false,
          }),
          container,
        );
        const elseFactory = new DefinitionRenderer(PLATFORM).getViewFactory(
          CustomElementDefinition.create({
            name: void 0,
            template: textTemplate.content.cloneNode(true),
            instructions: [
              [
                new TextBindingInstruction(new Interpolation(['', ''], [new AccessScopeExpression(elsePropName)]), false),
              ],
            ],
            needsCompile: false,
          }),
          container,
        );
        const sut = new If(ifFactory, ifLoc, work);
        const elseSut = new Else(elseFactory);
        const ifController = (sut as Writable<If>).$controller = Controller.forCustomAttribute(null, container, sut, (void 0)!);
        elseSut.link(LifecycleFlags.none, { children: [ifController] } as unknown as IHydratableController, void 0!, void 0!, void 0!);

        const firstBindInitialNodesText: string = value1 ? ifText : elseText;
        const firstBindFinalNodesText = firstBindInitialNodesText;
        const firstAttachInitialHostText = value1 ? ifText : elseText;
        const firstAttachFinalHostText: string = newValue1 ? ifText : elseText;

        const secondBindInitialNodesText: string = value2 ? ifText : elseText;
        const secondBindFinalNodesText = secondBindInitialNodesText;
        const secondAttachInitialHostText = value2 ? ifText : elseText;
        const secondAttachFinalHostText: string = newValue2 ? ifText : elseText;

        // -- Round 1 --

        const ctx = BindingContext.create({
          [ifPropName]: ifText,
          [elsePropName]: elseText
        });
        const scope = Scope.create(ctx);

        sut.value = value1;

        runActivateLifecycle(sut, baseFlags | activateFlags1, scope);

        assert.strictEqual(sut.view.nodes.lastChild.previousSibling['textContent'], firstBindInitialNodesText, '$nodes.textContent #1');

        if (activateTwice) {
          runActivateLifecycle(sut, baseFlags | activateFlags1, scope);
        }

        assert.strictEqual(sut.view.nodes.lastChild.previousSibling['textContent'], firstBindFinalNodesText, '$nodes.textContent #2');

        assert.strictEqual(host.textContent, firstAttachInitialHostText, 'host.textContent #1');

        sut.value = newValue1;

        assert.strictEqual(host.textContent, firstAttachFinalHostText, 'host.textContent #2');

        runDeactivateLifecycle(sut, baseFlags | deactivateFlags1);
        if (deactivateTwice) {
          runDeactivateLifecycle(sut, baseFlags | deactivateFlags1);
        }

        assert.strictEqual(host.textContent, '', 'host.textContent #3');

        // unbind should not affect existing values but stops them from updating afterwards

        // -- Round 2 --

        sut.value = value2;

        runActivateLifecycle(sut, baseFlags | activateFlags2, scope);

        assert.strictEqual(sut.view.nodes.lastChild.previousSibling['textContent'], secondBindInitialNodesText, '$nodes.textContent #3');
        if (activateTwice) {
          runActivateLifecycle(sut, baseFlags | activateFlags2, scope);
        }

        assert.strictEqual(sut.view.nodes.lastChild.previousSibling['textContent'], secondBindFinalNodesText, '$nodes.textContent #4');

        assert.strictEqual(host.textContent, secondAttachInitialHostText, 'host.textContent #4');

        sut.value = newValue2;

        assert.strictEqual(host.textContent, secondAttachFinalHostText, 'host.textContent #5');

        runDeactivateLifecycle(sut, baseFlags | deactivateFlags2);
        if (deactivateTwice) {
          runDeactivateLifecycle(sut, baseFlags | deactivateFlags2);
        }

        assert.strictEqual(host.textContent, '', 'host.textContent #6');
      });
    });
});
