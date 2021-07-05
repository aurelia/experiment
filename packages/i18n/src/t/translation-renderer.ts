import { camelCase } from '@aurelia/kernel';
import { TranslationBinding } from './translation-binding.js';
import {
  BindingMode,
  BindingType,
  IExpressionParser,
  IRenderer,
  renderer,
  IObserverLocator,
  IsBindingBehavior,
  LifecycleFlags,
  IHydratableController,
  AttrSyntax,
  IPlatform,
  IAttrMapper,
} from '@aurelia/runtime-html';

import type {
  CallBindingInstruction,
  BindingCommandInstance,
} from '@aurelia/runtime-html';
import { ICommandBuildInfo } from '@aurelia/runtime-html/dist/resources/binding-command';

export const TranslationInstructionType = 'tt';

export class TranslationAttributePattern {
  [key: string]: ((rawName: string, rawValue: string, parts: string[]) => AttrSyntax);

  public static registerAlias(alias: string) {
    this.prototype[alias] = function (rawName: string, rawValue: string, parts: string[]): AttrSyntax {
      return new AttrSyntax(rawName, rawValue, '', alias);
    };
  }
}

export class TranslationBindingInstruction {
  public readonly type: string = TranslationInstructionType;
  public mode: BindingMode.toView = BindingMode.toView;

  public constructor(
    public from: IsBindingBehavior,
    public to: string,
  ) { }
}

export class TranslationBindingCommand implements BindingCommandInstance {
  public readonly bindingType: BindingType.CustomCommand = BindingType.CustomCommand;

  public static get inject() { return [IAttrMapper]; }
  public constructor(private readonly m: IAttrMapper) {}

  public build(info: ICommandBuildInfo): TranslationBindingInstruction {
    let target: string;
    if (info.bindable == null) {
      target = this.m.map(info.node, info.attr.target)
        // if the mapper doesn't know how to map it
        // use the default behavior, which is camel-casing
        ?? camelCase(info.attr.target);
    } else {
      target = info.bindable.property;
    }
    return new TranslationBindingInstruction(info.expr as IsBindingBehavior, target);
  }
}

@renderer(TranslationInstructionType)
export class TranslationBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IObserverLocator private readonly observerLocator: IObserverLocator,
    @IPlatform private readonly platform: IPlatform,
  ) { }

  public render(
    flags: LifecycleFlags,
    controller: IHydratableController,
    target: HTMLElement,
    instruction: CallBindingInstruction,
  ): void {
    TranslationBinding.create({
      parser: this.parser,
      observerLocator: this.observerLocator,
      context: controller.container,
      controller,
      target,
      instruction,
      platform: this.platform,
    });
  }
}

export const TranslationBindInstructionType = 'tbt';

export class TranslationBindAttributePattern {
  [key: string]: ((rawName: string, rawValue: string, parts: string[]) => AttrSyntax);

  public static registerAlias(alias: string) {
    const bindPattern = `${alias}.bind`;
    this.prototype[bindPattern] = function (rawName: string, rawValue: string, parts: string[]): AttrSyntax {
      return new AttrSyntax(rawName, rawValue, parts[1], bindPattern);
    };
  }
}

export class TranslationBindBindingInstruction {
  public readonly type: string = TranslationBindInstructionType;
  public mode: BindingMode.toView = BindingMode.toView;

  public constructor(
    public from: IsBindingBehavior,
    public to: string,
  ) { }
}

export class TranslationBindBindingCommand implements BindingCommandInstance {
  public readonly bindingType: BindingType.BindCommand = BindingType.BindCommand;

  public static get inject() { return [IAttrMapper]; }
  public constructor(private readonly m: IAttrMapper) {}

  public build(info: ICommandBuildInfo): TranslationBindingInstruction {
    let target: string;
    if (info.bindable == null) {
      target = this.m.map(info.node, info.attr.target)
        // if the mapper doesn't know how to map it
        // use the default behavior, which is camel-casing
        ?? camelCase(info.attr.target);
    } else {
      target = info.bindable.property;
    }
    return new TranslationBindBindingInstruction(info.expr as IsBindingBehavior, target);
  }
}

@renderer(TranslationBindInstructionType)
export class TranslationBindBindingRenderer implements IRenderer {
  public constructor(
    @IExpressionParser private readonly parser: IExpressionParser,
    @IObserverLocator private readonly observerLocator: IObserverLocator,
    @IPlatform private readonly platform: IPlatform,
  ) { }

  public render(
    flags: LifecycleFlags,
    controller: IHydratableController,
    target: HTMLElement,
    instruction: CallBindingInstruction,
  ): void {
    TranslationBinding.create({
      parser: this.parser,
      observerLocator: this.observerLocator,
      context: controller.container,
      controller,
      target,
      instruction,
      platform: this.platform
    });
  }
}
