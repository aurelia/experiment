import {
  template,
  CustomElement,
  inlineView
} from '@aurelia/runtime-html';
import { assert, createFixture, } from '@aurelia/testing';

describe('@template', function () {
  describe('without dependencies', function () {

    @template('<div>TEST</div>')
    class Simple {
    }

    it('Simple test with @template renders correct template string', async function () {
      const options = createFixture('<simple></simple>', class { }, [CustomElement.define('simple', Simple)]);
      assert.strictEqual(options.appHost.firstElementChild.innerHTML, '<div>TEST</div>');
      await options.tearDown();
    });

  });
  describe('with dependencies', function () {

    it('renders correct template string with array', async function () {
      @template('<div>Inner Test</div>')
      class InnerSimple { }

      @template('<div><inner></inner></div>', [CustomElement.define('inner', InnerSimple)])
      class Simple {
      }
      const options = createFixture('<simple></simple>', class { }, [CustomElement.define('simple', Simple)]);
      assert.strictEqual(options.appHost.querySelector('inner').innerHTML, '<div>Inner Test</div>');
      await options.tearDown();
    });
    it('renders correct template string with params', async function () {
      @template('<div>Inner Test</div>')
      class InnerSimple { }

      @template('<div><inner></inner></div>', CustomElement.define('inner', InnerSimple))
      class Simple {
      }
      const options = createFixture('<simple></simple>', class { }, [CustomElement.define('simple', Simple)]);
      assert.strictEqual(options.appHost.querySelector('inner').innerHTML, '<div>Inner Test</div>');
      await options.tearDown();
    });

  });


});
describe('@inlineView', function () {
  describe('without dependencies', function () {

    @inlineView('<div>TEST</div>')
    class Simple {
    }

    it('Simple test with @inlineView renders correct template string', async function () {
      const options = createFixture('<simple></simple>', class { }, [CustomElement.define('simple', Simple)]);
      assert.strictEqual(options.appHost.firstElementChild.innerHTML, '<div>TEST</div>');
      await options.tearDown();
    });

  });
  describe('with dependencies', function () {



    it('renders correct template string using array', async function () {
      @inlineView('<div>Inner Test</div>')
      class InnerSimple { }

      @inlineView('<div><inner></inner></div>', [CustomElement.define('inner', InnerSimple)])
      class Simple {
      }
      const options = createFixture('<simple></simple>', class { }, [CustomElement.define('simple', Simple)]);
      assert.strictEqual(options.appHost.querySelector('inner').innerHTML, '<div>Inner Test</div>');
      await options.tearDown();
    });

    it('renders correct template string using non array', async function () {
      @inlineView('<div>Inner Test</div>')
      class InnerSimple { }

      @inlineView('<div><inner></inner></div>', CustomElement.define('inner', InnerSimple))
      class Simple {
      }
      const options = createFixture('<simple></simple>', class { }, [CustomElement.define('simple', Simple)]);
      assert.strictEqual(options.appHost.querySelector('inner').innerHTML, '<div>Inner Test</div>');
      await options.tearDown();
    });

  });
});
