import { DI, emptyArray, Registration, toArray, ILogger, camelCase, Protocol, ResourceDefinition, ResourceType, Metadata, noop } from '@aurelia/kernel';
import { BindingMode, BindingType, Char, IExpressionParser, PrimitiveLiteralExpression } from '@aurelia/runtime';
import { IAttrMapper } from './attribute-mapper.js';
import { ITemplateElementFactory } from './template-element-factory.js';
import {
  HydrateAttributeInstruction,
  HydrateElementInstruction,
  HydrateLetElementInstruction,
  HydrateTemplateController,
  InterpolationInstruction,
  LetBindingInstruction,
  SetAttributeInstruction,
  SetClassAttributeInstruction,
  SetPropertyInstruction,
  SetStyleAttributeInstruction,
  TextBindingInstruction,
  ITemplateCompiler,
  PropertyBindingInstruction,
} from './renderer.js';
import { IPlatform } from './platform.js';
import { Bindable, BindableDefinition } from './bindable.js';
import { AttrSyntax, IAttributeParser } from './resources/attribute-pattern.js';
import { CustomAttribute } from './resources/custom-attribute.js';
import { CustomElement, CustomElementDefinition } from './resources/custom-element.js';
import { BindingCommand } from './resources/binding-command.js';
import { createLookup } from './utilities-html.js';
import { allResources } from './utilities-di.js';

import type {
  IContainer,
  IResolver,
  Constructable,
} from '@aurelia/kernel';
import type { AnyBindingExpression } from '@aurelia/runtime';
import type { CustomAttributeDefinition } from './resources/custom-attribute.js';
import type { PartialCustomElementDefinition } from './resources/custom-element.js';
import type { IProjections } from './resources/slot-injectables.js';
import type { BindingCommandInstance, ICommandBuildInfo } from './resources/binding-command.js';
import type { ICompliationInstruction, IInstruction, } from './renderer.js';

export class TemplateCompiler implements ITemplateCompiler {
  public static register(container: IContainer): IResolver<ITemplateCompiler> {
    return Registration.singleton(ITemplateCompiler, this).register(container);
  }

  public debug: boolean = false;
  public resolveResources: boolean = true;

  public compile(
    partialDefinition: PartialCustomElementDefinition,
    container: IContainer,
    compilationInstruction: ICompliationInstruction | null,
  ): CustomElementDefinition {
    const definition = CustomElementDefinition.getOrCreate(partialDefinition);
    if (definition.template === null || definition.template === void 0) {
      return definition;
    }
    if (definition.needsCompile === false) {
      return definition;
    }
    compilationInstruction ??= emptyCompilationInstructions;

    const context = new CompilationContext(partialDefinition, container, compilationInstruction, null, null, void 0);
    const template = typeof definition.template === 'string' || !partialDefinition.enhance
      ? context._templateFactory.createTemplate(definition.template)
      : definition.template as HTMLElement;
    const isTemplateElement = template.nodeName === 'TEMPLATE' && (template as HTMLTemplateElement).content != null;
    const content = isTemplateElement ? (template as HTMLTemplateElement).content : template;
    const hooks = container.get(allResources(ITemplateCompilerHooks));
    const ii = hooks.length;
    let i = 0;
    if (ii > 0) {
      while (ii > i) {
        hooks[i].compiling?.(template);
        ++i;
      }
    }

    if (template.hasAttribute(localTemplateIdentifier)) {
      if (__DEV__)
        throw new Error('The root cannot be a local template itself.');
      else
        throw new Error('AUR0701');
    }
    this._compileLocalElement(content, context);
    this._compileNode(content, context);

    return CustomElementDefinition.create({
      ...partialDefinition,
      name: partialDefinition.name || CustomElement.generateName(),
      dependencies: (partialDefinition.dependencies ?? emptyArray).concat(context.deps ?? emptyArray),
      instructions: context.rows,
      surrogates: isTemplateElement
        ? this._compileSurrogate(template, context)
        : emptyArray,
      template,
      hasSlots: context.hasSlot,
      needsCompile: false,
    });
  }

  /** @internal */
  private _compileSurrogate(el: Element, context: CompilationContext): IInstruction[] {
    const instructions: IInstruction[] = [];
    const attrs = el.attributes;
    const exprParser = context._exprParser;
    let ii = attrs.length;
    let i = 0;
    let attr: Attr;
    let attrName: string;
    let attrValue: string;
    let attrSyntax: AttrSyntax;
    let attrDef: CustomAttributeDefinition | null = null;
    let attrInstructions: HydrateAttributeInstruction[] | undefined;
    let attrBindableInstructions: IInstruction[];
    // eslint-disable-next-line
    let bindableInfo: BindablesInfo<0> | BindablesInfo<1>;
    let primaryBindable: BindableDefinition;
    let bindingCommand: BindingCommandInstance | null = null;
    let expr: AnyBindingExpression;
    let isMultiBindings: boolean;
    let realAttrTarget: string;
    let realAttrValue: string;

    for (; ii > i; ++i) {
      attr = attrs[i];
      attrName = attr.name;
      attrValue = attr.value;
      attrSyntax = context._attrParser.parse(attrName, attrValue);

      realAttrTarget = attrSyntax.target;
      realAttrValue = attrSyntax.rawValue;

      if (invalidSurrogateAttribute[realAttrTarget]) {
        if (__DEV__)
          throw new Error(`Attribute ${attrName} is invalid on surrogate.`);
        else
          throw new Error(`AUR0702:${attrName}`);
      }

      bindingCommand = context._createCommand(attrSyntax);
      if (bindingCommand !== null && bindingCommand.bindingType & BindingType.IgnoreAttr) {
        // when the binding command overrides everything
        // just pass the target as is to the binding command, and treat it as a normal attribute:
        // active.class="..."
        // background.style="..."
        // my-attr.attr="..."
        expr = exprParser.parse(realAttrValue, bindingCommand.bindingType);

        commandBuildInfo.node = el;
        commandBuildInfo.attr = attrSyntax;
        commandBuildInfo.expr = expr;
        commandBuildInfo.bindable = null;
        commandBuildInfo.def = null;
        instructions.push(bindingCommand.build(commandBuildInfo));

        // to next attribute
        continue;
      }

      attrDef = context._findAttr(realAttrTarget);
      if (attrDef !== null) {
        if (attrDef.isTemplateController) {
          if (__DEV__)
            throw new Error(`Template controller ${realAttrTarget} is invalid on surrogate.`);
          else
            throw new Error(`AUR0703:${realAttrTarget}`);
        }
        bindableInfo = BindablesInfo.from(attrDef, true);
        // Custom attributes are always in multiple binding mode,
        // except when they can't be
        // When they cannot be:
        //        * has explicit configuration noMultiBindings: false
        //        * has binding command, ie: <div my-attr.bind="...">.
        //          In this scenario, the value of the custom attributes is required to be a valid expression
        //        * has no colon: ie: <div my-attr="abcd">
        //          In this scenario, it's simply invalid syntax.
        //          Consider style attribute rule-value pair: <div style="rule: ruleValue">
        isMultiBindings = attrDef.noMultiBindings === false
          && bindingCommand === null
          && hasInlineBindings(realAttrValue);
        if (isMultiBindings) {
          attrBindableInstructions = this._compileMultiBindings(el, realAttrValue, attrDef, context);
        } else {
          primaryBindable = bindableInfo.primary;
          // custom attribute + single value + WITHOUT binding command:
          // my-attr=""
          // my-attr="${}"
          if (bindingCommand === null) {
            expr = exprParser.parse(realAttrValue, BindingType.Interpolation);
            attrBindableInstructions = [
              expr === null
                ? new SetPropertyInstruction(realAttrValue, primaryBindable.property)
                : new InterpolationInstruction(expr, primaryBindable.property)
            ];
          } else {
            // custom attribute with binding command:
            // my-attr.bind="..."
            // my-attr.two-way="..."
            expr = exprParser.parse(realAttrValue, bindingCommand.bindingType);

            commandBuildInfo.node = el;
            commandBuildInfo.attr = attrSyntax;
            commandBuildInfo.expr = expr;
            commandBuildInfo.bindable = primaryBindable;
            commandBuildInfo.def = attrDef;
            attrBindableInstructions = [bindingCommand.build(commandBuildInfo)];
          }
        }

        el.removeAttribute(attrName);
        --i;
        --ii;
        (attrInstructions ??= []).push(new HydrateAttributeInstruction(
          // todo: def/ def.Type or def.name should be configurable
          //       example: AOT/runtime can use def.Type, but there are situation
          //       where instructions need to be serialized, def.name should be used
          this.resolveResources ? attrDef : attrDef.name,
          attrDef.aliases != null && attrDef.aliases.includes(realAttrTarget) ? realAttrTarget : void 0,
          attrBindableInstructions
        ));
        continue;
      }

      if (bindingCommand === null) {
        expr = exprParser.parse(realAttrValue, BindingType.Interpolation);
        if (expr != null) {
          el.removeAttribute(attrName);
          --i;
          --ii;

          instructions.push(new InterpolationInstruction(
            expr,
            // if not a bindable, then ensure plain attribute are mapped correctly:
            // e.g: colspan -> colSpan
            //      innerhtml -> innerHTML
            //      minlength -> minLength etc...
            context._attrMapper.map(el, realAttrTarget) ?? camelCase(realAttrTarget)
          ));
        } else {
          switch (attrName) {
            case 'class':
              instructions.push(new SetClassAttributeInstruction(realAttrValue));
              break;
            case 'style':
              instructions.push(new SetStyleAttributeInstruction(realAttrValue));
              break;
            default:
              // if not a custom attribute + no binding command + not a bindable + not an interpolation
              // then it's just a plain attribute
              instructions.push(new SetAttributeInstruction(realAttrValue, attrName));
          }
        }
      } else {
        expr = exprParser.parse(realAttrValue, bindingCommand.bindingType);

        commandBuildInfo.node = el;
        commandBuildInfo.attr = attrSyntax;
        commandBuildInfo.expr = expr;
        commandBuildInfo.bindable = null;
        commandBuildInfo.def = null;
        instructions.push(bindingCommand.build(commandBuildInfo));
      }
    }

    resetCommandBuildInfo();

    if (attrInstructions != null) {
      return (attrInstructions as IInstruction[]).concat(instructions);
    }

    return instructions;
  }

  // overall flow:
  // each of the method will be responsible for compiling its corresponding node type
  // and it should return the next node to be compiled
  /** @internal */
  private _compileNode(node: Node, context: CompilationContext): Node | null {
    switch (node.nodeType) {
      case 1:
        switch (node.nodeName) {
          case 'LET':
            return this._compileLet(node as Element, context);
          // ------------------------------------
          // todo: possible optimization:
          // when two conditions below are met:
          // 1. there's no attribute on au slot,
          // 2. there's no projection
          //
          // -> flatten the au-slot into children as this is just a static template
          // ------------------------------------
          // case 'AU-SLOT':
          //   return this.auSlot(node as Element, container, context);
          default:
            return this._compileElement(node as Element, context);
        }
      case 3:
        return this._compileText(node as Text, context);
      case 11: {
        let current: Node | null = (node as DocumentFragment).firstChild;
        while (current !== null) {
          current = this._compileNode(current, context);
        }
        break;
      }
    }
    return node.nextSibling;
  }

  /** @internal */
  private _compileLet(el: Element, context: CompilationContext): Node | null {
    const attrs = el.attributes;
    const ii = attrs.length;
    const letInstructions: LetBindingInstruction[] = [];
    const exprParser = context._exprParser;
    let toBindingContext = false;
    let i = 0;
    let attr: Attr;
    let attrSyntax: AttrSyntax;
    let attrName: string;
    let attrValue: string;
    let bindingCommand: BindingCommandInstance | null;
    let realAttrTarget: string;
    let realAttrValue: string;
    let expr: AnyBindingExpression;

    for (; ii > i; ++i) {
      attr = attrs[i];
      attrName = attr.name;
      attrValue = attr.value;
      if (attrName === 'to-binding-context') {
        toBindingContext = true;
        continue;
      }

      attrSyntax = context._attrParser.parse(attrName, attrValue);
      realAttrTarget = attrSyntax.target;
      realAttrValue = attrSyntax.rawValue;

      bindingCommand = context._createCommand(attrSyntax);
      if (bindingCommand !== null) {
        // supporting one time may not be as simple as it appears
        // as the let expression could compute its value from various expressions,
        // which means some value could be unavailable by the time it computes.
        //
        // Onetime means it will not have appropriate value, but it's also a good thing,
        // since often one it's just a simple declaration
        // todo: consider supporting one-time for <let>
        if (bindingCommand.bindingType === BindingType.ToViewCommand
          || bindingCommand.bindingType === BindingType.BindCommand
        ) {
          letInstructions.push(new LetBindingInstruction(
            exprParser.parse(realAttrValue, bindingCommand.bindingType),
            camelCase(realAttrTarget)
          ));
          continue;
        }
        if (__DEV__)
          throw new Error(`Invalid command ${attrSyntax.command} for <let>. Only to-view/bind supported.`);
        else
          throw new Error(`AUR0704:${attrSyntax.command}`);
      }

      expr = exprParser.parse(realAttrValue, BindingType.Interpolation);
      if (expr === null) {
        if (__DEV__) {
          context._logger.warn(
            `Property ${realAttrTarget} is declared with literal string ${realAttrValue}. ` +
            `Did you mean ${realAttrTarget}.bind="${realAttrValue}"?`
          );
        }
      }

      letInstructions.push(new LetBindingInstruction(
        expr === null ? new PrimitiveLiteralExpression(realAttrValue) : expr,
        camelCase(realAttrTarget)
      ));
    }
    context.rows.push([new HydrateLetElementInstruction(letInstructions, toBindingContext)]);
    // probably no need to replace
    // as the let itself can be used as is
    // though still need to mark el as target to ensure the instruction is matched with a target
    return this._markAsTarget(el).nextSibling;
  }

  /** @internal */
  // eslint-disable-next-line
  private _compileElement(el: Element, context: CompilationContext): Node | null {
    // overall, the template compiler does it job by compiling one node,
    // and let that the process of compiling that node point to the next node to be compiled.
    // ----------------------------------------
    // a summary of this 650 line long function:
    // 1. walk through all attributes to put them into their corresponding instruction groups
    //    template controllers      -> list 1
    //    custom attributes         -> list 2
    //    plain attrs with bindings -> list 3
    //    el bindables              -> list 4
    // 2. ensure element instruction is present
    //    2.1.
    //      if element is an <au-slot/> compile its content into auSlot property of the element instruction created
    // 3. sort instructions:
    //    hydrate custom element instruction
    //    hydrate custom attribute instructions
    //    rest kept as is (except special cases & to-be-decided)
    //    3.1
    //      mark this element as a target for later hydration
    // 4. Compiling child nodes of this element
    //    4.1.
    //      If 1 or more [Template controller]:
    //      4.1.1.
    //          Start processing the most inner (most right TC in list 1) similarly to step 4.2:
    //          4.1.1.0.
    //          let innerContext = context.createChild();
    //          4.1.1.1.
    //              walks through the child nodes, and perform a [au-slot] check
    //              - if this is a custom element, then extract all [au-slot] annotated elements into corresponding templates by their target slot name
    //              - else throw an error as [au-slot] is used on non-custom-element
    //          4.1.1.2.
    //              recursively compiles the child nodes into the innerContext
    //      4.1.2.
    //          Start processing other Template controllers by walking the TC list (list 1) RIGHT -> LEFT
    //          Explanation:
    //              If there' are multiple template controllers on an element,
    //              only the most inner template controller will have access to the template with the current element
    //              other "outer" template controller will only need to see a marker pointing to a definition of the inner one
    //    4.2.
    //      NO [Template controller]
    //      4.2.1.
    //          walks through the child nodes, and perform a [au-slot] check
    //          - if this is a custom element, then extract all [au-slot] annotated elements into corresponding templates by their target slot name
    //          - else throw an error as [au-slot] is used on non-custom-element
    //      4.2.2
    //          recursively compiles the child nodes into the current context
    // 5. Returning the next node for the compilation
    const nextSibling = el.nextSibling;
    const elName = (el.getAttribute('as-element') ?? el.nodeName).toLowerCase();
    const elDef = context._findElement(elName);
    const exprParser = context._exprParser;
    const removeAttr = this.debug
      ? noop
      : () => {
        el.removeAttribute(attrName);
        --i;
        --ii;
      };
    let attrs = el.attributes;
    let instructions: IInstruction[] | undefined;
    let ii = attrs.length;
    let i = 0;
    let attr: Attr;
    let attrName: string;
    let attrValue: string;
    let attrSyntax: AttrSyntax;
    let plainAttrInstructions: IInstruction[] | undefined;
    let elBindableInstructions: IInstruction[] | undefined;
    let attrDef: CustomAttributeDefinition | null = null;
    let isMultiBindings = false;
    let bindable: BindableDefinition;
    let attrInstructions: HydrateAttributeInstruction[] | undefined;
    let attrBindableInstructions: IInstruction[];
    let tcInstructions: HydrateTemplateController[] | undefined;
    let tcInstruction: HydrateTemplateController | undefined;
    let expr: AnyBindingExpression;
    let elementInstruction: HydrateElementInstruction | undefined;
    let bindingCommand: BindingCommandInstance | null = null;
    // eslint-disable-next-line
    let bindablesInfo: BindablesInfo<0> | BindablesInfo<1>;
    let primaryBindable: BindableDefinition;
    let realAttrTarget: string;
    let realAttrValue: string;
    let processContentResult: boolean | undefined | void = true;
    let hasContainerless = false;

    if (elName === 'slot') {
      context.root.hasSlot = true;
    }
    if (elDef !== null) {
      // todo: this is a bit ... powerful
      // maybe do not allow it to process its own attributes
      processContentResult = elDef.processContent?.call(elDef.Type, el, context.p);
      // might have changed during the process
      attrs = el.attributes;
      ii = attrs.length;
    }

    if (context.root.def.enhance && el.classList.contains('au')) {
      if (__DEV__)
        throw new Error(
          'Trying to enhance with a template that was probably compiled before. '
          + 'This is likely going to cause issues. '
          + 'Consider enhancing only untouched elements or first remove all "au" classes.'
        );
      else
        throw new Error(`AUR0705`);
    }

    // 1. walk and compile through all attributes
    //    for each of them, put in appropriate group.
    //    ex. plain attr with binding -> plain attr instruction list
    //        template controller     -> tc instruction list
    //        custom attribute        -> ca instruction list
    //        el bindable attribute   -> el bindable instruction list
    for (; ii > i; ++i) {
      attr = attrs[i];
      attrName = attr.name;
      attrValue = attr.value;
      switch (attrName) {
        case 'as-element':
        case 'containerless':
          removeAttr();
          if (!hasContainerless) {
            hasContainerless = attrName === 'containerless';
          }
          continue;
      }
      attrSyntax = context._attrParser.parse(attrName, attrValue);

      bindingCommand = context._createCommand(attrSyntax);
      if (bindingCommand !== null && bindingCommand.bindingType & BindingType.IgnoreAttr) {
        // when the binding command overrides everything
        // just pass the target as is to the binding command, and treat it as a normal attribute:
        // active.class="..."
        // background.style="..."
        // my-attr.attr="..."
        expr = exprParser.parse(attrValue, bindingCommand.bindingType);

        commandBuildInfo.node = el;
        commandBuildInfo.attr = attrSyntax;
        commandBuildInfo.expr = expr;
        commandBuildInfo.bindable = null;
        commandBuildInfo.def = null;
        (plainAttrInstructions ??= []).push(bindingCommand.build(commandBuildInfo));

        removeAttr();
        // to next attribute
        continue;
      }

      realAttrTarget = attrSyntax.target;
      realAttrValue = attrSyntax.rawValue;
      // if not a ignore attribute binding command
      // then process with the next possibilities
      attrDef = context._findAttr(realAttrTarget);
      // when encountering an attribute,
      // custom attribute takes precedence over custom element bindables
      if (attrDef !== null) {
        bindablesInfo = BindablesInfo.from(attrDef, true);
        // Custom attributes are always in multiple binding mode,
        // except when they can't be
        // When they cannot be:
        //        * has explicit configuration noMultiBindings: false
        //        * has binding command, ie: <div my-attr.bind="...">.
        //          In this scenario, the value of the custom attributes is required to be a valid expression
        //        * has no colon: ie: <div my-attr="abcd">
        //          In this scenario, it's simply invalid syntax.
        //          Consider style attribute rule-value pair: <div style="rule: ruleValue">
        isMultiBindings = attrDef.noMultiBindings === false
          && bindingCommand === null
          && hasInlineBindings(attrValue);
        if (isMultiBindings) {
          attrBindableInstructions = this._compileMultiBindings(el, attrValue, attrDef, context);
        } else {
          primaryBindable = bindablesInfo.primary;
          // custom attribute + single value + WITHOUT binding command:
          // my-attr=""
          // my-attr="${}"
          if (bindingCommand === null) {
            expr = exprParser.parse(attrValue, BindingType.Interpolation);
            attrBindableInstructions = [
              expr === null
                ? new SetPropertyInstruction(attrValue, primaryBindable.property)
                : new InterpolationInstruction(expr, primaryBindable.property)
            ];
          } else {
            // custom attribute with binding command:
            // my-attr.bind="..."
            // my-attr.two-way="..."
            expr = exprParser.parse(attrValue, bindingCommand.bindingType);

            commandBuildInfo.node = el;
            commandBuildInfo.attr = attrSyntax;
            commandBuildInfo.expr = expr;
            commandBuildInfo.bindable = primaryBindable;
            commandBuildInfo.def = attrDef;
            attrBindableInstructions = [bindingCommand.build(commandBuildInfo)];
          }
        }

        removeAttr();

        if (attrDef.isTemplateController) {
          (tcInstructions ??= []).push(new HydrateTemplateController(
            voidDefinition,
            // todo: def/ def.Type or def.name should be configurable
            //       example: AOT/runtime can use def.Type, but there are situation
            //       where instructions need to be serialized, def.name should be used
            this.resolveResources ? attrDef : attrDef.name,
            void 0,
            attrBindableInstructions,
          ));
        } else {
          (attrInstructions ??= []).push(new HydrateAttributeInstruction(
            // todo: def/ def.Type or def.name should be configurable
            //       example: AOT/runtime can use def.Type, but there are situation
            //       where instructions need to be serialized, def.name should be used
            this.resolveResources ? attrDef : attrDef.name,
            attrDef.aliases != null && attrDef.aliases.includes(realAttrTarget) ? realAttrTarget : void 0,
            attrBindableInstructions
          ));
        }
        continue;
      }

      if (bindingCommand === null) {
        // reaching here means:
        // + maybe a bindable attribute with interpolation
        // + maybe a plain attribute with interpolation
        // + maybe a plain attribute
        if (elDef !== null) {
          bindablesInfo = BindablesInfo.from(elDef, false);
          bindable = bindablesInfo.attrs[realAttrTarget];
          if (bindable !== void 0) {
            expr = exprParser.parse(realAttrValue, BindingType.Interpolation);
            (elBindableInstructions ??= []).push(
              expr == null
                ? new SetPropertyInstruction(realAttrValue, bindable.property)
                : new InterpolationInstruction(expr, bindable.property)
            );

            removeAttr();
            continue;
          }
        }

        // reaching here means:
        // + maybe a plain attribute with interpolation
        // + maybe a plain attribute
        expr = exprParser.parse(realAttrValue, BindingType.Interpolation);
        if (expr != null) {
          // if it's an interpolation, remove the attribute
          removeAttr();

          (plainAttrInstructions ??= []).push(new InterpolationInstruction(
            expr,
            // if not a bindable, then ensure plain attribute are mapped correctly:
            // e.g: colspan -> colSpan
            //      innerhtml -> innerHTML
            //      minlength -> minLength etc...
            context._attrMapper.map(el, realAttrTarget) ?? camelCase(realAttrTarget)
          ));
        }
        // if not a custom attribute + no binding command + not a bindable + not an interpolation
        // then it's just a plain attribute, do nothing
        continue;
      }

      // reaching here means:
      // + has binding command
      // + not an overriding binding command
      // + not a custom attribute
      removeAttr();

      if (elDef !== null) {
        // if the element is a custom element
        // - prioritize bindables on a custom element before plain attributes
        bindablesInfo = BindablesInfo.from(elDef, false);
        bindable = bindablesInfo.attrs[realAttrTarget];
        if (bindable !== void 0) {
          // if it looks like: <my-el value.bind>
          // it means        : <my-el value.bind="value">
          // this is a shortcut
          // and reuse attrValue variable
          attrValue = attrValue.length === 0
            && (bindingCommand.bindingType & (
              BindingType.BindCommand
              | BindingType.OneTimeCommand
              | BindingType.ToViewCommand
              | BindingType.TwoWayCommand
            )) > 0
              ? camelCase(attrName)
              : attrValue;
          expr = exprParser.parse(attrValue, bindingCommand.bindingType);

          commandBuildInfo.node = el;
          commandBuildInfo.attr = attrSyntax;
          commandBuildInfo.expr = expr;
          commandBuildInfo.bindable = bindable;
          commandBuildInfo.def = elDef;
          (elBindableInstructions ??= []).push(bindingCommand.build(commandBuildInfo));
          continue;
        }
      }

      // reaching here means:
      // + a plain attribute
      // + has binding command

      expr = exprParser.parse(realAttrValue, bindingCommand.bindingType);

      commandBuildInfo.node = el;
      commandBuildInfo.attr = attrSyntax;
      commandBuildInfo.expr = expr;
      commandBuildInfo.bindable = null;
      commandBuildInfo.def = null;
      (plainAttrInstructions ??= []).push(bindingCommand.build(commandBuildInfo));
    }

    resetCommandBuildInfo();

    if (this._shouldReorderAttrs(el) && plainAttrInstructions != null && plainAttrInstructions.length > 1) {
      this._reorder(el, plainAttrInstructions);
    }

    // 2. ensure that element instruction is present if this element is a custom element
    if (elDef !== null) {
      elementInstruction = new HydrateElementInstruction(
        // todo: def/ def.Type or def.name should be configurable
        //       example: AOT/runtime can use def.Type, but there are situation
        //       where instructions need to be serialized, def.name should be used
        this.resolveResources ? elDef : elDef.name,
        void 0,
        (elBindableInstructions ?? emptyArray) as IInstruction[],
        null,
        hasContainerless,
      );

      // 2.1 prepare fallback content for <au-slot/>
      if (elName === 'au-slot') {
        const slotName = el.getAttribute('name') || /* name="" is the same with no name */'default';
        const template = context.h('template');
        const fallbackContentContext = context._createChild();
        let node: Node | null = el.firstChild;
        while (node !== null) {
          // a special case:
          // <au-slot> doesn't have its own template
          // so anything attempting to project into it is discarded
          // doing so during compilation via removing the node,
          // instead of considering it as part of the fallback view
          if (node.nodeType === 1 && (node as Element).hasAttribute('au-slot')) {
            el.removeChild(node);
          } else {
            template.content.appendChild(node);
          }
          node = el.firstChild;
        }

        this._compileNode(template.content, fallbackContentContext);
        elementInstruction.auSlot = {
          name: slotName,
          fallback: CustomElementDefinition.create({
            name: CustomElement.generateName(),
            template,
            instructions: fallbackContentContext.rows,
            needsCompile: false,
          }),
        };
        // todo: shouldn't have to eagerly replace everything like this
        // this is a leftover refactoring work from the old binder
        el = this._replaceByMarker(el, context);
      }
    }

    // 3. merge and sort all instructions into a single list
    //    as instruction list for this element
    if (plainAttrInstructions != null
      || elementInstruction != null
      || attrInstructions != null
    ) {
      instructions = emptyArray.concat(
        elementInstruction ?? emptyArray,
        attrInstructions ?? emptyArray,
        plainAttrInstructions ?? emptyArray,
      );
      // 3.1 mark as template for later hydration
      this._markAsTarget(el);
    }

    // 4. compiling child nodes
    let shouldCompileContent: boolean;
    if (tcInstructions != null) {
      // 4.1 if there is 1 or more [Template controller]
      ii = tcInstructions.length - 1;
      i = ii;
      tcInstruction = tcInstructions[i];

      let template: HTMLTemplateElement;
      // assumption: el.parentNode is not null
      // but not always the case: e.g compile/enhance an element without parent with TC on it
      this._replaceByMarker(el, context);
      if (el.nodeName === 'TEMPLATE') {
        template = el as HTMLTemplateElement;
      } else {
        template = context.h('template');
        template.content.appendChild(el);
      }
      const mostInnerTemplate = template;
      // 4.1.1.0. prepare child context for the inner template compilation
      const childContext = context._createChild(instructions == null ? [] : [instructions]);

      shouldCompileContent = elDef === null || !elDef.containerless && !hasContainerless && processContentResult !== false;
      // todo: shouldn't have to eagerly replace with a marker like this
      //       this should be the job of the renderer
      if (elDef !== null && elDef.containerless) {
        this._replaceByMarker(el, context);
      }

      let child: Node | null;
      let childEl: Element;
      let targetSlot: string | null;
      let projections: IProjections | undefined;
      let slotTemplateRecord: Record<string, (Element | DocumentFragment)[]> | undefined;
      let slotTemplates: (Element | DocumentFragment)[];
      let slotTemplate: Element | DocumentFragment;
      let marker: HTMLElement;
      let projectionCompilationContext: CompilationContext;
      let j = 0, jj = 0;
      if (shouldCompileContent) {
        // 4.1.1.1.
        //  walks through the child nodes, and perform [au-slot] check
        //  note: this is a bit different with the summary above, possibly wrong since it will not throw
        //        on [au-slot] used on a non-custom-element + with a template controller on it
        if (elDef !== null) {
          // for each child element of a custom element
          // scan for [au-slot], if there's one
          // then extract the element into a projection definition
          // this allows support for [au-slot] declared on the same element with anther template controller
          // e.g:
          //
          // can do:
          //  <my-el>
          //    <div au-slot if.bind="..."></div>
          //    <div if.bind="..." au-slot></div>
          //  </my-el>
          //
          // instead of:
          //  <my-el>
          //    <template au-slot><div if.bind="..."></div>
          //  </my-el>
          child = el.firstChild;
          while (child !== null) {
            if (child.nodeType === 1) {
              // if has [au-slot] then it's a projection
              childEl = (child as Element);
              child = child.nextSibling;
              targetSlot = childEl.getAttribute('au-slot');
              if (targetSlot !== null) {
                if (targetSlot === '') {
                  targetSlot = 'default';
                }
                childEl.removeAttribute('au-slot');
                el.removeChild(childEl);
                ((slotTemplateRecord ??= {})[targetSlot] ??= []).push(childEl);
              }
              // if not a targeted slot then use the common node method
              // todo: in the future, there maybe more special case for a content of a custom element
              //       it can be all done here
            } else {
              child = child.nextSibling;
            }
          }

          if (slotTemplateRecord != null) {
            projections = {};
            // aggregate all content targeting the same slot
            // into a single template
            // with some special rule around <template> element
            for (targetSlot in slotTemplateRecord) {
              template = context.h('template');
              slotTemplates = slotTemplateRecord[targetSlot];
              for (j = 0, jj = slotTemplates.length; jj > j; ++j) {
                slotTemplate = slotTemplates[j];
                if (slotTemplate.nodeName === 'TEMPLATE') {
                  // this means user has some thing more than [au-slot] on a template
                  // consider this intentional, and use it as is
                  // e.g:
                  // <my-element>
                  //   <template au-slot repeat.for="i of items">
                  // ----vs----
                  // <my-element>
                  //   <template au-slot>this is just some static stuff <b>And a b</b></template>
                  if ((slotTemplate as Element).attributes.length > 0) {
                    template.content.appendChild(slotTemplate);
                  } else {
                    template.content.appendChild((slotTemplate as HTMLTemplateElement).content);
                  }
                } else {
                  template.content.appendChild(slotTemplate);
                }
              }

              // after aggregating all the [au-slot] templates into a single one
              // compile it
              // technically, the most inner template controller compilation context
              // is the parent of this compilation context
              // but for simplicity in compilation, maybe start with a flatter hierarchy
              // also, it wouldn't have any real uses
              projectionCompilationContext = context._createChild();
              this._compileNode(template.content, projectionCompilationContext);
              projections[targetSlot] = CustomElementDefinition.create({
                name: CustomElement.generateName(),
                template,
                instructions: projectionCompilationContext.rows,
                needsCompile: false,
              });
            }
            elementInstruction!.projections = projections;
          }
        }

        // 4.1.1.2:
        //  recursively compiles the child nodes into the inner context
        // important:
        // ======================
        // only goes inside a template, if there is a template controller on it
        // otherwise, leave it alone
        if (el.nodeName === 'TEMPLATE') {
          this._compileNode((el as HTMLTemplateElement).content, childContext);
        } else {
          child = el.firstChild;
          while (child !== null) {
            child = this._compileNode(child, childContext);
          }
        }
      }
      tcInstruction.def = CustomElementDefinition.create({
        name: CustomElement.generateName(),
        template: mostInnerTemplate,
        instructions: childContext.rows,
        needsCompile: false,
      });

      // 4.1.2.
      //  Start processing other Template controllers by walking the TC list (list 1) RIGHT -> LEFT
      while (i-- > 0) {
        // for each of the template controller from [right] to [left]
        // do create:
        // (1) a template
        // (2) add a marker to the template
        // (3) an instruction
        // instruction will be corresponded to the marker
        // =========================

        tcInstruction = tcInstructions[i];
        template = context.h('template');
        // appending most inner template is inaccurate, as the most outer one
        // is not really the parent of the most inner one
        // but it's only for the purpose of creating a marker,
        // so it's just an optimization hack
        marker = context.h('au-m');
        marker.classList.add('au');
        template.content.appendChild(marker);

        tcInstruction.def = CustomElementDefinition.create({
          name: CustomElement.generateName(),
          template,
          needsCompile: false,
          instructions: [[tcInstructions[i + 1]]]
        });
      }
      // the most outer template controller should be
      // the only instruction for peek instruction of the current context
      // e.g
      // <div if.bind="yes" with.bind="scope" repeat.for="i of items" data-id="i.id">
      // results in:
      // -----------
      //
      //  TC(if-[value=yes])
      //    | TC(with-[value=scope])
      //        | TC(repeat-[...])
      //            | div(data-id-[value=i.id])
      context.rows.push([tcInstruction]);
    } else {
      // 4.2
      //
      // if there's no template controller
      // then the instruction built is appropriate to be assigned as the peek row
      // and before the children compilation
      if (instructions != null) {
        context.rows.push(instructions);
      }

      shouldCompileContent = elDef === null || !elDef.containerless && !hasContainerless && processContentResult !== false;
      // todo: shouldn't have to eagerly replace with a marker like this
      //       this should be the job of the renderer
      if (elDef !== null && elDef.containerless) {
        this._replaceByMarker(el, context);
      }
      if (shouldCompileContent && el.childNodes.length > 0) {
        let child = el.firstChild as Node | null;
        let childEl: Element;
        let targetSlot: string | null;
        let projections: IProjections | null = null;
        let slotTemplateRecord: Record<string, (Element | DocumentFragment)[]> | undefined;
        let slotTemplates: (Element | DocumentFragment)[];
        let slotTemplate: Element | DocumentFragment;
        let template: HTMLTemplateElement;
        let projectionCompilationContext: CompilationContext;
        let j = 0, jj = 0;
        // 4.2.1.
        //    walks through the child nodes and perform [au-slot] check
        // --------------------
        // for each child element of a custom element
        // scan for [au-slot], if there's one
        // then extract the element into a projection definition
        // this allows support for [au-slot] declared on the same element with anther template controller
        // e.g:
        //
        // can do:
        //  <my-el>
        //    <div au-slot if.bind="..."></div>
        //    <div if.bind="..." au-slot></div>
        //  </my-el>
        //
        // instead of:
        //  <my-el>
        //    <template au-slot><div if.bind="..."></div>
        //  </my-el>
        while (child !== null) {
          if (child.nodeType === 1) {
            // if has [au-slot] then it's a projection
            childEl = (child as Element);
            child = child.nextSibling;
            targetSlot = childEl.getAttribute('au-slot');
            if (targetSlot !== null) {
              if (elDef === null) {
                if (__DEV__)
                  throw new Error(`Projection with [au-slot="${targetSlot}"] is attempted on a non custom element ${el.nodeName}.`);
                else
                  throw new Error(`AUR0706:${el.nodeName}[${targetSlot}]`);
              }
              if (targetSlot === '') {
                targetSlot = 'default';
              }
              el.removeChild(childEl);
              childEl.removeAttribute('au-slot');
              ((slotTemplateRecord ??= {})[targetSlot] ??= []).push(childEl);
            }
            // if not a targeted slot then use the common node method
            // todo: in the future, there maybe more special case for a content of a custom element
            //       it can be all done here
          } else {
            child = child.nextSibling;
          }
        }

        if (slotTemplateRecord != null) {
          projections = {};
          // aggregate all content targeting the same slot
          // into a single template
          // with some special rule around <template> element
          for (targetSlot in slotTemplateRecord) {
            template = context.h('template');
            slotTemplates = slotTemplateRecord[targetSlot];
            for (j = 0, jj = slotTemplates.length; jj > j; ++j) {
              slotTemplate = slotTemplates[j];
              if (slotTemplate.nodeName === 'TEMPLATE') {
                // this means user has some thing more than [au-slot] on a template
                // consider this intentional, and use it as is
                // e.g:
                // <my-element>
                //   <template au-slot repeat.for="i of items">
                // ----vs----
                // <my-element>
                //   <template au-slot>this is just some static stuff <b>And a b</b></template>
                if ((slotTemplate as Element).attributes.length > 0) {
                  template.content.appendChild(slotTemplate);
                } else {
                  template.content.appendChild((slotTemplate as HTMLTemplateElement).content);
                }
              } else {
                template.content.appendChild(slotTemplate);
              }
            }

            // after aggregating all the [au-slot] templates into a single one
            // compile it
            projectionCompilationContext = context._createChild();
            this._compileNode(template.content, projectionCompilationContext);
            projections[targetSlot] = CustomElementDefinition.create({
              name: CustomElement.generateName(),
              template,
              instructions: projectionCompilationContext.rows,
              needsCompile: false,
            });
          }
          elementInstruction!.projections = projections;
        }

        // 4.2.2
        //    recursively compiles the child nodes into current context
        child = el.firstChild;
        while (child !== null) {
          child = this._compileNode(child, context);
        }
      }
    }

    // 5. returns the next node to be compiled
    return nextSibling;
  }

  /** @internal */
  private _compileText(node: Text, context: CompilationContext): Node | null {
    let text = '';
    let current: Node | null = node;
    while (current !== null && current.nodeType === 3) {
      text += current.textContent!;
      current = current.nextSibling;
    }
    const expr = context._exprParser.parse(text, BindingType.Interpolation);
    if (expr === null) {
      return current;
    }

    const parent = node.parentNode!;
    // prepare a marker
    parent.insertBefore(this._markAsTarget(context.h('au-m')), node);
    // and the corresponding instruction
    context.rows.push([new TextBindingInstruction(expr, !!context.def.isStrictBinding)]);

    // and cleanup all the DOM for rendering text binding
    node.textContent = '';
    current = node.nextSibling;
    while (current !== null && current.nodeType === 3) {
      parent.removeChild(current);
      current = node.nextSibling;
    }

    return node.nextSibling;
  }

  /** @internal */
  private _compileMultiBindings(
    node: Element,
    attrRawValue: string,
    attrDef: CustomAttributeDefinition,
    context: CompilationContext
  ): IInstruction[] {
    // custom attribute + multiple values:
    // my-attr="prop1: literal1 prop2.bind: ...; prop3: literal3"
    // my-attr="prop1.bind: ...; prop2.bind: ..."
    // my-attr="prop1: ${}; prop2.bind: ...; prop3: ${}"
    const bindableAttrsInfo = BindablesInfo.from(attrDef, true);
    const valueLength = attrRawValue.length;
    const instructions: IInstruction[] = [];

    let attrName: string | undefined = void 0;
    let attrValue: string | undefined = void 0;

    let start = 0;
    let ch = 0;
    let expr: AnyBindingExpression;
    let attrSyntax: AttrSyntax;
    let command: BindingCommandInstance | null;
    let bindable: BindableDefinition;

    for (let i = 0; i < valueLength; ++i) {
      ch = attrRawValue.charCodeAt(i);

      if (ch === Char.Backslash) {
        ++i;
        // Ignore whatever comes next because it's escaped
      } else if (ch === Char.Colon) {
        attrName = attrRawValue.slice(start, i);

        // Skip whitespace after colon
        while (attrRawValue.charCodeAt(++i) <= Char.Space);

        start = i;

        for (; i < valueLength; ++i) {
          ch = attrRawValue.charCodeAt(i);
          if (ch === Char.Backslash) {
            ++i;
            // Ignore whatever comes next because it's escaped
          } else if (ch === Char.Semicolon) {
            attrValue = attrRawValue.slice(start, i);
            break;
          }
        }

        if (attrValue === void 0) {
          // No semicolon found, so just grab the rest of the value
          attrValue = attrRawValue.slice(start);
        }

        attrSyntax = context._attrParser.parse(attrName, attrValue);
        // ================================================
        // todo: should it always camel case???
        // const attrTarget = camelCase(attrSyntax.target);
        // ================================================
        command = context._createCommand(attrSyntax);
        bindable = bindableAttrsInfo.attrs[attrSyntax.target];
        if (bindable == null) {
          if (__DEV__)
            throw new Error(`Bindable ${attrSyntax.target} not found on ${attrDef.name}.`);
          else
            throw new Error(`AUR0707:${attrDef.name}.${attrSyntax.target}`);
        }
        if (command === null) {
          expr = context._exprParser.parse(attrValue, BindingType.Interpolation);
          instructions.push(expr === null
            ? new SetPropertyInstruction(attrValue, bindable.property)
            : new InterpolationInstruction(expr, bindable.property)
          );
        } else {
          expr = context._exprParser.parse(attrValue, command.bindingType);
          commandBuildInfo.node = node;
          commandBuildInfo.attr = attrSyntax;
          commandBuildInfo.expr = expr;
          commandBuildInfo.bindable = bindable;
          commandBuildInfo.def = attrDef;
          // instructions.push(command.compile(new BindingSymbol(command, bindable, expr, attrValue, attrName)));
          instructions.push(command.build(commandBuildInfo));
        }

        // Skip whitespace after semicolon
        while (i < valueLength && attrRawValue.charCodeAt(++i) <= Char.Space);

        start = i;

        attrName = void 0;
        attrValue = void 0;
      }
    }

    resetCommandBuildInfo();

    return instructions;
  }

  /** @internal */
  private _compileLocalElement(template: Element | DocumentFragment, context: CompilationContext) {
    const root: Element | DocumentFragment = template;
    const localTemplates = toArray(root.querySelectorAll('template[as-custom-element]')) as HTMLTemplateElement[];
    const numLocalTemplates = localTemplates.length;
    if (numLocalTemplates === 0) { return; }
    if (numLocalTemplates === root.childElementCount) {
      if (__DEV__)
        throw new Error('The custom element does not have any content other than local template(s).');
      else
        throw new Error('AUR0708');
    }
    const localTemplateNames: Set<string> = new Set();

    for (const localTemplate of localTemplates) {
      if (localTemplate.parentNode !== root) {
        if (__DEV__)
          throw new Error('Local templates needs to be defined directly under root.');
        else
          throw new Error('AUR0709');
      }
      const name = processTemplateName(localTemplate, localTemplateNames);

      const LocalTemplateType = class LocalTemplate { };
      const content = localTemplate.content;
      const bindableEls = toArray(content.querySelectorAll('bindable'));
      const bindableInstructions = Bindable.for(LocalTemplateType);
      const properties = new Set<string>();
      const attributes = new Set<string>();
      for (const bindableEl of bindableEls) {
        if (bindableEl.parentNode !== content) {
          if (__DEV__)
            throw new Error('Bindable properties of local templates needs to be defined directly under root.');
          else
            throw new Error('AUR0710');
        }
        const property = bindableEl.getAttribute(LocalTemplateBindableAttributes.property);
        if (property === null) {
          if (__DEV__)
            throw new Error(`The attribute 'property' is missing in ${bindableEl.outerHTML}`);
          else
            throw new Error('AUR0711');
        }
        const attribute = bindableEl.getAttribute(LocalTemplateBindableAttributes.attribute);
        if (attribute !== null
          && attributes.has(attribute)
          || properties.has(property)
        ) {
          if (__DEV__)
            throw new Error(`Bindable property and attribute needs to be unique; found property: ${property}, attribute: ${attribute}`);
          else
            throw new Error(`AUR0712:${property}+${attribute}`);
        } else {
          if (attribute !== null) {
            attributes.add(attribute);
          }
          properties.add(property);
        }
        bindableInstructions.add({
          property,
          attribute: attribute ?? void 0,
          mode: getBindingMode(bindableEl),
        });
        const ignoredAttributes = bindableEl.getAttributeNames().filter((attrName) => !allowedLocalTemplateBindableAttributes.includes(attrName));
        if (ignoredAttributes.length > 0) {
          if (__DEV__)
            context._logger.warn(`The attribute(s) ${ignoredAttributes.join(', ')} will be ignored for ${bindableEl.outerHTML}. Only ${allowedLocalTemplateBindableAttributes.join(', ')} are processed.`);
        }

        content.removeChild(bindableEl);
      }

      context._addDep(CustomElement.define({ name, template: localTemplate }, LocalTemplateType));

      root.removeChild(localTemplate);
    }
  }

  private _shouldReorderAttrs(el: Element): boolean {
    return el.nodeName === 'INPUT' && orderSensitiveInputType[(el as HTMLInputElement).type] === 1;
  }

  private _reorder(el: Element, instructions: (IInstruction)[]) {
    switch (el.nodeName) {
      case 'INPUT': {
        const _instructions = instructions as (PropertyBindingInstruction | InterpolationInstruction)[];
        // swap the order of checked and model/value attribute,
        // so that the required observers are prepared for checked-observer
        let modelOrValueOrMatcherIndex: number | undefined = void 0;
        let checkedIndex: number | undefined = void 0;
        let found = 0;
        let instruction: PropertyBindingInstruction | InterpolationInstruction;
        for (let i = 0; i < _instructions.length && found < 3; i++) {
          instruction = _instructions[i];
          switch (instruction.to) {
            case 'model':
            case 'value':
            case 'matcher':
              modelOrValueOrMatcherIndex = i;
              found++;
              break;
            case 'checked':
              checkedIndex = i;
              found++;
              break;
          }
        }
        if (checkedIndex !== void 0 && modelOrValueOrMatcherIndex !== void 0 && checkedIndex < modelOrValueOrMatcherIndex) {
          [_instructions[modelOrValueOrMatcherIndex], _instructions[checkedIndex]] = [_instructions[checkedIndex], _instructions[modelOrValueOrMatcherIndex]];
        }
      }
    }
  }

  /**
   * Mark an element as target with a special css class
   * and return it
   *
   * @internal
   */
  private _markAsTarget<T extends Element>(el: T): T {
    el.classList.add('au');
    return el;
  }

  /**
   * Replace an element with a marker, and return the marker
   *
   * @internal
   */
  private _replaceByMarker(node: Node, context: CompilationContext): HTMLElement {
    // todo: assumption made: parentNode won't be null
    const parent = node.parentNode!;
    const marker = context.h('au-m');
    this._markAsTarget(parent.insertBefore(marker, node));
    parent.removeChild(node);
    return marker;
  }
}

// this class is intended to be an implementation encapsulating the information at the root level of a template
// this works at the time this is created because everything inside a template should be retrieved
// from the root itself.
// if anytime in the future, where it's desirable to retrieve information from somewhere other than root
// then consider dropping this
// goal: hide the root container, and all the resources finding calls
class CompilationContext {
  public readonly root: CompilationContext;
  public readonly parent: CompilationContext | null;
  public readonly def: PartialCustomElementDefinition;
  public readonly ci: ICompliationInstruction;
  public readonly _templateFactory: ITemplateElementFactory;
  public readonly _logger: ILogger;
  public readonly _attrParser: IAttributeParser;
  public readonly _attrMapper: IAttrMapper;
  public readonly _exprParser: IExpressionParser;
  public readonly p: IPlatform;
  // an array representing targets of instructions, built on depth first tree walking compilation
  public readonly rows: IInstruction[][];
  public readonly localEls: Set<string>;
  public hasSlot: boolean = false;
  public deps: unknown[] | undefined;

  /** @internal */
  private readonly c: IContainer;

  public constructor(
    def: PartialCustomElementDefinition,
    container: IContainer,
    compilationInstruction: ICompliationInstruction,
    parent: CompilationContext | null,
    root: CompilationContext | null,
    instructions: IInstruction[][] | undefined,
  ) {
    const hasParent = parent !== null;
    this.c = container;
    this.root = root === null ? this : root;
    this.def = def;
    this.ci = compilationInstruction;
    this.parent = parent;
    this._templateFactory = hasParent ? parent!._templateFactory : container.get(ITemplateElementFactory);
    // todo: attr parser should be retrieved based in resource semantic (current leaf + root + ignore parent)
    this._attrParser = hasParent ? parent!._attrParser : container.get(IAttributeParser);
    this._exprParser = hasParent ? parent!._exprParser : container.get(IExpressionParser);
    this._attrMapper = hasParent ? parent!._attrMapper : container.get(IAttrMapper);
    this._logger = hasParent ? parent!._logger : container.get(ILogger);
    this.p = hasParent ? parent!.p : container.get(IPlatform);
    this.localEls = hasParent ? parent!.localEls : new Set();
    this.rows = instructions ?? [];
  }

  public _addDep(dep: unknown) {
    (this.root.deps ??= []).push(dep);
    this.root.c.register(dep);
  }

  public h<K extends keyof HTMLElementTagNameMap>(name: K): HTMLElementTagNameMap[K];
  public h<K extends string>(name: string): HTMLElement;
  public h(name: string): HTMLElement {
    const el = this.p.document.createElement(name);
    if (name === 'template') {
      this.p.document.adoptNode((el as HTMLTemplateElement).content);
    }
    return el;
  }

  /**
   * Find the custom element definition of a given name
   */
  public _findElement(name: string): CustomElementDefinition | null {
    return this.c.find(CustomElement, name);
  }

  /**
   * Find the custom attribute definition of a given name
   */
  public _findAttr(name: string): CustomAttributeDefinition | null {
    return this.c.find(CustomAttribute, name);
  }

  /**
   * Create a new child compilation context
   */
  public _createChild(instructions?: IInstruction[][]) {
    return new CompilationContext(this.def, this.c, this.ci, this, this.root, instructions);
  }

  // todo: ideally binding command shouldn't have to be cached
  // it can just be a singleton where it' retrieved
  // the resources semantic should be defined by the resource itself,
  // rather than baked in the container
  private readonly _commands: Record<string, BindingCommandInstance | null | undefined> = createLookup();
  /**
   * Retrieve a binding command resource instance.
   *
   * @param name - The parsed `AttrSyntax`
   *
   * @returns An instance of the command if it exists, or `null` if it does not exist.
   */
  public _createCommand(syntax: AttrSyntax): BindingCommandInstance | null {
    if (this.root !== this) {
      return this.root._createCommand(syntax);
    }
    const name = syntax.command;
    if (name === null) {
      return null;
    }
    let result = this._commands[name];
    if (result === void 0) {
      result = this.c.create(BindingCommand, name) as BindingCommandInstance;
      if (result === null) {
        if (__DEV__)
          throw new Error(`Unknown binding command: ${name}`);
        else
          throw new Error(`AUR0713:${name}`);
      }
      this._commands[name] = result;
    }
    return result;
  }
}

function hasInlineBindings(rawValue: string): boolean {
  const len = rawValue.length;
  let ch = 0;
  let i = 0;
  while (len > i) {
    ch = rawValue.charCodeAt(i);
    if (ch === Char.Backslash) {
      ++i;
      // Ignore whatever comes next because it's escaped
    } else if (ch === Char.Colon) {
      return true;
    } else if (ch === Char.Dollar && rawValue.charCodeAt(i + 1) === Char.OpenBrace) {
      return false;
    }
    ++i;
  }
  return false;
}

function resetCommandBuildInfo(): void {
  commandBuildInfo.node
    = commandBuildInfo.attr
    = commandBuildInfo.expr
    = commandBuildInfo.bindable
    = commandBuildInfo.def = null!;
}

const emptyCompilationInstructions: ICompliationInstruction = { projections: null };
// eslint-disable-next-line
const voidDefinition: CustomElementDefinition = { name: 'unnamed' } as CustomElementDefinition;
const commandBuildInfo: ICommandBuildInfo = {
  node: null!,
  expr: null!,
  attr: null!,
  bindable: null,
  def: null,
};
const invalidSurrogateAttribute = Object.assign(createLookup<boolean | undefined>(), {
  'id': true,
  'name': true,
  'au-slot': true,
  'as-element': true,
});
const orderSensitiveInputType: Record<string, number> = {
  checkbox: 1,
  radio: 1,
  // todo: range is also sensitive to order, for min/max
};

const bindableAttrsInfoCache = new WeakMap<CustomElementDefinition | CustomAttributeDefinition, BindablesInfo>();
export class BindablesInfo<T extends 0 | 1 = 0> {
  public static from(def: CustomAttributeDefinition, isAttr: true): BindablesInfo<1>;
  // eslint-disable-next-line
  public static from(def: CustomElementDefinition, isAttr: false): BindablesInfo<0>;
  public static from(def: CustomElementDefinition | CustomAttributeDefinition, isAttr: boolean): BindablesInfo<1 | 0> {
    let info = bindableAttrsInfoCache.get(def);
    if (info == null) {
      type CA = CustomAttributeDefinition;
      const bindables = def.bindables;
      const attrs = createLookup<BindableDefinition>();
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
            if (__DEV__)
              throw new Error(`Primary already exists on ${def.name}`);
            else
              throw new Error(`AUR0714:${def.name}`);
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

      bindableAttrsInfoCache.set(def, info = new BindablesInfo(attrs, bindables, primary));
    }
    return info;
  }

  protected constructor(
    public readonly attrs: Record<string, BindableDefinition>,
    public readonly bindables: Record<string, BindableDefinition>,
    public readonly primary: T extends 1 ? BindableDefinition : BindableDefinition | undefined,
  ) {}
}

const enum LocalTemplateBindableAttributes {
  property = "property",
  attribute = "attribute",
  mode = "mode",
}
const allowedLocalTemplateBindableAttributes: readonly string[] = Object.freeze([
  LocalTemplateBindableAttributes.property,
  LocalTemplateBindableAttributes.attribute,
  LocalTemplateBindableAttributes.mode
]);
const localTemplateIdentifier = 'as-custom-element';

function processTemplateName(localTemplate: HTMLTemplateElement, localTemplateNames: Set<string>): string {
  const name = localTemplate.getAttribute(localTemplateIdentifier);
  if (name === null || name === '') {
    if (__DEV__)
      throw new Error('The value of "as-custom-element" attribute cannot be empty for local template');
    else
      throw new Error('AUR0715');
  }
  if (localTemplateNames.has(name)) {
    if (__DEV__)
      throw new Error(`Duplicate definition of the local template named ${name}`);
    else
      throw new Error(`AUR0716:${name}`);
  } else {
    localTemplateNames.add(name);
    localTemplate.removeAttribute(localTemplateIdentifier);
  }
  return name;
}

function getBindingMode(bindable: Element): BindingMode {
  switch (bindable.getAttribute(LocalTemplateBindableAttributes.mode)) {
    case 'oneTime':
      return BindingMode.oneTime;
    case 'toView':
      return BindingMode.toView;
    case 'fromView':
      return BindingMode.fromView;
    case 'twoWay':
      return BindingMode.twoWay;
    case 'default':
    default:
      return BindingMode.default;
  }
}

/**
 * An interface describing the hooks a compilation process should invoke.
 *
 * A feature available to the default template compiler.
 */
export const ITemplateCompilerHooks = DI.createInterface<ITemplateCompilerHooks>('ITemplateCompilerHooks');
export interface ITemplateCompilerHooks {
  /**
   * Should be invoked immediately before a template gets compiled
   */
  compiling?(template: HTMLElement): void;
}

const typeToHooksDefCache = new WeakMap<Constructable, TemplateCompilerHooksDefinition<unknown>>();
const hooksBaseName = Protocol.resource.keyFor('compiler-hooks');
export const TemplateCompilerHooks = Object.freeze({
  name: hooksBaseName,
  define<K extends ITemplateCompilerHooks, T extends Constructable<K>>(Type: T): T {
    let def = typeToHooksDefCache.get(Type);
    if (def === void 0) {
      typeToHooksDefCache.set(Type, def = new TemplateCompilerHooksDefinition(Type));
      Metadata.define(hooksBaseName, def, Type);
      Protocol.resource.appendTo(Type, hooksBaseName);
    }
    return Type;
  }
});

class TemplateCompilerHooksDefinition<T> implements ResourceDefinition<Constructable<T>, ITemplateCompilerHooks> {
  public get name(): string { return ''; }

  public constructor(
    public readonly Type: ResourceType<Constructable<T>, ITemplateCompilerHooks>,
  ) {}

  public register(c: IContainer) {
    c.register(Registration.singleton(ITemplateCompilerHooks, this.Type));
  }
}

/**
 * Decorator: Indicates that the decorated class is a template compiler hooks.
 *
 * An instance of this class will be created and appropriate compilation hooks will be invoked
 * at different phases of the default compiler.
 */
/* eslint-disable */
// deepscan-disable-next-line
export const templateCompilerHooks = (target?: Function) => {
  return target === void 0 ? decorator : decorator(target);
  function decorator(t: Function): any {
    return TemplateCompilerHooks.define(t as Constructable) as unknown as void;
  };
}
/* eslint-enable */
