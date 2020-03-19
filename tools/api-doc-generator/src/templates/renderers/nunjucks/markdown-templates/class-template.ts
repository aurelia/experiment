export const classTemplate = `
{% if comment %}
    # &#10025; Summary
    {{ comment | commentRenderer }}
{% endif %}
<br/>
| Modifier(s)                            | Extends                      | Implements                                    |
|----------------------------------------|------------------------------|-----------------------------------------------|
| {{ modifiers | join(', ','declare') }} | {{ extends | typeRenderer }} | {{ implements | typesRenderer | join(', ') }} |
<br/>
{% if typeParameters %}
    # &#10025; Type Parameter(s)
    {% for tp in typeParameters %}
        {{ tp | typeParameterRenderer }}
        <br/>
    {% endfor %}
{% endif %}
{% if decorators %}
    # &#10025; Decorators(s)
    {% for d in decorators %}
        {{ d | decoratorRenderer }}
        <br/>
    {% endfor %}
{% endif %}
{% if constructors %}
    # &#10025; Constructor(s)
    {% for c in constructors %}
        | Parameter-less                         | Implementation                          | Overload                          |
        |:--------------------------------------:|:---------------------------------------:|:---------------------------------:|
        | {{ c.isParameterLess | print_symbol }} | {{ c.isImplementation | print_symbol }} | {{ c.isOverload | print_symbol }} |
        <br/>
        {% if c.parameters %}
            &nbsp;&nbsp; **&#9733; Parameter(s)**
            <br/>
            {% for p in c.parameters %}
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#10149; {{ p.name | replaceWith | mdEscape }}**
                <br/>
                | Type                        | Optional                           | Rest                          | Parameter Property                          |
                |-----------------------------|:----------------------------------:|:-----------------------------:|:-------------------------------------------:|
                | {{ p.type | typeRenderer }} | {{ p.isOptional | print_symbol }}  | {{ p.isRest | print_symbol }} | {{ p.isParameterProperty  | print_symbol }} |            
                <br/>
                {% if p.decorators %}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Decorator(s)**
                    <br/>
                    {% for de in p.decorators %}
                        {{ de | decoratorRenderer }}
                        <br/>
                    {% endfor %}
                {% endif %}
                <br/>
            {% endfor %}
        {% endif %}
    {% endfor %}
{% endif %}
{% if indexers %}
    # &#9733; Indexer(s)
    {% for i in indexers %}
        {% if i.comment %}
            &nbsp;&nbsp; **&#9733; Summary**
            {{ i.comment | commentRenderer}}
        {% endif %}
        <br/>
        {% if i.returnType %}
            | Return Type                      |
            |----------------------------------|
            | {{ i.returnType | typeRenderer}} |
        {% endif %}
        <br/>
        | Key Name                                 | Key Type                       |
        |------------------------------------------|--------------------------------|
        | {{ i.keyName | replaceWith | mdEscape }} | {{ i.keyType | typeRenderer }} |
        <br/>
    {% endfor %}
{% endif %}
{% if properties %}
    # &#10025; Property(ies)
    {% for pr in properties %}
        &nbsp;&nbsp; **&#10148; {{ pr.name | replaceWith | mdEscape }}**
        {% if pr.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**
            {{ pr.comment | commentRenderer }}
        {% endif %}
        <br/>
        | Modifier(s)                               | Optional                           | Type                         |
        |-------------------------------------------|:----------------------------------:|------------------------------|
        | {{ pr.modifiers | join(', ','declare') }} | {{ pr.isOptional | print_symbol }} | {{ pr.type | typeRenderer }} |
        <br/>  
        {% if pr.decorators %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Decorators(s)**
            {% for d in pr.decorators %}
                {{ d | decoratorRenderer }}
                <br/>
            {% endfor %}
        {% endif %}        
        {% if p.initializer %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Initializer**
            <br/>
            \`\`\`ts
            {{ p.initializer | replaceWith }}
            \`\`\`
            <br/>
        {% endif %}
    {% endfor %}
{% endif %}
{% if getAccessors %}
    # &#10025; Get Accessor(s)
    {% for g in getAccessors %}
        &nbsp;&nbsp; **&#10148; {{ g.name | replaceWith | mdEscape }}**
        <br/>
        {% if g.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**
            {{ g.comment | commentRenderer }}
            <br/>
        {% endif %}
        <br/>
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
    # &#10025; Set Accessor(s)
    {% for s in setAccessors %}
        &nbsp;&nbsp; **&#10148; {{ s.name | replaceWith | mdEscape }}**
        <br/>
        {% if s.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**
            {{ s.comment | commentRenderer }}
            <br/>
        {% endif %}
        <br/>
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
        <br/>
        {% if s.parameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Parameter(s)**
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
    # &#10025; Method(s)
    {% for m in methods %}
        &nbsp;&nbsp; **&#10148; {{ m.name | replaceWith | mdEscape }}**
        <br/>
        {% if m.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**
            {{ m.comment | commentRenderer }}
            <br/>
        {% endif %}
        <br/>
        | Modifier(s)                              | Generator                          | Return Type                       |
        |------------------------------------------|:----------------------------------:|-----------------------------------|
        | {{ m.modifiers | join(', ','declare') }} | {{ m.isGenerator | print_symbol }} | {{ m.returnType | typeRenderer }} |        
        <br/>
        {% if m.typeParameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Type Parameter(s)**
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
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Parameter(s)**
            <br/>
            {% for p in m.parameters %}
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _**&#10149; {{ p.name | replaceWith | mdEscape }}**_
                <br/>            
                | Modifier(s)                              | Type                        | Optional                           | Rest                          | Parameter Property                          |
                |------------------------------------------|-----------------------------|:----------------------------------:|:-----------------------------:|:-------------------------------------------:|
                | {{ p.modifiers | join(', ','declare') }} | {{ p.type | typeRenderer }} | {{ p.isOptional | print_symbol }}  | {{ p.isRest | print_symbol }} | {{ p.isParameterProperty  | print_symbol }} |
                <br/>
                {% if p.decorators %}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Decorator(s)**
                    <br/>
                    {% for d in p.decorators %}
                        {{ d | decoratorRenderer }}
                        <br/>
                    {% endfor %}
                {% endif %}
                {% if p.initializer %}
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Initializer**
                    <br/>
                    \`\`\`ts
                    {{ p.initializer | replaceWith }}
                    \`\`\`
                    <br/>
                {% endif %}
            {% endfor %}
        {% endif %}
    {% endfor %}
{% endif %}
`;
