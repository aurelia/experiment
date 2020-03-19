export const commentTemplate = `
{% if description %}
    {% for d in description %}
        {{ d }}
    {% endfor %}
{% endif %}

{% if details %}
    {% for detail in details %}
        **{{ detail.title | mdEscape }}**
        {% if detail.tags %}
            {{ detail.tags | tagToMdTable }}
        {% endif %}
    {% endfor %}
{% endif %}
`;
