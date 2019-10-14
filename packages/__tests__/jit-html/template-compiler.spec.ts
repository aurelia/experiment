
import { parseExpression } from '@aurelia/jit';
import {
  Constructable,
  IContainer,
  IRegistry,
  IResourceDescriptions,
  kebabCase,
  PLATFORM,
  RuntimeCompilationResources
} from '@aurelia/kernel';
import {
  AccessScopeExpression,
  AttributeFilter,
  bindable,
  BindingIdentifier,
  BindingMode,
  BindingType,
  customAttribute,
  CustomAttribute,
  customElement,
  CustomElement,
  DelegationStrategy,
  ForOfStatement,
  HydrateTemplateController,
  IBindableDescription,
  IDOM,
  IHydrateElementInstruction,
  IHydrateTemplateController,
  ITemplateCompiler,
  ITemplateDefinition,
  PrimitiveLiteralExpression,
  TargetedInstructionType as TT,
  IHydrateLetElementInstruction,
  ICustomElementType
} from '@aurelia/runtime';
import { HTMLTargetedInstructionType as HTT } from '@aurelia/runtime-html';
import {
  assert,
  eachCartesianJoinFactory,
  HTMLTestContext,
  TestContext,
  verifyBindingInstructionsEqual
} from '@aurelia/testing';

export function createAttribute(name: string, value: string): Attr {
  const attr = document.createAttribute(name);
  attr.value = value;
  return attr;
}

const buildNotRequired = { required: false, compiler: 'default' };

describe('template-compiler.spec.ts\n  [TemplateCompiler]', function () {
  let ctx: HTMLTestContext;
  let sut: ITemplateCompiler;
  let resources: IResourceDescriptions;
  let container: IContainer;
  let dom: IDOM;

  // eslint-disable-next-line mocha/no-hooks
  beforeEach(function () {
    ctx = TestContext.createHTMLTestContext();
    container = ctx.container;
    sut = ctx.templateCompiler;
    container.registerResolver<string>(CustomAttribute.keyFrom('foo'), { getFactory: () => ({ Type: { description: {} } }) } as any);
    resources = new RuntimeCompilationResources(container);
    dom = ctx.dom;
  });

  describe('compileElement()', function () {

    it('set hasSlots to true <slot/>', function () {
      const definition = compileWith('<template><slot></slot></template>', []);
      assert.strictEqual(definition.hasSlots, true, `definition.hasSlots`);

      // test this with nested slot inside template controller
    });

    describe('with custom element', function () {

      describe('compiles surrogate', function () {

        it('compiles surrogate', function () {
          const { instructions, surrogates } = compileWith(
            `<template class="h-100"></template>`,
            []
          );
          verifyInstructions(instructions, []);
          verifyInstructions(
            surrogates,
            [{ toVerify: ['type', 'value', 'to'], type: HTT.setAttribute, value: 'h-100', to: 'class' }]
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
          const attrs = ['id', 'replace'];
          attrs.forEach(attr => {
            assert.throws(
              () => compileWith(`<template ${attr}="${attr}"></template>`, []),
              /Invalid surrogate attribute/,
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
          { toVerify: ['type', 'res', 'to'], type: TT.hydrateAttribute, res: 'prop3' },
          { toVerify: ['type', 'res', 'to'], type: TT.hydrateAttribute, res: 'prop3' }
        ];
        verifyInstructions(siblingInstructions, expectedSiblingInstructions);
        const rootInstructions = actual.instructions[0][0]['instructions'];
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
          { toVerify: ['type', 'res'], type: TT.hydrateElement, res: 'el' }
        ];
        verifyInstructions(rootInstructions, expectedRootInstructions);

        const expectedElInstructions = [
          { toVerify: ['type', 'to', 'value'], type: TT.setProperty, to: 'name', value: 'name' }
        ];
        verifyInstructions((rootInstructions[0] as IHydrateElementInstruction).instructions, expectedElInstructions);
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
        verifyInstructions((rootInstructions[0] as IHydrateElementInstruction).instructions, expectedElInstructions);
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
        verifyInstructions((rootInstructions[0] as IHydrateElementInstruction).instructions, expectedElInstructions);
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
          verifyInstructions(hydratePropAttrInstruction.instructions, [
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
                type: TT.hydrateElement, res: 'not-div' }
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
                  type: TT.hydrateTemplateController, res: 'if' }
              ]);
              const templateControllerInst = instructions[0][0] as IHydrateTemplateController;
              verifyInstructions(templateControllerInst.instructions, [
                { toVerify: ['type', 'to', 'from'],
                  type: TT.propertyBinding, to: 'value', from: new AccessScopeExpression('value') }
              ]);
              const [hydrateNotDivInstruction] = templateControllerInst.def.instructions[0] as [IHydrateElementInstruction];
              verifyInstructions([hydrateNotDivInstruction], [
                { toVerify: ['type', 'res'],
                  type: TT.hydrateElement, res: 'not-div' }
              ]);
              verifyInstructions(hydrateNotDivInstruction.instructions, []);
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
          assert.strictEqual((instructions[0][0] as IHydrateLetElementInstruction).instructions.length, 0, `(instructions[0][0]).instructions.length`);
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
          verifyInstructions((instructions[0][0] as IHydrateLetElementInstruction).instructions, [
            { toVerify: ['type', 'to', 'srcOrExp'],
              type: TT.letBinding, to: 'a', from: 'b' },
            { toVerify: ['type', 'to'],
              type: TT.letBinding, to: 'c' }
          ]);
        });

        describe('[to-binding-context]', function () {
          it('understands [to-binding-context]', function () {
            const { instructions } = compileWith(`<template><let to-binding-context></let></template>`);
            assert.strictEqual((instructions[0][0] as IHydrateLetElementInstruction).toBindingContext, true, `(instructions[0][0]).toBindingContext`);
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
      toVerify: string[];
      [prop: string]: any;
    }

    function compileWith(markup: string | Element, extraResources: any[] = []) {
      extraResources.forEach(e => e.register(container));
      const templateDefinition: ITemplateDefinition = { template: markup, instructions: [], surrogates: [] } as unknown as ITemplateDefinition;
      return sut.compile(dom, templateDefinition, resources);
    }

    function verifyInstructions(actual: any[], expectation: IExpectedInstruction[], type?: string) {
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
      oneTime: false
    }];
  } else {
    return [{
      type: TT.setProperty,
      to: 'value',
      value
    }];
  }
}

function createTemplateController(ctx: HTMLTestContext, attr: string, target: string, value: string, tagName: string, finalize: boolean, childInstr?, childTpl?): CTCResult {
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
    const instruction = {
      type: TT.hydrateTemplateController,
      res: target,
      def: {
        name: target,
        template: ctx.createElementFromMarkup(`<template><au-m class="au"></au-m></template>`),
        instructions: [[childInstr]],
        build: buildNotRequired,
        scopeParts: [],
      },
      instructions: createTplCtrlAttributeInstruction(attr, value),
      link: attr === 'else'
    };
    const input: ITemplateDefinition = {
      template: finalize ? `<div>${rawMarkup}</div>` : rawMarkup,
      instructions: []
    } as unknown as ITemplateDefinition;
    const output: ITemplateDefinition = {
      template: ctx.createElementFromMarkup(`<template><div><au-m class="au"></au-m></div></template>`),
      instructions: [[instruction]],
      build: buildNotRequired,
      scopeParts: [],
    } as unknown as ITemplateDefinition;
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
    const instruction = {
      type: TT.hydrateTemplateController,
      res: target,
      def: {
        name: target,
        template: ctx.createElementFromMarkup(tagName === 'template' ? compiledMarkup : `<template>${compiledMarkup}</template>`),
        instructions,
        build: buildNotRequired,
        scopeParts: [],
      },
      instructions: createTplCtrlAttributeInstruction(attr, value),
      link: attr === 'else'
    };
    const rawMarkup = `<${tagName} ${attr}="${value || ''}">${childTpl || ''}</${tagName}>`;
    const input: ITemplateDefinition = {
      template: finalize ? `<div>${rawMarkup}</div>` : rawMarkup,
      instructions: []
    } as unknown as ITemplateDefinition;
    const output: ITemplateDefinition = {
      template: ctx.createElementFromMarkup(finalize ? `<template><div><au-m class="au"></au-m></div></template>` : `<au-m class="au"></au-m>`),
      instructions: [[instruction]],
      build: buildNotRequired,
      scopeParts: [],
    } as unknown as ITemplateDefinition;
    return [input, output];
  }
}

function createCustomElement({
  ctx,
  tagName,
  finalize,
  attributes,
  childInstructions,
  siblingInstructions,
  nestedElInstructions,
  childOutput,
  childInput,
  capturedAttrs,
  customOutputAttributeMarkup
}: {
  ctx: HTMLTestContext;
  tagName: string;
  finalize: boolean;
  attributes: [string, string][];
  childInstructions: any[];
  siblingInstructions: any[];
  nestedElInstructions: any[];
  childOutput?: any;
  childInput?: any;
  capturedAttrs?: { name: string; value: string }[];
  /**
   * When output template attributes will be in different shape with common scenarios
   * this helps specify the output
   */
  customOutputAttributeMarkup?: string;
}) {
  const instruction = {
    type: TT.hydrateElement,
    res: tagName,
    instructions: childInstructions,
    parts: PLATFORM.emptyObject,
    capturedAttrs: capturedAttrs || PLATFORM.emptyArray
  };
  const attributeMarkup = attributes.map(a => `${a[0]}="${a[1]}"`).join(' ');
  const rawMarkup = `<${tagName} ${attributeMarkup}>${(childInput && childInput.template) || ''}</${tagName}>`;
  const input = {
    template: finalize ? `<div>${rawMarkup}</div>` : rawMarkup,
    instructions: []
  };
  const outputMarkup = ctx.createElementFromMarkup(
    `<${tagName} ${typeof customOutputAttributeMarkup === 'string' ? customOutputAttributeMarkup : attributeMarkup.replace(/\$\{.*\}/, '')}>${(childOutput && childOutput.template.outerHTML) || ''}</${tagName}>`);
  outputMarkup.classList.add('au');
  const output = {
    template: finalize ? ctx.createElementFromMarkup(`<template><div>${outputMarkup.outerHTML}</div></template>`) : outputMarkup,
    instructions: [[instruction, ...siblingInstructions], ...nestedElInstructions],
    build: buildNotRequired,
    scopeParts: [],
  };
  return [input, output];
}

function createCustomAttribute(ctx: HTMLTestContext, resName: string, finalize: boolean, attributes: [string, string][], childInstructions: any[], siblingInstructions: any[], nestedElInstructions: any[], childOutput?, childInput?) {
  const instruction = {
    type: TT.hydrateAttribute,
    res: resName,
    instructions: childInstructions
  };
  const attributeMarkup = attributes.map(a => `${a[0]}: ${a[1]};`).join('');
  const rawMarkup = `<div ${resName}="${attributeMarkup}">${(childInput && childInput.template) || ''}</div>`;
  const input = {
    template: finalize ? `<div>${rawMarkup}</div>` : rawMarkup,
    instructions: []
  };
  const outputMarkup = ctx.createElementFromMarkup(`<div ${resName}="${attributeMarkup}">${(childOutput && childOutput.template.outerHTML) || ''}</div>`);
  outputMarkup.classList.add('au');
  const output = {
    template: finalize ? ctx.createElementFromMarkup(`<template><div>${outputMarkup.outerHTML}</div></template>`) : outputMarkup,
    instructions: [[instruction, ...siblingInstructions], ...nestedElInstructions],
    build: buildNotRequired,
    scopeParts: [],
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

function createAttributeInstruction(bindableDescription: IBindableDescription | null, attributeName: string, attributeValue: string, isMulti: boolean) {
  const parts = attributeName.split('.');
  const attr = parts[0];
  const cmd = parts.pop();
  const defaultMode = !!bindableDescription ? (bindableDescription.mode === BindingMode.default ? BindingMode.toView : bindableDescription.mode) : BindingMode.toView;
  const mode = commandToMode[cmd] || defaultMode;
  const oneTime = mode === BindingMode.oneTime;

  if (!!bindableDescription) {
    if (!!cmd && validCommands.includes(cmd)) {
      const type = TT.propertyBinding;
      const to = bindableDescription.property;
      const from = parseExpression(attributeValue);
      return { type, to, mode, from, oneTime };
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
    const to = attr;
    if (!!cmd && validCommands.includes(cmd)) {
      const from = parseExpression(attributeValue);
      return { type, to, mode, from, oneTime };
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

type CTCResult = [ITemplateDefinition, ITemplateDefinition];

type Bindables = { [pdName: string]: IBindableDescription };

describe(`TemplateCompiler - combinations`, function () {
  function setup(ctx: HTMLTestContext, ...globals: IRegistry[]) {
    const container = ctx.container;
    container.register(...globals);
    const sut = ctx.templateCompiler;
    const dom = ctx.dom;
    const resources = new RuntimeCompilationResources(container);
    return { container, dom, sut, resources };
  }

  describe('plain attributes', function () {
    eachCartesianJoinFactory([
      [
        TestContext.createHTMLTestContext
      ],
      [
        (ctx) => ['div']
      ] as ((ctx: HTMLTestContext) => [string])[],
      [
        (ctx) => ['foo', 'foo', 'bar'],
        (ctx) => ['foo.bar', 'foo', 'bar'],
        (ctx) => ['foo.bind', 'foo', 'bar'],
        (ctx) => ['value', 'value', 'value']
      ] as ((ctx: HTMLTestContext, $1: [string]) => [string, string, string])[],
      [
        (ctx, $1, [, , value]) => [`ref`,                     value, { type: TT.refBinding,       from: new AccessScopeExpression(value), to: 'element' }],
        (ctx, $1, [attr, to, value]) => [`${attr}.bind`,      value, { type: TT.propertyBinding,  from: new AccessScopeExpression(value), to, mode: BindingMode.toView,   oneTime: false }],
        (ctx, $1, [attr, to, value]) => [`${attr}.to-view`,   value, { type: TT.propertyBinding,  from: new AccessScopeExpression(value), to, mode: BindingMode.toView,   oneTime: false }],
        (ctx, $1, [attr, to, value]) => [`${attr}.one-time`,  value, { type: TT.propertyBinding,  from: new AccessScopeExpression(value), to, mode: BindingMode.oneTime,  oneTime: true  }],
        (ctx, $1, [attr, to, value]) => [`${attr}.from-view`, value, { type: TT.propertyBinding,  from: new AccessScopeExpression(value), to, mode: BindingMode.fromView, oneTime: false }],
        (ctx, $1, [attr, to, value]) => [`${attr}.two-way`,   value, { type: TT.propertyBinding,  from: new AccessScopeExpression(value), to, mode: BindingMode.twoWay,   oneTime: false }],
        (ctx, $1, [attr, to, value]) => [`${attr}.trigger`,   value, { type: HTT.listenerBinding, from: new AccessScopeExpression(value), to, strategy: DelegationStrategy.none,      preventDefault: true }],
        (ctx, $1, [attr, to, value]) => [`${attr}.delegate`,  value, { type: HTT.listenerBinding, from: new AccessScopeExpression(value), to, strategy: DelegationStrategy.bubbling,  preventDefault: false }],
        (ctx, $1, [attr, to, value]) => [`${attr}.capture`,   value, { type: HTT.listenerBinding, from: new AccessScopeExpression(value), to, strategy: DelegationStrategy.capturing, preventDefault: false }],
        (ctx, $1, [attr, to, value]) => [`${attr}.call`,      value, { type: TT.callBinding,      from: new AccessScopeExpression(value), to }]
      ] as ((ctx: HTMLTestContext, $1: [string], $2: [string, string, string]) => [string, string, any])[]
    ],                       (ctx, [el], $2, [n1, v1, i1]) => {
      const markup = `<${el} ${n1}="${v1}"></${el}>`;

      it(markup, function () {
        const input: ITemplateDefinition = {
          template: markup,
          instructions: [],
          surrogates: [],
        } as unknown as ITemplateDefinition;
        const expected = {
          template: ctx.createElementFromMarkup(`<template><${el} ${n1}="${v1}" class="au"></${el}></template>`),
          instructions: [[i1]],
          surrogates: [],
          build: buildNotRequired,
          scopeParts: [],
        };

        const { sut, resources, dom } = setup(ctx);

        const actual = sut.compile(dom, input, resources);

        verifyBindingInstructionsEqual(actual, expected);
      });
    });
  });

  describe('custom attributes', function () {
    eachCartesianJoinFactory([
      [
        TestContext.createHTMLTestContext
      ],
      // IAttributeDefinition.bindables
      [
        (ctx) => [undefined, undefined, 'value'],
        (ctx) => [{}, undefined,  'value'],
        (ctx) => [{ asdf: { attribute: 'bazBaz', property: 'bazBaz', mode: BindingMode.oneTime } }, BindingMode.oneTime, 'bazBaz'],
        (ctx) => [{ asdf: { attribute: 'bazBaz', property: 'bazBaz', mode: BindingMode.fromView } }, BindingMode.fromView, 'bazBaz'],
        (ctx) => [{ asdf: { attribute: 'bazBaz', property: 'bazBaz', mode: BindingMode.twoWay } }, BindingMode.twoWay, 'bazBaz'],
        (ctx) => [{ asdf: { attribute: 'bazBaz', property: 'bazBaz', mode: BindingMode.default } }, BindingMode.default, 'bazBaz']
      ] as ((ctx: HTMLTestContext) => [Record<string, IBindableDescription> | undefined, BindingMode | undefined, string])[],
      [
        (ctx) => ['foo',     '', class Foo {}],
        (ctx) => ['foo-foo', '', class FooFoo {}],
        (ctx) => ['foo',     'bar', class Foo {}],
        (ctx) => ['foo-foo', 'bar', class Foo {}]
      ] as ((ctx: HTMLTestContext) => [string, string, Constructable])[],
      // IAttributeDefinition.defaultBindingMode
      [
        (ctx) => undefined,
        (ctx) => BindingMode.oneTime,
        (ctx) => BindingMode.toView,
        (ctx) => BindingMode.fromView,
        (ctx) => BindingMode.twoWay
      ] as ((ctx: HTMLTestContext) => BindingMode | undefined)[],
      [
        (ctx, [, , to], [attr, value]) => [`${attr}`,           { type: TT.setProperty, to, value }],
        (ctx, [, mode, to], [attr, value], defaultMode) => [`${attr}.bind`,      { type: TT.propertyBinding, from: value.length > 0 ? new AccessScopeExpression(value) : new PrimitiveLiteralExpression(value), to, mode: (mode && mode !== BindingMode.default) ? mode : (defaultMode || BindingMode.toView) }],
        (ctx, [, , to],      [attr, value]) => [`${attr}.to-view`,   { type: TT.propertyBinding, from: value.length > 0 ? new AccessScopeExpression(value) : new PrimitiveLiteralExpression(value), to, mode: BindingMode.toView }],
        (ctx, [, , to],      [attr, value]) => [`${attr}.one-time`,  { type: TT.propertyBinding, from: value.length > 0 ? new AccessScopeExpression(value) : new PrimitiveLiteralExpression(value), to, mode: BindingMode.oneTime }],
        (ctx, [, , to],      [attr, value]) => [`${attr}.from-view`, { type: TT.propertyBinding, from: value.length > 0 ? new AccessScopeExpression(value) : new PrimitiveLiteralExpression(value), to, mode: BindingMode.fromView }],
        (ctx, [, , to],      [attr, value]) => [`${attr}.two-way`,   { type: TT.propertyBinding, from: value.length > 0 ? new AccessScopeExpression(value) : new PrimitiveLiteralExpression(value), to, mode: BindingMode.twoWay }]
      ] as ((ctx: HTMLTestContext, $1: [Record<string, IBindableDescription>, BindingMode, string], $2: [string, string, Constructable], $3: BindingMode) => [string, any])[]
    ],                       (ctx, [bindables], [attr, value, ctor], defaultBindingMode, [name, childInstruction]) => {
      if (childInstruction.mode !== undefined) {
        childInstruction.oneTime = childInstruction.mode === BindingMode.oneTime;
      }
      const def = { name: attr, defaultBindingMode, bindables };
      const markup = `<div ${name}="${value}"></div>`;

      it(`${markup}  CustomAttribute=${JSON.stringify(def)}`, function () {
        const input: ITemplateDefinition = {
          template: markup,
          instructions: [],
          surrogates: [],
        } as unknown as ITemplateDefinition;
        const instruction = {
          type: TT.hydrateAttribute,
          res: def.name,
          instructions: [childInstruction],
        };
        const expected = {
          template: ctx.createElementFromMarkup(`<template><div ${name}="${value}" class="au"></div></template>`),
          instructions: [[instruction]],
          surrogates: [],
          build: buildNotRequired,
          scopeParts: [],
        };

        const $def = CustomAttribute.define(def, ctor);
        const { sut, resources, dom  } = setup(ctx, $def);

        const actual = sut.compile(dom, input, resources);

        verifyBindingInstructionsEqual(actual, expected);
      });
    });
  });

  describe('custom attributes with multiple bindings', function () {

    eachCartesianJoinFactory([
      [
        TestContext.createHTMLTestContext
      ],
      [
        (ctx) => 'foo',
        (ctx) => 'bar42'
      ] as ((ctx: HTMLTestContext) => string)[],
      [
        (ctx, pdName) => pdName,
        (ctx, pdName) => `${pdName}Bar` // descriptor.property is different from the actual property name
      ] as ((ctx: HTMLTestContext, $1: string) => string)[],
      [
        (ctx, pdName, pdProp) => ({ [pdName]: { property: pdProp, attribute: kebabCase(pdProp), mode: BindingMode.default  } }),
        (ctx, pdName, pdProp) => ({ [pdName]: { property: pdProp, attribute: kebabCase(pdProp), mode: BindingMode.oneTime  } }),
        (ctx, pdName, pdProp) => ({ [pdName]: { property: pdProp, attribute: kebabCase(pdProp), mode: BindingMode.toView   } }),
        (ctx, pdName, pdProp) => ({ [pdName]: { property: pdProp, attribute: kebabCase(pdProp), mode: BindingMode.fromView } }),
        (ctx, pdName, pdProp) => ({ [pdName]: { property: pdProp, attribute: kebabCase(pdProp), mode: BindingMode.twoWay   } })
      ] as ((ctx: HTMLTestContext, $1: string, $2: string) => Bindables)[],
      [
        (ctx) => [``,           `''`],
        (ctx) => [``,           `\${a}`],
        (ctx) => [`.bind`,      `''`],
        (ctx) => [`.one-time`,  `''`],
        (ctx) => [`.to-view`,   `''`],
        (ctx) => [`.from-view`, `''`],
        (ctx) => [`.two-way`,   `''`]
      ] as ((ctx: HTMLTestContext) => [string, string])[],
      [
        (ctx, pdName, pdProp, bindables, [cmd]) => [bindables[pdName], `${pdProp}${cmd}`],
        (ctx, pdName, pdProp, bindables, [cmd]) => [bindables[pdName], `${pdProp}.qux${cmd}`],
        (ctx, pdName, pdProp, bindables, [cmd]) => [null,              `${pdProp}Qux${cmd}`]
        // TODO: test fallback to attribute name when no matching binding exists (or throw if we don't want to support this)
      ] as ((ctx: HTMLTestContext, $1: string, $2: string, $3: Bindables, $4: [string, string]) => [IBindableDescription, string])[]
    ],                       (ctx, pdName, pdProp, bindables, [cmd, attrValue], [bindableDescription, attrName]) => {
      it(`div - pdName=${pdName}  pdProp=${pdProp}  cmd=${cmd}  attrName=${attrName}  attrValue="${attrValue}"`, function () {

        const { sut, resources, dom  } = setup(
          ctx,
          CustomAttribute.define({ name: 'asdf', bindables }, class FooBar {})
        );

        const instruction = createAttributeInstruction(bindableDescription, attrName, attrValue, true);

        const [input, output] = createCustomAttribute(ctx, 'asdf', true, [[attrName, attrValue]], [instruction], [], []) as [ITemplateDefinition, ITemplateDefinition];

        if (attrName.endsWith('.qux')) {
          let e;
          try {
            sut.compile(dom, input, resources);
          } catch (err) {
            // console.log('EXPECTED: ', JSON.stringify(output.instructions[0][0], null, 2));
            // console.log('ACTUAL: ', JSON.stringify(actual.instructions[0][0], null, 2));
            e = err;
          }
          assert.instanceOf(e, Error);
        } else {
          // enableTracing();
          // Tracer.enableLiveLogging(SymbolTraceWriter);
          const actual = sut.compile(dom, input, resources);
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
    });
  });

  describe('nested template controllers (one per element)', function () {

    eachCartesianJoinFactory([
      [
        TestContext.createHTMLTestContext
      ],
      [
        (ctx) => createTemplateController(ctx, 'foo',        'foo',    '',              'div',      false),
        (ctx) => createTemplateController(ctx, 'foo',        'foo',    'bar',           'div',      false),
        (ctx) => createTemplateController(ctx, 'if.bind',    'if',     'show',          'div',      false),
        (ctx) => createTemplateController(ctx, 'if.bind',    'if',     'show',          'template', false),
        (ctx) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'div',      false),
        (ctx) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'template', false)
      ] as ((ctx: HTMLTestContext) => CTCResult)[],
      [
        (ctx, [input, output]) => createTemplateController(ctx, 'foo',        'foo',    '',              'div',      false, output.instructions[0][0], input.template),
        (ctx, [input, output]) => createTemplateController(ctx, 'foo',        'foo',    'bar',           'div',      false, output.instructions[0][0], input.template),
        (ctx, [input, output]) => createTemplateController(ctx, 'if.bind',    'if',     'show',          'div',      false, output.instructions[0][0], input.template),
        (ctx, [input, output]) => createTemplateController(ctx, 'else',       'else',   '',              'div',      false, output.instructions[0][0], input.template),
        (ctx, [input, output]) => createTemplateController(ctx, 'else',       'else',   '',              'template', false, output.instructions[0][0], input.template),
        (ctx, [input, output]) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'div',      false, output.instructions[0][0], input.template),
        (ctx, [input, output]) => createTemplateController(ctx, 'with.bind',  'with',   'foo',           'div',      false, output.instructions[0][0], input.template),
        (ctx, [input, output]) => createTemplateController(ctx, 'with.bind',  'with',   'foo',           'template', false, output.instructions[0][0], input.template)
      ] as ((ctx: HTMLTestContext, $1: CTCResult) => CTCResult)[],
      [
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'foo',        'foo',    '',              'div',      false, output.instructions[0][0], input.template),
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'foo',        'foo',    'bar',           'div',      false, output.instructions[0][0], input.template),
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'foo',        'foo',    'bar',           'template', false, output.instructions[0][0], input.template),
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'div',      false, output.instructions[0][0], input.template),
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'template', false, output.instructions[0][0], input.template)
      ] as ((ctx: HTMLTestContext, $1: CTCResult, $2: CTCResult) => CTCResult)[],
      [
        (ctx, $1, $2, [input, output]) => createTemplateController(ctx, 'bar',        'bar',    '',              'div',      true, output.instructions[0][0], input.template),
        (ctx, $1, $2, [input, output]) => createTemplateController(ctx, 'bar',        'bar',    'baz',           'div',      true, output.instructions[0][0], input.template),
        (ctx, $1, $2, [input, output]) => createTemplateController(ctx, 'bar',        'bar',    'baz',           'template', true, output.instructions[0][0], input.template),
        (ctx, $1, $2, [input, output]) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'div',      true, output.instructions[0][0], input.template),
        (ctx, $1, $2, [input, output]) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'template', true, output.instructions[0][0], input.template)
      ] as ((ctx: HTMLTestContext, $1: CTCResult, $2: CTCResult, $3: CTCResult) => CTCResult)[]
    ],                       (ctx, $1, $2, $3, [input, output]) => {

      it(`${input.template}`, function () {

        const { sut, resources, dom } = setup(
          ctx,
          CustomAttribute.define({ name: 'foo', isTemplateController: true }, class Foo {}),
          CustomAttribute.define({ name: 'bar', isTemplateController: true }, class Bar {}),
          CustomAttribute.define({ name: 'baz', isTemplateController: true }, class Baz {}),
          CustomAttribute.define({ name: 'qux', isTemplateController: true }, class Qux {})
        );

        const actual = sut.compile(dom, input, resources);
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

    eachCartesianJoinFactory([
      [
        TestContext.createHTMLTestContext
      ],
      [
        (ctx) => createTemplateController(ctx, 'foo',        'foo',    '',              'div',      false),
        (ctx) => createTemplateController(ctx, 'foo',        'foo',    'bar',           'div',      false),
        (ctx) => createTemplateController(ctx, 'if.bind',    'if',     'show',          'div',      false),
        (ctx) => createTemplateController(ctx, 'if.bind',    'if',     'show',          'template', false),
        (ctx) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'div',      false),
        (ctx) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'template', false)
      ] as ((ctx: HTMLTestContext) => CTCResult)[],
      [
        (ctx, [input, output]) => createTemplateController(ctx, 'bar',        'bar',    '',              null,       false, output.instructions[0][0], input.template),
        (ctx, [input, output]) => createTemplateController(ctx, 'else',       'else',   '',              null,       false, output.instructions[0][0], input.template),
        (ctx, [input, output]) => createTemplateController(ctx, 'with.bind',  'with',   'foo',           null,       false, output.instructions[0][0], input.template)
      ] as ((ctx: HTMLTestContext, $1: CTCResult) => CTCResult)[],
      [
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'foo',        'foo',    '',              'div',      false, output.instructions[0][0], input.template),
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'foo',        'foo',    'bar',           'div',      false, output.instructions[0][0], input.template),
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'foo',        'foo',    'bar',           'template', false, output.instructions[0][0], input.template),
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'baz',        'baz',    '',              null,       false, output.instructions[0][0], input.template),
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'div',      false, output.instructions[0][0], input.template),
        (ctx, $1, [input, output]) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'template', false, output.instructions[0][0], input.template)
      ] as ((ctx: HTMLTestContext, $1: CTCResult, $2: CTCResult) => CTCResult)[],
      [
        (ctx, $1, $2, [input, output]) => createTemplateController(ctx, 'qux',        'qux',    '',              null,       false, output.instructions[0][0], input.template),
        (ctx, $1, $2, [input, output]) => createTemplateController(ctx, 'if.bind',    'if',     '',              'template', false, output.instructions[0][0], input.template),
        (ctx, $1, $2, [input, output]) => createTemplateController(ctx, 'if.bind',    'if',     '',              'div',      false, output.instructions[0][0], input.template),
        (ctx, $1, $2, [input, output]) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'div',      false, output.instructions[0][0], input.template),
        (ctx, $1, $2, [input, output]) => createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'template', false, output.instructions[0][0], input.template)
      ] as ((ctx: HTMLTestContext, $1: CTCResult, $2: CTCResult, $3: CTCResult) => CTCResult)[],
      [
        (ctx, $1, $2, $3, [input, output]) => createTemplateController(ctx, 'quux',       'quux',   '',              null,       true, output.instructions[0][0], input.template)
      ] as ((ctx: HTMLTestContext, $1: CTCResult, $2: CTCResult, $3: CTCResult, $4: CTCResult) => CTCResult)[]
    ],                       (ctx, $1, $2, $3, $4, [input, output]) => {

      it(`${input.template}`, function () {

        const { sut, resources, dom } = setup(
          ctx,
          CustomAttribute.define({ name: 'foo',  isTemplateController: true }, class Foo {}),
          CustomAttribute.define({ name: 'bar',  isTemplateController: true }, class Bar {}),
          CustomAttribute.define({ name: 'baz',  isTemplateController: true }, class Baz {}),
          CustomAttribute.define({ name: 'qux',  isTemplateController: true }, class Qux {}),
          CustomAttribute.define({ name: 'quux', isTemplateController: true }, class Quux {})
        );

        const actual = sut.compile(dom, input, resources);
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

    eachCartesianJoinFactory([
      [
        TestContext.createHTMLTestContext
      ],
      [
        (ctx) => []
      ] as ((ctx: HTMLTestContext) => CTCResult[])[],
      [
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'foo',        'foo',    '',              'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'foo',        'foo',    '',              'template', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'foo',        'foo',    'bar',           'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'if.bind',    'if',     'show',          'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'div', false)); }
      ] as ((ctx: HTMLTestContext, results: CTCResult[]) => void)[],
      [
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'foo',        'foo',    '',              'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'foo',        'foo',    'bar',           'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'if.bind',    'if',     'show',          'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'if.bind',    'if',     'show',          'template', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'else',       'else',   '',              'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'template', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'with.bind',  'with',   'bar',           'div', false)); }
      ] as ((ctx: HTMLTestContext, results: CTCResult[]) => void)[],
      [
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'foo',        'foo',    '',              'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'foo',        'foo',    'bar',           'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'div', false)); },
        (ctx, results: CTCResult[]) => { results.push(createTemplateController(ctx, 'repeat.for', 'repeat', 'item of items', 'template', false)); }
      ] as ((ctx: HTMLTestContext, results: CTCResult[]) => void)[]
    ],                       (ctx, [[input1, output1], [input2, output2], [input3, output3]]) => {
      const input: ITemplateDefinition = {
        template: `<div>${input1.template}${input2.template}${input3.template}</div>`,
        instructions: []
      } as unknown as ITemplateDefinition;

      it(`${input.template}`, function () {

        const { sut, resources, dom } = setup(
          ctx,
          CustomAttribute.define({ name: 'foo', isTemplateController: true }, class Foo {}),
          CustomAttribute.define({ name: 'bar', isTemplateController: true }, class Bar {}),
          CustomAttribute.define({ name: 'baz', isTemplateController: true }, class Baz {})
        );

        const output = {
          template: ctx.createElementFromMarkup(`<template><div>${output1.template['outerHTML']}${output2.template['outerHTML']}${output3.template['outerHTML']}</div></template>`),
          instructions: [output1.instructions[0], output2.instructions[0], output3.instructions[0]],
          build: buildNotRequired,
          scopeParts: [],
        };
        // enableTracing();
        // Tracer.enableLiveLogging(SymbolTraceWriter);
        const actual = sut.compile(dom, input, resources);
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
        TestContext.createHTMLTestContext
      ],
      [
        (ctx) => 'foo',
        (ctx) => 'bar42'
      ] as ((ctx: HTMLTestContext) => string)[],
      [
        (ctx, pdName) => pdName,
        (ctx, pdName) => `${pdName}Bar` // descriptor.property is different from the actual property name
      ] as ((ctx: HTMLTestContext, $1: string) => string)[],
      [
        (ctx, pdName, pdProp) => kebabCase(pdProp),
        (ctx, pdName, pdProp) => `${kebabCase(pdProp)}-baz` // descriptor.attribute is different from kebab-cased descriptor.property
      ] as ((ctx: HTMLTestContext, $1: string, $2: string) => string)[],
      [
        (ctx, pdName, pdProp, pdAttr) => ({ [pdName]: { property: pdProp, attribute: pdAttr, mode: BindingMode.default  } }),
        (ctx, pdName, pdProp, pdAttr) => ({ [pdName]: { property: pdProp, attribute: pdAttr, mode: BindingMode.oneTime  } }),
        (ctx, pdName, pdProp, pdAttr) => ({ [pdName]: { property: pdProp, attribute: pdAttr, mode: BindingMode.toView   } }),
        (ctx, pdName, pdProp, pdAttr) => ({ [pdName]: { property: pdProp, attribute: pdAttr, mode: BindingMode.fromView } }),
        (ctx, pdName, pdProp, pdAttr) => ({ [pdName]: { property: pdProp, attribute: pdAttr, mode: BindingMode.twoWay   } })
      ] as ((ctx: HTMLTestContext, $1: string, $2: string, $3: string) => Bindables)[],
      [
        (ctx) => [``,           `''`],
        (ctx) => [``,           `\${a}`],
        (ctx) => [`.bind`,      `''`],
        (ctx) => [`.one-time`,  `''`],
        (ctx) => [`.to-view`,   `''`],
        (ctx) => [`.from-view`, `''`],
        (ctx) => [`.two-way`,   `''`]
      ] as ((ctx: HTMLTestContext) => [string, string])[],
      [
        (ctx, pdName, pdProp, pdAttr, bindables, [cmd]) => [bindables[pdName], `${pdAttr}${cmd}`],
        (ctx, pdName, pdProp, pdAttr, bindables, [cmd]) => [bindables[pdName], `${pdAttr}.qux${cmd}`],
        (ctx, pdName, pdProp, pdAttr, bindables, [cmd]) => [null,              `${pdAttr}-qux${cmd}`]
      ] as ((ctx: HTMLTestContext, $1: string, $2: string, $3: string, $4: Bindables, $5: [string, string]) => [IBindableDescription, string])[],
      [
        (ctx) => `''`
      ] as ((ctx: HTMLTestContext) => string)[]
    ],                       (ctx, pdName, pdProp, pdAttr, bindables, [cmd, attrValue], [bindableDescription, attrName]) => {
      it(`customElement - pdName=${pdName}  pdProp=${pdProp}  pdAttr=${pdAttr}  cmd=${cmd}  attrName=${attrName}  attrValue="${attrValue}"`, function () {

        const { sut, resources, dom } = setup(
          ctx,
          CustomElement.define({ name: 'foobar', bindables }, class FooBar {})
        );

        const instruction = createAttributeInstruction(bindableDescription, attrName, attrValue, false);
        const instructions = instruction == null ? [] : [instruction];
        const childInstructions = !!bindableDescription ? instructions : [];
        const siblingInstructions = !bindableDescription ? instructions : [];

        const [input, output] = createCustomElement({
          ctx,
          tagName: 'foobar',
          finalize: true,
          attributes: [[attrName, attrValue]],
          childInstructions,
          siblingInstructions,
          nestedElInstructions: []
        }) as [ITemplateDefinition, ITemplateDefinition];

        if (attrName.endsWith('.qux')) {
          let e;
          try {
            sut.compile(dom, input, resources);
          } catch (err) {
            // console.log('EXPECTED: ', JSON.stringify(output.instructions[0][0], null, 2));
            // console.log('ACTUAL: ', JSON.stringify(actual.instructions[0][0], null, 2));
            e = err;
          }
          assert.instanceOf(e, Error);
        } else {
          // enableTracing();
          // Tracer.enableLiveLogging(SymbolTraceWriter);
          const actual = sut.compile(dom, input, resources);
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
    });
  });

  describe('custom elements with capture attrs', function () {
    interface ICaptureAttrsTestCase {
      getInputOutput: (ctx: HTMLTestContext) => ReturnType<typeof createCustomElement>;
    }

    eachCartesianJoinFactory([
      [
        TestContext.createHTMLTestContext
      ],
      [
        () => CustomElement.define({ name: 'foo', captureAttrs: AttributeFilter.all }, class Foo {}),
        () => CustomElement.define({ name: 'foo', bindables: ['attr-0'], captureAttrs: AttributeFilter.all })
      ] as (() => ICustomElementType & IRegistry)[],
      [
        (ctx, CE: ICustomElementType) => {
          const testAttrs: [string, string][] = [0,0,0,0,0].map((_, idx) => [`attr-${idx}`, `attr-v-${idx}`]);
          const capturedAttrs = testAttrs
            .filter(([attrName]) => CE.description.bindables[attrName] === void 0)
            .map(([attrName, attrValue]) => ({ name: attrName, value: attrValue }));
          const uncapturedAttrs = testAttrs
            .filter(([attrName]) => CE.description.bindables[attrName] !== void 0);
          const attrsOnTemplate = uncapturedAttrs
            .map(([attrName, attrValue]) => `${attrName}="${attrValue}"`)
            .join(' ');
          const childInstructions = uncapturedAttrs
            .map(([attrName, attrValue]) => ({ type: 're', to: attrName, value: attrValue }));
          return createCustomElement({
            ctx,
            tagName: `foo`,
            finalize: true,
            attributes: testAttrs,
            childInstructions: childInstructions,
            siblingInstructions: [],
            nestedElInstructions: [],
            capturedAttrs: capturedAttrs,
            customOutputAttributeMarkup: attrsOnTemplate
          });
        },
        // (ctx) => createCustomElement({
        //   ctx,
        //   tagName: `bar`,
        //   finalize: true,
        //   attributes: Array.from({ length: 5 }).map((_, idx) => [`attr-${idx}`, `attr-v-${idx}`]),
        //   childInstructions: [],
        //   siblingInstructions: [],
        //   nestedElInstructions: []
        // }),
        // (ctx) => createCustomElement({
        //   ctx,
        //   tagName: `baz`,
        //   finalize: true,
        //   attributes: Array.from({ length: 5 }).map((_, idx) => [`attr-${idx}`, `attr-v-${idx}`]),
        //   childInstructions: [],
        //   siblingInstructions: [],
        //   nestedElInstructions: []
        // })
      ] as ((ctx: HTMLTestContext) => CTCResult)[]
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
    ],                       (ctx, CE, [input, output]) => {
      it(`${input.template}`, function () {

        const { sut, resources, dom } = setup(
          ctx,
          CE,
          // CustomElement.define({ name: 'foo', captureAttrs: AttributeFilter.all }, class Foo {}),
          // CustomElement.define({ name: 'bar' }, class Bar {}),
          // CustomElement.define({ name: 'baz' }, class Baz {})
        );

        // enableTracing();
        // Tracer.enableLiveLogging(SymbolTraceWriter);
        const actual = sut.compile(dom, input, resources);
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
