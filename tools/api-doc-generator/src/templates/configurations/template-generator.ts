import { ITemplateConfiguration } from './template-configuration';
import { TemplateRendererType, ITemplateRenderer } from '../renderers/template-renderer';

export interface ITemplateGenerator {
    configure: (configureAction?: (defaultConfiguration: ITemplateConfiguration) => ITemplateConfiguration) => void;
    reset: () => void;

    addRenderer<T>(type: TemplateRendererType, renderer: ITemplateRenderer<T>): ITemplateGenerator;
    getRenderer<T>(type: TemplateRendererType): ITemplateRenderer<T>;
}
