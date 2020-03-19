export const decoratorTemplate = `
| Name                                | Decorator Factory                        |
|-------------------------------------|:----------------------------------------:|
| {{ name | replaceWith | mdEscape }} | {{ isDecoratorFactory | print_symbol }}  |
<br/>
{% if arguments %}
| Argument(s)                                           |
|-------------------------------------------------------|
    {% for args in arguments %}
        | {{ args | decoratorArgumentRenderer }}  |
    {% endfor %}
{% endif %}
`;
