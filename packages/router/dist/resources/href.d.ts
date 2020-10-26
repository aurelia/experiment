import { INode, ICustomAttributeViewModel, ICustomAttributeController } from '@aurelia/runtime-html';
import { IRouter } from '../router';
export declare class HrefCustomAttribute implements ICustomAttributeViewModel {
    private readonly router;
    value: string | undefined;
    private readonly element;
    readonly $controller: ICustomAttributeController<this>;
    constructor(element: INode, router: IRouter);
    beforeBind(): void;
    beforeUnbind(): void;
    valueChanged(): void;
    private updateValue;
    private hasGoto;
}
//# sourceMappingURL=href.d.ts.map