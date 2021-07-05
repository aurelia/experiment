/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Aurelia,
  customElement,
  ICustomElementController,
  IPlatform,
  CustomElementDefinition,
  ICustomElementViewModel,
  Controller,
  CustomElement,
  LifecycleFlags,
  IHydratedController,
} from '@aurelia/runtime-html';

import { assert, TestContext } from '@aurelia/testing';

function createFixture() {
  const ctx = TestContext.create();
  const { container } = ctx;
  const p = container.get(IPlatform);
  const host = ctx.createElement('div');
  const au = new Aurelia(container);

  return { p, au, host };
}

const specs: (Partial<CustomElementDefinition> & { toString(): string })[] = [
  {
    // nothing (control test)
    toString(): string { return `nothing`; },
  },
  {
    shadowOptions: { mode: 'open' },
    toString(): string { return `shadowOptions: { mode: 'open' }`; },
  },
  {
    shadowOptions: { mode: 'closed' },
    toString(): string { return `shadowOptions: { mode: 'closed' }`; },
  },
  {
    containerless: true,
    toString(): string { return `containerless: true`; },
  },
];

for (const parentSpec of specs) {
  describe(`parentSpec: ${parentSpec}`, function () {
    for (const childSpec of specs) {
      describe(`childSpec: ${childSpec}`, function () {
        it(`can activate/deactivate twice with the same outcomes`, async function () {
          const { au, host } = createFixture();

          @customElement({ ...childSpec, name: 'the-child', template: `child` })
          class TheChild implements ICustomElementViewModel {}

          @customElement({ ...parentSpec, name: 'the-parent', template: `parent`, dependencies: [TheChild] })
          class TheParent implements ICustomElementViewModel {
            public $controller!: ICustomElementController<this>;

            private childController!: ICustomElementController;

            public created(controller: ICustomElementController<this>): void {
              const container = controller.container;
              this.childController = Controller.forCustomElement(null, container, container, container.get(CustomElement.keyFrom('the-child')), controller.host, null);
            }
            public attaching(initiator: IHydratedController): void {
              // No async hooks so all of these are synchronous.
              void this.childController.activate(initiator, this.$controller, LifecycleFlags.none);
            }
            public detaching(initiator: IHydratedController): void {
              void this.childController.deactivate(initiator, this.$controller, LifecycleFlags.none);
            }
            public activateChild(): void {
              void this.childController.activate(this.childController, this.$controller, LifecycleFlags.none);
            }
            public deactivateChild(): void {
              void this.childController.deactivate(this.childController, this.$controller, LifecycleFlags.none);
            }
          }

          @customElement({ name: 'the-app', template: `<the-parent></the-parent>`, dependencies: [TheParent] })
          class TheApp implements ICustomElementViewModel {}

          au.app({ host, component: TheApp });
          const theApp = au.root.controller.children[0].viewModel as TheParent;

          await au.start();

          assert.visibleTextEqual(host, `parentchild`, `visible text after start() #1`);
          theApp.deactivateChild();
          assert.visibleTextEqual(host, `parent`, `visible text after deactivateChild() #1`);
          theApp.activateChild();
          assert.visibleTextEqual(host, `parentchild`, `visible text after activateChild() #1`);
          theApp.deactivateChild();
          assert.visibleTextEqual(host, `parent`, `visible text after deactivateChild() #2`);
          theApp.activateChild();
          assert.visibleTextEqual(host, `parentchild`, `visible text after activateChild() #2`);

          await au.stop();

          assert.visibleTextEqual(host, ``, `visible text after stop() #1`);

          await au.start();

          assert.visibleTextEqual(host, `parentchild`, `visible text after start() #2`);

          assert.visibleTextEqual(host, `parentchild`, `visible text after start() #1`);
          theApp.deactivateChild();
          assert.visibleTextEqual(host, `parent`, `visible text after deactivateChild() #1`);
          theApp.activateChild();
          assert.visibleTextEqual(host, `parentchild`, `visible text after activateChild() #1`);
          theApp.deactivateChild();
          assert.visibleTextEqual(host, `parent`, `visible text after deactivateChild() #2`);
          theApp.activateChild();
          assert.visibleTextEqual(host, `parentchild`, `visible text after activateChild() #2`);

          await au.stop(true);
        });
      });
    }
  });
}
