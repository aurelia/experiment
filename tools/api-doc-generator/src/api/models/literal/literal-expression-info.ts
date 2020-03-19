import { GetAccessorInfo } from '../property/get-accessor-info';
import { SetAccessorInfo } from '../property/set-accessor-info';
import { MethodInfo } from '../method/method-info';
import { LiteralAssignmentInfo } from './literal-assignment-info';

export interface LiteralExpressionInfo {
    assignments: LiteralAssignmentInfo[] | undefined;
    getAccessors: GetAccessorInfo[] | undefined;
    setAccessors: SetAccessorInfo[] | undefined;
    methods: MethodInfo[] | undefined;
    text: string;
    isObject: boolean;
}
