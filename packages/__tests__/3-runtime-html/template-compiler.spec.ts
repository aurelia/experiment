import {
  Constructable,
  IContainer,
  kebabCase,
  ISink,
  ILogEvent,
  LoggerConfiguration,
  DefaultLogger,
  LogLevel,
  camelCase,
  Registration,
} from '@aurelia/kernel';
import {
  AccessScopeExpression,
  bindable,
  BindableDefinition,
  BindingIdentifier,
  BindingMode,
  BindingType,
  customAttribute,
  CustomAttribute,
  customElement,
  CustomElement,
  DelegationStrategy,
  ForOfStatement,
  ITemplateCompiler,
  PartialCustomElementDefinition,
  PrimitiveLiteralExpression,
  PartialCustomAttributeDefinition,
  CustomElementDefinition,
  IInstruction,
  CustomElementType,
  AuSlot,
  parseExpression,
  Aurelia,
  HydrateElementInstruction,
  HydrateTemplateController,
  InstructionType as HTT,
  InstructionType as TT,
  HydrateLetElementInstruction,
  InstructionType,
  IExpressionParser,
  CustomAttributeDefinition,
  ITemplateCompilerHooks,
  IAttributeParser,
  HydrateAttributeInstruction,
} from '@aurelia/runtime-html';
import {
  assert,
  eachCartesianJoinFactory,
  TestContext,
  verifyBindingInstructionsEqual,
  generateCartesianProduct,
} from '@aurelia/testing';

export function createAttribute(name: string, value: string): Attr {
  const attr = document.createAttribute(name);
  attr.value = value;
  return attr;
}

describe('template-compiler.spec.ts\n  [TemplateCompiler]', function () {
  let ctx: TestContext;
  let sut: ITemplateCompiler;
  let container: IContainer;

  // eslint-disable-next-line mocha/no-hooks
  beforeEach(function () {
    ctx = TestContext.create();
    container = ctx.container;
    sut = ctx.templateCompiler;
    container.registerResolver<string>(CustomAttribute.keyFrom('foo'), { getFactory: () => ({ Type: { description: {} } }) } as any);
  });

  describe('compileElement()', function () {
    describe('with <slot/>', function () {
      it('set hasSlots to true <slot/>', function () {
        const definition = compileWith('<template><slot></slot></template>', []);
        assert.strictEqual(definition.hasSlots, true, `definition.hasSlots`);
      });

      it('recognizes slot in nested <template>', function () {
        const definition = compileWith('<template><template if.bind="true"><slot></slot></template></template>', []);
        assert.strictEqual(definition.hasSlots, true, `definition.hasSlots`);
      });

      it('does not discriminate slot name', function () {
        const definition = compileWith('<template><slot name="slot"></slot></template>', []);
        assert.strictEqual(definition.hasSlots, true, `definition.hasSlots`);
      });

      // <template> shouldn't be compiled
      it('does not recognize slot in <template> without template controller', function () {
        const definition = compileWith('<template><template ><slot></slot></template></template>', []);
        assert.strictEqual(definition.hasSlots, false, `definition.hasSlots`);
      });
    });

    describe('with nested <template> without template controller', function () {
      it('does not compile <template> without template controller', function () {
        const definition = compileWith(`<template><template>\${prop}</template></template>`, []);
        assert.deepStrictEqual(definition.instructions, [], `definition.instructions`);
      });
    });

    describe('with custom element', function () {

      describe('compiles surrogate', function () {

        it('compiles surrogate plain class attribute', function () {
          const { instructions, surrogates } = compileWith(
            `<template class="h-100"></template>`,
            []
          );
          verifyInstructions(instructions, []);
          verifyInstructions(
            surrogates,
            [{ toVerify: ['type', 'value'], type: HTT.setClassAttribute, value: 'h-100' }]
          );
        });

        it('compiles surrogate plain style attribute', function () {
          const { instructions, surrogates } = compileWith(
            `<template style="background: red"></template>`,
            []
          );
          verifyInstructions(instructions, []);
          verifyInstructions(
            surrogates,
            [{ toVerify: ['type', 'value'], type: HTT.setStyleAttribute, value: 'background: red' }]
          );
        });

        it('compiles surrogate with binding expression', function () {
          const { instructions, surrogates } = compileWith(
            `<template class.bind="base"></template>`,
            []
          );
          verifyInstructions(instructions, [], 'normal');
          verifyInstructions(
            surrogates,
            [{ toVerify: ['type', 'to'], type: TT.propertyBinding, to: 'class' }],
            'surrogate'
          );
        });

        it('compiles surrogate with interpolation expression', function () {
          const { instructions, surrogates } = compileWith(
            `<template class="h-100 \${base}"></template>`,
            []
          );
          verifyInstructions(instructions, [], 'normal');
          verifyInstructions(
            surrogates,
            [{ toVerify: ['type', 'to'], type: TT.interpolation, to: 'class' }],
            'surrogate'
          );
        });

        it('throws on attributes that require to be unique', function () {
          const attrs = ['id'];
          attrs.forEach(attr => {
            assert.throws(
              () => compileWith(`<template ${attr}="${attr}"></template>`, []),
              /(Attribute id is invalid on surrogate)|(AUR0702:id)/,
            );
          });
        });
      });

      it('understands attr precendence: custom attr > element prop', function () {
        @customElement('el')
        class El {
          @bindable() public prop1: string;
          @bindable() public prop2: string;
          @bindable() public prop3: string;
        }

        @customAttribute('prop3')
        class Prop {}

        const actual = compileWith(
          `<template>
            <el prop1.bind="p" prop2.bind="p" prop3.bind="t" prop3="t"></el>
          </template>`,
          [El, Prop]
        );
        assert.strictEqual(actual.instructions.length, 1, `actual.instructions.length`);
        assert.strictEqual(actual.instructions[0].length, 3, `actual.instructions[0].length`);
        const siblingInstructions = actual.instructions[0].slice(1);
        const expectedSiblingInstructions = [
          { toVerify: ['type', 'res', 'to'], type: TT.hydrateAttribute, res: CustomAttribute.getDefinition(Prop) },
          { toVerify: ['type', 'res', 'to'], type: TT.hydrateAttribute, res: CustomAttribute.getDefinition(Prop) }
        ];
        verifyInstructions(siblingInstructions, expectedSiblingInstructions);
        const rootInstructions = actual.instructions[0][0]['props'];
        const expectedRootInstructions = [
          { toVerify: ['type', 'res', 'to'], type: TT.propertyBinding, to: 'prop1' },
          { toVerify: ['type', 'res', 'to'], type: TT.propertyBinding, to: 'prop2' }
        ];
        verifyInstructions(rootInstructions, expectedRootInstructions);
      });

      it('distinguishs element properties / normal attributes', function () {
        @customElement('el')
        class El {

          @bindable()
          public name: string;
        }

        const actual = compileWith(
          `<template>
            <el name="name" name2="label"></el>
          </template>`,
          [El]
        );
        const rootInstructions = actual.instructions[0];
        const expectedRootInstructions = [
          { toVerify: ['type', 'res'], type: TT.hydrateElement, res: CustomElement.getDefinition(El) }
        ];
        verifyInstructions(rootInstructions, expectedRootInstructions);

        const expectedElInstructions = [
          { toVerify: ['type', 'to', 'value'], type: TT.setProperty, to: 'name', value: 'name' }
        ];
        verifyInstructions((rootInstructions[0] as HydrateElementInstruction).props, expectedElInstructions);
      });

      it('understands element property casing', function () {
        @customElement('el')
        class El {

          @bindable()
          public backgroundColor: string;
        }

        const actual = compileWith(
          `<template>
            <el background-color="label"></el>
          </template>`,
          [El]
        );
        const rootInstructions = actual.instructions[0];

        const expectedElInstructions = [
          { toVerify: ['type', 'value', 'to'], type: TT.setProperty, value: 'label', to: 'backgroundColor' },
        ];
        verifyInstructions((rootInstructions[0] as HydrateElementInstruction).props, expectedElInstructions);
      });

      it('understands binding commands', function () {
        @customElement('el')
        class El {
          @bindable({ mode: BindingMode.twoWay }) public propProp1: string;
          @bindable() public prop2: string;
          @bindable() public propProp3: string;
          @bindable() public prop4: string;
          @bindable() public propProp5: string;
        }
        const actual = compileWith(
          `<template>
            <el
              prop-prop1.bind="prop1"
              prop2.one-time="prop2"
              prop-prop3.to-view="prop3"
              prop4.from-view="prop4"
              prop-prop5.two-way="prop5"
              ></el>
          </template>`,
          [El]
        );
        const rootInstructions = actual.instructions[0];

        const expectedElInstructions = [
          { toVerify: ['type', 'mode', 'to'], mode: BindingMode.twoWay, to: 'propProp1' },
          { toVerify: ['type', 'mode', 'to'], mode: BindingMode.oneTime, to: 'prop2' },
          { toVerify: ['type', 'mode', 'to'], mode: BindingMode.toView, to: 'propProp3' },
          { toVerify: ['type', 'mode', 'to'], mode: BindingMode.fromView, to: 'prop4' },
          { toVerify: ['type', 'mode', 'to'], mode: BindingMode.twoWay, to: 'propProp5' },
        ].map((e: any) => {
          e.type = TT.propertyBinding;
          return e;
        });
        verifyInstructions((rootInstructions[0] as HydrateElementInstruction).props, expectedElInstructions);
      });

      describe('with template controller', function () {
        it('compiles', function () {
          @customAttribute({
            name: 'prop',
            isTemplateController: true
          })
          class Prop {
            public value: any;
          }
          const { template, instructions } = compileWith(
            `<template><el prop.bind="p"></el></template>`,
            [Prop]
          );
          assert.strictEqual((template as HTMLTemplateElement).outerHTML, '<template><au-m class="au"></au-m></template>', `(template as HTMLTemplateElement).outerHTML`);
          const [hydratePropAttrInstruction] = instructions[0] as unknown as [HydrateTemplateController];
          assert.strictEqual((hydratePropAttrInstruction.def.template as HTMLTemplateElement).outerHTML, '<template><el></el></template>', `(hydratePropAttrInstruction.def.template as HTMLTemplateElement).outerHTML`);
        });

        it('moves attrbiutes instructions before the template controller into it', function () {
          @customAttribute({
            name: 'prop',
            isTemplateController: true
          })
          class Prop {
            public value: any;
          }
          const { template, instructions } = compileWith(
            `<template><el name.bind="name" title.bind="title" prop.bind="p"></el></template>`,
            [Prop]
          );
          assert.strictEqual((template as HTMLTemplateElement).outerHTML, '<template><au-m class="au"></au-m></template>', `(template as HTMLTemplateElement).outerHTML`);
          const [hydratePropAttrInstruction] = instructions[0] as unknown as [HydrateTemplateController];
          verifyInstructions(hydratePropAttrInstruction.props, [
            { toVerify: ['type', 'to', 'from'],
              type: TT.propertyBinding, to: 'value', from: new AccessScopeExpression('p') }
          ]);
          verifyInstructions(hydratePropAttrInstruction.def.instructions[0], [
            { toVerify: ['type', 'to', 'from'],
              type: TT.propertyBinding, to: 'name', from: new AccessScopeExpression('name') },
            { toVerify: ['type', 'to', 'from'],
              type: TT.propertyBinding, to: 'title', from: new AccessScopeExpression('title') },
          ]);
        });

        describe('[as-element]', function () {
          it('understands [as-element]', function () {
            @customElement('not-div')
            class NotDiv {}
            const { instructions } = compileWith('<template><div as-element="not-div"></div></template>', [NotDiv]);
            verifyInstructions(instructions[0], [
              { toVerify: ['type', 'res'],
                type: TT.hydrateElement, res: CustomElement.getDefinition(NotDiv) }
            ]);
          });

          it('does not throw when element is not found', function () {
            const { instructions } = compileWith('<template><div as-element="not-div"></div></template>');
            assert.strictEqual(instructions.length, 0, `instructions.length`);
          });

          describe('with template controller', function () {
            it('compiles', function () {
              @customElement('not-div')
              class NotDiv {}
              const { instructions } = compileWith(
                '<template><div if.bind="value" as-element="not-div"></div></template>',
                [NotDiv]
              );

              verifyInstructions(instructions[0], [
                { toVerify: ['type', 'res', 'to'],
                  type: TT.hydrateTemplateController, res: container.find(CustomAttribute, 'if') }
              ]);
              const templateControllerInst = instructions[0][0] as HydrateTemplateController;
              verifyInstructions(templateControllerInst.props, [
                { toVerify: ['type', 'to', 'from'],
                  type: TT.propertyBinding, to: 'value', from: new AccessScopeExpression('value') }
              ]);
              const [hydrateNotDivInstruction] = templateControllerInst.def.instructions[0] as [HydrateElementInstruction];
              verifyInstructions([hydrateNotDivInstruction], [
                { toVerify: ['type', 'res'],
                  type: TT.hydrateElement, res: CustomElement.getDefinition(NotDiv) }
              ]);
              verifyInstructions(hydrateNotDivInstruction.props, []);
            });
          });
        });
      });

      describe('<let/> element', function () {

        it('compiles', function () {
          const { instructions } = compileWith(`<template><let></let></template>`);
          assert.strictEqual(instructions.length, 1, `instructions.length`);
        });

        it('does not generate instructions when there is no bindings', function () {
          const { instructions } = compileWith(`<template><let></let></template>`);
          assert.strictEqual((instructions[0][0] as HydrateLetElementInstruction).instructions.length, 0, `(instructions[0][0]).instructions.length`);
        });

        it('ignores custom element resource', function () {
          @customElement('let')
          class Let {}

          const { instructions } = compileWith(
            `<template><let></let></template>`,
            [Let]
          );
          verifyInstructions(instructions[0], [
            { toVerify: ['type'], type: TT.hydrateLetElement }
          ]);
        });

        it('compiles with attributes', function () {
          const { instructions } = compileWith(`<let a.bind="b" c="\${d}"></let>`);
          verifyInstructions((instructions[0][0] as HydrateLetElementInstruction).instructions, [
            { toVerify: ['type', 'to', 'srcOrExp'],
              type: TT.letBinding, to: 'a', from: 'b' },
            { toVerify: ['type', 'to'],
              type: TT.letBinding, to: 'c' }
          ]);
        });

        describe('[to-binding-context]', function () {
          it('understands [to-binding-context]', function () {
            const { instructions } = compileWith(`<template><let to-binding-context></let></template>`);
            assert.strictEqual((instructions[0][0] as HydrateLetElementInstruction).toBindingContext, true, `(instructions[0][0]).toBindingContext`);
          });

          it('ignores [to-binding-context] order', function () {
            let instructions = compileWith(`<template><let a.bind="a" to-binding-context></let></template>`).instructions[0];
            verifyInstructions(instructions, [
              { toVerify: ['type', 'toBindingContext'], type: TT.hydrateLetElement, toBindingContext: true }
            ]);
            instructions = compileWith(`<template><let to-binding-context a.bind="a"></let></template>`).instructions[0];
            verifyInstructions(instructions, [
              { toVerify: ['type', 'toBindingContext'], type: TT.hydrateLetElement, toBindingContext: true }
            ]);
          });
        });
      });
    });

    interface IExpectedInstruction {
      [prop: string]: any;
      toVerify: string[];
    }

    function compileWith(markup: string | Element, extraResources: any[] = []) {
      extraResources.forEach(e => container.register(e));
      const templateDefinition: PartialCustomElementDefinition = { template: markup, instructions: [], surrogates: [] } as unknown as PartialCustomElementDefinition;
      return sut.compile(templateDefinition, container, null);
    }

    function verifyInstructions(actual: readonly any[], expectation: IExpectedInstruction[], type?: string) {
      assert.strictEqual(actual.length, expectation.length, `Expected to have ${expectation.length} ${type ? type : ''} instructions. Received: ${actual.length}`);
      for (let i = 0, ii = actual.length; i < ii; ++i) {
        const actualInst = actual[i];
        const expectedInst = expectation[i];
        const ofType = type ? `of ${type}` : '';
        for (const prop of expectedInst.toVerify) {
          if (expectedInst[prop] instanceof Object) {
            assert.deepStrictEqual(
              actualInst[prop],
              expectedInst[prop],
              `Expected actual instruction ${ofType} to have "${prop}": ${expectedInst[prop]}. Received: ${actualInst[prop]} (on index: ${i})`
            );
          } else {
            assert.deepStrictEqual(
              actualInst[prop],
              expectedInst[prop],
              `Expected actual instruction ${ofType} to have "${prop}": ${expectedInst[prop]}. Received: ${actualInst[prop]} (on index: ${i})`
            );
          }
        }
      }
    }
  });
});

const elementInfoLookup = new WeakMap<CustomElementDefinition, Record<string, ElementInfo>>();

/**
 * Pre-processed information about a custom element resource, optimized
 * for consumption by the template compiler.
 */
class ElementInfo {
  /**
   * A lookup of the bindables of this element, indexed by the (pre-processed)
   * attribute names as they would be found in parsed markup.
   */
  public bindables: Record<string, BindableInfo | undefined> = Object.create(null);

  public constructor(
    public name: string,
    public alias: string | undefined,
    public containerless: boolean,
  ) {}

  public static from(def: CustomElementDefinition | null, alias: string): ElementInfo | null {
    if (def === null) {
      return null;
    }
    let rec = elementInfoLookup.get(def);
    if (rec === void 0) {
      elementInfoLookup.set(def, rec = Object.create(null) as Record<string, ElementInfo>);
    }
    let info = rec[alias];
    if (info === void 0) {
      info = rec[alias] = new ElementInfo(def.name, alias === def.name ? void 0 : alias, def.containerless);
      const bindables = def.bindables;
      const defaultBindingMode = BindingMode.toView;

      let bindable: BindableDefinition;
      let prop: string;
      let attr: string;
      let mode: BindingMode;

      for (prop in bindables) {
        bindable = bindables[prop];
        // explicitly provided property name has priority over the implicit property name
        if (bindable.property !== void 0) {
          prop = bindable.property;
        }
        // explicitly provided attribute name has priority over the derived implicit attribute name
        if (bindable.attribute !== void 0) {
          attr = bindable.attribute;
        } else {
          // derive the attribute name from the resolved property name
          attr = kebabCase(prop);
        }
        if (bindable.mode !== void 0 && bindable.mode !== BindingMode.default) {
          mode = bindable.mode;
        } else {
          mode = defaultBindingMode;
        }
        info.bindables[attr] = new BindableInfo(prop, mode);
      }
    }
    return info;
  }
}

const attrInfoLookup = new WeakMap<CustomAttributeDefinition, Record<string, AttrInfo>>();

/**
 * Pre-processed information about a custom attribute resource, optimized
 * for consumption by the template compiler.
 */
class AttrInfo {
  /**
   * A lookup of the bindables of this attribute, indexed by the (pre-processed)
   * bindable names as they would be found in the attribute value.
   *
   * Only applicable to multi attribute bindings (semicolon-separated).
   */
  public bindables: Record<string, BindableInfo | undefined> = Object.create(null);
  /**
   * The single or first bindable of this attribute, or a default 'value'
   * bindable if no bindables were defined on the attribute.
   *
   * Only applicable to single attribute bindings (where the attribute value
   * contains no semicolons)
   */
  public bindable: BindableInfo | null = null;

  public constructor(
    public name: string,
    public alias: string | undefined,
    public isTemplateController: boolean,
    public noMultiBindings: boolean,
  ) {}

  public static from(def: CustomAttributeDefinition | null, alias: string): AttrInfo | null {
    if (def === null) {
      return null;
    }
    let rec = attrInfoLookup.get(def);
    if (rec === void 0) {
      attrInfoLookup.set(def, rec = Object.create(null) as Record<string, AttrInfo>);
    }
    let info = rec[alias];
    if (info === void 0) {
      info = rec[alias] = new AttrInfo(def.name, alias === def.name ? void 0 : alias, def.isTemplateController, def.noMultiBindings);
      const bindables = def.bindables;
      const defaultBindingMode = def.defaultBindingMode !== void 0 && def.defaultBindingMode !== BindingMode.default
        ? def.defaultBindingMode
        : BindingMode.toView;

      let bindable: BindableDefinition;
      let prop: string;
      let mode: BindingMode;
      let hasPrimary: boolean = false;
      let isPrimary: boolean = false;
      let bindableInfo: BindableInfo;

      for (prop in bindables) {
        bindable = bindables[prop];
        // explicitly provided property name has priority over the implicit property name
        if (bindable.property !== void 0) {
          prop = bindable.property;
        }
        if (bindable.mode !== void 0 && bindable.mode !== BindingMode.default) {
          mode = bindable.mode;
        } else {
          mode = defaultBindingMode;
        }
        isPrimary = bindable.primary === true;
        bindableInfo = info.bindables[prop] = new BindableInfo(prop, mode);
        if (isPrimary) {
          if (hasPrimary) {
            throw new Error('primary already exists');
          }
          hasPrimary = true;
          info.bindable = bindableInfo;
        }
        // set to first bindable by convention
        if (info.bindable === null) {
          info.bindable = bindableInfo;
        }
      }
      // if no bindables are present, default to "value"
      if (info.bindable === null) {
        info.bindable = new BindableInfo('value', defaultBindingMode);
      }
    }
    return info;
  }
}

/**
 * A pre-processed piece of information about a defined bindable property on a custom
 * element or attribute, optimized for consumption by the template compiler.
 */
 class BindableInfo {
  public constructor(
    /**
     * The pre-processed *property* (not attribute) name of the bindable, which is
     * (in order of priority):
     *
     * 1. The `property` from the description (if defined)
     * 2. The name of the property of the bindable itself
     */
    public propName: string,
    /**
     * The pre-processed (default) bindingMode of the bindable, which is (in order of priority):
     *
     * 1. The `mode` from the bindable (if defined and not bindingMode.default)
     * 2. The `defaultBindingMode` (if it's an attribute, defined, and not bindingMode.default)
     * 3. `bindingMode.toView`
     */
    public mode: BindingMode,
  ) {}
}

function stringOrUnnamed(str: string | undefined): string {
  if (str === void 0) {
    return 'unnamed';
  }
  return str;
}

const defaultCustomElementDefinitionProperties = {
  name: 'unnamed',
  Type: class HTMLOnlyElement {},
  aliases: [],
  key: 'au:resource:custom-element:unnamed',
  cache: 0,
  dependencies: [],
  bindables: {},
  childrenObservers: {},
  containerless: false,
  injectable: null,
  isStrictBinding: false,
  hasSlots: false,
  shadowOptions: null,
  surrogates: [],
  watches: [],
};

function createTplCtrlAttributeInstruction(attr: string, value: string) {
  if (attr === 'repeat.for') {
    return [{
      type: TT.iteratorBinding,
      from: new ForOfStatement(
        new BindingIdentifier(value.split(' of ')[0]),
        new AccessScopeExpression(value.split(' of ')[1])),
      to: 'items'
    }];
  } else if (attr.includes('.')) {
    return [{
      type: TT.propertyBinding,
      from: value.length === 0 ? PrimitiveLiteralExpression.$empty : new AccessScopeExpression(value),
      to: 'value',
      mode: BindingMode.toView,
    }];
  } else {
    return [{
      type: TT.setProperty,
      to: 'value',
      value
    }];
  }
}

function createTemplateController(ctx: TestContext, resolveRes: boolean, attr: string, target: string, value: string, tagName: string, finalize: boolean, childInstr?, childTpl?): CTCResult {
  // multiple template controllers per element
  if (tagName == null) {
    const node = ctx.createElementFromMarkup(childTpl);
    const attributes = [];
    while (node.attributes.length) {
      attributes.unshift(node.attributes[0]);
      node.removeAttribute(node.attributes[0].name);
    }
    node.setAttribute(attr, value);
    while (attributes.length) {
      const attrib = attributes.pop();
      node.setAttribute(attrib.name, attrib.value);
    }
    node.setAttribute(attr, value);
    const rawMarkup = node.outerHTML;
    const instruction: Partial<HydrateTemplateController & { def: PartialCustomElementDefinition & { key: string } }> = {
      type: TT.hydrateTemplateController,
      res: resolveRes ? ctx.container.find(CustomAttribute, target)! : target,
      def: {
        ...defaultCustomElementDefinitionProperties,
        name: stringOrUnnamed(target),
        key: `au:resource:custom-element:${stringOrUnnamed(target)}`,
        template: ctx.createElementFromMarkup(`<template><au-m class="au"></au-m></template>`),
        instructions: [[childInstr]],
        needsCompile: false,
        enhance: false,
        processContent: null,
      },
      props: createTplCtrlAttributeInstruction(attr, value),
    };
    const input: PartialCustomElementDefinition = {
      template: finalize ? `<div>${rawMarkup}</div>` : rawMarkup,
      instructions: []
    } as unknown as PartialCustomElementDefinition;
    const output: PartialCustomElementDefinition = {
      ...defaultCustomElementDefinitionProperties,
      template: ctx.createElementFromMarkup(`<template><div><au-m class="au"></au-m></div></template>`),
      instructions: [[instruction]],
      needsCompile: false,
      enhance: false,
      processContent: null,
    } as unknown as PartialCustomElementDefinition;
    return [input, output];
  } else {
    let compiledMarkup;
    let instructions;
    if (childInstr === undefined) {
      compiledMarkup = `<${tagName}></${tagName}>`;
      instructions = [];
    } else {
      compiledMarkup = `<${tagName}><au-m class="au"></au-m></${tagName}>`;
      instructions = [[childInstr]];
    }
    const instruction: Partial<HydrateTemplateController & { def: PartialCustomElementDefinition & { key: string } }> = {
      type: TT.hydrateTemplateController,
      res: resolveRes ? ctx.container.find(CustomAttribute, target)! : target,
      def: {
        ...defaultCustomElementDefinitionProperties,
        name: stringOrUnnamed(target),
        key: `au:resource:custom-element:${stringOrUnnamed(target)}`,
        template: ctx.createElementFromMarkup(tagName === 'template' ? compiledMarkup : `<template>${compiledMarkup}</template>`),
        instructions,
        needsCompile: false,
        enhance: false,
        processContent: null,
      },
      props: createTplCtrlAttributeInstruction(attr, value),
    };
    const rawMarkup = `<${tagName} ${attr}="${value || ''}">${childTpl || ''}</${tagName}>`;
    const input: PartialCustomElementDefinition = {
      template: finalize ? `<div>${rawMarkup}</div>` : rawMarkup,
      instructions: []
    } as unknown as PartialCustomElementDefinition;
    const output: PartialCustomElementDefinition = {
      ...defaultCustomElementDefinitionProperties,
      template: ctx.createElementFromMarkup(finalize ? `<template><div><au-m class="au"></au-m></div></template>` : `<au-m class="au"></au-m>`),
      instructions: [[instruction]],
      needsCompile: false,
      enhance: false,
      processContent: null,
    } as unknown as PartialCustomElementDefinition;
    return [input, output];
  }
}

function createCustomElement(
  ctx: TestContext,
  tagNameOrDef: string | CustomElementDefinition,
  finalize: boolean,
  attributes: readonly [string, string][],
  childInstructions: readonly any[],
  siblingInstructions: readonly any[],
  nestedElInstructions: readonly any[],
  childOutput?,
  childInput?,
  debugMode?: boolean
): [PartialCustomElementDefinition, PartialCustomElementDefinition] {
  const instruction: Partial<HydrateElementInstruction> = {
    type: TT.hydrateElement,
    res: tagNameOrDef,
    props: childInstructions as IInstruction[],
    auSlot: null,
    containerless: false,
    projections: null,
  };
  const def = typeof tagNameOrDef === 'string'
    ? ctx.container.find(CustomElement, tagNameOrDef)
    : tagNameOrDef;
  const exprParser = ctx.container.get(IExpressionParser);
  const attrParser = ctx.container.get(IAttributeParser);
  const attributeMarkup = attributes.map(a => `${a[0]}="${a[1]}"`).join(' ');
  const rawMarkup = `<${def.name} ${attributeMarkup}>${(childInput && childInput.template) || ''}</${def.name}>`;
  const input = {
    name: 'unnamed',
    template: finalize ? `<div>${rawMarkup}</div>` : rawMarkup,
    instructions: []
  };
  const outputAttributeMarkup = debugMode
    ? attributes
      .map(a => `${a[0]}="${a[1]}"`)
      .join(' ')
    : attributes
      .filter((a) => {
        const syntax = attrParser.parse(a[0], a[1]);
        // if not with a binding command,
        const canStay = syntax.command === null
          // nor a custom attribute,
          && !ctx.container.find(CustomAttribute, syntax.target)
          // nor with interpolation
          && exprParser.parse(a[1], BindingType.Interpolation) === null
          // nor a bindable
          && !(BindablesInfo.from(def, false).attrs[a[0]]);
        // then can stay in the template
        return canStay;
      })
      .map(a => `${a[0]}="${a[1]}"`)
      .join(' ');
  const outputMarkup = ctx.createElementFromMarkup(`<${def.name} ${outputAttributeMarkup}>${(childOutput && childOutput.template.outerHTML) || ''}</${def.name}>`);
  outputMarkup.classList.add('au');
  const output = {
    ...defaultCustomElementDefinitionProperties,
    name: 'unnamed',
    key: 'au:resource:custom-element:unnamed',
    template: finalize ? ctx.createElementFromMarkup(`<template><div>${outputMarkup.outerHTML}</div></template>`) : outputMarkup,
    instructions: [[instruction, ...siblingInstructions], ...nestedElInstructions],
    needsCompile: false,
    enhance: false,
    watches: [],
    processContent: null,
  };
  return [input, output];
}

function createCustomAttribute(
  ctx: TestContext,
  attrNameOrDef: string | CustomAttributeDefinition,
  finalize: boolean,
  attributes: readonly [string, string][],
  childInstructions: readonly any[],
  siblingInstructions: readonly any[],
  nestedElInstructions: readonly any[],
  childOutput?,
  childInput?,
): [PartialCustomAttributeDefinition, PartialCustomAttributeDefinition] {
  const resName = typeof attrNameOrDef === 'string' ? attrNameOrDef : attrNameOrDef.name;
  const instruction: Partial<HydrateAttributeInstruction> | Partial<HydrateTemplateController> = {
    type: TT.hydrateAttribute,
    res: attrNameOrDef,
    props: childInstructions as any[]
  };
  const attributeMarkup = attributes.map(a => `${a[0]}: ${a[1]};`).join('');
  const rawMarkup = `<div ${resName}="${attributeMarkup}">${(childInput && childInput.template) || ''}</div>`;
  const input = {
    name: 'unnamed',
    template: finalize ? `<div>${rawMarkup}</div>` : rawMarkup,
    instructions: []
  };
  // old behavior: keep attribute on the output template as is
  // const outputMarkup = ctx.createElementFromMarkup(`<div ${resName}="${attributeMarkup}">${(childOutput && childOutput.template.outerHTML) || ''}</div>`);

  // new behavior: if it's custom attribute, remove
  const outputMarkup = ctx.createElementFromMarkup(`<div>${(childOutput && childOutput.template.outerHTML) || ''}</div>`);
  outputMarkup.classList.add('au');
  const output = {
    ...defaultCustomElementDefinitionProperties,
    name: 'unnamed',
    key: 'au:resource:custom-element:unnamed',
    template: finalize ? ctx.createElementFromMarkup(`<template><div>${outputMarkup.outerHTML}</div></template>`) : outputMarkup,
    instructions: [[instruction, ...siblingInstructions], ...nestedElInstructions],
    needsCompile: false,
    enhance: false,
    watches: [],
    processContent: null,
  };
  return [input, output];
}

const commandToMode = {
  'one-time': BindingMode.oneTime,
  'to-view': BindingMode.toView,
  'from-view': BindingMode.fromView,
  'two-way': BindingMode.twoWay
};

const validCommands = ['bind', 'one-time', 'to-view', 'from-view', 'two-way', 'trigger', 'delegate', 'capture', 'call'];

function createAttributeInstruction(bindableDescription: BindableDefinition | null, attributeName: string, attributeValue: string, isMulti: boolean) {
  const parts = attributeName.split('.');
  const attr = parts[0];
  const cmd = parts.pop();
  const defaultMode = !!bindableDescription ? (bindableDescription.mode === BindingMode.default ? BindingMode.toView : bindableDescription.mode) : BindingMode.toView;
  const mode = commandToMode[cmd] || defaultMode;

  if (!!bindableDescription) {
    if (!!cmd && validCommands.includes(cmd)) {
      const type = TT.propertyBinding;
      const to = bindableDescription.property;
      const from = parseExpression(attributeValue);
      return { type, to, mode, from };
    } else {
      const from = parseExpression(attributeValue, BindingType.Interpolation);
      if (!!from) {
        const type = TT.interpolation;
        const to = bindableDescription.property;
        return { type, to, from };
      } else {
        const type = TT.setProperty;
        const to = bindableDescription.property;
        const value = attributeValue;
        return { type, to, value };
      }
    }
  } else {
    const type = TT.propertyBinding;
    const to = camelCase(attr);
    if (!!cmd && validCommands.includes(cmd)) {
      const from = parseExpression(attributeValue);
      return { type, to, mode, from };
    } else {
      const from = parseExpression(attributeValue, BindingType.Interpolation);
      if (!!from) {
        const type2 = TT.interpolation;
        return { type: type2, to, from };
      } else if (isMulti) {
        const type3 = TT.setProperty;
        const to3 = attr;
        const value = attributeValue;
        return { type: type3, to: to3, value };
      } else {
        return null;
      }
    }
  }
}

type CTCResult = [PartialCustomElementDefinition, PartialCustomElementDefinition];

type Bindables = { [pdName: string]: BindableDefinition };

describe(`TemplateCompiler - combinations`, function () {
  function createFixture(ctx: TestContext, ...globals: any[]) {
    const container = ctx.container;
    container.register(...globals);
    const sut = ctx.templateCompiler;
    return { container, sut };
  }

  describe('plain attributes', function () {
    eachCartesianJoinFactory([
      [
        TestContext.create
      ],
      [
        (ctx) => ['div']
      ] as ((ctx: TestContext) => [string])[],
      [
        (ctx) => ['foo', 'foo', 'bar'],
        (ctx) => ['foo.bar', 'foo', 'bar'],
        (ctx) => ['foo.bind', 'foo', 'bar'],
        (ctx) => ['value', 'value', 'value']
      ] as ((ctx: TestContext, $1: [string]) => [string, string, string])[],
      [
        (ctx, $1, [, , value]) => [`ref`,                     value, { type: TT.refBinding,       from: new AccessScopeExpression(value), to: 'element' }],
        (ctx, $1, [attr, to, value]) => [`${attr}.bind`,      value, { type: TT.propertyBinding,  from: new AccessScopeExpression(value), to, mode: BindingMode.toView,   }],
        (ctx, $1, [attr, to, value]) => [`${attr}.to-view`,   value, { type: TT.propertyBinding,  from: new AccessScopeExpression(value), to, mode: BindingMode.toView,   }],
        (ctx, $1, [attr, to, value]) => [`${attr}.one-time`,  value, { type: TT.propertyBinding,  from: new AccessScopeExpression(value), to, mode: BindingMode.oneTime,  }],
        (ctx, $1, [attr, to, value]) => [`${attr}.from-view`, value, { type: TT.propertyBinding,  from: new AccessScopeExpression(value), to, mode: BindingMode.fromView, }],
        (ctx, $1, [attr, to, value]) => [`${attr}.two-way`,   value, { type: TT.propertyBinding,  from: new AccessScopeExpression(value), to, mode: BindingMode.twoWay,   }],
        (ctx, $1, [attr, to, value]) => [`${attr}.trigger`,   value, { type: HTT.listenerBinding, from: new AccessScopeExpression(value), to, strategy: DelegationStrategy.none,      preventDefault: true }],
        (ctx, $1, [attr, to, value]) => [`${attr}.delegate`,  value, { type: HTT.listenerBinding, from: new AccessScopeExpression(value), to, strategy: DelegationStrategy.bubbling,  preventDefault: false }],
        (ctx, $1, [attr, to, value]) => [`${attr}.capture`,   value, { type: HTT.listenerBinding, from: new AccessScopeExpression(value), to, strategy: DelegationStrategy.capturing, preventDefault: false }],
        (ctx, $1, [attr, to, value]) => [`${attr}.call`,      value, { type: TT.callBinding,      from: new AccessScopeExpression(value), to }]
      ] as ((ctx: TestContext, $1: [string], $2: [string, string, string]) => [string, string, any])[]
    ],                       (ctx, [el], $2, [n1, v1, i1]) => {
      const markup = `<${el} plain data-attr="value" ${n1}="${v1}"></${el}>`;

      for (const debugMode of [true, false]) {
        it(`[Debug: ${debugMode}] ${markup} + [class] attribute`, function () {
          const markup = `<${el} plain data-attr="value" class="abc" ${n1}="${v1}"></${el}>`;
          const input: PartialCustomElementDefinition = {
            template: markup,
            instructions: [],
            surrogates: [],
          } as unknown as PartialCustomElementDefinition;
          const expected = {
            ...defaultCustomElementDefinitionProperties,
            template: ctx.createElementFromMarkup(`<template><${el} plain data-attr="value" class="abc au" ${debugMode ? `${n1}="${v1}" ` : ''}></${el}></template>`),
            instructions: [[i1]],
            surrogates: [],
            needsCompile: false,
            enhance: false,
            processContent: null,
          };

          const { sut, container } = createFixture(ctx);
          sut.debug = debugMode;

          const actual = sut.compile(input, container, null);

          verifyBindingInstructionsEqual(actual, expected);
        });

        it(`[Debug: ${debugMode}] ${markup}`, function () {
          const markup = `<${el} plain data-attr="value" ${n1}="${v1}"></${el}>`;
          const input: PartialCustomElementDefinition = {
            template: markup,
            instructions: [],
            surrogates: [],
          } as unknown as PartialCustomElementDefinition;
          const expected = {
            ...defaultCustomElementDefinitionProperties,
            template: ctx.createElementFromMarkup(`<template><${el} plain data-attr="value" ${debugMode ? `${n1}="${v1}" ` : ''}class="au"></${el}></template>`),
            instructions: [[i1]],
            surrogates: [],
            needsCompile: false,
            enhance: false,
            processContent: null,
          };

          const { sut, container } = createFixture(ctx);
          sut.debug = debugMode;

          const actual = sut.compile(input, container, null);

          verifyBindingInstructionsEqual(actual, expected);
        });
      }
    });

    for (const debugMode of [true, false]) {
      it(`[Debug: ${debugMode}] [class] attribute + \${interpolation}`, function () {
        const ctx = TestContext.create();
        const markup = `<span plain data-attr="value" class="abc-\${value}"></span>`;
        const input: PartialCustomElementDefinition = {
          template: markup,
          instructions: [],
          surrogates: [],
        } as unknown as PartialCustomElementDefinition;
        const expected = {
          ...defaultCustomElementDefinitionProperties,
          template: ctx.createElementFromMarkup(
            `<template><span plain data-attr="value" class="${debugMode ? `abc-\${value} ` : ''}au"></span></template>`
          ),
          instructions: [[
            {
              "from": {
                "parts": ["abc-",""],
                "expressions": [
                  {"name":"value","ancestor":0}
                ],
                "isMulti": false,
                "firstExpression": {"name":"value","ancestor":0}
              },
              "to":"class"
            }
          ]],
          surrogates: [],
          needsCompile: false,
          enhance: false,
          processContent: null,
        };

        const { sut, container } = createFixture(ctx);
        sut.debug = debugMode;

        const actual = sut.compile(input, container, null);

        verifyBindingInstructionsEqual(actual, expected);
      });
    }
  });

  describe('custom attributes', function () {
    eachCartesianJoinFactory([
      [
        TestContext.create
      ],
      // PartialCustomAttributeDefinition.bindables
      [
        (ctx) => [undefined, undefined, 'value'],
        (ctx) => [{}, undefined,  'value'] as any,
        (ctx) => [BindableDefinition.create('asdf', { attribute: 'bazBaz', property: 'bazBaz', mode: BindingMode.oneTime }), BindingMode.oneTime, 'bazBaz'],
        (ctx) => [BindableDefinition.create('asdf', { attribute: 'bazBaz', property: 'bazBaz', mode: BindingMode.fromView }), BindingMode.fromView, 'bazBaz'],
        (ctx) => [BindableDefinition.create('asdf', { attribute: 'bazBaz', property: 'bazBaz', mode: BindingMode.twoWay }), BindingMode.twoWay, 'bazBaz'],
        (ctx) => [BindableDefinition.create('asdf', { attribute: 'bazBaz', property: 'bazBaz', mode: BindingMode.default }), BindingMode.default, 'bazBaz']
      ] as ((ctx: TestContext) => [Record<string, BindableDefinition> | undefined, BindingMode | undefined, string])[],
      [
        (ctx) => ['foo',     '', class Foo1 {}],
        (ctx) => ['foo-foo', '', class FooFoo {}],
        (ctx) => ['foo',     'bar', class Foo2 {}],
        (ctx) => ['foo-foo', 'bar', class Foo3 {}]
      ] as ((ctx: TestContext) => [string, string, Constructable])[],
      // PartialCustomAttributeDefinition.defaultBindingMode
      [
        (ctx) => undefined,
        (ctx) => BindingMode.oneTime,
        (ctx) => BindingMode.toView,
        (ctx) => BindingMode.fromView,
        (ctx) => BindingMode.twoWay
      ] as ((ctx: TestContext) => BindingMode | undefined)[],
      [
        (ctx, [, , to], [attr, value]) => [`${attr}`,           { type: TT.setProperty, to, value }],
        (ctx, [, mode, to], [attr, value], defaultMode) => [`${attr}.bind`,      { type: TT.propertyBinding, from: value.length > 0 ? new AccessScopeExpression(value) : new PrimitiveLiteralExpression(value), to, mode: (mode && mode !== BindingMode.default) ? mode : (defaultMode || BindingMode.toView) }],
        (ctx, [, , to],      [attr, value]) => [`${attr}.to-view`,   { type: TT.propertyBinding, from: value.length > 0 ? new AccessScopeExpression(value) : new PrimitiveLiteralExpression(value), to, mode: BindingMode.toView }],
        (ctx, [, , to],      [attr, value]) => [`${attr}.one-time`,  { type: TT.propertyBinding, from: value.length > 0 ? new AccessScopeExpression(value) : new PrimitiveLiteralExpression(value), to, mode: BindingMode.oneTime }],
        (ctx, [, , to],      [attr, value]) => [`${attr}.from-view`, { type: TT.propertyBinding, from: value.length > 0 ? new AccessScopeExpression(value) : new PrimitiveLiteralExpression(value), to, mode: BindingMode.fromView }],
        (ctx, [, , to],      [attr, value]) => [`${attr}.two-way`,   { type: TT.propertyBinding, from: value.length > 0 ? new AccessScopeExpression(value) : new PrimitiveLiteralExpression(value), to, mode: BindingMode.twoWay }]
      ] as ((ctx: TestContext, $1: [Record<string, BindableDefinition>, BindingMode, string], $2: [string, string, Constructable], $3: BindingMode) => [string, any])[]
    ],                       (ctx, [bindables], [attr, value, ctor], defaultBindingMode, [name, childInstruction]) => {
      for (const resolveResources of [true, false]) {
        const def = { name: attr, defaultBindingMode, bindables };
        const $def = CustomAttribute.define(def, ctor);
        const markup = `<div ${name}="${value}"></div>`;
        const title = `${markup} [Resolve res: ${resolveResources}] CustomAttribute=${JSON.stringify(def)}`;

        it(title, function () {
          const input: PartialCustomElementDefinition = {
            template: markup,
            instructions: [],
            surrogates: [],
          } as unknown as PartialCustomElementDefinition;
          const instruction: Partial<HydrateAttributeInstruction> = {
            type: TT.hydrateAttribute,
            res: resolveResources ? CustomAttribute.getDefinition($def) : attr,
            props: [childInstruction],
          };
          const expected = {
            ...defaultCustomElementDefinitionProperties,
            // old behavior:
            // template: ctx.createElementFromMarkup(`<template><div ${name}="${value}" class="au"></div></template>`),
            // new behavior
            // todo: ability to configure whether attr should be removed
            template: ctx.createElementFromMarkup(`<template><div class="au"></div></template>`),
            instructions: [[instruction]],
            surrogates: [],
            needsCompile: false,
            enhance: false,
            watches: [],
            processContent: null,
          };

          const { sut, container } = createFixture(ctx, $def);
          sut.resolveResources = resolveResources;

          const actual = sut.compile(input, container, null);

          verifyBindingInstructionsEqual(actual, expected);
        });
      }
    });
  });

  describe('custom attributes with multiple bindings', function () {
    eachCartesianJoinFactory([
      [
        TestContext.create
      ],
      [
        (ctx) => 'foo',
        (ctx) => 'bar42'
      ] as ((ctx: TestContext) => string)[],
      [
        (ctx, pdName) => pdName,
        (ctx, pdName) => `${pdName}Bar` // descriptor.property is different from the actual property name
      ] as ((ctx: TestContext, $1: string) => string)[],
      [
        (ctx, pdName, pdProp) => ({ [pdName]: BindableDefinition.create(pdName, { property: pdProp, attribute: kebabCase(pdProp), mode: BindingMode.default  }) }),
        (ctx, pdName, pdProp) => ({ [pdName]: BindableDefinition.create(pdName, { property: pdProp, attribute: kebabCase(pdProp), mode: BindingMode.oneTime  }) }),
        (ctx, pdName, pdProp) => ({ [pdName]: BindableDefinition.create(pdName, { property: pdProp, attribute: kebabCase(pdProp), mode: BindingMode.toView   }) }),
        (ctx, pdName, pdProp) => ({ [pdName]: BindableDefinition.create(pdName, { property: pdProp, attribute: kebabCase(pdProp), mode: BindingMode.fromView }) }),
        (ctx, pdName, pdProp) => ({ [pdName]: BindableDefinition.create(pdName, { property: pdProp, attribute: kebabCase(pdProp), mode: BindingMode.twoWay   }) })
      ] as ((ctx: TestContext, $1: string, $2: string) => Bindables)[],
      [
        (ctx) => [``,           `''`],
        (ctx) => [``,           `\${a}`],
        (ctx) => [`.bind`,      `''`],
        (ctx) => [`.one-time`,  `''`],
        (ctx) => [`.to-view`,   `''`],
        (ctx) => [`.from-view`, `''`],
        (ctx) => [`.two-way`,   `''`]
      ] as ((ctx: TestContext) => [string, string])[],
      [
        (ctx, pdName, pdProp, bindables, [cmd]) => [bindables[pdName], `${pdProp}${cmd}`],
        (ctx, pdName, pdProp, bindables, [cmd]) => [bindables[pdName], `${pdProp}.qux${cmd}`],
        (ctx, pdName, pdProp, bindables, [cmd]) => [null,              `${pdProp}Qux${cmd}`]
        // TODO: test fallback to attribute name when no matching binding exists (or throw if we don't want to support this)
      ] as ((ctx: TestContext, $1: string, $2: string, $3: Bindables, $4: [string, string]) => [BindableDefinition, string])[]
    ],                       (ctx, pdName, pdProp, bindables, [cmd, attrValue], [bindableDescription, attrName]) => {
      for (const resolveResources of [true, false]) {
        const title = `[Resolve res: ${resolveResources}] div - pdName=${pdName}  pdProp=${pdProp}  cmd=${cmd}  attrName=${attrName}  attrValue="${attrValue}"`;

        it(title, function () {
          const FooBar = CustomAttribute.define({ name: 'asdf', bindables }, class FooBar {});
          const FooBarDef = CustomAttribute.getDefinition(FooBar);
          const { sut, container } = createFixture(
            ctx,
            FooBar
          );
          sut.resolveResources = resolveResources;

          const instruction = createAttributeInstruction(bindableDescription, attrName, attrValue, true);

          // IMPORTANT:
          // ====================================
          // before template compiler refactoring:
          // const [input, output] = createCustomAttribute(ctx, 'asdf', true, [[attrName, attrValue]], [instruction], [], []) as [PartialCustomElementDefinition, PartialCustomElementDefinition];

          // after template compiler refactoring:
          // reason: custom attribute should look & behave like style attribute
          // we do: style="background-color: red" instead of style="backgroundColor: red"
          //
          // if for some reasons, this reasoning causes a lot of unintuitiveness in the template
          // then consider reverting it
          const [input, output] = createCustomAttribute(
            ctx,
            resolveResources ? FooBarDef : 'asdf',
            true,
            [[kebabCase(attrName), attrValue]],
            [instruction],
            [],
            []
          ) as [PartialCustomElementDefinition, PartialCustomElementDefinition];
          const bindablesInfo = BindablesInfo.from(CustomAttribute.getDefinition(FooBar), true);

          if (!bindablesInfo.attrs[kebabCase(attrName)]) {
            assert.throws(() => sut.compile(input, container, null), `Bindable ${attrName} not found on asdf.`);
          } else {
            // enableTracing();
            // Tracer.enableLiveLogging(SymbolTraceWriter);
            const actual = sut.compile(input, container, null);
            // console.log('\n'+stringifyTemplateDefinition(actual, 0));
            // disableTracing();
            try {
              verifyBindingInstructionsEqual(actual, output);
            } catch (err) {
              // console.log('EXPECTED: ', JSON.stringify(output.instructions[0][0], null, 2));
              // console.log('ACTUAL: ', JSON.stringify(actual.instructions[0][0], null, 2));
              throw err;
            }
          }
        });
      }
    });
  });

  describe('nested template controllers (one per element)', function () {
    const Foo = CustomAttribute.define({ name: 'foo', isTemplateController: true }, class Foo {});
    const Bar = CustomAttribute.define({ name: 'bar', isTemplateController: true }, class Bar {});
    const Baz = CustomAttribute.define({ name: 'baz', isTemplateController: true }, class Baz {});
    const Qux = CustomAttribute.define({ name: 'qux', isTemplateController: true }, class Qux {});

    eachCartesianJoinFactory([
      [
        () => {
          const ctx = TestContext.create();
          ctx.container.register(Foo, Bar, Baz, Qux);
          return ctx;
        }
      ],
      [() => true, () => false],
      [
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    '',              'div',      false),
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    'bar',           'div',      false),
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'if.bind',    'if',     'show',          'div',      false),
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'if.bind',    'if',     'show',          'template', false),
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'div',      false),
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'template', false)
      ] as ((ctx: TestContext) => CTCResult)[],
      [
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    '',              'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    'bar',           'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'if.bind',    'if',     'show',          'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'else',       'else',   '',              'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'else',       'else',   '',              'template', false, output.instructions[0][0], input.template),
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'with.bind',  'with',   'foo',           'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'with.bind',  'with',   'foo',           'template', false, output.instructions[0][0], input.template)
      ] as ((ctx: TestContext, resolveRes: boolean, $1: CTCResult) => CTCResult)[],
      [
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    '',              'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    'bar',           'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    'bar',           'template', false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'template', false, output.instructions[0][0], input.template)
      ] as ((ctx: TestContext, resolveRes: boolean, $1: CTCResult, $2: CTCResult) => CTCResult)[],
      [
        (ctx, resolveRes, $1, $2, [input, output]) => createTemplateController(ctx, resolveRes, 'bar',        'bar',    '',              'div',      true, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, $2, [input, output]) => createTemplateController(ctx, resolveRes, 'bar',        'bar',    'baz',           'div',      true, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, $2, [input, output]) => createTemplateController(ctx, resolveRes, 'bar',        'bar',    'baz',           'template', true, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, $2, [input, output]) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'div',      true, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, $2, [input, output]) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'template', true, output.instructions[0][0], input.template)
      ] as ((ctx: TestContext, resolveRes: boolean, $1: CTCResult, $2: CTCResult, $3: CTCResult) => CTCResult)[]
    ],                       (ctx, resolveRes, $1, $2, $3, [input, output]) => {

      it(`[Resolve res: ${resolveRes}] ${input.template}`, function () {

        const { sut, container } = createFixture(
          ctx,
          CustomAttribute.define({ name: 'foo', isTemplateController: true }, class Foo {}),
          CustomAttribute.define({ name: 'bar', isTemplateController: true }, class Bar {}),
          CustomAttribute.define({ name: 'baz', isTemplateController: true }, class Baz {}),
          CustomAttribute.define({ name: 'qux', isTemplateController: true }, class Qux {})
        );
        sut.resolveResources = resolveRes;

        const actual = sut.compile(input, container, null);
        try {
          verifyBindingInstructionsEqual(actual, output);
        } catch (err) {
          // console.log('EXPECTED: ', JSON.stringify(output.instructions[0][0], null, 2));
          // console.log('ACTUAL: ', JSON.stringify(actual.instructions[0][0], null, 2));
          throw err;
        }
      });
    });
  });

  describe('nested template controllers (multiple per element)', function () {
    const Foo = CustomAttribute.define({ name: 'foo',  isTemplateController: true }, class Foo {});
    const Bar = CustomAttribute.define({ name: 'bar',  isTemplateController: true }, class Bar {});
    const Baz = CustomAttribute.define({ name: 'baz',  isTemplateController: true }, class Baz {});
    const Qux = CustomAttribute.define({ name: 'qux',  isTemplateController: true }, class Qux {});
    const Quux = CustomAttribute.define({ name: 'quux', isTemplateController: true }, class Quux {});
    eachCartesianJoinFactory([
      [
        () => {
          const ctx = TestContext.create();
          ctx.container.register(Foo, Bar, Baz, Qux, Quux);
          return ctx;
        }
      ],
      [() => true, () => false],
      [
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    '',              'div',      false),
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    'bar',           'div',      false),
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'if.bind',    'if',     'show',          'div',      false),
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'if.bind',    'if',     'show',          'template', false),
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'div',      false),
        (ctx, resolveRes) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'template', false)
      ] as ((ctx: TestContext, resolveRes: boolean) => CTCResult)[],
      [
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'bar',        'bar',    '',              null,       false, output.instructions[0][0], input.template),
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'else',       'else',   '',              null,       false, output.instructions[0][0], input.template),
        (ctx, resolveRes, [input, output]) => createTemplateController(ctx, resolveRes, 'with.bind',  'with',   'foo',           null,       false, output.instructions[0][0], input.template)
      ] as ((ctx: TestContext, resolveRes: boolean, $1: CTCResult) => CTCResult)[],
      [
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    '',              'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    'bar',           'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'foo',        'foo',    'bar',           'template', false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'baz',        'baz',    '',              null,       false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, [input, output]) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'template', false, output.instructions[0][0], input.template)
      ] as ((ctx: TestContext, resolveRes: boolean, $1: CTCResult, $2: CTCResult) => CTCResult)[],
      [
        (ctx, resolveRes, $1, $2, [input, output]) => createTemplateController(ctx, resolveRes, 'qux',        'qux',    '',              null,       false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, $2, [input, output]) => createTemplateController(ctx, resolveRes, 'if.bind',    'if',     '',              'template', false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, $2, [input, output]) => createTemplateController(ctx, resolveRes, 'if.bind',    'if',     '',              'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, $2, [input, output]) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'div',      false, output.instructions[0][0], input.template),
        (ctx, resolveRes, $1, $2, [input, output]) => createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'template', false, output.instructions[0][0], input.template)
      ] as ((ctx: TestContext, resolveRes: boolean, $1: CTCResult, $2: CTCResult, $3: CTCResult) => CTCResult)[],
      [
        (ctx, resolveRes, $1, $2, $3, [input, output]) => createTemplateController(ctx, resolveRes, 'quux',       'quux',   '',              null,       true, output.instructions[0][0], input.template)
      ] as ((ctx: TestContext, resolveRes: boolean, $1: CTCResult, $2: CTCResult, $3: CTCResult, $4: CTCResult) => CTCResult)[]
    ],
    (ctx, resolveRes, $1, $2, $3, $4, [input, output]) => {
      it(`[Resolve res: ${resolveRes}] ${input.template}`, function () {
        const { sut, container } = createFixture(ctx);
        sut.resolveResources = resolveRes;
        const actual = sut.compile(input, container, null);

        try {
          verifyBindingInstructionsEqual(actual, output);
        } catch (err) {
          // console.log('EXPECTED: ', JSON.stringify(output.instructions[0][0], null, 2));
          // console.log('ACTUAL: ', JSON.stringify(actual.instructions[0][0], null, 2));
          throw err;
        }
      });
    });
  });

  describe('sibling template controllers', function () {
    const Foo = CustomAttribute.define({ name: 'foo', isTemplateController: true }, class Foo {});
    const Bar = CustomAttribute.define({ name: 'bar', isTemplateController: true }, class Bar {});
    const Baz = CustomAttribute.define({ name: 'baz', isTemplateController: true }, class Baz {});

    eachCartesianJoinFactory([
      [
        () => {
          const ctx = TestContext.create();
          ctx.container.register(Foo, Bar, Baz);
          return ctx;
        }
      ],
      [() => true, () => false],
      [
        (ctx, resolveRes) => []
      ] as ((ctx: TestContext) => CTCResult[])[],
      [
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'foo',        'foo',    '',              'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'foo',        'foo',    '',              'template', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'foo',        'foo',    'bar',           'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'if.bind',    'if',     'show',          'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'div', false)); },
      ] as ((ctx: TestContext, resolveResources: boolean, results: CTCResult[]) => void)[],
      [
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'foo',        'foo',    '',              'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'foo',        'foo',    'bar',           'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'if.bind',    'if',     'show',          'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'if.bind',    'if',     'show',          'template', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'else',       'else',   '',              'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'template', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'with.bind',  'with',   'bar',           'div', false)); }
      ] as ((ctx: TestContext, resolveResources: boolean, results: CTCResult[]) => void)[],
      [
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'foo',        'foo',    '',              'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'foo',        'foo',    'bar',           'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'div', false)); },
        (ctx, resolveRes, results: CTCResult[]) => { results.push(createTemplateController(ctx, resolveRes, 'repeat.for', 'repeat', 'item of items', 'template', false)); }
      ] as ((ctx: TestContext, resolveResources: boolean, results: CTCResult[]) => void)[]
    ],                       (ctx, resolveRes, [[input1, output1], [input2, output2], [input3, output3]]) => {
      const input: PartialCustomElementDefinition = {
        template: `<div>${input1.template}${input2.template}${input3.template}</div>`,
        instructions: []
      } as unknown as PartialCustomElementDefinition;

      it(`[Resolve res: ${resolveRes}] ${input.template}`, function () {

        const { sut, container } = createFixture(
          ctx,
        );
        sut.resolveResources = resolveRes;

        const output = {
          ...defaultCustomElementDefinitionProperties,
          template: ctx.createElementFromMarkup(`<template><div>${output1.template['outerHTML']}${output2.template['outerHTML']}${output3.template['outerHTML']}</div></template>`),
          instructions: [output1.instructions[0], output2.instructions[0], output3.instructions[0]],
          needsCompile: false,
          enhance: false,
          watches: [],
          processContent: null,
        };
        // enableTracing();
        // Tracer.enableLiveLogging(SymbolTraceWriter);
        const actual = sut.compile(input, container, null);
        // console.log('\n'+stringifyTemplateDefinition(actual, 0));
        // disableTracing();
        try {
          verifyBindingInstructionsEqual(actual, output);
        } catch (err) {
          // console.log('EXPECTED: ', JSON.stringify(output.instructions, null, 2));
          // console.log('ACTUAL: ', JSON.stringify(actual.instructions, null, 2));
          throw err;
        }
      });
    });
  });

  describe('attributes on custom elements', function () {
    eachCartesianJoinFactory([
      [
        TestContext.create
      ],
      [
        (ctx) => 'foo',
        (ctx) => 'bar42'
      ] as ((ctx: TestContext) => string)[],
      [
        (ctx, pdName) => pdName,
        (ctx, pdName) => `${pdName}Bar` // descriptor.property is different from the actual property name
      ] as ((ctx: TestContext, $1: string) => string)[],
      [
        (ctx, pdName, pdProp) => kebabCase(pdProp),
        (ctx, pdName, pdProp) => `${kebabCase(pdProp)}-baz` // descriptor.attribute is different from kebab-cased descriptor.property
      ] as ((ctx: TestContext, $1: string, $2: string) => string)[],
      [
        (ctx, pdName, pdProp, pdAttr) => ({ [pdName]: BindableDefinition.create(pdName, { property: pdProp, attribute: pdAttr, mode: BindingMode.default  }) }),
        (ctx, pdName, pdProp, pdAttr) => ({ [pdName]: BindableDefinition.create(pdName, { property: pdProp, attribute: pdAttr, mode: BindingMode.oneTime  }) }),
        (ctx, pdName, pdProp, pdAttr) => ({ [pdName]: BindableDefinition.create(pdName, { property: pdProp, attribute: pdAttr, mode: BindingMode.toView   }) }),
        (ctx, pdName, pdProp, pdAttr) => ({ [pdName]: BindableDefinition.create(pdName, { property: pdProp, attribute: pdAttr, mode: BindingMode.fromView }) }),
        (ctx, pdName, pdProp, pdAttr) => ({ [pdName]: BindableDefinition.create(pdName, { property: pdProp, attribute: pdAttr, mode: BindingMode.twoWay   }) })
      ] as ((ctx: TestContext, $1: string, $2: string, $3: string) => Bindables)[],
      [
        (ctx) => [``,           `''`],
        (ctx) => [``,           `\${a}`],
        (ctx) => [`.bind`,      `''`],
        (ctx) => [`.one-time`,  `''`],
        (ctx) => [`.to-view`,   `''`],
        (ctx) => [`.from-view`, `''`],
        (ctx) => [`.two-way`,   `''`],
      ] as ((ctx: TestContext) => [string, string])[],
      [
        (ctx, pdName, pdProp, pdAttr, bindables, [cmd]) => [bindables[pdName], `${pdAttr}${cmd}`],
        (ctx, pdName, pdProp, pdAttr, bindables, [cmd]) => [bindables[pdName], `${pdAttr}.qux${cmd}`],
        (ctx, pdName, pdProp, pdAttr, bindables, [cmd]) => [null,              `${pdAttr}-qux${cmd}`]
      ] as ((ctx: TestContext, $1: string, $2: string, $3: string, $4: Bindables, $5: [string, string]) => [BindableDefinition, string])[],
      [
        (ctx) => `''`
      ] as ((ctx: TestContext) => string)[]
    ],
    (ctx, pdName, pdProp, pdAttr, bindables, [cmd, attrValue], [bindableDescription, attrName]) => {
      for (const resolveResources of [true, false]) {
        for (const debugMode of [true, false]) {
          it(`[Resolve resources: ${resolveResources}] [Debug: ${debugMode}] customElement - pdName=${pdName}  pdProp=${pdProp}  pdAttr=${pdAttr}  cmd=${cmd}  attrName=${attrName}  attrValue="${attrValue}"`, function () {

            const FooBar = CustomElement.define({ name: 'foobar', bindables }, class FooBar {});
            const { sut, container } = createFixture(
              ctx,
              FooBar
            );
            sut.resolveResources = resolveResources;
            sut.debug = debugMode;

            const instruction = createAttributeInstruction(bindableDescription, attrName, attrValue, false);
            const instructions = instruction == null ? [] : [instruction];
            const childInstructions = !!bindableDescription ? instructions : [];
            const siblingInstructions = !bindableDescription ? instructions : [];

            const [input, output] = createCustomElement(
              ctx,
              resolveResources ? CustomElement.getDefinition(FooBar) : 'foobar',
              true,
              [[attrName, attrValue]],
              childInstructions,
              siblingInstructions,
              [],
              void 0,
              void 0,
              debugMode
            ) as [PartialCustomElementDefinition, PartialCustomElementDefinition];

            if (attrName.endsWith('.qux')) {
              let e;
              try {
                sut.compile(input, container, null);
              } catch (err) {
                // console.log('EXPECTED: ', JSON.stringify(output.instructions[0][0], null, 2));
                // console.log('ACTUAL: ', JSON.stringify(actual.instructions[0][0], null, 2));
                e = err;
              }
              assert.instanceOf(e, Error);
            } else {
              // enableTracing();
              // Tracer.enableLiveLogging(SymbolTraceWriter);
              const actual = sut.compile(input, container, null);
              // console.log('\n'+stringifyTemplateDefinition(actual, 0));
              // disableTracing();
              try {
                verifyBindingInstructionsEqual(actual, output);
              } catch (err) {
                // console.log('EXPECTED: ', JSON.stringify(output.instructions[0][0], null, 2));
                // console.log('ACTUAL: ', JSON.stringify(actual.instructions[0][0], null, 2));
                throw err;
              }
            }
          });
        }
      }
    });
  });

  describe('custom elements', function () {
    const Foo = CustomElement.define({ name: 'foo' }, class Foo {});
    const Bar = CustomElement.define({ name: 'bar' }, class Bar {});
    const Baz = CustomElement.define({ name: 'baz' }, class Baz {});
    const FooDef = CustomElement.getDefinition(Foo);
    const BarDef = CustomElement.getDefinition(Bar);
    const BazDef = CustomElement.getDefinition(Baz);

    function prepareElements(ctx: TestContext) {
      ctx.container.register(Foo, Bar, Baz);
      return ctx;
    }
    eachCartesianJoinFactory([
      [
        () => prepareElements(TestContext.create())
      ],
      [
        (ctx) => true,
        (ctx) => false,
      ],
      [
        (ctx, resolveResources) => createCustomElement(ctx, resolveResources ? FooDef : `foo`, true, [], [], [], []),
        (ctx, resolveResources) => createCustomElement(ctx, resolveResources ? BarDef : `bar`, true, [], [], [], []),
        (ctx, resolveResources) => createCustomElement(ctx, resolveResources ? BazDef : `baz`, true, [], [], [], [])
      ] as ((ctx: TestContext, resolveResources: boolean) => CTCResult)[]
      // <(($1: CTCResult) => CTCResult)[]>[
      //   ([input, output]) => createCustomElement(`foo`, false, [], [], [], output.instructions, output, input),
      //   ([input, output]) => createCustomElement(`bar`, false, [], [], [], output.instructions, output, input),
      //   ([input, output]) => createCustomElement(`baz`, false, [], [], [], output.instructions, output, input)
      // ],
      // <(($1: CTCResult, $2: CTCResult) => CTCResult)[]>[
      //   ($1, [input, output]) => createCustomElement(`foo`, true, [], [], [], output.instructions, output, input),
      //   ($1, [input, output]) => createCustomElement(`bar`, true, [], [], [], output.instructions, output, input),
      //   ($1, [input, output]) => createCustomElement(`baz`, true, [], [], [], output.instructions, output, input)
      // ]
      // ], ($1, $2, [input, output]) => {
    ],
    (ctx, resolveRes, [input, output]) => {
      it(`[Resolve res: ${resolveRes}] ${input.template}`, function () {

        const { sut, container } = createFixture(ctx);
        sut.resolveResources = resolveRes;

        // enableTracing();
        // Tracer.enableLiveLogging(SymbolTraceWriter);
        const actual = sut.compile(input, container, null);
        // console.log('\n'+stringifyTemplateDefinition(actual, 0));
        // disableTracing();
        try {
          verifyBindingInstructionsEqual(actual, output);
        } catch (err) {
          console.log('EXPECTED: ', JSON.stringify(output.instructions, null, 2));
          console.log('ACTUAL: ', JSON.stringify(actual.instructions, null, 2));
          throw err;
        }
      });
    });
  });
});

describe('TemplateCompiler - local templates', function () {
  class EventLog implements ISink {
    public readonly log: ILogEvent[] = [];
    public handleEvent(event: ILogEvent): void {
      this.log.push(event);
    }
  }
  function createFixture() {
    const ctx = TestContext.create();
    const container = ctx.container;
    container.register(LoggerConfiguration.create({ sinks: [EventLog] }));
    const sut = ctx.templateCompiler;
    return { ctx, container, sut };
  }

  class LocalTemplateTestData {

    public constructor(
      public readonly template: string,
      private readonly expectedResources: Map<string, ElementInfo>,
      private readonly templateFreq: Map<string, number>,
      public readonly expectedContent: string,
    ) {
      this.verifyDefinition = this.verifyDefinition.bind(this);
    }
    public verifyDefinition(definition: CustomElementDefinition, container: IContainer): void {
      assert.equal((definition.template as HTMLTemplateElement).querySelector('template[as-custom-element]'), null);

      for (const [name, info] of this.expectedResources) {
        assert.deepStrictEqual(ElementInfo.from(container.find(CustomElement, name), void 0), info, 'element info');
      }
      const ceInstructions: HydrateElementInstruction[] = definition.instructions.flatMap((i) => i).filter((i) => i instanceof HydrateElementInstruction) as HydrateElementInstruction[];
      for (const [template, freq] of this.templateFreq) {
        assert.strictEqual(ceInstructions.filter((i) => i.res === template).length, freq, 'HydrateElementInstruction.freq');
      }
    }

  }
  function *getLocalTemplateTestData() {
    yield new LocalTemplateTestData(
      `<template as-custom-element="foo-bar">static</template>
      <foo-bar></foo-bar>`,
      new Map([['foo-bar', new ElementInfo('foo-bar', void 0, false)]]),
      new Map([['foo-bar', 1]]),
      'static'
    );
    yield new LocalTemplateTestData(
      `<foo-bar></foo-bar>
      <template as-custom-element="foo-bar">static</template>`,
      new Map([['foo-bar', new ElementInfo('foo-bar', void 0, false)]]),
      new Map([['foo-bar', 1]]),
      'static'
    );
    yield new LocalTemplateTestData(
      `<foo-bar></foo-bar>
      <template as-custom-element="foo-bar">static</template>
      <foo-bar></foo-bar>`,
      new Map([['foo-bar', new ElementInfo('foo-bar', void 0, false)]]),
      new Map([['foo-bar', 2]]),
      'static static'
    );
    yield new LocalTemplateTestData(
      `<template as-custom-element="foo-bar">static foo-bar</template>
      <template as-custom-element="fiz-baz">static fiz-baz</template>
      <fiz-baz></fiz-baz>
      <foo-bar></foo-bar>`,
      new Map([['foo-bar', new ElementInfo('foo-bar', void 0, false)], ['fiz-baz', new ElementInfo('fiz-baz', void 0, false)]]),
      new Map([['foo-bar', 1], ['fiz-baz', 1]]),
      'static fiz-baz static foo-bar'
    );
    const bindingModeMap = new Map([
      ['oneTime', BindingMode.oneTime],
      ['toView', BindingMode.toView],
      ['fromView', BindingMode.fromView],
      ['twoWay', BindingMode.twoWay],
      ['default', BindingMode.toView],
    ]);
    for (const [bindingMode, props, attributeName] of generateCartesianProduct([
      [...bindingModeMap.keys(), void 0],
      [['prop'], ['prop', 'camelProp']],
      ['fiz-baz', undefined],
    ])) {
      const ei = new ElementInfo('foo-bar', void 0, false);
      const mode = bindingModeMap.get(bindingMode) ?? BindingMode.toView;
      let bindables = '';
      let templateBody = '';
      let attrExpr = '';
      let renderedContent = '';
      const value = "awesome possum";
      for (let i = 0, ii = props.length; i < ii; i++) {
        const prop = props[i];
        const bi = new BindableInfo(prop, mode);
        const attr = kebabCase(attributeName !== void 0 ? `${attributeName}${i + 1}` : prop);
        ei.bindables[attr] = bi;

        bindables += `<bindable property='${prop}'${bindingMode !== void 0 ? ` mode="${bindingMode}"` : ''}${attributeName !== void 0 ? ` attribute="${attr}"` : ''}></bindable>`;
        templateBody += ` \${${prop}}`;
        const content = `${value}${i + 1}`;
        attrExpr += ` ${attr}="${content}"`;
        renderedContent += ` ${content}`;
      }

      yield new LocalTemplateTestData(
        `<template as-custom-element="foo-bar">
            ${bindables}
            ${templateBody}
          </template>
          <foo-bar ${attrExpr}></foo-bar>`,
        new Map([['foo-bar', ei]]),
        new Map([['foo-bar', 1]]),
        renderedContent.trim()
      );
    }
  }
  for (const { template, verifyDefinition, expectedContent } of getLocalTemplateTestData()) {
    it(template, function () {
      const { container, sut } = createFixture();
      sut.resolveResources = false;
      const definition = sut.compile({ name: 'lorem-ipsum', template }, container, null);
      verifyDefinition(definition, container);
    });
    if (template.includes(`mode="fromView"`)) { continue; }
    it(`${template} - content`, async function () {
      const { ctx, container } = createFixture();
      const host = ctx.doc.createElement('div');
      ctx.doc.body.appendChild(host);
      const au = new Aurelia(container)
        .app({ host, component: CustomElement.define({ name: 'lorem-ipsum', template }, class { }) });

      await au.start();

      assert.html.textContent(host, expectedContent);

      await au.stop();
      ctx.doc.body.removeChild(host);
      au.dispose();
    });
  }

  it('works with if', async function () {
    const template = `<template as-custom-element="foo-bar">
    <bindable property='prop'></bindable>
    \${prop}
   </template>
   <foo-bar prop="awesome possum" if.bind="true"></foo-bar>
   <foo-bar prop="ignored" if.bind="false"></foo-bar>`;
    const expectedContent = "awesome possum";

    const { ctx, container } = createFixture();
    const host = ctx.doc.createElement('div');
    ctx.doc.body.appendChild(host);
    const au = new Aurelia(container)
      .app({ host, component: CustomElement.define({ name: 'lorem-ipsum', template }, class { }) });

    await au.start();

    assert.html.textContent(host, expectedContent);

    await au.stop();
    ctx.doc.body.removeChild(host);
    au.dispose();
  });

  it('works with for', async function () {
    const template = `<template as-custom-element="foo-bar">
    <bindable property='prop'></bindable>
    \${prop}
   </template>
   <foo-bar repeat.for="i of 5" prop.bind="i"></foo-bar>`;
    const expectedContent = "0 1 2 3 4";

    const { ctx, container } = createFixture();
    const host = ctx.doc.createElement('div');
    ctx.doc.body.appendChild(host);
    const au = new Aurelia(container)
      .app({ host, component: CustomElement.define({ name: 'lorem-ipsum', template }, class { }) });

    await au.start();

    assert.html.textContent(host, expectedContent);

    await au.stop();
    ctx.doc.body.removeChild(host);
    au.dispose();
  });

  it('works with nested templates - 1', async function () {
    @customElement({ name: 'level-one', template: `<template as-custom-element="foo-bar"><bindable property='prop'></bindable>Level One \${prop}</template><foo-bar prop.bind="prop"></foo-bar>` })
    class LevelOne {
      @bindable public prop: string;
    }
    @customElement({
      name: 'level-two', template: `
    <template as-custom-element="foo-bar">
      <bindable property='prop'></bindable>
      Level Two \${prop}
      <level-one prop="inter-dimensional portal"></level-one>
    </template>
    <foo-bar prop.bind="prop"></foo-bar>
    <level-one prop.bind="prop"></level-one>
    `})
    class LevelTwo {
      @bindable public prop: string;
    }
    const template = `<level-two prop="foo2"></level-two><level-one prop="foo1"></level-one>`;
    const expectedContent = "Level Two foo2 Level One inter-dimensional portal Level One foo2 Level One foo1";

    const { ctx, container } = createFixture();
    const host = ctx.doc.createElement('div');
    ctx.doc.body.appendChild(host);
    const au = new Aurelia(container)
      .register(LevelOne, LevelTwo)
      .app({ host, component: CustomElement.define({ name: 'lorem-ipsum', template }, class { }) });

    await au.start();

    assert.html.textContent(host, expectedContent);

    await au.stop();
    ctx.doc.body.removeChild(host);
    au.dispose();
  });

  it('works with nested templates - 2', async function () {
    const template = `
    <template as-custom-element="el-one">
      <template as-custom-element="one-two">
        1
      </template>
      2
      <one-two></one-two>
    </template>
    <template as-custom-element="el-two">
      <template as-custom-element="two-two">
        3
      </template>
      4
      <two-two></two-two>
    </template>
    <el-two></el-two>
    <el-one></el-one>
    `;
    const expectedContent = "4 3 2 1";

    const { ctx, container } = createFixture();
    const host = ctx.doc.createElement('div');
    ctx.doc.body.appendChild(host);
    const au = new Aurelia(container)
      .app({ host, component: CustomElement.define({ name: 'lorem-ipsum', template }, class { }) });

    await au.start();

    assert.html.textContent(host, expectedContent);

    await au.stop();
    ctx.doc.body.removeChild(host);
    au.dispose();
  });

  it('throws error if a root template is a local template', function () {
    const template = `<template as-custom-element="foo-bar">I have local root!</template>`;
    const { container, sut } = createFixture();
    assert.throws(() => sut.compile({ name: 'lorem-ipsum', template }, container, null), 'The root cannot be a local template itself.');
  });

  it('throws error if the custom element has only local templates', function () {
    const template = `
    <template as-custom-element="foo-bar">Does this work?</template>
    <template as-custom-element="fiz-baz">Of course not!</template>
    `;
    const { container, sut } = createFixture();
    assert.throws(() => sut.compile({ name: 'lorem-ipsum', template }, container, null), 'The custom element does not have any content other than local template(s).');
  });

  it('throws error if a local template is not under root', function () {
    const template = `<div><template as-custom-element="foo-bar">Can I hide here?</template></div>`;
    const { container, sut } = createFixture();
    assert.throws(() => sut.compile({ name: 'lorem-ipsum', template }, container, null), 'Local templates needs to be defined directly under root.');
  });

  it('throws error if a local template does not have name', function () {
    const template = `<template as-custom-element="">foo-bar</template><div></div>`;
    const { container, sut } = createFixture();
    assert.throws(() => sut.compile({ name: 'lorem-ipsum', template }, container, null), 'The value of "as-custom-element" attribute cannot be empty for local template');
  });

  it('throws error if a duplicate local templates are found', function () {
    const template = `<template as-custom-element="foo-bar">foo-bar1</template><template as-custom-element="foo-bar">foo-bar2</template><div></div>`;
    const { container, sut } = createFixture();
    assert.throws(() => sut.compile({ name: 'lorem-ipsum', template }, container, null), 'Duplicate definition of the local template named foo-bar');
  });

  it('throws error if bindable is not under root', function () {
    const template = `<template as-custom-element="foo-bar">
      <div>
        <bindable property="prop"></bindable>
      </div>
    </template>
    <div></div>`;
    const { container, sut } = createFixture();
    assert.throws(() => sut.compile({ name: 'lorem-ipsum', template }, container, null), 'Bindable properties of local templates needs to be defined directly under root.');
  });

  it('throws error if bindable property is missing', function () {
    const template = `<template as-custom-element="foo-bar">
      <bindable attribute="prop"></bindable>
    </template>
    <div></div>`;
    const { container, sut } = createFixture();
    assert.throws(() => sut.compile({ name: 'lorem-ipsum', template }, container, null), 'The attribute \'property\' is missing in <bindable attribute="prop"></bindable>');
  });

  it('throws error if duplicate bindable properties are found', function () {
    const template = `<template as-custom-element="foo-bar">
      <bindable property="prop" attribute="bar"></bindable>
      <bindable property="prop" attribute="baz"></bindable>
    </template>
    <div></div>`;
    const { container, sut } = createFixture();
    assert.throws(
      () => sut.compile({ name: 'lorem-ipsum', template }, container, null),
      'Bindable property and attribute needs to be unique; found property: prop, attribute: '
    );
  });

  it('throws error if duplicate bindable attributes are found', function () {
    const template = `<template as-custom-element="foo-bar">
      <bindable property="prop1" attribute="bar"></bindable>
      <bindable property="prop2" attribute="bar"></bindable>
    </template>
    <div></div>`;
    const { container, sut } = createFixture();
    assert.throws(
      () => sut.compile({ name: 'lorem-ipsum', template }, container, null),
      'Bindable property and attribute needs to be unique; found property: prop2, attribute: bar'
    );
  });

  for (const attr of ['if.bind="true"', 'if.bind="false"', 'else', 'repeat.for="item of items"', 'with.bind="{a:1}"', 'switch.bind="cond"', 'case="case1"']) {
    it(`throws error if local-template surrogate has template controller - ${attr}`, function () {
      const template = `<template as-custom-element="foo-bar" ${attr}>
      <bindable property="prop1" attribute="bar"></bindable>
    </template>
    <foo-bar></foo-bar>`;
      const { ctx, container } = createFixture();

      assert.throws(() =>
        new Aurelia(container)
          .app({ host: ctx.doc.createElement('div'), component: CustomElement.define({ name: 'lorem-ipsum', template }, class { }) }),
        `Template controller ${attr.split('.')[0]} is invalid on surrogate`
      );
    });
  }

  it('warns if bindable element has more attributes other than the allowed', function () {
    const template = `<template as-custom-element="foo-bar">
      <bindable property="prop" unknown-attr who-cares="no one"></bindable>
    </template>
    <div></div>`;
    const { container, sut } = createFixture();

    sut.compile({ name: 'lorem-ipsum', template }, container, null);
    const sinks = container.get(DefaultLogger)['warnSinks'] as ISink[];
    const eventLog = sinks.find((s) => s instanceof EventLog) as EventLog;
    if (__DEV__) {
      assert.strictEqual(eventLog.log.length, 1, `eventLog.log.length`);
    }
    const event = eventLog.log[0];
    assert.strictEqual(event.severity, LogLevel.warn);
    assert.includes(
      event.toString(),
      'The attribute(s) unknown-attr, who-cares will be ignored for <bindable property="prop" unknown-attr="" who-cares="no one"></bindable>. Only property, attribute, mode are processed.'
    );
  });

});

describe('TemplateCompiler - au-slot', function () {
  function createFixture() {
    const ctx = TestContext.create();
    const container = ctx.container;
    const sut = ctx.templateCompiler;
    return { ctx, container, sut };
  }
  function $createCustomElement(template: string, name: string) {
    return CustomElement.define({ name, isStrictBinding: true, template, bindables: { people: { mode: BindingMode.default } }, }, class MyElement { });
  }

  class ExpectedSlotFallbackInfo {
    public constructor(
      public readonly slotName: string,
      public readonly content: string,
    ) { }
  }
  class TestData {
    public constructor(
      public readonly template: string,
      public readonly customElements: CustomElementType[],
      public readonly allExpectedProjections: [string, Record<string, string>][] | null,
      public readonly expectedSlotInfos: ExpectedSlotFallbackInfo[],
    ) {
    }
  }

  function *getTestData() {
    // projections verification
    yield new TestData(
      `<my-element><div au-slot></div></my-element>`,
      [$createCustomElement('', 'my-element')],
      [['my-element', { 'default': '<div></div>' }]],
      [],
    );
    yield new TestData(
      `<my-element><div au-slot="s1">p1</div><div au-slot="s2">p2</div></my-element>`,
      [$createCustomElement('', 'my-element')],
      [['my-element', { s1: '<div>p1</div>', s2: '<div>p2</div>' }]],
      [],
    );
    yield new TestData(
      `<my-element><div au-slot="s1">p1</div><div au-slot="s1">p2</div></my-element>`,
      [$createCustomElement('', 'my-element')],
      [['my-element', { s1: '<div>p1</div><div>p2</div>' }]],
      [],
    );
    yield new TestData(
      `<my-element><au-slot au-slot><div au-slot="s1">p1</div><div au-slot="s1">p2</div></au-slot></my-element>`,
      [$createCustomElement('', 'my-element')],
      [['my-element', { 'default': '<au-m class="au"></au-m>' }]],
      [],
    );

    // fallback verification
    yield new TestData(
      `<au-slot name="s1">s1fb</au-slot><au-slot name="s2"><div>s2fb</div></au-slot>`,
      [],
      null,
      [
        new ExpectedSlotFallbackInfo('s1', 's1fb'),
        new ExpectedSlotFallbackInfo('s2', '<div>s2fb</div>'),
      ],
    );
    yield new TestData(
      `<au-slot name="s1">s1fb</au-slot><au-slot name="s2"><div>s2fb</div></au-slot>`,
      [],
      null,
      [
        new ExpectedSlotFallbackInfo('s1', 's1fb'),
        new ExpectedSlotFallbackInfo('s2', '<div>s2fb</div>'),
      ],
    );
    yield new TestData(
      `<au-slot name="s1">s1fb</au-slot><au-slot name="s2"><div>s2fb</div></au-slot>`,
      [],
      null,
      [
        new ExpectedSlotFallbackInfo('s1', 's1fb'),
        new ExpectedSlotFallbackInfo('s2', '<div>s2fb</div>'),
      ],
    );
    yield new TestData(
      `<au-slot name="s1">s1fb</au-slot><my-element><div au-slot>p</div></my-element>`,
      [$createCustomElement('', 'my-element')],
      null,
      [
        new ExpectedSlotFallbackInfo('s1', 's1fb'),
      ],
    );
  }
  for (const { customElements, template, expectedSlotInfos, allExpectedProjections } of getTestData()) {
    it(`compiles - ${template}`, function () {
      const { sut, container } = createFixture();
      container.register(AuSlot, ...customElements);

      const compiledDefinition = sut.compile(
        CustomElementDefinition.create({ name: 'my-ce', template }, class MyCe { }),
        container,
        { projections: null }
      );

      type HEI = HydrateElementInstruction;
      const allInstructions = compiledDefinition.instructions.flat();
      for (const expectedSlotInfo of expectedSlotInfos) {
        const actualInstruction = allInstructions.find((i) =>
          i.type === InstructionType.hydrateElement
          && (typeof (i as HEI).res === 'string' && ((i as HEI).res as string).includes('au-slot')
            || (i as HEI).res === CustomElement.getDefinition(AuSlot)
          )
          && (i as HydrateElementInstruction).auSlot.name === expectedSlotInfo.slotName
        ) as HydrateElementInstruction;
        assert.notEqual(actualInstruction, void 0, 'instruction');
        const actualSlotInfo = actualInstruction.auSlot!;
        assert.deepStrictEqual((actualSlotInfo.fallback.template as HTMLElement).outerHTML, `<template>${expectedSlotInfo.content}</template>`, 'content');
        assert.deepStrictEqual(actualSlotInfo.fallback.needsCompile, false, 'needsCompile');
      }

      // for each element instruction found
      // verify projections for it compiles properly
      if (allExpectedProjections == null) {
        return;
      }

      for (const [elName, projections] of allExpectedProjections) {
        const elementInstruction = allInstructions.find(i =>
          i.type === InstructionType.hydrateElement
          && (typeof (i as HEI).res === 'string' && ((i as HEI).res as string) === elName
            || (i as HEI).res === container.find(CustomElement, elName)
          )
        ) as HydrateElementInstruction;
        assert.notEqual(elementInstruction, void 0, `Instruction for element "${elName}" missing`);
        const actualProjections = elementInstruction.projections;
        for (const slotName in projections) {
          const def = actualProjections[slotName];
          assert.instanceOf(def, CustomElementDefinition);
          assert.deepStrictEqual((def.template as HTMLElement).outerHTML, `<template>${projections[slotName]}</template>`, 'content');
          assert.deepStrictEqual(def.needsCompile, false, 'needsCompile');
        }
      }
    });
  }
});

describe('TemplateCompiler - hooks', function () {
  function createFixture() {
    const ctx = TestContext.create();
    const container = ctx.container;
    const sut = ctx.templateCompiler;
    return { ctx, container, sut };
  }

  it('invokes before compile hooks', function () {
    const template = `<template></template>`;
    const { container, sut } = createFixture();
    let hookCallCount = 0;

    container.register(Registration.instance(ITemplateCompilerHooks, {
      compiling(template: HTMLElement) {
        hookCallCount++;
        template.setAttribute('data-hello', 'world');
      }
    }));

    const definition = sut.compile({ name: 'lorem-ipsum', template }, container, null);
    assert.strictEqual(hookCallCount, 1);
    assert.strictEqual((definition.template as Element).getAttribute('data-hello'), 'world');
  });

  it('invokes all hooks', function () {
    const template = `<template></template>`;
    const { container, sut } = createFixture();
    let hookCallCount = 0;

    container.register(Registration.instance(ITemplateCompilerHooks, {
      compiling(template: HTMLElement) {
        hookCallCount++;
        template.setAttribute('data-hello', 'world');
      }
    }));
    container.register(Registration.instance(ITemplateCompilerHooks, {
      compiling(template: HTMLElement) {
        hookCallCount++;
        template.setAttribute('data-world', 'hello');
      }
    }));

    const definition = sut.compile({ name: 'lorem-ipsum', template }, container, null);
    assert.strictEqual(hookCallCount, 2);
    assert.strictEqual((definition.template as Element).getAttribute('data-hello'), 'world');
    assert.strictEqual((definition.template as Element).getAttribute('data-world'), 'hello');
  });

  it('does not throw if the compile hooks does not have any hooks', function () {
    const template = `<template></template>`;
    const { container, sut } = createFixture();

    container.register(Registration.instance(ITemplateCompilerHooks, {}));
    assert.doesNotThrow(() => sut.compile({ name: 'lorem-ipsum', template }, container, null));
  });

  it('invokes hooks with resources semantic - only leaf', function () {
    const template = `<template></template>`;
    const { container, sut } = createFixture();
    let hookCallCount = 0;
    const createResolver = () => Registration.instance(ITemplateCompilerHooks, {
      compiling(template: HTMLElement) {
        hookCallCount++;
        template.setAttribute('data-hello', 'world');
      }
    });
    const middleContainer = container.createChild();
    const leafContainer = middleContainer.createChild();
    middleContainer.register(createResolver());
    leafContainer.register(createResolver());

    const definition = sut.compile({ name: 'lorem-ipsum', template }, leafContainer, null);
    assert.strictEqual(hookCallCount, 1);
    assert.strictEqual((definition.template as Element).getAttribute('data-hello'), 'world');
  });

  it('invokes hooks with resources semantic - leaf + root', function () {
    const template = `<template></template>`;
    const { container, sut } = createFixture();
    let hookCallCount = 0;
    const createResolver = (value: string) => Registration.instance(ITemplateCompilerHooks, {
      compiling(template: HTMLElement) {
        hookCallCount++;
        template.setAttribute(`data-${value}`, value);
      }
    });
    const middleContainer = container.createChild();
    const leafContainer = middleContainer.createChild();
    container.register(createResolver('root'));
    middleContainer.register(createResolver('middle'));
    leafContainer.register(createResolver('leaf'));

    const definition = sut.compile({ name: 'lorem-ipsum', template }, leafContainer, null);
    assert.strictEqual(hookCallCount, 2);
    assert.strictEqual((definition.template as Element).getAttribute('data-root'), 'root');
    assert.strictEqual((definition.template as Element).getAttribute('data-middle'), null);
    assert.strictEqual((definition.template as Element).getAttribute('data-leaf'), 'leaf');
  });
});

class BindablesInfo<T extends 0 | 1 = 0> {
  public static from(def: CustomElementDefinition | CustomAttributeDefinition, isAttr: true): BindablesInfo<1>;
  // eslint-disable-next-line
  public static from(def: CustomElementDefinition | CustomAttributeDefinition, isAttr: false): BindablesInfo<0>;
  public static from(def: CustomElementDefinition | CustomAttributeDefinition, isAttr: boolean): BindablesInfo<1 | 0> {
    type CA = CustomAttributeDefinition;
    const bindables = def.bindables;
    const attrs: Record<string, BindableDefinition> = {};
    const defaultBindingMode: BindingMode = isAttr
      ? (def as CA).defaultBindingMode === void 0
        ? BindingMode.default
        : (def as CA).defaultBindingMode
      : BindingMode.default;
    let bindable: BindableDefinition | undefined;
    let prop: string;
    let hasPrimary: boolean = false;
    let primary: BindableDefinition | undefined;
    let attr: string;

    // from all bindables, pick the first primary bindable
    // if there is no primary, pick the first bindable
    // if there's no bindables, create a new primary with property value
    for (prop in bindables) {
      bindable = bindables[prop];
      attr = bindable.attribute;
      if (bindable.primary === true) {
        if (hasPrimary) {
          throw new Error(`Primary already exists on ${def.name}`);
        }
        hasPrimary = true;
        primary = bindable;
      } else if (!hasPrimary && primary == null) {
        primary = bindable;
      }

      attrs[attr] = BindableDefinition.create(prop, bindable);
    }
    if (bindable == null && isAttr) {
      // if no bindables are present, default to "value"
      primary = attrs.value = BindableDefinition.create('value', { mode: defaultBindingMode });
    }

    return new BindablesInfo(attrs, bindables, primary!);
  }

  protected constructor(
    public readonly attrs: Record<string, BindableDefinition>,
    public readonly bindables: Record<string, BindableDefinition>,
    public readonly primary: T extends 1 ? BindableDefinition : BindableDefinition | undefined,
  ) {}
}
