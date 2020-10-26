import type { ITask } from '@aurelia/kernel';
import { AccessorType, IAccessor, LifecycleFlags } from '../observation';
export declare class PropertyAccessor implements IAccessor {
    task: ITask | null;
    type: AccessorType;
    getValue(obj: object, key: string): unknown;
    setValue(value: unknown, flags: LifecycleFlags, obj: object, key: string): void;
}
export declare const propertyAccessor: PropertyAccessor;
//# sourceMappingURL=property-accessor.d.ts.map