import {
    bindable,
    customElement,
    CustomElement,
    LifecycleFlags,
    alias
} from '@aurelia/runtime';
import { HTMLTestContext, TestContext, TestConfiguration, assert, setup } from '@aurelia/testing';
import { Registration } from '@aurelia/kernel';

interface Person { firstName?: string, lastName?: string, fullName?: string };

// TemplateCompiler - custom element integration
describe('custom-elements', function () {
    let ctx: HTMLTestContext;

    beforeEach(function () {
        ctx = TestContext.createHTMLTestContext();
    });

    // custom elements
    it('01.', async function () {
        ctx.container.register(TestConfiguration);
        const { tearDown } = setup(`<template><name-tag name="bigopon"></name-tag></template>`, class { }, ctx);
        assert.strictEqual(ctx.doc.firstElementChild.textContent, 'bigopon', `host.textContent`);
        await tearDown();
    });

    //[as-element]
    describe('02.', function () {

        //works with custom element with [as-element]
        it('01.', async function () {
            ctx.container.register(TestConfiguration);
            const { tearDown, appHost } = setup(`<template><div as-element="name-tag" name="bigopon"></div></template>`, class { }, ctx);

            assert.strictEqual(ctx.doc.firstElementChild.textContent, 'bigopon', `host.textContent`);
            await tearDown();

        });

        //ignores tag name
        it('02.', async function () {
            ctx.container.register(TestConfiguration);
            const { tearDown } = setup(`<template><name-tag as-element="div" name="bigopon">Fred</name-tag></template>`, class { }, ctx);

            assert.strictEqual(ctx.doc.firstElementChild.textContent, 'Fred', `host.textContent`);

            await tearDown();

        });
    });

    // //<let/>
    it('03.', async function () {
        const { tearDown, lifecycle, host, component } = setup('<template><let full-name.bind="firstName + ` ` + lastName"></let><div>\${fullName}</div></template>', class { firstName = undefined; lastName = undefined; }, ctx);
        assert.strictEqual(host.textContent, 'undefined undefined', `host.textContent`);

        component.firstName = 'bi';
        component.lastName = 'go';

        assert.strictEqual(host.textContent, 'undefined undefined', `host.textContent`);
        lifecycle.processRAFQueue(LifecycleFlags.none);

        assert.strictEqual(host.textContent, 'bi go', `host.textContent`);

        await tearDown();

    });

    // //<let [to-view-model] />
    it('04.', async function () {
        const { tearDown, lifecycle, host, component } = setup<Person>('<template><let to-view-model full-name.bind="firstName + ` ` + lastName"></let><div>\${fullName}</div></template>', class implements Person { }, ctx);
        component.firstName = 'bi';
        assert.strictEqual(component.fullName, 'bi undefined', `component.fullName`);
        component.lastName = 'go';
        assert.strictEqual(component.fullName, 'bi go', `component.fullName`);
        lifecycle.processRAFQueue(LifecycleFlags.none);
        assert.strictEqual(host.textContent, 'bi go', `host.textContent`);
        await tearDown();

    });

    // //initial values propagate through multiple nested custom elements connected via bindables
    it('05.', async function () {
        let boundCalls = 0;

        @customElement({ name: 'foo1', template: `<template><foo2 value.bind="value" value2.bind="value1"></foo2>\${value}</template>` })
        class Foo1 {
            @bindable()
            public value: any;
            public value1: any;
            public bound(): void {
                assert.strictEqual(this.value, 'w00t', 'Foo1.this.value');
                assert.strictEqual(this.value1, 'w00t1', 'Foo1.this.value1');
                boundCalls++;
            }
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo2', template: `<template><foo3 value.bind="value" value2.bind="value2"></foo3>\${value}</template>` })
        class Foo2 {
            @bindable()
            public value: any;
            public value1: any;
            @bindable()
            public value2: any;
            public bound(): void {
                assert.strictEqual(this.value, 'w00t', 'Foo2.this.value');
                assert.strictEqual(this.value1, 'w00t1', 'Foo2.this.value1');
                assert.strictEqual(this.value2, 'w00t1', 'Foo2.this.value2');
                boundCalls++;
            }
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo3', template: `<template><foo4 value.bind="value" value2.bind="value2"></foo4>\${value}</template>` })
        class Foo3 {
            @bindable()
            public value: any;
            public value1: any;
            @bindable()
            public value2: any;
            public bound(): void {
                assert.strictEqual(this.value, 'w00t', 'Foo3.this.value');
                assert.strictEqual(this.value1, 'w00t1', 'Foo3.this.value1');
                assert.strictEqual(this.value2, 'w00t1', 'Foo3.this.value2');
                boundCalls++;
            }
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo4', template: `<template><foo5 value.bind="value" value2.bind="value2"></foo5>\${value}</template>` })
        class Foo4 {
            @bindable()
            public value: any;
            public value1: any;
            @bindable()
            public value2: any;
            public bound(): void {
                assert.strictEqual(this.value, 'w00t', 'Foo4.this.value');
                assert.strictEqual(this.value1, 'w00t1', 'Foo4.this.value1');
                assert.strictEqual(this.value2, 'w00t1', 'Foo4.this.value2');
                boundCalls++;
            }
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo5', template: `<template>\${value}</template>` })
        class Foo5 {
            @bindable()
            public value: any;
            public value1: any;
            @bindable()
            public value2: any;
            public bound(): void {
                assert.strictEqual(this.value, 'w00t', 'Foo5.this.value');
                assert.strictEqual(this.value1, 'w00t1', 'Foo5.this.value1');
                assert.strictEqual(this.value2, 'w00t1', 'Foo5.this.value2');
                boundCalls++;
            }
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        const customElementCtors: any[] = [Foo1, Foo2, Foo3, Foo4, Foo5];
        const { lifecycle, component, host, tearDown } = await setup('<template><foo1 value.bind="value"></foo1>\${value}</template>', class { value = 'w00t' }, ctx, true, [...customElementCtors, TestConfiguration])

        assert.strictEqual(boundCalls, 5, `boundCalls`);

        let current = component;
        // let cur: any;
        // while (i < 5) {

        //     const childCtor = customElementCtors[i];
        //     assert.instanceOf(current.$componentHead, Object, '');
        //     assert.strictEqual(current.$componentHead, current.$componentTail, `current.$componentHead`);
        //     assert.instanceOf(current.$componentHead, childCtor, `current.$componentHead`);

        //     switch (i) {
        //         case 0: // root component -> foo1
        //             cur = current.$bindingHead;
        //             assert.instanceOf(cur, PropertyBinding, `cur`);
        //             assert.instanceOf(cur._observer0, SetterObserver, `cur._observer0`);
        //             assert.strictEqual(cur._observer1, undefined, `cur._observer1`);
        //             assert.instanceOf(cur.targetObserver, PropertyAccessor, `cur.targetObserver`);

        //             cur = cur.$nextBinding;
        //             assert.instanceOf(cur, InterpolationBinding, `cur`);
        //             assert.strictEqual(cur.target.nodeName, '#text', `cur.target.nodeName`);
        //             assert.instanceOf(cur.targetObserver, ElementPropertyAccessor, `cur.targetObserver`);
        //             assert.strictEqual(cur.$nextBinding, null, 'cur.$nextBinding');

        //             cur = current = current.$componentHead;
        //             assert.instanceOf(cur, childCtor, `cur.$componentHead ${i}`);
        //             break;
        //         case 1: // foo1 -> foo2
        //             cur = current.$bindingHead;
        //             assert.instanceOf(cur, PropertyBinding, `cur`);
        //             assert.instanceOf(cur._observer0, SelfObserver, `cur._observer0`);
        //             assert.strictEqual(cur._observer1, undefined, `cur._observer1`);
        //             assert.instanceOf(cur.targetObserver, PropertyAccessor, `cur.targetObserver`);

        //             cur = cur.$nextBinding;
        //             assert.instanceOf(cur, PropertyBinding, `cur`);
        //             assert.instanceOf(cur._observer0, SetterObserver, `cur._observer0`);
        //             assert.strictEqual(cur._observer1, undefined, `cur._observer1`);
        //             assert.instanceOf(cur.targetObserver, PropertyAccessor, `cur.targetObserver`);

        //             cur = cur.$nextBinding;
        //             assert.instanceOf(cur, InterpolationBinding, `cur`);
        //             assert.strictEqual(cur.target.nodeName, '#text', `cur.target.nodeName`);
        //             assert.instanceOf(cur.targetObserver, ElementPropertyAccessor, `cur.targetObserver`);
        //             assert.strictEqual(cur.$nextBinding, null, 'cur.$nextBinding');

        //             cur = current = current.$componentHead;
        //             assert.instanceOf(cur, childCtor, `cur.$componentHead ${i}`);
        //             break;
        //         case 2:
        //         case 3:
        //         case 4: // foo2 -> foo3-5
        //             cur = current.$bindingHead;
        //             assert.instanceOf(cur, PropertyBinding, `cur`);
        //             assert.instanceOf(cur._observer0, SelfObserver, `cur._observer0`);
        //             assert.strictEqual(cur._observer1, undefined, `cur._observer1`);
        //             assert.instanceOf(cur.targetObserver, PropertyAccessor, `cur.targetObserver`);

        //             cur = cur.$nextBinding;
        //             assert.instanceOf(cur, PropertyBinding, `cur`);
        //             assert.instanceOf(cur._observer0, SelfObserver, `cur._observer0`);
        //             assert.strictEqual(cur._observer1, undefined, `cur._observer1`);
        //             assert.instanceOf(cur.targetObserver, PropertyAccessor, `cur.targetObserver`);

        //             cur = cur.$nextBinding;
        //             assert.instanceOf(cur, InterpolationBinding, `cur`);
        //             assert.strictEqual(cur.target.nodeName, '#text', `cur.target.nodeName`);
        //             assert.instanceOf(cur.targetObserver, ElementPropertyAccessor, `cur.targetObserver`);
        //             assert.strictEqual(cur.$nextBinding, null, 'cur.$nextBinding');

        //             cur = current = current.$componentHead;
        //             assert.instanceOf(cur, childCtor, `cur.$componentHead ${i}`);
        //     }

        //     i++;
        // }

        // assert.strictEqual(lifecycle['flushCount'], 0, `lifecycle['flushCount']`);
        assert.strictEqual(host.textContent, 'w00t'.repeat(6), `host.textContent`);

        component.value = 'w00t00t';
        assert.strictEqual(current.value, 'w00t00t', `current.value`);
        assert.strictEqual(host.textContent, 'w00t'.repeat(6), `host.textContent`);
        // assert.strictEqual(lifecycle['flushCount'], 6, `lifecycle['flushCount']`);

        lifecycle.processRAFQueue(LifecycleFlags.none);
        assert.strictEqual(host.textContent, 'w00t00t'.repeat(6), `host.textContent`);
        await tearDown();

    });

    describe('06. Aliasing', async function () {

        @customElement({ name: 'foo1', template: `<template><foo2 value.bind="value" value2.bind="value1"></foo2>\${value}</template>`, aliases: ['foo11', 'foo12'] })
        class Foo1 {
            @bindable()
            public value: any;
            public value1: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo2', template: `<template>\${value}</template>`, aliases: ['foo21', 'foo22'] })
        class Foo2 {
            @bindable()
            public value: any;
            public value1: any;
            @bindable()
            public value2: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo3', template: `<template><foo11 value.bind="value" value2.bind="value1"></foo11>\${value}</template>`, aliases: ['foo31', 'foo32'] })
        class Foo3 {
            @bindable()
            public value: any;
            public value1: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo4', template: `<template><foo2 value.bind="value" value2.bind="value1"></foo2>\${value}</template>`, aliases: ['foo43'] })
        @alias('foo41', 'foo42')
        class Foo4 {
            @bindable()
            public value: any;
            public value1: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo5', template: `<template><foo2 value.bind="value" value2.bind="value1"></foo2>\${value}</template>`, aliases: ['foo53'] })
        @alias(...['foo51', 'foo52'])
        class Foo5 {
            @bindable()
            public value: any;
            public value1: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        const customElementCtors: any[] = [Foo1, Foo2, Foo3, Foo4, Foo5];
        it('Simple Alias doesn\'t break original', async function () {
            const options = await setup('<template><foo1 value.bind="value"></foo1>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.host.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with decorator doesn\'t break original', async function () {
            const options = await setup('<template><foo4 value.bind="value"></foo4>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with decorator doesn\'t break origianl aliases', async function () {
            const options = await setup('<template><foo43 value.bind="value"></foo43>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias Works', async function () {
            const options = await setup('<template><foo11 value.bind="value"></foo11>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.host.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with decorator 1st position works as expected', async function () {
            const options = await setup('<template><foo41 value.bind="value"></foo41>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with decorator 2nd position works as expected', async function () {
            const options = await setup('<template><foo42 value.bind="value"></foo42>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with spread decorator 1st position works as expected', async function () {
            const options = await setup('<template><foo51 value.bind="value"></foo51>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with spread decorator 2nd position works as expected', async function () {
            const options = await setup('<template><foo52 value.bind="value"></foo52>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias element referencing another alias', async function () {
            const options = await setup('<template><foo31 value.bind="value"></foo31>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.host.textContent, 'wOOt'.repeat(4));
            await options.tearDown();
        });
        it('Orig and Alias work', async function () {
            const options = await setup('<template><foo11 value.bind="value"></foo11><foo1 value.bind="value"></foo1>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.host.textContent, 'wOOt'.repeat(5));
            await options.tearDown();
        });
        it('Alias and Alias (2) work', async function () {
            const options = await setup('<template><foo11 value.bind="value"></foo11><foo12 value.bind="value"></foo12>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.host.textContent, 'wOOt'.repeat(5));
            await options.tearDown();
        });
        it('Alias to Alias ', async function () {
            const options = await setup('<template><test value.bind="value"></test>${value}</template>', class { value = 'wOOt' }, ctx, true, [...customElementCtors, Registration.alias(CustomElement.keyFrom('foo11'), CustomElement.keyFrom('test'))]);
            assert.strictEqual(options.host.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });
        it('Alias to Alias plus original alias ', async function () {
            const options = await setup('<template><test value.bind="value"></test><foo12 value.bind="value"></foo12>${value}</template>', class { value = 'wOOt' }, ctx, true, [...customElementCtors, Registration.alias(CustomElement.keyFrom('foo11'), CustomElement.keyFrom('test'))]);
            assert.strictEqual(options.host.textContent, 'wOOt'.repeat(5));
            await options.tearDown();
        });
        it('Alias to Alias 2 aliases and original', async function () {
            const options = await setup('<template><test value.bind="value"></test><foo12 value.bind="value"></foo11><foo12 value.bind="value"></foo11><foo1 value.bind="value"></foo1>${value}</template>', class { value = 'wOOt' }, ctx, true, [...customElementCtors, Registration.alias(CustomElement.keyFrom('foo11'), CustomElement.keyFrom('test'))]);
            assert.strictEqual(options.host.textContent, 'wOOt'.repeat(9));
            await options.tearDown();
        });
    });

    describe('07. Containerless', async function () {
        @customElement({ name: 'foo1', template: `<template><div><foo2 value.bind="value" value2.bind="value1"></foo2></div>\${value}</template>`, aliases: ['foo11', 'foo12'], containerless: true })
        class Foo1 {
            @bindable()
            public value: any;
            public value1: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo2', template: `<template>\${value}</template>`, aliases: ['foo21', 'foo22'], containerless: true })
        class Foo2 {
            @bindable()
            public value: any;
            public value1: any;
            @bindable()
            public value2: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo3', template: `<template><foo11 value.bind="value" value2.bind="value1"></foo11>\${value}</template>`, aliases: ['foo31', 'foo32'], containerless: false })
        class Foo3 {
            @bindable()
            public value: any;
            public value1: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        const customElementCtors: any[] = [Foo1, Foo2, Foo3];
        it('Simple containerless', async function () {
            const options = await setup('<template><foo1 value.bind="value"></foo1>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.appHost.firstElementChild.tagName, 'DIV', 'DIV INSTEAD OF ELEMENT TAG WITH CONTAINERLESS');
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });
        it('Simple alias containerless', async function () {
            const options = await setup('<template><foo11 value.bind="value"></foo11>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.appHost.firstElementChild.tagName, 'DIV', 'DIV INSTEAD OF ELEMENT TAG WITH CONTAINERLESS');
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });
        it('Containerless inside non containerless', async function () {
            const options = await setup('<template><foo3 value.bind="value"></foo3>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.appHost.firstElementChild.firstElementChild.tagName, 'DIV', 'DIV INSTEAD OF ELEMENT TAG WITH CONTAINERLESS');
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(4));
            await options.tearDown();
        });
        it('Containerless inside non containerless alias', async function () {
            const options = await setup('<template><foo31 value.bind="value"></foo31>${value}</template>', class { value = 'wOOt' }, ctx, true, customElementCtors);
            assert.strictEqual(options.appHost.firstElementChild.firstElementChild.tagName, 'DIV', 'DIV INSTEAD OF ELEMENT TAG WITH CONTAINERLESS');
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(4));
            await options.tearDown();
        });

    })
});
