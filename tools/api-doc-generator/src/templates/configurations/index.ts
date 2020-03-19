import { ITemplateConfiguration } from './template-configuration';
import { ITemplateGenerator } from './template-generator';
import { defaultConfiguration } from './default-configuration';
import { ITemplateRenderer, TemplateRendererType } from '../renderers/template-renderer';
import {
    DecoratorRenderer,
    DecoratorArgumentRenderer,
    TypeRenderer,
    TypeParameterRenderer,
    CommentRenderer,
    EnumRenderer,
    TypeAliasRenderer,
    FunctionRenderer,
    ClassRenderer,
    InterfaceRenderer,
    LiteralCallSignatureRenderer,
    LiteralAssignmentRenderer,
    LiteralExpressionRenderer,
    VariableStatementRenderer,
    ExportAssignmentRenderer,
} from '../renderers/renderers';

let configuration = defaultConfiguration;

/* eslint-disable */
// @ts-ignore
const renderers: Record<TemplateRendererType, ITemplateRenderer> = {};
/* eslint-disable */

const templateGenerator: ITemplateGenerator = {
    configure: (configureAction?: (defaultConfiguration: ITemplateConfiguration) => ITemplateConfiguration) => {
        configuration = configureAction
            ? configureAction(Object.assign({}, defaultConfiguration))
            : defaultConfiguration;
    },
    reset: () => {
        configuration = defaultConfiguration;
    },

    addRenderer<T>(type: TemplateRendererType, renderer: ITemplateRenderer<T>): ITemplateGenerator {
        // @ts-ignore
        // const key = renderer.__proto__.constructor.name;

        renderers[type] = renderer;
        return templateGenerator;
    },
    getRenderer<T>(type: TemplateRendererType): ITemplateRenderer<T> {
        return renderers[type] as ITemplateRenderer<T>;
    },
};

templateGenerator
    .addRenderer(TemplateRendererType.Decorator, new DecoratorRenderer())
    .addRenderer(TemplateRendererType.DecoratorArgument, new DecoratorArgumentRenderer())
    .addRenderer(TemplateRendererType.Type, new TypeRenderer())
    .addRenderer(TemplateRendererType.TypeParameter, new TypeParameterRenderer())
    .addRenderer(TemplateRendererType.Comment, new CommentRenderer())
    .addRenderer(TemplateRendererType.Enum, new EnumRenderer())
    .addRenderer(TemplateRendererType.TypeAlias, new TypeAliasRenderer())
    .addRenderer(TemplateRendererType.Function, new FunctionRenderer())
    .addRenderer(TemplateRendererType.Class, new ClassRenderer())
    .addRenderer(TemplateRendererType.Interface, new InterfaceRenderer())
    .addRenderer(TemplateRendererType.LiteralCallSignature, new LiteralCallSignatureRenderer())
    .addRenderer(TemplateRendererType.LiteralAssignment, new LiteralAssignmentRenderer())
    .addRenderer(TemplateRendererType.LiteralExpression, new LiteralExpressionRenderer())
    .addRenderer(TemplateRendererType.VariableStatement, new VariableStatementRenderer())
    .addRenderer(TemplateRendererType.ExportAssignment, new ExportAssignmentRenderer())

    ;

export { configuration as TemplateConfiguration, templateGenerator as TemplateGenerator , ITemplateConfiguration, ITemplateGenerator };
