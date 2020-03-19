export const enumTemplate = `
{% if comment %}
    # &#10025; Summary
    {{ comment | commentRenderer }}
{% endif %}
<br/>
| Const                        |
|------------------------------|
| {{ isConst | print_symbol }} |
<br/>
{% if members %}
    # &#10025; Member(s)
    | Name                                      | Value         |
    |-------------------------------------------|---------------|
    {% for m in members %}
        | {{ m.name | replaceWith | mdEscape }} | {{ m.value }} |
    {% endfor %}
{% endif %}
`;
