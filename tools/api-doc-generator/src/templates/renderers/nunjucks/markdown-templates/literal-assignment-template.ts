export const literalAssignmentTemplate = `
**&#10148; {{ name | replaceWith | mdEscape }}**
<br/>
{% if comment %}
    &nbsp;&nbsp; **&#9733; Summary**
    {{ comment | commentRenderer}}
    <br/>
{% endif %}
| Type                      | Shorthand                         | Spread                        |
|---------------------------|:---------------------------------:|:-----------------------------:|
| {{ type | typeRenderer }} | {{ isShorthand | print_symbol }}  | {{ isSpread | print_symbol }} |
<br/>
**&#9733; Value**
{{ value | memberRenderer }}
`;
