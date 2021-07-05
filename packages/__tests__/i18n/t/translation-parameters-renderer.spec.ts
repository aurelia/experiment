import { I18nConfiguration, TranslationBinding, TranslationParametersAttributePattern, TranslationParametersBindingCommand, TranslationParametersBindingInstruction, TranslationParametersBindingRenderer, TranslationParametersInstructionType } from '@aurelia/i18n';
import { DI } from '@aurelia/kernel';
import {
  AnyBindingExpression,
  BindingType,
  IExpressionParser,
  IRenderer,
  IObserverLocator,
  LifecycleFlags,
  StandardConfiguration,
  IHydratableController,
  IBinding,
  CallBindingInstruction,
  AttrSyntax,
  BindingCommand,
  BindingCommandInstance,
  IAttributePattern,
  IPlatform,
} from '@aurelia/runtime-html';
import { assert, PLATFORM, TestContext } from '@aurelia/testing';

describe('TranslationParametersAttributePattern', function () {
  function createFixture() {
    const container = DI.createContainer();
    container.register(TranslationParametersAttributePattern);
    return container.get(IAttributePattern);
  }

  it('creates attribute syntax without `to`', function () {
    const sut = createFixture();
    const pattern = 't-params.bind';
    const value = '{foo: "bar"}';

    const actual: AttrSyntax = sut[pattern](pattern, value, []);
    assert.equal(actual.command, pattern);
    assert.equal(actual.rawName, pattern);
    assert.equal(actual.rawValue, value);
    assert.equal(actual.target, '');
  });
});

describe('TranslationParametersBindingCommand', function () {
  function createFixture() {
    const container = DI.createContainer();
    container.register(TranslationParametersBindingCommand);
    return container.get<BindingCommandInstance>(BindingCommand.keyFrom(`t-params.bind`));
  }

  it('registers the `t-params.bind` command', function () {
    const sut = createFixture();
    assert.instanceOf(sut, TranslationParametersBindingCommand);
  });

  it('compiles the binding to a TranslationParametersBindingInstruction', function () {
    const sut = createFixture();
    const syntax: AttrSyntax = { command: 't-params.bind', rawName: 't-params.bind', rawValue: '{foo: "bar"}', target: '' };
    const actual = sut.build({
      node: { nodeName: 'abc' } as unknown as Element,
      attr: syntax,
      bindable: null,
      def: null,
      expr: { syntax } as unknown as AnyBindingExpression
    });

    assert.instanceOf(actual, TranslationParametersBindingInstruction);
  });
});

describe('TranslationParametersBindingRenderer', function () {

  function createFixture() {
    const { container } = TestContext.create();
    container.register(StandardConfiguration, I18nConfiguration);
    return container;
  }

  it('instantiated with instruction type', function () {
    const container = createFixture();
    const sut: IRenderer = new TranslationParametersBindingRenderer(container.get(IExpressionParser), container.get(IObserverLocator), container.get(IPlatform));
    assert.equal(sut.instructionType, TranslationParametersInstructionType);
  });

  it('#render instantiates TranslationBinding if there are none existing', function () {
    const container = createFixture();
    const sut: IRenderer = new TranslationParametersBindingRenderer(container.get(IExpressionParser), container.get(IObserverLocator), container.get(IPlatform));
    const expressionParser = container.get(IExpressionParser);
    const controller = ({ bindings: [], addBinding(binding) { (controller.bindings as unknown as IBinding[]).push(binding); } } as unknown as IHydratableController);
    const callBindingInstruction: CallBindingInstruction = { from: expressionParser.parse('{foo: "bar"}', BindingType.BindCommand) } as unknown as CallBindingInstruction;

    sut.render(
      LifecycleFlags.none,
      controller,
      PLATFORM.document.createElement('span'),
      callBindingInstruction,
    );

    assert.instanceOf(controller.bindings[0], TranslationBinding);
  });

  it('#render add the paramExpr to the existing TranslationBinding for the target element', function () {
    const container = createFixture();
    const sut: IRenderer = new TranslationParametersBindingRenderer(container.get(IExpressionParser), container.get(IObserverLocator), container.get(IPlatform));
    const expressionParser = container.get(IExpressionParser);
    const targetElement = PLATFORM.document.createElement('span');
    const binding = new TranslationBinding(targetElement, container.get(IObserverLocator), container, container.get(IPlatform));
    const hydratable = ({ bindings: [binding] } as unknown as IHydratableController);
    const paramExpr = expressionParser.parse('{foo: "bar"}', BindingType.BindCommand);
    const callBindingInstruction: CallBindingInstruction = { from: paramExpr } as unknown as CallBindingInstruction;

    sut.render(
      LifecycleFlags.none,
      hydratable,
      targetElement,
      callBindingInstruction,
    );

    assert.equal(binding['parameter'].expr, paramExpr);
  });
});
