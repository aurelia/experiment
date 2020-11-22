import { IContainer, IPlatform } from '@aurelia/kernel';
import { AppTask, IAttrSyntaxTransformer, NodeObserverLocator } from '@aurelia/runtime-html';
import { assert, createFixture } from '@aurelia/testing';

describe('3-runtime-html/attr-syntax-extension.spec.ts', function () {
  let elementNameSeed = 0;
  it('understands how to transform .bind on web component custom elements', async function () {
    class MyElement extends HTMLElement {

      public select: HTMLSelectElement;

      public constructor() {
        super();
        this.innerHTML = '<select><option>1</option><option>2</option><option>3</option></select>';
        this.select = this.firstElementChild as any;
        this.select.addEventListener('change', () => {
          this.dispatchEvent(new CustomEvent('my-el-change'));
        });
      }

      public get value() {
        return this.select.value;
      }

      public set value(v) {
        this.select.value = v;
      }
    }

    const elName = `my-el-${elementNameSeed++}`;

    const { ctx, component, appHost, startPromise } = createFixture(
      `<${elName} value.bind="option"></${elName}>`,
      class App {
        public option = '1';
      },
      [
        AppTask.with(IContainer).beforeCreate().call(container => {
          const platform = container.get(IPlatform);
          platform.globalThis.customElements.define(elName, MyElement);

          const transformer = container.get(IAttrSyntaxTransformer);
          transformer.useTwoWay((el, property) => {
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
    selectEl.dispatchEvent(new Event('change'));

    assert.strictEqual(component.option, '2');

    component.option = '3';
    assert.strictEqual(selectEl.value, '2');
    ctx.platform.domWriteQueue.flush();
    assert.strictEqual(selectEl.value, '3');
  });
});