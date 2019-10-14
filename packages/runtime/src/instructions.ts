import {
  IForOfStatement,
  IInterpolationExpression,
  IsBindingBehavior,
} from './ast';
import {
  ICallBindingInstruction,
  IHydrateAttributeInstruction,
  IHydrateElementInstruction,
  IHydrateLetElementInstruction,
  IHydrateTemplateController,
  IInterpolationInstruction,
  IIteratorBindingInstruction,
  ILetBindingInstruction,
  IPropertyBindingInstruction,
  IRefBindingInstruction,
  ISetPropertyInstruction,
  ITargetedInstruction,
  ITemplateDefinition,
  TargetedInstructionType
} from './definitions';
import { BindingMode } from './flags';
import { PLATFORM } from '@aurelia/kernel';

export class InterpolationInstruction implements IInterpolationInstruction {
  public type: TargetedInstructionType.interpolation;

  public from: string | IInterpolationExpression;
  public to: string;

  public constructor(from: string | IInterpolationExpression, to: string) {
    this.type = TargetedInstructionType.interpolation;

    this.from = from;
    this.to = to;
  }
}

export class OneTimeBindingInstruction implements IPropertyBindingInstruction {
  public type: TargetedInstructionType.propertyBinding;

  public from: string | IsBindingBehavior;
  public mode: BindingMode.oneTime;
  public oneTime: true;
  public to: string;

  public constructor(from: string | IsBindingBehavior, to: string) {
    this.type = TargetedInstructionType.propertyBinding;

    this.from = from;
    this.mode = BindingMode.oneTime;
    this.oneTime = true;
    this.to = to;
  }
}

export class ToViewBindingInstruction implements IPropertyBindingInstruction {
  public type: TargetedInstructionType.propertyBinding;

  public from: string | IsBindingBehavior;
  public mode: BindingMode.toView;
  public oneTime: false;
  public to: string;

  public constructor(from: string | IsBindingBehavior, to: string) {
    this.type = TargetedInstructionType.propertyBinding;

    this.from = from;
    this.mode = BindingMode.toView;
    this.oneTime = false;
    this.to = to;
  }
}

export class FromViewBindingInstruction implements IPropertyBindingInstruction {
  public type: TargetedInstructionType.propertyBinding;

  public from: string | IsBindingBehavior;
  public mode: BindingMode.fromView;
  public oneTime: false;
  public to: string;

  public constructor(from: string | IsBindingBehavior, to: string) {
    this.type = TargetedInstructionType.propertyBinding;

    this.from = from;
    this.mode = BindingMode.fromView;
    this.oneTime = false;
    this.to = to;
  }
}

export class TwoWayBindingInstruction implements IPropertyBindingInstruction {
  public type: TargetedInstructionType.propertyBinding;

  public from: string | IsBindingBehavior;
  public mode: BindingMode.twoWay;
  public oneTime: false;
  public to: string;

  public constructor(from: string | IsBindingBehavior, to: string) {
    this.type = TargetedInstructionType.propertyBinding;

    this.from = from;
    this.mode = BindingMode.twoWay;
    this.oneTime = false;
    this.to = to;
  }
}

export class IteratorBindingInstruction implements IIteratorBindingInstruction {
  public type: TargetedInstructionType.iteratorBinding;

  public from: string | IForOfStatement;
  public to: string;

  public constructor(from: string | IForOfStatement, to: string) {
    this.type = TargetedInstructionType.iteratorBinding;

    this.from = from;
    this.to = to;
  }
}

export class CallBindingInstruction implements ICallBindingInstruction {
  public type: TargetedInstructionType.callBinding;

  public from: string | IsBindingBehavior;
  public to: string;

  public constructor(from: string | IsBindingBehavior, to: string) {
    this.type = TargetedInstructionType.callBinding;

    this.from = from;
    this.to = to;
  }
}

export class RefBindingInstruction implements IRefBindingInstruction {
  public type: TargetedInstructionType.refBinding;

  public constructor(
    public readonly from: string | IsBindingBehavior,
    public readonly to: string
  ) {
    this.type = TargetedInstructionType.refBinding;
  }
}

export class SetPropertyInstruction implements ISetPropertyInstruction {
  public type: TargetedInstructionType.setProperty;

  public to: string;
  public value: unknown;

  public constructor(value: unknown, to: string) {
    this.type = TargetedInstructionType.setProperty;

    this.to = to;
    this.value = value;
  }
}

export class HydrateElementInstruction implements IHydrateElementInstruction {
  public readonly type: TargetedInstructionType.hydrateElement;
  public readonly capturedAttrs: { name: string; value: string }[];

  public constructor(
    public readonly res: string,
    public readonly instructions: ITargetedInstruction[],
    public readonly parts: Record<string, ITemplateDefinition> | undefined,
    capturedAttrs: { name: string; value: string }[] | undefined
  ) {
    this.type = TargetedInstructionType.hydrateElement;
    this.capturedAttrs = capturedAttrs === void 0 ? PLATFORM.emptyArray : capturedAttrs;
  }
}

export class HydrateAttributeInstruction implements IHydrateAttributeInstruction {
  public type: TargetedInstructionType.hydrateAttribute;

  public instructions: ITargetedInstruction[];
  public res: string;

  public constructor(res: string, instructions: ITargetedInstruction[]) {
    this.type = TargetedInstructionType.hydrateAttribute;

    this.instructions = instructions;
    this.res = res;
  }
}

export class HydrateTemplateController implements IHydrateTemplateController {
  public type: TargetedInstructionType.hydrateTemplateController;

  public def: ITemplateDefinition;
  public instructions: ITargetedInstruction[];
  public link?: boolean;
  public parts?: Record<string, ITemplateDefinition>;
  public res: string;

  public constructor(
    def: ITemplateDefinition,
    res: string,
    instructions: ITargetedInstruction[],
    link?: boolean,
    parts?: Record<string, ITemplateDefinition>,
  ) {
    this.type = TargetedInstructionType.hydrateTemplateController;

    this.def = def;
    this.instructions = instructions;
    this.link = link;
    this.parts = parts;
    this.res = res;
  }
}

export class LetElementInstruction implements IHydrateLetElementInstruction {
  public type: TargetedInstructionType.hydrateLetElement;

  public instructions: ILetBindingInstruction[];
  public toBindingContext: boolean;

  public constructor(instructions: ILetBindingInstruction[], toBindingContext: boolean) {
    this.type = TargetedInstructionType.hydrateLetElement;

    this.instructions = instructions;
    this.toBindingContext = toBindingContext;
  }
}

export class LetBindingInstruction implements ILetBindingInstruction {
  public type: TargetedInstructionType.letBinding;

  public from: string | IsBindingBehavior | IInterpolationExpression;
  public to: string;

  public constructor(from: string | IsBindingBehavior | IInterpolationExpression, to: string) {
    this.type = TargetedInstructionType.letBinding;

    this.from = from;
    this.to = to;
  }
}
