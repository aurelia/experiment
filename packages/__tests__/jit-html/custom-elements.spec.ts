import {
    bindable,
    customElement,
    CustomElement,
    LifecycleFlags,
    alias
} from '@aurelia/runtime';
import { TestConfiguration, assert, setup } from '@aurelia/testing';
import { Registration, importAs } from '@aurelia/kernel';

interface Person { firstName?: string, lastName?: string, fullName?: string };
const app = class { value = 'wOOt' };

describe('custom-elements', function () {

    const registrations = [TestConfiguration];

    //custom elements
    it('01.', async function () {
        const { tearDown, appHost } = setup(`<template><name-tag name="bigopon"></name-tag></template>`, undefined, registrations);
        assert.strictEqual(appHost.textContent, 'bigopon', `host.textContent`);
        await tearDown();
    });

    //[as-element]
    describe('02.', function () {

        //works with custom element with [as-element]
        it('01.', async function () {
            const { tearDown, appHost } = setup(`<template><div as-element="name-tag" name="bigopon"></div></template>`, undefined, registrations);

            assert.strictEqual(appHost.textContent, 'bigopon', `host.textContent`);
            await tearDown();

        });

        //ignores tag name
        it('02.', async function () {
            const { tearDown, appHost } = setup(`<template><name-tag as-element="div" name="bigopon">Fred</name-tag></template>`, undefined, registrations);

            assert.strictEqual(appHost.textContent, 'Fred', `host.textContent`);

            await tearDown();

        });
    });

    // //<let/>
    it('03.', async function () {
        const { tearDown, lifecycle, appHost, component } = setup('<template><let full-name.bind="firstName + ` ` + lastName"></let><div>\${fullName}</div></template>', class { firstName = undefined; lastName = undefined; });
        assert.strictEqual(appHost.textContent, 'undefined undefined', `host.textContent`);

        component.firstName = 'bi';
        component.lastName = 'go';

        assert.strictEqual(appHost.textContent, 'undefined undefined', `host.textContent`);
        lifecycle.processRAFQueue(LifecycleFlags.none);

        assert.strictEqual(appHost.textContent, 'bi go', `host.textContent`);

        await tearDown();

    });

    // //<let [to-view-model] />
    it('04.', async function () {
        const { tearDown, lifecycle, appHost, component } = setup<Person>('<template><let to-view-model full-name.bind="firstName + ` ` + lastName"></let><div>\${fullName}</div></template>', class implements Person { });
        component.firstName = 'bi';
        assert.strictEqual(component.fullName, 'bi undefined', `component.fullName`);
        component.lastName = 'go';
        assert.strictEqual(component.fullName, 'bi go', `component.fullName`);
        lifecycle.processRAFQueue(LifecycleFlags.none);
        assert.strictEqual(appHost.textContent, 'bi go', `host.textContent`);
        await tearDown();

    });

    // //initial values propagate through multiple nested custom elements connected via bindables
    it('05.', async function () {
        let boundCalls = 0;

        @customElement({ name: 'foo1', template: `<template><foo2 value.bind="value" value2.bind="value1"></foo2>\${value}</template>` })
        class FooElement1 {
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
        class FooElement2 {
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
        class FooElement3 {
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
        class FooElement4 {
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
        class FooElement5 {
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

        const resources: any[] = [FooElement1, FooElement2, FooElement3, FooElement4, FooElement5];
        const { lifecycle, component, appHost, tearDown } = await setup('<template><foo1 value.bind="value"></foo1>\${value}</template>', class { value = 'w00t' }, [...resources, TestConfiguration])

        assert.strictEqual(boundCalls, 5, `boundCalls`);

        let current = component;
        assert.strictEqual(appHost.textContent, 'w00t'.repeat(6), `host.textContent`);

        component.value = 'w00t00t';
        assert.strictEqual(current.value, 'w00t00t', `current.value`);
        assert.strictEqual(appHost.textContent, 'w00t'.repeat(6), `host.textContent`);
        lifecycle.processRAFQueue(LifecycleFlags.none);
        assert.strictEqual(appHost.textContent, 'w00t00t'.repeat(6), `host.textContent`);
        await tearDown();

    });

    describe('06. Aliasing', async function () {

        @customElement({ name: 'foo1', template: `<template><foo2 value.bind="value" value2.bind="value1"></foo2>\${value}</template>`, aliases: ['foo11', 'foo12'] })
        class FooContainerless1 {
            @bindable()
            public value: any;
            public value1: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        @customElement({ name: 'foo2', template: `<template>\${value}</template>`, aliases: ['foo21', 'foo22'] })
        class FooContainerless2 {
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
        class FooContainerless3 {
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
        class FooContainerless4 {
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
        class FooContainerless5 {
            @bindable()
            public value: any;
            public value1: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }
        const resources: any[] = [FooContainerless1, FooContainerless2, FooContainerless3, FooContainerless4, FooContainerless5];
        it('Simple Alias doesn\'t break original', async function () {
            const options = await setup('<template><foo1 value.bind="value"></foo1>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with decorator doesn\'t break original', async function () {
            const options = await setup('<template><foo4 value.bind="value"></foo4>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with decorator doesn\'t break origianl aliases', async function () {
            const options = await setup('<template><foo43 value.bind="value"></foo43>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias Works', async function () {
            const options = await setup('<template><foo11 value.bind="value"></foo11>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with decorator 1st position works as expected', async function () {
            const options = await setup('<template><foo41 value.bind="value"></foo41>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with decorator 2nd position works as expected', async function () {
            const options = await setup('<template><foo42 value.bind="value"></foo42>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with spread decorator 1st position works as expected', async function () {
            const options = await setup('<template><foo51 value.bind="value"></foo51>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias with spread decorator 2nd position works as expected', async function () {
            const options = await setup('<template><foo52 value.bind="value"></foo52>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });

        it('Simple Alias element referencing another alias', async function () {
            const options = await setup('<template><foo31 value.bind="value"></foo31>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(4));
            await options.tearDown();
        });
        it('Orig and Alias work', async function () {
            const options = await setup('<template><foo11 value.bind="value"></foo11><foo1 value.bind="value"></foo1>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(5));
            await options.tearDown();
        });
        it('Alias and Alias (2) work', async function () {
            const options = await setup('<template><foo11 value.bind="value"></foo11><foo12 value.bind="value"></foo12>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(5));
            await options.tearDown();
        });
        it('Alias to Alias ', async function () {
            const options = await setup('<template><test value.bind="value"></test>${value}</template>', app, [...resources, Registration.alias(CustomElement.keyFrom('foo11'), CustomElement.keyFrom('test'))]);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });
        it('Alias to Alias plus original alias ', async function () {
            const options = await setup('<template><test value.bind="value"></test><foo12 value.bind="value"></foo12>${value}</template>', app, [...resources, Registration.alias(CustomElement.keyFrom('foo11'), CustomElement.keyFrom('test'))]);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(5));
            await options.tearDown();
        });
        it('Alias to Alias 2 aliases and original', async function () {
            const options = await setup('<template><test value.bind="value"></test><foo12 value.bind="value"></foo11><foo12 value.bind="value"></foo11><foo1 value.bind="value"></foo1>${value}</template>', app, [...resources, Registration.alias(CustomElement.keyFrom('foo11'), CustomElement.keyFrom('test'))]);
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(9));
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

        const resources: any[] = [Foo1, Foo2, Foo3];
        it('Simple containerless', async function () {
            const options = await setup('<template><foo1 value.bind="value"></foo1>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.firstElementChild.tagName, 'DIV', 'DIV INSTEAD OF ELEMENT TAG WITH CONTAINERLESS');
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });
        it('Simple alias containerless', async function () {
            const options = await setup('<template><foo11 value.bind="value"></foo11>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.firstElementChild.tagName, 'DIV', 'DIV INSTEAD OF ELEMENT TAG WITH CONTAINERLESS');
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(3));
            await options.tearDown();
        });
        it('Containerless inside non containerless', async function () {
            const options = await setup('<template><foo3 value.bind="value"></foo3>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.firstElementChild.firstElementChild.tagName, 'DIV', 'DIV INSTEAD OF ELEMENT TAG WITH CONTAINERLESS');
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(4));
            await options.tearDown();
        });
        it('Containerless inside non containerless alias', async function () {
            const options = await setup('<template><foo31 value.bind="value"></foo31>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.firstElementChild.firstElementChild.tagName, 'DIV', 'DIV INSTEAD OF ELEMENT TAG WITH CONTAINERLESS');
            assert.strictEqual(options.appHost.textContent, 'wOOt'.repeat(4));
            await options.tearDown();
        });
    });

    describe('08. Runtime Aliasing', async function () {

        @customElement({ name: 'foo2', template: `<template>\${value}</template>` })
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

        @customElement({ name: 'foo2', template: `<template>\${value}-test</template>` })
        class Foo3 {
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

        @customElement({
            name: 'foo1',
            dependencies: [importAs('woot2', Foo3), importAs('woot', Foo2)],
            template: `<woot value.bind="value"></woot><woot2 value.bind="value"></woot2>`,
        })
        class Foo1 {
            @bindable()
            public value: any;
            public value1: any;
            public binding() { this.valueChanged(); }
            public valueChanged(): void {
                this.value1 = `${this.value}1`;
            }
        }

        const resources: any[] = [Foo1];
        it('Simple containerless', async function () {
            const options = await setup('<template><foo1 value.bind="value"></foo1>${value}</template>', app, resources);
            assert.strictEqual(options.appHost.textContent, 'wOOtwOOt-testwOOt');
            await options.tearDown();
        });
    });


});
