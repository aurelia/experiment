import { Constructable, IContainer, Registration, Writable } from '@aurelia/kernel';
import { IResourceKind, IResourceType } from '../resource';

export interface IBindingBehaviorSource {
  name: string;
}

export type IBindingBehaviorType = IResourceType<IBindingBehaviorSource>;

export function bindingBehavior(nameOrSource: string | IBindingBehaviorSource): <T extends Constructable>(target: T) => T & IResourceType<IBindingBehaviorSource> {
  return function<T extends Constructable>(target: T): T & IResourceType<IBindingBehaviorSource> {
    return BindingBehaviorResource.define(nameOrSource, target);
  };
}

export const BindingBehaviorResource: IResourceKind<IBindingBehaviorSource, IBindingBehaviorType> = {
  name: 'binding-behavior',

  keyFrom(name: string): string {
    return `${this.name}:${name}`;
  },

  isType<T extends Constructable>(Type: T): Type is T & IBindingBehaviorType {
    return (Type as T & IBindingBehaviorType).kind === this;
  },

  define<T extends Constructable>(nameOrSource: string | IBindingBehaviorSource, ctor: T): T & IBindingBehaviorType {
    const Type = ctor as T & IBindingBehaviorType;
    const description = typeof nameOrSource === 'string'
      ? { name: nameOrSource }
      : nameOrSource;

    (Type as Writable<IBindingBehaviorType>).kind = BindingBehaviorResource;
    (Type as Writable<IBindingBehaviorType>).description = description;
    Type.register = register;

    return Type;
  }
};

function register(this: IBindingBehaviorType, container: IContainer): void {
  container.register(
    Registration.singleton(
      BindingBehaviorResource.keyFrom(this.description.name),
      this
    )
  );
}
