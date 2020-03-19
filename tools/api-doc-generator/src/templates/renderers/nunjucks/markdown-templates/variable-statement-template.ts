export const variableStatementTemplate = `
{% if comment %}
    # &#9733; Summary
    {{ comment | commentRenderer }}
{% endif %}
<br/>
| Modifier(s)                            |
|----------------------------------------|
| {{ modifiers | join(', ','declare') }} |
<br/>
{% if variables %}
    # &#9733; Variable(s)
    {% for v in variables %}
        &nbsp;&nbsp; **&#10148; {{ v.name | replaceWith | mdEscape }}**
        <br/>
        {% if v.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**
            {{ v.comment | commentRenderer }}
            <br/>
        {% endif %}
        | Type                        |
        |-----------------------------|
        | {{ v.type | typeRenderer }} |
        <br/>
        {% if v.initializer %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Initializer**
            <br/>
            \`\`\`ts
            {{ v.initializer | replaceWith }}
            \`\`\`
            <br/>
        {% endif %}
        <br/>
    {% endfor %}
{% endif %}
{% if literals %}
    # &#9733; Literal(s)
    {% for l in literals %}
        &nbsp;&nbsp; **&#10148; {{ l.name | replaceWith | mdEscape }}**
        <br/>
        {% if l.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**
            {{ l.comment | commentRenderer }}
            <br/>
        {% endif %}
        | Type                        | Array                           |
        |-----------------------------|---------------------------------|
        | {{ l.type | typeRenderer }} | {{ l.isArray | print_symbol  }} |
        <br/>        
        {% if l.members %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Member(s)**
            {% for m in l.members %}
                {{ m | memberRenderer }}
            {% endfor %}
        {% endif %}
    {% endfor %}
{% endif %}
{% if destructuring %}
    # &#9733; Destructuring(s)
    {% for de in destructuring %}
        {% if de.comment %}
            &nbsp;&nbsp; **&#9733; Summary**
            {{ de.comment | commentRenderer }}
        {% endif %}
        <br/>
        | Array                            |
        |----------------------------------|
        | {{ de.isArray | print_symbol  }} |
        <br/>
        {% if de.initializer %}
            &nbsp;&nbsp; **&#9733; Initializer**
            <br/>
            {{ de.initializer | replaceWith }}
            <br/>
        {% endif %}
        <br/>
        {% if de.members %}
            &nbsp;&nbsp; **&#9733; Member(s)**
            {% for m in de.members %}
                {{ m | memberRenderer }}
            {% endfor %}
        {% endif %}
    {% endfor %}
{% endif %}
`;
