export interface ITemplateRenderer<T> {
    render(info: T): string;
}

export enum TemplateRendererType {
    Decorator,
    DecoratorArgument,
    Type,
    TypeParameter,
    Comment,
    Enum,
    TypeAlias,
    Function,
    Class,
    Interface,
    VariableStatement,
    LiteralCallSignature,
    LiteralAssignment,
    LiteralExpression,
    ExportAssignment,
}
