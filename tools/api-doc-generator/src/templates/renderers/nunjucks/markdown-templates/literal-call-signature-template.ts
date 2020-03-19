export const literalCallSignatureTemplate = `
{% if returnType %}
    | Return Type                     |
    |---------------------------------|
    | {{ returnType | typeRenderer }} |
{% endif %}
<br/>
{% if typeParameters %}
    **&#9733; Type Parameter(s)**
    {% for tp in typeParameters %}
        {{ tp | typeParameterRenderer }}
        <br/>
    {% endfor %}
{% endif %}
{% if parameters %}
    **&#9733; Parameter(s)**
    {% for p in parameters %}
        &nbsp;&nbsp; _**&#10149; {{ p.name | replaceWith | mdEscape }}**_
        <br/>
        | Modifier(s)                              | Type                        | Optional                           | Rest                          | Parameter Property                          |
        |------------------------------------------|-----------------------------|:----------------------------------:|:-----------------------------:|:-------------------------------------------:|
        | {{ p.modifiers | join(', ','declare') }} | {{ p.type | typeRenderer }} | {{ p.isOptional | print_symbol }}  | {{ p.isRest | print_symbol }} | {{ p.isParameterProperty  | print_symbol }} |
         <br/>
         {% if p.initializer %}
            &nbsp;&nbsp; **&#9733; Initializer**
            <br/>
            \`\`\`ts
            {{ p.initializer | replaceWith }}
            \`\`\`
            <br/>
         {% endif %}
    {% endfor %}
{% endif %}
`;
