export const interfaceTemplate = `
{% if comment %}
    # &#10025; Summary
    {{ comment | commentRenderer }}
{% endif %}
<br/>
| Modifier(s)                            | Extends                                    |
|----------------------------------------|--------------------------------------------|
| {{ modifiers | join(', ','declare') }} | {{ extends | typesRenderer | join(', ') }} |
<br/>
{% if typeParameters %}
    # &#10025; Type Parameter(s)
    {% for tp in typeParameters %}
        {{ tp | typeParameterRenderer }}
        <br/>
    {% endfor %}
{% endif %}
{% if indexers %}
    # &#10025; Indexer(s)
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
{% if constructors %}
    # &#10025; Constructor(s)
    {% for c in constructors %}
        {% if c.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**
            {{ c.comment | commentRenderer }}
        {% endif %}
        <br/>
        {% if c.typeParameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Type Parameter(s)**
            {% for tp in c.typeParameters %}
                {{ tp | typeParameterRenderer }}
                <br/>
            {% endfor %}
        {% endif %}
        {% if c.returnType %}
            | Return Type                       |
            |-----------------------------------|
            | {{ c.returnType | typeRenderer }} |
        {% endif %}
        <br/>
        {% if c.parameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Parameter(s)**
            {% for p in c.parameters %}
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _**&#10149; {{ p.name | replaceWith | mdEscape }}**_
                <br/>
                | Modifier(s)                              | Optional                           | Rest                          | Parameter Property                          | Initializer                       |
                |------------------------------------------|:----------------------------------:|:-----------------------------:|:-------------------------------------------:|-----------------------------------|
                | {{ p.modifiers | join(', ','declare') }} | {{ p.isOptional | print_symbol }}  | {{ p.isRest | print_symbol }} | {{ p.isParameterProperty  | print_symbol }} | {{ p.initializer | replaceWith }} |            
                <br/>
            {% endfor %}
        {% endif %}
    {% endfor %}
{% endif %}
{% if properties %}
    # &#10025; Property(ies)
    {% for pr in properties %}
        &nbsp;&nbsp; **&#10148; {{ pr.name | replaceWith | mdEscape }}**
        <br/>
        {% if pr.comment %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Summary**
            {{ pr.comment | commentRenderer}}
            <br/>
        {% endif %}
        | Optional                           | Type                         |
        |:----------------------------------:|------------------------------|
        | {{ pr.isOptional | print_symbol }} | {{ pr.type | typeRenderer }} |
        <br/>   
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
        {% endif %}
        <br/>
        | Return Type                       |
        |-----------------------------------|
        | {{ m.returnType | typeRenderer }} |
        <br/>
        {% if m.typeParameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Type Parameter(s)**
            {% for tp in m.typeParameters %}
                {{ tp | typeParameterRenderer}}
                <br/>
            {% endfor %}
        {% endif %}
        {% if m.parameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Parameter(s)**
            <br/>
            {% for p in m.parameters %}
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _**&#10149; {{ p.name | replaceWith | mdEscape }}**_
                <br/> 
                | Modifier(s)                              | Optional                           | Rest                          | Parameter Property                          | Initializer                       |
                |------------------------------------------|:----------------------------------:|:-----------------------------:|:-------------------------------------------:|-----------------------------------|
                | {{ p.modifiers | join(', ','declare') }} | {{ p.isOptional | print_symbol }}  | {{ p.isRest | print_symbol }} | {{ p.isParameterProperty  | print_symbol }} | {{ p.initializer | replaceWith }} |            
                <br/>
            {% endfor %}
        {% endif %}
    {% endfor %}
{% endif %}
<br/>
{% if callSignatures %}
    # &#10025; Call Signature(s)
    {% for cs in callSignatures %}
        {% if cs.comment %}
            &nbsp;&nbsp; **&#9733; Summary**
            {{ cs.comment | commentRenderer }}
            <br/>
        {% endif %}
        {% if cs.typeParameters %}
            &nbsp;&nbsp; **&#9733; Type Parameter(s)**
            {% for tp in cs.typeParameters %}
                {{ tp | typeParameterRenderer }}
                <br/>
            {% endfor %}
        {% endif %}
        {% if cs.returnType %}
            | Return Type                        |
            |------------------------------------|
            | {{ cs.returnType | typeRenderer }} |
        {% endif %}
        <br/>
        {% if cs.parameters %}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **&#9733; Parameter(s)**
            <br/>
            {% for p in cs.parameters %}
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _**&#10149; {{ p.name | replaceWith | mdEscape }}**_
                <br/>   
                | Modifier(s)                              | Optional                           | Rest                          | Parameter Property                          | Initializer                       |
                |------------------------------------------|:----------------------------------:|:-----------------------------:|:-------------------------------------------:|-----------------------------------|
                | {{ p.modifiers | join(', ','declare') }} | {{ p.isOptional | print_symbol }}  | {{ p.isRest | print_symbol }} | {{ p.isParameterProperty  | print_symbol }} | {{ p.initializer | replaceWith }} |            
                <br/>
            {% endfor %}
        {% endif %}
    {% endfor %}
{% endif %}
`;
