import { IContainer, IPlatform } from '@aurelia/kernel';
import { AppTask, BrowserPlatform, CustomElement, IAttrMapper, NodeObserverLocator } from '@aurelia/runtime-html';
import { assert, createFixture } from '@aurelia/testing';

describe('3-runtime-html/attr-syntax-extension.spec.ts', function () {
  // cant deal with custom elements on nodejs
  if (typeof process !== 'undefined') {
    return;
  }
  it('understands how to transform .bind on web component custom elements', async function () {
    const elName = CustomElement.generateName();
    const { ctx, component, appHost, startPromise, tearDown } = createFixture(
      `<${elName} value.bind="option"></${elName}>`,
      class App {
        public option = '1';
      },
      [
        AppTask.beforeCreate(IContainer, container => {
          const platform = container.get(IPlatform) as BrowserPlatform;
          platform.window.customElements.define(elName, class MyElement extends platform.window.HTMLElement {

            public select: HTMLSelectElement;

            public constructor() {
              super();
              this.innerHTML = '<select><option>1</option><option>2</option><option>3</option></select>';
              this.select = this.firstElementChild as any;
              this.select.addEventListener('change', () => {
                this.dispatchEvent(new CustomEvent('my-el-change'));
              });
              if (this.hasOwnProperty('value')) {
                const v = this.value;
                delete this.value;
                this.value = v;
              }
            }

            public get value() {
              return this.select.value;
            }

            public set value(v) {
              this.select.value = v;
            }
          });

          const attrMapper = container.get(IAttrMapper);
          attrMapper.useTwoWay((el, property) => {
            return el.tagName === elName.toUpperCase() && property === 'value';
          });

          const nodeObserverLocator = container.get(NodeObserverLocator);
          nodeObserverLocator.useConfig(elName.toUpperCase(), 'value', { events: ['my-el-change'] });
        })
      ]
    );

    await startPromise;

    const selectEl = appHost.querySelector('select');
    assert.strictEqual(selectEl.value, '1');
    assert.strictEqual(selectEl.options[0].selected, true);

    selectEl.options[1].selected = true;
    debugger
    selectEl.dispatchEvent(new Event('change'));

    assert.strictEqual(component.option, '2');

    component.option = '3';
    assert.strictEqual(selectEl.value, '2');
    ctx.platform.domWriteQueue.flush();
    assert.strictEqual(selectEl.value, '3');

    await tearDown();
  });
});
