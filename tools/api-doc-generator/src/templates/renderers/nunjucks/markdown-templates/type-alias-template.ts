export const typeAliasTemplate = `
{% if comment %}
    # &#10025; Summary
    {{ comment | commentRenderer }}
{% endif %}
<br/>
| Modifier(s)                            | Type                     |
|----------------------------------------|--------------------------|
| {{ modifiers | join(', ','declare') }} | {{ type | typeRenderer}} |
<br/>
{% if typeParameters %}
    # &#10025; Type Parameter(s)
    {% for tp in typeParameters %}
        {{ tp | typeParameterRenderer}}
        <br/>
    {% endfor %}
{% endif %}
{% if initializer %}
    # &#10025; Initializer
    \`\`\`ts
    {{ initializer | replaceWith }}
    \`\`\`
{% endif %}
`;
