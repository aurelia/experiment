export const literalExpressionTemplate = `
| Object                        |
|:-----------------------------:|
| {{ isObject | print_symbol }} |
<br/>
{% if assignments %}
    **&#9733; Assignment(s)**
    {% for a in assignments %}
        {{ a | assignmentRenderer }}
        <br/>
    {% endfor %}
{% endif %}
{% if getAccessors %}
    **&#9733; Get Accessor(s)**
    {% for g in getAccessors %}
        &nbsp;&nbsp; **&#10148; {{ g.name | replaceWith | mdEscape }}**
        <br/>
        {% if g.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**
            {{ g.comment | commentRenderer }}
            <br/>
        {% endif %}
        | Modifier(s)                              | Return Type                       |
        |------------------------------------------|-----------------------------------|
        | {{ g.modifiers | join(', ','declare') }} | {{ g.returnType | typeRenderer }} |
        <br/>   
        {% if g.typeParameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Type Parameter(s)**
            {% for tp in g.typeParameters %}
                {{ tp | typeParameterRenderer }}
                <br/>
            {% endfor %}
        {% endif %}
        {% if g.decorators %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Decorators(s)**
            {% for d in g.decorators %}
                {{ d | decoratorRenderer }}
                <br/>
            {% endfor %}
        {% endif %}
    {% endfor %}
{% endif %}
{% if setAccessors %}
    **&#9733; Set Accessor(s)**
    {% for s in setAccessors %}
        &nbsp;&nbsp; **&#10148; {{ s.name | replaceWith | mdEscape }}**
        <br/> 
        {% if s.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**
            {{ s.comment | commentRenderer }}
            <br/>
        {% endif %}
        | Modifier(s)                              | Return Type                       |
        |------------------------------------------|-----------------------------------|
        | {{ s.modifiers | join(', ','declare') }} | {{ s.returnType | typeRenderer }} |
        <br/>         
        {% if s.typeParameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Type Parameter(s)**
            {% for tp in s.typeParameters %}
                {{ tp | typeParameterRenderer }}
                <br/>
            {% endfor %}
        {% endif %}
        {% if s.decorators %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Decorators(s)**
            {% for d in s.decorators %}
                {{ d | decoratorRenderer }}
                <br/>
            {% endfor %}
        {% endif %}
        {% if s.parameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Parameter(s)**
            <br/> 
            {% for p in s.parameters %}
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _**&#10149; {{ p.name | replaceWith | mdEscape }}**_
                <br/> 
                | Modifier(s)                              | Type                        |
                |------------------------------------------|-----------------------------|
                | {{ p.modifiers | join(', ','declare') }} | {{ p.type | typeRenderer }} |
                <br/> 
            {% endfor %}
        {% endif %}
    {% endfor %}
{% endif %}
{% if methods %}
    **&#9733; Method(s)**
    {% for m in methods %}
        &nbsp;&nbsp; **&#10148; {{ m.name | replaceWith | mdEscape }}**
        <br/>
        {% if m.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**;
            {{ m.comment | commentRenderer }}
            <br/>
        {% endif %}
        | Modifier(s)                              | Generator                          | Return Type                       |
        |------------------------------------------|:----------------------------------:|-----------------------------------|
        | {{ m.modifiers | join(', ','declare') }} | {{ m.isGenerator | print_symbol }} | {{ m.returnType | typeRenderer }} |        
        <br/>
        {% if m.typeParameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Type Parameter(s)**
            {% for tp in m.typeParameters %}
                {{ tp | typeParameterRenderer }}
                <br/>
            {% endfor %}
        {% endif %}
        {% if m.decorators %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Decorators(s)**
            {% for d in m.decorators %}
                {{ d | decoratorRenderer }}
                <br/>
            {% endfor %}
        {% endif %}
        {% if m.parameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Parameter(s)** 
            <br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _**&#10149; {{ p.name | replaceWith | mdEscape }}**_
            <br/>
            | Modifier(s)                              | Type                        | Optional                           | Rest                          | Parameter Property                          | Initializer                       |
            |------------------------------------------|-----------------------------|:----------------------------------:|:-----------------------------:|:-------------------------------------------:|-----------------------------------|
            | {{ p.modifiers | join(', ','declare') }} | {{ p.type | typeRenderer }} | {{ p.isOptional | print_symbol }}  | {{ p.isRest | print_symbol }} | {{ p.isParameterProperty  | print_symbol }} | {{ p.initializer | replaceWith }} |
            <br/>
            {% for p in m.parameters %}
                {% if p.decorators %}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Decorator(s)**
                    <br/>
                    {% for d in p.decorators %}
                        {{ d | decoratorRenderer }}
                        <br/>
                    {% endfor %}
                {% endif %}
            {% endfor %}
        {% endif %}
    {% endfor %}
{% endif %}
`;
