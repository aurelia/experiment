import { DI, LoggerConfiguration, LogLevel, ColorOptions, Registration } from '@aurelia/kernel';
import { ServiceHost, $Undefined, $ESModule } from '@aurelia/aot';
import { IFileSystem, FileKind, FileEntry } from '@aurelia/runtime-node';
import { VirtualFileSystem } from './virtual-file-system';
import { assert } from '@aurelia/testing';

// NOTE: These tests are not meant to be even close to exhaustive. That's what the 262 test suite is for.
// These tests exist solely for having an easy way to quickly test some high-level things when a feature is not yet ready for exposure to the 262 test suite.

describe.skip('AOT (smoke tests)', function () {
  async function execute(content: string) {
    const container = DI.createContainer();
    container.register(
      LoggerConfiguration.create(console, LogLevel.debug, ColorOptions.colors),
      Registration.singleton(IFileSystem, VirtualFileSystem),
    );

    const host = container.get(ServiceHost);

    const result = await host.execute({
      evaluate: true,
      entries: [{
        file: new FileEntry('test.js', void 0),
        standalone: true,
      }]
    });

    if (result.result.isAbrupt) {
      assert.fail(`Evaluation error`);
    }

    return ((result.result as $Undefined).sourceNode as $ESModule).ExecutionResult;
  }

  it('simple return statement with binary expression', async function () {
    const result = await execute(`
      return 1 + 1;
    `);

    assert.strictEqual(result['[[Value]]'], 2);
  });

  it('simple if statement with binary expression', async function () {
    const result = await execute(`
      if (true) {
        return 1 + 1;
      }
    `);

    assert.strictEqual(result['[[Value]]'], 2);
  });

  it('simple if/else statement with binary expression', async function () {
    const result = await execute(`
      if (false) {
        return 1 + 1;
      } else {
        return 5;
      }
    `);

    assert.strictEqual(result['[[Value]]'], 5);
  });

  it('simple function declaration with binary expression', async function () {
    const result = await execute(`
      function foo() {
        return 1 + 1;
      }
      return foo();
    `);

    assert.strictEqual(result['[[Value]]'], 2);
  });

  it('simple function declaration with parameters and binary expression', async function () {
    const result = await execute(`
      function foo(a, b) {
        return a + b;
      }
      return foo(1, 1);
    `);

    assert.strictEqual(result['[[Value]]'], 2);
  });

  it('new class instance', async function () {
    const result = await execute(`
      class Foo {
        get value() {
          return 42;
        }
      }
      return new Foo().value;
    `);

    assert.equal(result['[[Value]]'], "42");
  });

  it('new object', async function () {
    const result = await execute(`
      function Foo() {
        this.value = 42;
      }
      return new Foo().value;
    `);

    assert.equal(result['[[Value]]'], "42");
  });

  it.skip('new Number', async function () {
    const result = await execute(`
      return new Number();
    `);

    assert.instanceOf(result['[[Value]]'], Number);
  });

  it.skip('new error', async function () {
    const result = await execute(`
      return new Error();
    `);

    assert.instanceOf(result['[[Value]]'], Error);
  });

  it.skip('try catch with thrown error', async function () {
    const result = await execute(`
      try {
        throw new Error();
      } catch {
        return 1;
      }
    `);

    assert.strictEqual(result['[[Value]]'], 1);
  });

  it.skip('try catch with reference error', async function () {
    const result = await execute(`
      try {
        foo.bar;
      } catch {
        return 1;
      }
    `);

    assert.strictEqual(result['[[Value]]'], 1);
  });

  it('try catch with no error', async function () {
    const result = await execute(`
      try {
        return 42;
      } catch {
        return 1;
      }
    `);

    assert.strictEqual(result['[[Value]]'], 42);
  });

  it('simple switch', async function () {
    const result = await execute(`
      switch(1){
        case 1:
          return 1;
        default:
          return 2;
      }
    `);

    assert.strictEqual(result['[[Value]]'], 1);
  });

  it('switch with default', async function () {
    const result = await execute(`
      switch(2){
        case 1:
          return 1;
        default:
          return 2;
      }
    `);

    assert.strictEqual(result['[[Value]]'], 2);
  });

  it('switch with default in the middle', async function () {
    const result = await execute(`
      switch(3){
        case 1:
          return 1;
        default:
          return 2;
        case 3:
          return 3;
      }
    `);

    assert.strictEqual(result['[[Value]]'], 3);
  });

  it('void operator', async function () {
    const result = await execute(`
      function answer(){
        return 42;
      }
      return void answer();
    `);

    assert.strictEqual(result['[[Value]]'], undefined);
  });

  it.skip('void operator with throw', async function () {
    const result = await execute(`
      function answer(){
        throw new Error();
      }
      return void answer();
    `);

    assert.instanceOf(result['[[Value]]'], Error);
  });

  it.skip('delete', async function () {
    const result = await execute(`
      function foo(){}
      // foo.a = 123;
      foo.b = 123;
      // delete foo.a;
      return foo;
    `);

    const foo: any = result['[[Value]]'];
    assert.equal(foo.a, void 0);
    assert.equal(foo.b, 123);
  });

  [
    { input: undefined, type: "undefined" },
    { input: null, type: "object" },
    { input: true, type: "boolean" },
    { input: 1, type: "number" },
    { input: "'1'", type: "string" },
    { input: '{ }', type: "object" },
  ].map(({ input, type }) =>
    it(`typeof ${input} is "${type}"`, async function () {
      const result = await execute(`
      return typeof ${input};
    `);

      assert.strictEqual(result['[[Value]]'], type);
    }));

  it(`typeof function is "function"`, async function () {
    const result = await execute(`
      function foo() { }
      return typeof foo;
    `);

    assert.strictEqual(result['[[Value]]'], "function");
  });

});
