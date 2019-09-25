import {
    CustomElement,
    ITemplateDefinition,
    IViewModel,
    CustomAttribute
} from '@aurelia/runtime';
import { assert, setup } from '@aurelia/testing';
import { importAs, IResourceType } from '@aurelia/kernel';

function resourceMutator(element: IResourceType<ITemplateDefinition, IViewModel>, mutate: (e: IResourceType<ITemplateDefinition, IViewModel>) => void) {
    mutate(element);
    return element;
}


describe('runtime-aliasing', function () {

    const Foo1 = CustomElement.define({ name: 'foo1', template: `<template>\${value}-Foo1</template>`, bindables: ['value'] },
        class {
            public value: any;
        });

    const Foo2 = CustomElement.define({ name: 'foo2', template: `<template>\${value}-Foo2<test value.bind="value"></test></template>`, bindables: ['value', 'value2'], dependencies: [importAs('test', Foo1)] },
        class {
            public value: any;
            public value2: any;
        });

    const Foo3 = CustomElement.define({ name: 'foo2', template: `<template>\${value}-Foo3</template>`, bindables: ['value', 'value2'] },
        class {
            public value: any;
            public value2: any;
        });
        
    const testCases: any[] = [
        {
            describeTitle: '01. Custom Elements',
            resources: [Foo1, Foo2],
            tests: [
                {
                    app: CustomElement.define({
                        name: 'name',
                        template: `<test value.bind="value"></test>`,
                        dependencies: [importAs('test', Foo1)]
                    }, class { value = 'wOOt' }),
                    title: 'Basic aliasing works as expected',
                    assertFn: assert.strictEqual,
                    expected: 'wOOt-Foo1'
                },
                {
                    app: CustomElement.define({
                        name: 'name',
                        template: `<foo1 value.bind="value"></foo1>`,
                        dependencies: [importAs('test', Foo1)]
                    }, class { value = 'wOOt' }),
                    assertFn: assert.strictEqual,
                    title: 'Basic aliasing doesn\'t break normal case if globally registered',
                    expected: 'wOOt-Foo1'
                },
                {
                    app: CustomElement.define({
                        name: 'name',
                        template: `<test value.bind="value"></test>`,
                        dependencies: [importAs('test', resourceMutator(Foo1, (e) => { e.description.aliases = ['test2']; }))]
                    }, class { value = 'wOOt' }),
                    title: 'Basic aliasing works as expected with alias',
                    assertFn: assert.strictEqual,
                    expected: 'wOOt-Foo1'
                },
                {
                    app: CustomElement.define({
                        name: 'name',
                        template: `<test2 value.bind="value"></test2>`,
                        dependencies: [importAs('test', resourceMutator(Foo1, (e) => { e.description.aliases = ['test2'] }))]
                    }, class { value = 'wOOt' }),
                    assertFn: assert.strictEqual,
                    title: 'Basic aliasing doesn\'t break alias case if globally registered',
                    expected: 'wOOt-Foo1'
                },
                {
                    app: CustomElement.define({
                        name: 'name',
                        template: `<test value.bind="value"></test><test2 value.bind="value"></test2>`,
                        dependencies: [importAs('test', Foo2), importAs('test2', Foo3)]
                    }, class { value = 'wOOt' }),
                    assertFn: assert.strictEqual,
                    title: 'Two resources with the same name imported and used correctly',
                    expected: 'wOOt-Foo2wOOt-Foo1wOOt-Foo3'
                },
                {
                    app: CustomElement.define({
                        name: 'name',
                        template: `<test value.bind="value"></test>`,
                        dependencies: [importAs('test', Foo2)]
                    }, class { value = 'wOOt' }),
                    assertFn: assert.strictEqual,
                    title: 'Nested registrations of the same name resolve correctly',
                    expected: 'wOOt-Foo2wOOt-Foo1'
                }
            ]
        },
    ];

    testCases.forEach(desc => {
        describe(desc.describeTitle, async function () {
            desc.tests.forEach(test => {
                it(test.title, async function () {
                    const options = await setup(test.template, test.app, desc.resources);
                    test.assertFn(options.appHost.textContent, test.expected, '');
                    await options.tearDown();
                });
            })
        });
    })
});
