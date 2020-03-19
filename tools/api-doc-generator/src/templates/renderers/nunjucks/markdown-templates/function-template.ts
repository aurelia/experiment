export const functionTemplate = `
| Modifier(s)                            | Return Type                    | Generator                        | Overload                         | Implementation                        |
|----------------------------------------|--------------------------------|:--------------------------------:|:--------------------------------:|:-------------------------------------:|
| {{ modifiers | join(', ','declare') }} | {{ returnType | typeRenderer}} | {{ isGenerator | print_symbol }} | {{ isOverload | print_symbol }}  | {{ isImplementation | print_symbol }} |
<br/>
{% if comment %}
    # &#10025; Summary
    {{ comment | commentRenderer }}
{% endif %}
<br/>
{% if typeGuard %}
    # &#10025; Type Guard
    | On                             |
    |--------------------------------|
    | {{ typeGuard | typeRenderer }} |
{% endif %}
<br/>
{% if typeParameters %}
    # &#10025; Type Parameter(s)
    {% for tp in typeParameters %}
        {{ tp | typeParameterRenderer }}
        <br/>
    {% endfor %}
{% endif %}
{% if parameters %}
        &nbsp;&nbsp; **&#9733; Parameter(s)**
        {% for p in parameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _**&#10149; {{ p.name | replaceWith | mdEscape }}**_
        <br/>
        | Modifier(s)                              | Type                        | Optional                           | Rest                          | Parameter Property                          |
        |------------------------------------------|-----------------------------|:----------------------------------:|:-----------------------------:|:-------------------------------------------:|
        | {{ p.modifiers | join(', ','declare') }} | {{ p.type | typeRenderer }} | {{ p.isOptional | print_symbol }}  | {{ p.isRest | print_symbol }} | {{ p.isParameterProperty  | print_symbol }} |
        <br/>
        {% if p.initializer %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Initializer**
            <br/>
            \`\`\`ts
            {{ p.initializer | replaceWith }}
            \`\`\`
            <br/>
        {% endif %}
        <br/>
    {% endfor %}
{% endif %}
`;
