import { IContainer, Registration } from '@aurelia/kernel';
import { IShadowDOMGlobalStyles } from './shadow-dom-styles';
import { IShadowDOMStyleFactory } from './shadow-dom-registry';
import { AppTask } from '../app-task';
export const StyleConfiguration = {
    shadowDOM(config) {
        return AppTask.with(IContainer).beforeCreate().call(container => {
            if (config.sharedStyles) {
                const factory = container.get(IShadowDOMStyleFactory);
                container.register(Registration.instance(IShadowDOMGlobalStyles, factory.createStyles(config.sharedStyles, null)));
            }
        });
    }
};
//# sourceMappingURL=style-configuration.js.map