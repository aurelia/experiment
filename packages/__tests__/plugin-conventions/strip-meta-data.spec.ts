import { BindingMode } from '@aurelia/runtime';
import { stripMetaData, IStrippedHtml } from '@aurelia/plugin-conventions';
import { assert } from '@aurelia/testing';

describe('stripMetaData', function () {
  it('returns empty html', function () {
    assert.deepEqual(stripMetaData(' '), {
      aliases: [],
      html: ' ',
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: {}
    });
  });

  it('strips import tag', function () {
    const html = `<import from="./a"></import>
  <template>
    <p></p>
  </template>
  `;
    const expected = `
  <template>
    <p></p>
  </template>
  `;

    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [{ as: undefined, from: './a', resourceName: undefined }],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips import tags with wrong or missing close tag', function () {
    const html = `<import from="./a" />
<import from="b"></import>
<template>
  <import from="./c.css">
  <p></p>
</template>
`;
    const expected = `

<template>
${'  ' /* leading space is untouched */}
  <p></p>
</template>
`;

    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [{ as: undefined, from: './a', resourceName: undefined }, { from: 'b', as: undefined, resourceName: undefined }, { from: './c.css', as: undefined, resourceName: undefined }],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips require tag', function () {
    const html = `<require from="./a"></require>
  <template>
    <p></p>
  </template>
  `;
    const expected = `
  <template>
    <p></p>
  </template>
  `;

    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [{ as: undefined, from: './a', resourceName: undefined }],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips mixed import/require tags with wrong or missing close tag', function () {
    const html = `<import from="./a" /><import from="foo">
  <require from="b"></require>
  <template>
    <require from="./c.css">
    <p></p>
  </template>
  `;
    const expected = `
  
  <template>
  ${'  ' /* leading space is untouched */}
    <p></p>
  </template>
  `;

    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [{ as: undefined, from: './a', resourceName: undefined }, { from: 'foo', as: undefined, resourceName: undefined }, { from: 'b', as: undefined, resourceName: undefined }, { from: './c.css', as: undefined, resourceName: undefined }],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips use-shadow-dom tag', function () {
    const html = `<use-shadow-dom></use-shadow-dom>
  <template>
  </template>
  `;
    const expected = `
  <template>
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: 'open',
      deps: [],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips use-shadow-dom tag with mode attribute', function () {
    const html = `<use-shadow-dom mode="closed">
  <template>
  <require from="./a"></require>
  </template>
  `;
    const expected = `
  <template>
  
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: 'closed',
      deps: [{ as: undefined, from: './a', resourceName: undefined }],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips use-shadow-dom attribute', function () {
    const html = `<template use-shadow-dom>
  </template>
  `;
    const expected = `<template >
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: 'open',
      deps: [],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips use-shadow-dom attribute with explicit mode', function () {
    const html = `<template use-shadow-dom="closed">
<require from="./a"></require>
  </template>
  `;
    const expected = `<template >

  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: 'closed',
      deps: [{ as: undefined, from: './a', resourceName: undefined }],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips containerless tag', function () {
    const html = `<containerless></containerless>
  <template>
  </template>
  `;
    const expected = `
  <template>
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: true,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips containerless tag without closing tag', function () {
    const html = `<containerless>
  <template>
  </template>
  `;
    const expected = `
  <template>
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: true,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips containerless attribute', function () {
    const html = `<template containerless>
  </template>
  `;
    const expected = `<template >
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: true,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips bindable tag', function () {
    const html = `<bindable name="firstName"></bindable>
  <template>
  </template>
  `;
    const expected = `
  <template>
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: { firstName: {} }
    } as IStrippedHtml);
  });

  it('strips bindable tag with more attrs', function () {
    const html = `<bindable name="firstName" mode="one-way">
<bindable name="lastName" mode="TwoWay" attribute="surname">
<bindable name="foo" mode="one_time"></bindable>
<bindable name="bar" mode="toView">
<bindable name="lo" mode="from-view"></bindable>
  <template>
  </template>
  `;
    const expected = `




  <template>
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: {
        firstName: { mode: BindingMode.toView },
        lastName: { mode: BindingMode.twoWay, attribute: 'surname' },
        foo: { mode: BindingMode.oneTime },
        bar: { mode: BindingMode.toView },
        lo: { mode: BindingMode.fromView }
      }
    } as IStrippedHtml);
  });

  it('strips bindable attribute', function () {
    const html = `<template bindable="firstName">
  </template>
  `;
    const expected = `<template >
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: { firstName: {} }
    } as IStrippedHtml);
  });

  it('strips bindable attribute with multiple names', function () {
    const html = `<template bindable="firstName,lastName">
  </template>
  `;
    const expected = `<template >
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: { firstName: {}, lastName: {} }
    } as IStrippedHtml);
  });

  it('strips bindable attribute with multiple names with spaces', function () {
    const html = `<template bindable="firstName,
                                        lastName,
                                        age">
  </template>
  `;
    const expected = `<template >
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: { firstName: {}, lastName: {}, age: {} }
    } as IStrippedHtml);
  });

  it('strips alias attribute with multiple names with spaces', function () {
    const html = `<template alias="firstName,
                                     alias">
  </template>
  `;
    const expected = `<template >
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: ['firstName', 'alias'],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips alias attribute with multiple names', function () {
    const html = `<template alias="firstName,                alias">
  </template>
  `;
    const expected = `<template >
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: ['firstName', 'alias'],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips alias attribute with single name', function () {
    const html = `<template alias="firstName">
  </template>
  `;
    const expected = `<template >
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: ['firstName'],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips alias node with single name', function () {
    const html = `<alias name="firstName"><template>
  </template>
  `;
    const expected = `<template>
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: ['firstName'],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips alias node with multiple name', function () {
    const html = `<alias name="firstName,alias"><template>
  </template>
  `;
    const expected = `<template>
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: ['firstName', 'alias'],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });


  it('strips alias node and attr combo', function () {
    const html = `<alias name="firstName,alias"><template alias="firstName2,            alias2">
  </template>
  `;
    const expected = `<template >
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: ['firstName', "alias", "firstName2", "alias2"],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: {}
    });
  });

  it('strips alias node with no name', function () {
    const html = `<alias><template>
  </template>
  `;
    const expected = `<template>
  </template>
  `;
    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips mixed import/require tags with as', function () {
    const html = `<import as="test1" from="./a" />
  <template>
    <p></p>
  </template>
  `;
    const expected = `
  <template>
    <p></p>
  </template>
  `;

    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [{ as: 'test1', from: './a', resourceName: undefined }],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips mixed import/require tags with wrong or missing close tag with as', function () {
    const html = `<import as="test1" from="./a" /><import as="test2" from="foo">
  <require as="test3"  from="b"></require>
  <template>
    <require from="./c.css">
    <p></p>
  </template>
  `;
    const expected = `
  
  <template>
  ${'  ' /* leading space is untouched */}
    <p></p>
  </template>
  `;

    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [{ as: 'test1', from: './a', resourceName: undefined }, { from: 'foo', as: 'test2', resourceName: undefined }, { from: 'b', as: 'test3', resourceName: undefined }, { from: './c.css', as: undefined, resourceName: undefined }],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });


  it('strips mixed import/require tags with as and resourceName', function () {
    const html = `<import resource-name="resource1" as="test1" from="./a" />
  <template>
    <p></p>
  </template>
  `;
    const expected = `
  <template>
    <p></p>
  </template>
  `;

    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [{ as: 'test1', from: './a', resourceName: 'resource1' }],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });

  it('strips mixed import/require tags with wrong or missing close tag with as as resourceName', function () {
    const html = `<import resource-name="resource1" as="test1" from="./a" /><import resource-name="resource2" as="test2" from="foo">
  <require resource-name="resource3" as="test3"  from="b"></require>
  <template>
    <require from="./c.css">
    <p></p>
  </template>
  `;
    const expected = `
  
  <template>
  ${'  ' /* leading space is untouched */}
    <p></p>
  </template>
  `;

    assert.deepEqual(stripMetaData(html), {
      aliases: [],
      html: expected,
      shadowMode: null,
      deps: [{ as: 'test1', from: './a', resourceName: 'resource1' }, { from: 'foo', as: 'test2', resourceName: 'resource2' }, { from: 'b', as: 'test3', resourceName: 'resource3' }, { from: './c.css', as: undefined, resourceName: undefined }],
      containerless: false,
      bindables: {}
    } as IStrippedHtml);
  });



});
