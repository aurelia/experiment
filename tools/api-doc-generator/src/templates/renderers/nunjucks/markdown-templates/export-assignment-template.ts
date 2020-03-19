export const exportAssignmentTemplate = `
{% if comment %}
    # &#10025; Summary
    {{ comment | commentRenderer }}
{% endif %}
<br/>
| Default                          | Array                         |
|:--------------------------------:|:-----------------------------:|
| {{ isDefault | print_symbol }}   | {{ isArray | print_symbol  }} |
<br/>
{% if newExpression %}
    # &#10025; New Expression
    <br/>
    | Name                                              | Type                                    |
    |---------------------------------------------------|-----------------------------------------|
    | {{ newExpression.name | replaceWith | mdEscape }} | {{ newExpression.type | typeRenderer }} |
    <br/>
{% endif %}
{% if members %}
    # &#10025; Member(s)
    {% for m in members %}
        {{ m | memberRenderer }}
    {% endfor %}
{% endif %}
`;
