import {
  DI,
  inject,
  Registration,
  singleton,
  transient,
} from '@aurelia/kernel';
import { _, assert, createSpy, ISpy } from '@aurelia/testing';

function decorator(): ClassDecorator { return (target: any) => target; }

describe(`The DI object`, function () {
  describe(`createContainer()`, function () {
    // it(`returns an instance of Container`, function () {
    //   const actual = DI.createContainer();
    //   assert.instanceOf(actual, Container, `actual`);
    // });

    it(`returns a new container every time`, function () {
      assert.notStrictEqual(DI.createContainer(), DI.createContainer(), `DI.createContainer()`);
    });
  });

  // describe(`getDesignParamtypes()`, function () {
  //   it(`returns PLATFORM.emptyArray if the class has no constructor or decorators`, function () {
  //     class Foo {}
  //     const actual = DI.getDesignParamtypes(Foo);
  //     assert.strictEqual(actual, PLATFORM.emptyArray, `actual`);
  //   });
  //   it(`returns PLATFORM.emptyArray if the class has a decorator but no constructor`, function () {
  //     @decorator()
  //     class Foo {}
  //     const actual = DI.getDesignParamtypes(Foo);
  //     assert.strictEqual(actual, PLATFORM.emptyArray, `actual`);
  //   });

  //   it(`returns PLATFORM.emptyArray if the class has no constructor args or decorators`, function () {
  //     class Foo { constructor() { return; } }
  //     const actual = DI.getDesignParamtypes(Foo);
  //     assert.strictEqual(actual, PLATFORM.emptyArray, `actual`);
  //   });

  //   it(`returns PLATFORM.emptyArray if the class has constructor args but no decorators`, function () {
  //     class Bar {}
  //     class Foo { constructor(public bar: Bar) {} }
  //     const actual = DI.getDesignParamtypes(Foo);
  //     assert.strictEqual(actual, PLATFORM.emptyArray, `actual`);
  //   });

  //   it(`returns PLATFORM.emptyArray if the class has constructor args and the decorator is applied via a function call`, function () {
  //     class Bar {}
  //     class Foo { constructor(public bar: Bar) {} }
  //     decorator()(Foo);
  //     const actual = DI.getDesignParamtypes(Foo);
  //     assert.strictEqual(actual, PLATFORM.emptyArray, `actual`);
  //   });

  //   it(`returns PLATFORM.emptyArray if the class is declared as an anonymous variable, even if it has ctor args and decorator is applied properly`, function () {
  //     class Bar {}
  //     @decorator()
  //     const FooInline = class { constructor(public bar: Bar) {} };
  //     const actual = DI.getDesignParamtypes(FooInline);
  //     assert.strictEqual(actual, PLATFORM.emptyArray, `actual`);
  //   });

  //   it(`returns PLATFORM.emptyArray if the class is declared as a named variable, even if it has ctor args and decorator is applied properly`, function () {
  //     class Bar {}
  //     @decorator()
  //     const FooInline = class Foo { constructor(public bar: Bar) {} };
  //     const actual = DI.getDesignParamtypes(FooInline);
  //     assert.strictEqual(actual, PLATFORM.emptyArray, `actual`);
  //   });

  //   describe(`returns an empty array if the class has a decorator but no constructor args`, function () {
  //     @decorator()
  //     class Foo { constructor() { return; } }

  //     it(_`${Foo}`, function () {
  //       const actual = DI.getDesignParamtypes(Foo);
  //       assertIsMutableArray(actual, 0);
  //     });

  //     it(_`${class {}}`, function () {
  //       let cls;
  //       function anonDecorator(): ClassDecorator { return (target: any) => cls = target; }
  //       @anonDecorator()
  //       class { constructor() { return; } }
  //       const actual = DI.getDesignParamtypes(cls);
  //       assertIsMutableArray(actual, 0);
  //     });
  //   });

  //   describe(`falls back to Object for declarations that cannot be statically analyzed`, function () {
  //     interface ArgCtor {}
  //     for (const argCtor of [
  //       class Bar {},
  //       function () { return; },
  //       () => { return; },
  //       class {},
  //       {},
  //       Error,
  //       Array,
  //       (class Bar {}).prototype,
  //       (class Bar {}).prototype.constructor
  //     ] as any[]) {
  //       @decorator()
  //       class FooDecoratorInvocation { constructor(public arg: ArgCtor) {} }

  //       it(_`${FooDecoratorInvocation} { constructor(${argCtor}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooDecoratorInvocation);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Object, `actual[0]`);
  //       });

  //       @(decorator as any)
  //       class FooDecoratorNonInvocation { constructor(public arg: ArgCtor) {} }

  //       it(_`${FooDecoratorNonInvocation} { constructor(${argCtor}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooDecoratorInvocation);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Object, `actual[0]`);
  //       });
  //     }
  //   });

  //   describe(`falls back to Object for mismatched declarations`, function () {

  //     // Technically we're testing TypeScript here, but it's still useful to have an in-place fixture to validate our assumptions
  //     // And also to have an alert mechanism for when the functionality in TypeScript changes, without having to read the changelogs

  //     // What we're verifying here is under which circumstances a function object will or won't be properly resolved as a
  //     // designParamType, and it seems like the presence of a same-name interface actually breaks this in some situations

  //     // Note: the order of declaration (interface first or other thing first) doesn't seem to matter here
  //     // But whether or not there is a direct type cast, does seem to matter in the case of AnonClass (note the negative assertion)

  //     // It's unclear whether the difference between AnonClass (which works) and AnonClassInterface (which doesn't work) is a bug in TS or not,
  //     // but it has ramifications we need to keep in mind.

  //     interface Bar {}
  //     class Bar {}

  //     interface AnonClass {}
  //     const AnonClass = class {};

  //     interface AnonClassInterface {}
  //     const AnonClassInterface: AnonClassInterface = class {};

  //     interface VarFunc {}
  //     const VarFunc = function () { return; };

  //     interface VarFuncInterface {}
  //     const VarFuncInterface: VarFuncInterface = function () { return; };

  //     interface Func {}
  //     // eslint-disable-next-line no-empty
  //     function Func() {}

  //     interface Arrow {}
  //     const Arrow = () => { return; };

  //     interface ArrowInterface {}
  //     const ArrowInterface: ArrowInterface = () => { return; };

  //     describe(`decorator invocation`, function () {
  //       @decorator()
  //       class FooBar { constructor(public arg: Bar) {} }

  //       // Note: this is a negative assertion meant to make it easier to compare this describe with the one below
  //       it(_`NOT ${FooBar} { constructor(public ${Bar}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooBar);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Bar, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooAnonClass { constructor(public arg: AnonClass) {} }

  //       // Note: this is a negative assertion meant to make it easier to compare this describe with the one below
  //       it(_`NOT ${FooAnonClass} { constructor(public ${AnonClass}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooAnonClass);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], AnonClass, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooAnonClassInterface { constructor(public arg: AnonClassInterface) {} }

  //       // this one is particularly interesting..
  //       it(_`${FooAnonClassInterface} { constructor(public ${AnonClassInterface}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooAnonClassInterface);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Object, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooVarFunc { constructor(public arg: VarFunc) {} }

  //       it(_`${FooVarFunc} { constructor(public ${VarFunc}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooVarFunc);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Object, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooVarFuncInterface { constructor(public arg: VarFuncInterface) {} }

  //       it(_`${FooVarFuncInterface} { constructor(public ${VarFuncInterface}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooVarFuncInterface);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Object, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooFunc { constructor(public arg: Func) {} }

  //       it(_`${FooFunc} { constructor(public ${Func}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooFunc);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Object, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooArrow { constructor(public arg: Arrow) {} }

  //       it(_`${FooArrow} { constructor(public ${Arrow}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooArrow);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Object, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooArrowInterface { constructor(public arg: ArrowInterface) {} }

  //       it(_`${FooArrowInterface} { constructor(public ${ArrowInterface}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooArrowInterface);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Object, `actual[0]`);
  //       });
  //     });
  //   });

  //   describe(`returns the correct types for valid declarations`, function () {
  //     class Bar {}

  //     const AnonClass = class {};

  //     const VarFunc = function () { return; };

  //     // eslint-disable-next-line no-empty
  //     function Func() {}

  //     const Arrow = () => { return; };

  //     describe(`decorator invocation`, function () {
  //       @decorator()
  //       class FooBar { constructor(public arg: Bar) {} }

  //       it(_`${FooBar} { constructor(public ${Bar}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooBar);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Bar, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooAnonClass { constructor(public arg: AnonClass) {} }

  //       it(_`${FooAnonClass} { constructor(public ${AnonClass}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooAnonClass);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], AnonClass, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooVarFunc { constructor(public arg: VarFunc) {} }

  //       it(_`${FooVarFunc} { constructor(public ${VarFunc}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooVarFunc);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], VarFunc, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooFunc { constructor(public arg: Func) {} }

  //       it(_`${FooFunc} { constructor(public ${Func}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooFunc);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Func, `actual[0]`);
  //       });

  //       @decorator()
  //       class FooArrow { constructor(public arg: Arrow) {} }

  //       it(_`${FooArrow} { constructor(public ${Arrow}) }`, function () {
  //         const actual = DI.getDesignParamtypes(FooArrow);
  //         assertIsMutableArray(actual, 1);
  //         assert.strictEqual(actual[0], Arrow, `actual[0]`);
  //       });
  //     });
  //   });
  // });

  describe(`getDependencies()`, function () {
    let getDesignParamtypes: ISpy<typeof DI.getDesignParamtypes>;

    // eslint-disable-next-line mocha/no-hooks
    beforeEach(function () {
      getDesignParamtypes = createSpy(DI, 'getDesignParamtypes', true);
    });
    // eslint-disable-next-line mocha/no-hooks
    afterEach(function () {
      getDesignParamtypes.restore();
    });

    it(`uses getDesignParamtypes() if the static inject property does not exist`, function () {
      class Bar {}
      @decorator()
      class Foo { public constructor(bar: Bar) { return; } }
      DI.getDependencies(Foo);

      assert.deepStrictEqual(
        getDesignParamtypes.calls,
        [
          [Foo],
        ],
        `getDesignParamtypes.calls`,
      );
    });

    it(`uses getDesignParamtypes() if the static inject property is undefined`, function () {
      class Bar {}
      @decorator()
      class Foo { public static inject; public constructor(bar: Bar) { return; } }
      DI.getDependencies(Foo);

      assert.deepStrictEqual(
        getDesignParamtypes.calls,
        [
          [Foo],
        ],
        `getDesignParamtypes.calls`,
      );
    });

    it(`throws when inject is not an array`, function () {
      class Bar {}
      class Foo { public static inject = Bar; }

      assert.throws(() => DI.getDependencies(Foo), void 0, `() => DI.getDependencies(Foo)`);

      assert.deepStrictEqual(
        getDesignParamtypes.calls,
        [],
        `getDesignParamtypes.calls`,
      );
    });

    for (const deps of [
      [class Bar {}],
      [class Bar {}, class Bar {}],
      [undefined],
      [null],
      [42]
    ]) {
      it(_`returns a copy of the inject array ${deps}`, function () {
        class Foo { public static inject = deps.slice(); }
        const actual = DI.getDependencies(Foo);

        assert.deepStrictEqual(actual, deps, `actual`);
        assert.notStrictEqual(actual, Foo.inject, `actual`);

        assert.deepStrictEqual(
          getDesignParamtypes.calls,
          [],
          `getDesignParamtypes.calls`,
        );
      });
    }

    for (const deps of [
      [class Bar {}],
      [class Bar {}, class Bar {}],
      [undefined],
      [null],
      [42]
    ]) {
      it(_`does not traverse the 2-layer prototype chain for inject array ${deps}`, function () {
        class Foo { public static inject = deps.slice(); }
        class Bar extends Foo { public static inject = deps.slice(); }
        const actual = DI.getDependencies(Bar);

        assert.deepStrictEqual(actual, deps, `actual`);

        assert.deepStrictEqual(
          getDesignParamtypes.calls,
          [],
          `getDesignParamtypes.calls`,
        );
      });

      it(_`does not traverse the 3-layer prototype chain for inject array ${deps}`, function () {
        class Foo { public static inject = deps.slice(); }
        class Bar extends Foo { public static inject = deps.slice(); }
        class Baz extends Bar { public static inject = deps.slice(); }
        const actual = DI.getDependencies(Baz);

        assert.deepStrictEqual(actual, deps, `actual`);

        assert.deepStrictEqual(
          getDesignParamtypes.calls,
          [],
          `getDesignParamtypes.calls`,
        );
      });

      it(_`does not traverse the 1-layer + 2-layer prototype chain (with gap) for inject array ${deps}`, function () {
        class Foo { public static inject = deps.slice(); }
        class Bar extends Foo { }
        class Baz extends Bar { public static inject = deps.slice(); }
        class Qux extends Baz { public static inject = deps.slice(); }
        const actual = DI.getDependencies(Qux);

        assert.deepStrictEqual(actual, deps, `actual`);

        assert.deepStrictEqual(
          getDesignParamtypes.calls,
          [],
          `getDesignParamtypes.calls`,
        );
      });
    }

  });

  describe(`createInterface()`, function () {
    it(`returns a function that stringifies its default friendly name`, function () {
      const sut = DI.createInterface();
      const expected = 'InterfaceSymbol<(anonymous)>';
      assert.strictEqual(sut.toString(), expected, `sut.toString() === '${expected}'`);
      assert.strictEqual(String(sut), expected, `String(sut) === '${expected}'`);
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      assert.strictEqual(`${sut}`, expected, `\`\${sut}\` === '${expected}'`);
    });

    it(`returns a function that stringifies its configured friendly name`, function () {
      const sut = DI.createInterface('IFoo');
      const expected = 'InterfaceSymbol<IFoo>';
      assert.strictEqual(sut.toString(), expected, `sut.toString() === '${expected}'`);
      assert.strictEqual(String(sut), expected, `String(sut) === '${expected}'`);
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      assert.strictEqual(`${sut}`, expected, `\`\${sut}\` === '${expected}'`);
    });
  });
});

describe(`The inject decorator`, function () {
  class Dep1 {}
  class Dep2 {}
  class Dep3 {}

  it(`can decorate classes with explicit dependencies`, function () {
    @inject(Dep1, Dep2, Dep3)
    class Foo {}

    assert.deepStrictEqual(DI.getDependencies(Foo), [Dep1, Dep2, Dep3], `Foo['inject']`);
  });

  // it(`can decorate classes with implicit dependencies`, function () {
  //   @inject()
  //   class Foo { constructor(dep1: Dep1, dep2: Dep2, dep3: Dep3) { return; } }

  //   assert.deepStrictEqual(Foo['inject'], [Dep1, Dep2, Dep3], `Foo['inject']`);
  // });

  it(`can decorate constructor parameters explicitly`, function () {
    class Foo { public constructor(@inject(Dep1)dep1, @inject(Dep2)dep2, @inject(Dep3)dep3) { return; } }

    assert.deepStrictEqual(DI.getDependencies(Foo), [Dep1, Dep2, Dep3], `Foo['inject']`);
  });

  // it(`can decorate constructor parameters implicitly`, function () {
  //   class Foo { constructor(@inject() dep1: Dep1, @inject() dep2: Dep2, @inject() dep3: Dep3) { return; } }

  //   assert.deepStrictEqual(Foo['inject'], [Dep1, Dep2, Dep3], `Foo['inject']`);
  // });

  it(`can decorate properties explicitly`, function () {
    // @ts-ignore
    class Foo { @inject(Dep1)public dep1; @inject(Dep2)public dep2; @inject(Dep3)public dep3; }

    assert.strictEqual(DI.getDependencies(Foo)['dep1'], Dep1, `Foo['inject'].dep1`);
    assert.strictEqual(DI.getDependencies(Foo)['dep2'], Dep2, `Foo['inject'].dep2`);
    assert.strictEqual(DI.getDependencies(Foo)['dep3'], Dep3, `Foo['inject'].dep3`);
  });

  it(`cannot decorate properties implicitly`, function () {
    // @ts-ignore
    class Foo { @inject()public dep1: Dep1; @inject()public dep2: Dep2; @inject()public dep3: Dep3; }

    assert.strictEqual(DI.getDependencies(Foo)['dep1'], undefined, `Foo['inject'].dep1`);
    assert.strictEqual(DI.getDependencies(Foo)['dep2'], undefined, `Foo['inject'].dep2`);
    assert.strictEqual(DI.getDependencies(Foo)['dep3'], undefined, `Foo['inject'].dep3`);
  });
});

describe(`The transient decorator`, function () {
  it(`works as a plain decorator`, function () {
    @transient
    class Foo {}

    assert.instanceOf(Foo['register'], Function, `Foo['register']`);

    const container = DI.createContainer();

    const foo1 = container.get(Foo);
    const foo2 = container.get(Foo);

    assert.notStrictEqual(foo1, foo2, `foo1`);
  });

  it(`works as an invocation`, function () {
    @transient()
    class Foo {}

    assert.instanceOf(Foo['register'], Function, `Foo['register']`);

    const container = DI.createContainer();

    const foo1 = container.get(Foo);
    const foo2 = container.get(Foo);

    assert.notStrictEqual(foo1, foo2, `foo1`);
  });
});

describe(`The singleton decorator`, function () {
  it(`works as a plain decorator`, function () {
    @singleton
    class Foo {}

    assert.instanceOf(Foo['register'], Function, `Foo['register']`);

    const container = DI.createContainer();

    const foo1 = container.get(Foo);
    const foo2 = container.get(Foo);

    assert.strictEqual(foo1, foo2, `foo1`);
  });

  it(`works as an invocation`, function () {
    @singleton()
    class Foo {}

    assert.instanceOf(Foo['register'], Function, `Foo['register']`);

    const container = DI.createContainer();

    const foo1 = container.get(Foo);
    const foo2 = container.get(Foo);

    assert.strictEqual(foo1, foo2, `foo1`);
  });
});

// describe(`The Resolver class`, function () {
//   let container: IContainer;
//   let registerResolver: ReturnType<typeof spy>;

//   beforeEach(function () {
//     container = DI.createContainer();
//     registerResolver = spy(container, 'registerResolver');
//   });

//   afterEach(function () {
//     registerResolver.restore();
//   });

//   describe(`register()`, function () {
//     it(`registers the resolver to the container with the provided key`, function () {
//       const sut = new Resolver('foo', 0, null);
//       sut.register(container, 'bar');
//       expect(registerResolver).to.have.been.calledWith('bar', sut);
//     });

//     it(`registers the resolver to the container with its own`, function () {
//       const sut = new Resolver('foo', 0, null);
//       sut.register(container);
//       expect(registerResolver).to.have.been.calledWith('foo', sut);
//     });
//   });

//   describe(`resolve()`, function () {
//     it(`instance - returns state`, function () {
//       const state = {};
//       const sut = new Resolver('foo', ResolverStrategy.instance, state);
//       const actual = sut.resolve(container, container);
//       assert.strictEqual(actual, state, `actual`);
//     });

//     it(`singleton - returns an instance of the type and sets strategy to instance`, function () {
//       class Foo {}
//       const sut = new Resolver('foo', ResolverStrategy.singleton, Foo);
//       const actual = sut.resolve(container, container);
//       assert.instanceOf(actual, Foo, `actual`);

//       const actual2 = sut.resolve(container, container);
//       assert.strictEqual(actual2, actual, `actual2`);
//     });

//     it(`transient - always returns a new instance of the type`, function () {
//       class Foo {}
//       const sut = new Resolver('foo', ResolverStrategy.transient, Foo);
//       const actual1 = sut.resolve(container, container);
//       assert.instanceOf(actual1, Foo, `actual1`);

//       const actual2 = sut.resolve(container, container);
//       assert.instanceOf(actual2, Foo, `actual2`);
//       assert.notStrictEqual(actual2, actual1, `actual2`);
//     });

//     it(`array - calls resolve() on the first item in the state array`, function () {
//       const resolver = { resolve: spy() };
//       const sut = new Resolver('foo', ResolverStrategy.array, [resolver]);
//       sut.resolve(container, container);
//       expect(resolver.resolve).to.have.been.calledWith(container, container);
//     });

//     it(`throws for unknown strategy`, function () {
//       const sut = new Resolver('foo', -1, null);
//       assert.throws(() => sut.resolve(container, container), /6/, `() => sut.resolve(container, container)`);
//     });
//   });

//   describe(`getFactory()`, function () {
//     it(`returns a new singleton Factory if it does not exist`, function () {
//       class Foo {}
//       const sut = new Resolver(Foo, ResolverStrategy.singleton, Foo);
//       const actual = sut.getFactory(container);
//       assert.instanceOf(actual, Factory, `actual`);
//       assert.strictEqual(actual.Type, Foo, `actual.Type`);
//     });

//     it(`returns a new transient Factory if it does not exist`, function () {
//       class Foo {}
//       const sut = new Resolver(Foo, ResolverStrategy.transient, Foo);
//       const actual = sut.getFactory(container);
//       assert.instanceOf(actual, Factory, `actual`);
//       assert.strictEqual(actual.Type, Foo, `actual.Type`);
//     });

//     it(`returns a null for instance strategy`, function () {
//       class Foo {}
//       const sut = new Resolver(Foo, ResolverStrategy.instance, Foo);
//       const actual = sut.getFactory(container);
//       assert.strictEqual(actual, null, `actual`);
//     });

//     it(`returns a null for array strategy`, function () {
//       class Foo {}
//       const sut = new Resolver(Foo, ResolverStrategy.array, Foo);
//       const actual = sut.getFactory(container);
//       assert.strictEqual(actual, null, `actual`);
//     });

//     it(`returns a null for alias strategy`, function () {
//       class Foo {}
//       const sut = new Resolver(Foo, ResolverStrategy.alias, Foo);
//       const actual = sut.getFactory(container);
//       assert.strictEqual(actual, null, `actual`);
//     });

//     it(`returns a null for callback strategy`, function () {
//       class Foo {}
//       const sut = new Resolver(Foo, ResolverStrategy.callback, Foo);
//       const actual = sut.getFactory(container);
//       assert.strictEqual(actual, null, `actual`);
//     });
//   });
// });

// describe(`The Factory class`, function () {

//   describe(`create()`, function () {
//     for (const count of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
//       it(`returns a new Factory with ${count} deps`, function () {
//         class Bar {}
//         class Foo {public static inject = Array(count).map(c => Bar); }
//         const actual = Factory.create(Foo);
//         assert.instanceOf(actual, Factory, `actual`);
//         assert.strictEqual(actual.Type, Foo, `actual.Type`);
//         if (count < 6) {
//           assert.strictEqual(actual['invoker'], classInvokers[count], `actual['invoker']`);
//         } else {
//           assert.strictEqual(actual['invoker'], fallbackInvoker, `actual['invoker']`);
//         }
//         assert.notStrictEqual(actual['dependencies'], Foo.inject, `actual['dependencies']`);
//         assert.deepStrictEqual(actual['dependencies'], Foo.inject, `actual['dependencies']`);
//       });
//     }
//   });

//   describe(`construct()`, function () {
//     for (const staticCount of [0, 1, 2, 3, 4, 5, 6, 7]) {
//       for (const dynamicCount of [0, 1, 2]) {
//         const container = new Container();
//         it(`instantiates a type with ${staticCount} static deps and ${dynamicCount} dynamic deps`, function () {
//           class Bar {}
//           class Foo {public static inject = Array(staticCount).fill(Bar); public args: any[]; constructor(...args: any[]) {this.args = args; }}
//           const sut = Factory.create(Foo);
//           const dynamicDeps = dynamicCount ? Array(dynamicCount).fill({}) : undefined;

//           const actual = sut.construct(container, dynamicDeps);

//           for (let i = 0, ii = Foo.inject.length; i < ii; ++i) {
//             assert.instanceOf(actual.args[i], Foo.inject[i], `actual.args[i]`);
//           }
//           for (let i = 0, ii = dynamicDeps ? dynamicDeps.length : 0; i < ii; ++i) {
//             assert.strictEqual(actual.args[Foo.inject.length + i], dynamicDeps[i], `actual.args[Foo.inject.length + i]`);
//           }
//         });
//       }
//     }
//   });

//   describe(`registerTransformer()`, function () {
//     it(`registers the transformer`, function () {
//       const container = new Container();
//       class Foo {public bar; public baz; }
//       const sut = Factory.create(Foo);
//       // eslint-disable-next-line prefer-object-spread
//       sut.registerTransformer(foo2 => Object.assign(foo2, { bar: 1 }));
//       // eslint-disable-next-line prefer-object-spread
//       sut.registerTransformer(foo2 => Object.assign(foo2, { baz: 2 }));
//       const foo = sut.construct(container);
//       assert.strictEqual(foo.bar, 1, `foo.bar`);
//       assert.strictEqual(foo.baz, 2, `foo.baz`);
//       assert.instanceOf(foo, Foo, `foo`);
//     });
//   });

// });

describe(`The Container class`, function () {
  function createFixture() {
    const sut = DI.createContainer();
    const register = createSpy();

    return { sut, register };
  }

  describe(`register()`, function () {
    it(_`calls register() on {register}`, function () {
      const { sut, register } = createFixture();
      sut.register({register});

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on {register},{register}`, function () {
      const { sut, register } = createFixture();
      sut.register({register}, {register});

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on [{register},{register}]`, function () {
      const { sut, register } = createFixture();
      sut.register([{register}, {register}] as any);

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on {foo:{register}}`, function () {
      const { sut, register } = createFixture();
      sut.register({foo: {register}});

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on {foo:{register}},{foo:{register}}`, function () {
      const { sut, register } = createFixture();
      sut.register({foo: {register}}, {foo: {register}});

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on [{foo:{register}},{foo:{register}}]`, function () {
      const { sut, register } = createFixture();
      sut.register([{foo: {register}}, {foo: {register}}] as any);

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on {register},{foo:{register}}`, function () {
      const { sut, register } = createFixture();
      sut.register({register}, {foo: {register}});

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on [{register},{foo:{register}}]`, function () {
      const { sut, register } = createFixture();
      sut.register([{register}, {foo: {register}}] as any);

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on [{register},{}]`, function () {
      const { sut, register } = createFixture();
      sut.register([{register}, {}] as any);

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on [{},{register}]`, function () {
      const { sut, register } = createFixture();
      sut.register([{}, {register}] as any);

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on [{foo:{register}},{foo:{}}]`, function () {
      const { sut, register } = createFixture();
      sut.register([{foo: {register}}, {foo: {}}] as any);

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
        ],
        `register.calls`,
      );
    });

    it(_`calls register() on [{foo:{}},{foo:{register}}]`, function () {
      const { sut, register } = createFixture();
      sut.register([{foo: {}}, {foo: {register}}] as any);

      assert.deepStrictEqual(
        register.calls,
        [
          [sut],
        ],
        `register.calls`,
      );
    });

    describe(`does NOT throw when attempting to register primitive values`, function () {
      for (const value of [
        void 0,
        null,
        true,
        false,
        '',
        'asdf',
        NaN,
        Infinity,
        0,
        42,
        Symbol(),
        Symbol('a'),
      ]) {
        it(`{foo:${String(value)}}`, function () {
          const { sut } = createFixture();
          sut.register({foo:value});
        });

        it(`{foo:{bar:${String(value)}}}`, function () {
          const { sut } = createFixture();
          sut.register({foo:{bar:value}});
        });

        it(`[${String(value)}]`, function () {
          const { sut } = createFixture();
          sut.register([value]);
        });

        it(`${String(value)}`, function () {
          const { sut } = createFixture();
          sut.register(value);
        });
      }
    });
  });

  // describe(`registerResolver()`, function () {
  //   for (const key of [null, undefined, Object]) {
  //     it(_`throws on invalid key ${key}`, function () {
  //       assert.throws(() => sut.registerResolver(key, null as any), /5/, `() => sut.registerResolver(key, null as any)`);
  //     });
  //   }

  //   it(`registers the resolver if it does not exist yet`, function () {
  //     const key = {};
  //     const resolver = new Resolver(key, ResolverStrategy.instance, {});
  //     sut.registerResolver(key, resolver);
  //     const actual = sut.getResolver(key);
  //     assert.strictEqual(actual, resolver, `actual`);
  //   });

  //   it(`changes to array resolver if the key already exists`, function () {
  //     const key = {};
  //     const resolver1 = new Resolver(key, ResolverStrategy.instance, {});
  //     const resolver2 = new Resolver(key, ResolverStrategy.instance, {});
  //     sut.registerResolver(key, resolver1);
  //     const actual1 = sut.getResolver(key);
  //     assert.strictEqual(actual1, resolver1, `actual1`);
  //     sut.registerResolver(key, resolver2);
  //     const actual2 = sut.getResolver(key);
  //     assert.notStrictEqual(actual2, actual1, `actual2`);
  //     assert.notStrictEqual(actual2, resolver1, `actual2`);
  //     assert.notStrictEqual(actual2, resolver2, `actual2`);
  //     assert.strictEqual(actual2['strategy'], ResolverStrategy.array, `actual2['strategy']`);
  //     assert.strictEqual(actual2['state'][0], resolver1, `actual2['state'][0]`);
  //     assert.strictEqual(actual2['state'][1], resolver2, `actual2['state'][1]`);
  //   });

  //   it(`appends to the array resolver if the key already exists more than once`, function () {
  //     const key = {};
  //     const resolver1 = new Resolver(key, ResolverStrategy.instance, {});
  //     const resolver2 = new Resolver(key, ResolverStrategy.instance, {});
  //     const resolver3 = new Resolver(key, ResolverStrategy.instance, {});
  //     sut.registerResolver(key, resolver1);
  //     sut.registerResolver(key, resolver2);
  //     sut.registerResolver(key, resolver3);
  //     const actual1 = sut.getResolver(key);
  //     assert.strictEqual(actual1['strategy'], ResolverStrategy.array, `actual1['strategy']`);
  //     assert.strictEqual(actual1['state'][0], resolver1, `actual1['state'][0]`);
  //     assert.strictEqual(actual1['state'][1], resolver2, `actual1['state'][1]`);
  //     assert.strictEqual(actual1['state'][2], resolver3, `actual1['state'][2]`);
  //   });
  // });

  describe(`registerTransformer()`, function () {
    for (const key of [null, undefined]) {
      it(_`throws on invalid key ${key}`, function () {
        const { sut } = createFixture();
        // assert.throws(() => sut.registerTransformer(key, null as any), /AUR0014/, `() => sut.registerTransformer(key, null as any)`);
        assert.throws(() => sut.registerTransformer(key, null as any), /key\/value cannot be null or undefined/, `() => sut.registerTransformer(key, null as any)`);
      });
    }

    it(`registers the transformer if it does not exist yet`, function () {
      return;
    });

    it(`reuses the existing transformer if it exists`, function () {
      return;
    });
  });

  describe(`getResolver()`, function () {
    for (const key of [null, undefined]) {
      it(_`throws on invalid key ${key}`, function () {
        const { sut } = createFixture();
        // assert.throws(() => sut.getResolver(key, null as any), /AUR0014/, `() => sut.getResolver(key, null as any)`);
        assert.throws(() => sut.getResolver(key, null as any), /key\/value cannot be null or undefined/, `() => sut.getResolver(key, null as any)`);
      });
    }

  });

  // describe(`has()`, function () {
  //   for (const key of [null, undefined, Object]) {
  //     it(_`returns false for non-existing key ${key}`, function () {
  //       assert.strictEqual(sut.has(key as any, false), false, `sut.has(key as any, false)`);
  //     });
  //   }
  //   it(`returns true for existing key`, function () {
  //     const key = {};
  //     sut.registerResolver(key, new Resolver(key, ResolverStrategy.instance, {}));
  //     assert.strictEqual(sut.has(key as any, false), true, `sut.has(key as any, false)`);
  //   });
  // });

  describe(`get()`, function () {
    for (const key of [null, undefined]) {
      it(_`throws on invalid key ${key}`, function () {
        const { sut } = createFixture();
        // assert.throws(() => sut.get(key), /AUR0014/, `() => sut.get(key)`);
        assert.throws(() => sut.get(key), /key\/value cannot be null or undefined/, `() => sut.get(key)`);
      });
    }

  });

  describe(`getAll()`, function () {
    for (const key of [null, undefined]) {
      it(_`throws on invalid key ${key}`, function () {
        const { sut } = createFixture();
        // assert.throws(() => sut.getAll(key), /AUR0014/, `() => sut.getAll(key)`);
        assert.throws(() => sut.getAll(key), /key\/value cannot be null or undefined/, `() => sut.getAll(key)`);
      });
    }

  });

  // describe(`getFactory()`, function () {
  //   for (const count of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  //     sut = new Container(); // ensure the state is reset (beforeEach doesn't know about loops)

  //     it(`returns a new Factory with ${count} deps if it does not exist`, function () {
  //       class Bar {}
  //       class Foo {public static inject = Array(count).map(c => Bar); }
  //       const actual = sut.getFactory(Foo);
  //       assert.instanceOf(actual, Factory, `actual`);
  //       assert.strictEqual(actual.Type, Foo, `actual.Type`);
  //       if (count < 6) {
  //         assert.strictEqual(actual['invoker'], classInvokers[count], `actual['invoker']`);
  //       } else {
  //         assert.strictEqual(actual['invoker'], fallbackInvoker, `actual['invoker']`);
  //       }
  //       assert.notStrictEqual(actual['dependencies'], Foo.inject, `actual['dependencies']`);
  //       assert.deepStrictEqual(actual['dependencies'], Foo.inject, `actual['dependencies']`);
  //     });
  //   }

  //   it(`reuses the existing factory if it already exists`, function () {
  //     const create = spy(Factory, 'create');
  //     class Foo {}
  //     const actual = sut.getFactory(Foo);
  //     assert.instanceOf(actual, Factory, `actual`);
  //     const actual2 = sut.getFactory(Foo);
  //     assert.strictEqual(actual, actual2, `actual`);
  //     expect(create).to.have.been.calledOnce;
  //     create.restore();
  //   });
  // });

  describe(`createChild()`, function () {
    it(`inherits non-resource obj keyed factories from root`, function () {
      const type = class {};
      const key = {} as any;

      const parent = DI.createContainer();

      parent.register(Registration.singleton(key, type));

      const factoryFromParent = parent.getFactory(key);

      const child = parent.createChild();

      const factoryFromChild = child.getFactory(key);

      assert.strictEqual(factoryFromParent, factoryFromChild);
    });

    // Irrelevant due to metadata
    // it(`inherits non-resource string keyed factories from root`, function () {
    //   const type = class {};
    //   const key = 'foo' as any;

    //   const parent = DI.createContainer();

    //   parent.register(Registration.singleton(key, type));

    //   const factoryFromParent = parent.getFactory(key);

    //   const child = parent.createChild();

    //   const factoryFromChild = child.getFactory(key);

    //   assert.strictEqual(factoryFromParent, factoryFromChild);
    // });

    // Irrelevant due to metadata
    // it(`inherits resource factories from root`, function () {
    //   const type = class {};
    //   const key = 'foo:bar' as any;

    //   const parent = DI.createContainer();

    //   parent.register(Registration.singleton(key, type));

    //   const factoryFromParent = parent.getFactory(key);

    //   const child = parent.createChild();

    //   const factoryFromChild = child.getFactory(key);

    //   assert.strictEqual(factoryFromParent, factoryFromChild);
    // });

    it(`does NOT store non-resource obj keyed resolvers in resourceResolvers`, function () {
      const type = class {};
      const key = {} as any;

      const parent = DI.createContainer();

      parent.register(Registration.singleton(key, type));

      const parentHasKey = parent['resourceResolvers'][key] !== void 0;

      const child = parent.createChild();

      const childHasKey = child['resourceResolvers'][key] !== void 0;

      assert.strictEqual(parentHasKey, false, `has@root`);
      assert.strictEqual(childHasKey, false, `has@child`);
    });

    // Irrelevant due to metadata
    // it(`does NOT store non-resource string keyed resolvers in resourceResolvers`, function () {
    //   const type = class {};
    //   const key = 'foo' as any;

    //   const parent = DI.createContainer();

    //   parent.register(Registration.singleton(key, type));

    //   const parentHasKey = parent['resourceResolvers'][key] !== void 0;

    //   const child = parent.createChild();

    //   const childHasKey = child['resourceResolvers'][key] !== void 0;

    //   assert.strictEqual(parentHasKey, false, `has@root`);
    //   assert.strictEqual(childHasKey, false, `has@child`);
    // });

    // Irrelevant due to metadata
    // it(`stores resource resolvers in resourceResolvers and inherits them from root`, function () {
    //   const type = class {};
    //   const key = 'foo:bar' as any;

    //   const parent = DI.createContainer();

    //   parent.register(Registration.singleton(key, type));

    //   const parentHasKey = parent['resourceResolvers'][key] !== void 0;

    //   const child = parent.createChild();

    //   const childHasKey = child['resourceResolvers'][key] !== void 0;

    //   assert.strictEqual(parentHasKey, true, `has@root`);
    //   assert.strictEqual(childHasKey, true, `has@child`);
    // });

    describe(`followed by another createChild()`, function () {
      it(`inherits non-resource obj keyed factories from root`, function () {
        const type = class {};
        const key = {} as any;

        const root = DI.createContainer();

        root.register(Registration.singleton(key, type));

        const factoryFromRoot = root.getFactory(key);

        const parent = root.createChild();
        const child = parent.createChild();

        const factoryFromChild = child.getFactory(key);

        assert.strictEqual(factoryFromRoot, factoryFromChild);
      });

      // Irrelevant due to metadata
      // it(`inherits non-resource string keyed factories from root`, function () {
      //   const type = class {};
      //   const key = 'foo' as any;

      //   const root = DI.createContainer();

      //   root.register(Registration.singleton(key, type));

      //   const factoryFromRoot = root.getFactory(key);

      //   const parent = root.createChild();
      //   const child = parent.createChild();

      //   const factoryFromChild = child.getFactory(key);

      //   assert.strictEqual(factoryFromRoot, factoryFromChild);
      // });

      // Irrelevant due to metadata
      // it(`inherits resource factories from root`, function () {
      //   const type = class {};
      //   const key = 'foo:bar' as any;

      //   const root = DI.createContainer();

      //   root.register(Registration.singleton(key, type));

      //   const factoryFromRoot = root.getFactory(key);

      //   const parent = root.createChild();
      //   const child = parent.createChild();

      //   const factoryFromChild = child.getFactory(key);

      //   assert.strictEqual(factoryFromRoot, factoryFromChild);
      // });

      it(`inherits non-resource obj keyed factories from parent`, function () {
        const type = class {};
        const key = {} as any;

        const root = DI.createContainer();
        const parent = root.createChild();

        parent.register(Registration.singleton(key, type));

        const factoryFromParent = parent.getFactory(key);

        const child = parent.createChild();

        const factoryFromChild = child.getFactory(key);

        assert.strictEqual(factoryFromParent, factoryFromChild);
      });

      // Irrelevant due to metadata
      // it(`inherits non-resource string keyed factories from parent`, function () {
      //   const type = class {};
      //   const key = 'foo' as any;

      //   const root = DI.createContainer();
      //   const parent = root.createChild();

      //   parent.register(Registration.singleton(key, type));

      //   const factoryFromParent = parent.getFactory(key);

      //   const child = parent.createChild();

      //   const factoryFromChild = child.getFactory(key);

      //   assert.strictEqual(factoryFromParent, factoryFromChild);
      // });

      // Irrelevant due to metadata
      // it(`inherits resource factories from parent`, function () {
      //   const type = class {};
      //   const key = 'foo:bar' as any;

      //   const root = DI.createContainer();
      //   const parent = root.createChild();

      //   parent.register(Registration.singleton(key, type));

      //   const factoryFromParent = parent.getFactory(key);

      //   const child = parent.createChild();

      //   const factoryFromChild = child.getFactory(key);

      //   assert.strictEqual(factoryFromParent, factoryFromChild);
      // });

      it(`does NOT store non-resource obj keyed resolvers in resourceResolvers`, function () {
        const type = class {};
        const key = {} as any;

        const root = DI.createContainer();
        const parent = root.createChild();

        parent.register(Registration.singleton(key, type));

        const parentHasKey = parent['resourceResolvers'][key] !== void 0;

        const child = parent.createChild();

        const childHasKey = child['resourceResolvers'][key] !== void 0;

        assert.strictEqual(parentHasKey, false, `parentHasKey`);
        assert.strictEqual(childHasKey, false, `childHasKey`);
      });

      it(`does NOT store non-resource string keyed resolvers in resourceResolvers`, function () {
        const type = class {};
        const key = 'foo' as any;

        const root = DI.createContainer();
        const parent = root.createChild();

        parent.register(Registration.singleton(key, type));

        const parentHasKey = parent['resourceResolvers'][key] !== void 0;

        const child = parent.createChild();

        const childHasKey = child['resourceResolvers'][key] !== void 0;

        assert.strictEqual(parentHasKey, false, `parentHasKey`);
        assert.strictEqual(childHasKey, false, `childHasKey`);
      });

      it(`stores resource resolvers in resourceResolvers in parent but does not inherit them from parent`, function () {
        const type = class {};
        const key = 'foo:bar' as any;

        const root = DI.createContainer();
        const parent = root.createChild();

        parent.register(Registration.singleton(key, type));

        const parentHasKey = parent['resourceResolvers'][key] !== void 0;

        const child = parent.createChild();

        const childHasKey = child['resourceResolvers'][key] !== void 0;

        assert.strictEqual(parentHasKey, true, `parentHasKey`);
        assert.strictEqual(childHasKey, false, `childHasKey`);
      });

      // container used to copy resource keys all the way down
      // it's not only wasteful, but also inappropriate
      // a change in the way resources information is carried forward resulted in this test being skipped
      // but kept as a reminder how it used to be, in case someone relying on this behavior ran into the odd behavior
      it.skip(`stores resource resolvers in resourceResolvers in parent and inherits them from root but does not from parent`, function () {
        const type = class {};
        const keyFromRoot = 'foo:bar' as any;
        const keyFromParent = 'foo:baz' as any;

        const root = DI.createContainer();

        root.register(Registration.singleton(keyFromRoot, type));

        const parent = root.createChild();

        parent.register(Registration.singleton(keyFromParent, type));

        const parentHasKeyFromRoot = parent['resourceResolvers'][keyFromRoot] !== void 0;
        const parentHasKeyFromParent = parent['resourceResolvers'][keyFromParent] !== void 0;

        const child = parent.createChild();

        const childHasKeyFromRoot = child['resourceResolvers'][keyFromRoot] !== void 0;
        const childHasKeyFromParent = child['resourceResolvers'][keyFromParent] !== void 0;

        assert.strictEqual(parentHasKeyFromRoot, false, `parentHasKeyFromRoot`);
        assert.strictEqual(parentHasKeyFromParent, true, `parentHasKeyFromParent`);

        assert.strictEqual(childHasKeyFromRoot, false, `childHasKeyFromRoot`);
        assert.strictEqual(childHasKeyFromParent, false, `childHasKeyFromParent`);
      });
    });
  });

  describe(`jitRegister()`, function () {
    return;
  });
});

// describe(`The Registration object`, function () {

//   it(`instance() returns the correct resolver`, function () {
//     const value = {};
//     const actual = Registration.instance('key', value);
//     assert.strictEqual(actual['key'], 'key', `actual['key']`);
//     assert.strictEqual(actual['strategy'], ResolverStrategy.instance, `actual['strategy']`);
//     assert.strictEqual(actual['state'], value, `actual['state']`);
//   });

//   it(`singleton() returns the correct resolver`, function () {
//     class Foo {}
//     const actual = Registration.singleton('key', Foo);
//     assert.strictEqual(actual['key'], 'key', `actual['key']`);
//     assert.strictEqual(actual['strategy'], ResolverStrategy.singleton, `actual['strategy']`);
//     assert.strictEqual(actual['state'], Foo, `actual['state']`);
//   });

//   it(`transient() returns the correct resolver`, function () {
//     class Foo {}
//     const actual = Registration.transient('key', Foo);
//     assert.strictEqual(actual['key'], 'key', `actual['key']`);
//     assert.strictEqual(actual['strategy'], ResolverStrategy.transient, `actual['strategy']`);
//     assert.strictEqual(actual['state'], Foo, `actual['state']`);
//   });

//   it(`callback() returns the correct resolver`, function () {
//     const callback = () => { return; };
//     const actual = Registration.callback('key', callback);
//     assert.strictEqual(actual['key'], 'key', `actual['key']`);
//     assert.strictEqual(actual['strategy'], ResolverStrategy.callback, `actual['strategy']`);
//     assert.strictEqual(actual['state'], callback, `actual['state']`);
//   });

//   it(`alias() returns the correct resolver`, function () {
//     const actual = Registration.aliasTo('key', 'key2');
//     assert.strictEqual(actual['key'], 'key2', `actual['key']`);
//     assert.strictEqual(actual['strategy'], ResolverStrategy.alias, `actual['strategy']`);
//     assert.strictEqual(actual['state'], 'key', `actual['state']`);
//   });
// });

// describe(`The classInvokers object`, function () {
//   const container = { get(t) {
//     return new t();
//   } } as any as IContainer;
//   class Foo { public args: any[]; constructor(...args: any[]) { this.args = args; } }

//   class Dep1 {}
//   class Dep2 {}
//   class Dep3 {}
//   class Dep4 {}
//   class Dep5 {}
//   class Dep6 {}

//   it(`invoke() handles 0 deps`, function () {
//     const actual = classInvokers[0].invoke(container, Foo, []) as Foo;
//     assert.strictEqual(actual.args.length, 0, `actual.args.length`);
//   });

//   it(`invoke() handles 1 dep`, function () {
//     const actual = classInvokers[1].invoke(container, Foo, [Dep1]) as Foo;
//     assert.strictEqual(actual.args.length, 1, `actual.args.length`);
//     assert.instanceOf(actual.args[0], Dep1, `actual.args[0]`);
//   });

//   it(`invoke() handles 2 deps`, function () {
//     const actual = classInvokers[2].invoke(container, Foo, [Dep1, Dep2]) as Foo;
//     assert.strictEqual(actual.args.length, 2, `actual.args.length`);
//     assert.instanceOf(actual.args[0], Dep1, `actual.args[0]`);
//     assert.instanceOf(actual.args[1], Dep2, `actual.args[1]`);
//   });

//   it(`invoke() handles 3 deps`, function () {
//     const actual = classInvokers[3].invoke(container, Foo, [Dep1, Dep2, Dep3]) as Foo;
//     assert.strictEqual(actual.args.length, 3, `actual.args.length`);
//     assert.instanceOf(actual.args[0], Dep1, `actual.args[0]`);
//     assert.instanceOf(actual.args[1], Dep2, `actual.args[1]`);
//     assert.instanceOf(actual.args[2], Dep3, `actual.args[2]`);
//   });

//   it(`invoke() handles 4 deps`, function () {
//     const actual = classInvokers[4].invoke(container, Foo, [Dep1, Dep2, Dep3, Dep4]) as Foo;
//     assert.strictEqual(actual.args.length, 4, `actual.args.length`);
//     assert.instanceOf(actual.args[0], Dep1, `actual.args[0]`);
//     assert.instanceOf(actual.args[1], Dep2, `actual.args[1]`);
//     assert.instanceOf(actual.args[2], Dep3, `actual.args[2]`);
//     assert.instanceOf(actual.args[3], Dep4, `actual.args[3]`);
//   });

//   it(`invoke() handles 5 deps`, function () {
//     const actual = classInvokers[5].invoke(container, Foo, [Dep1, Dep2, Dep3, Dep4, Dep5]) as Foo;
//     assert.strictEqual(actual.args.length, 5, `actual.args.length`);
//     assert.instanceOf(actual.args[0], Dep1, `actual.args[0]`);
//     assert.instanceOf(actual.args[1], Dep2, `actual.args[1]`);
//     assert.instanceOf(actual.args[2], Dep3, `actual.args[2]`);
//     assert.instanceOf(actual.args[3], Dep4, `actual.args[3]`);
//     assert.instanceOf(actual.args[4], Dep5, `actual.args[4]`);
//   });

//   it(`invoke() does not handle 6 deps`, function () {
//     assert.throws(() => classInvokers[6].invoke(container, Foo, [Dep1, Dep2, Dep3, Dep4, Dep5, Dep6]), /undefined/, `() => classInvokers[6].invoke(container, Foo, [Dep1, Dep2, Dep3, Dep4, Dep5, Dep6])`);
//   });

// });

// describe(`The invokeWithDynamicDependencies function`, function () {
//   const container = { get(t) {
//     return `static${t}`;
//   } } as any as IContainer;
//   class Foo { public args: any[]; constructor(...args: any[]) { this.args = args; } }

//   const deps = [class Dep1 {}, class Dep2 {}, class Dep3 {}];

//   it(_`throws when staticDeps is null`, function () {
//     assert.throws(() => invokeWithDynamicDependencies(container, Foo, null, []), void 0, `() => invokeWithDynamicDependencies(container, Foo, null, [])`);
//   });

//   it(_`throws when any of the staticDeps is null`, function () {
//     assert.throws(() => invokeWithDynamicDependencies(container, Foo, [null], []), /7/, `() => invokeWithDynamicDependencies(container, Foo, [null], [])`);
//   });

//   it(_`throws when any of the staticDeps is undefined`, function () {
//     assert.throws(() => invokeWithDynamicDependencies(container, Foo, [undefined], []), /7/, `() => invokeWithDynamicDependencies(container, Foo, [undefined], [])`);
//   });

//   it(_`throws when staticDeps is undefined`, function () {
//     assert.throws(() => invokeWithDynamicDependencies(container, Foo, undefined, []), void 0, `() => invokeWithDynamicDependencies(container, Foo, undefined, [])`);
//   });

//   it(_`handles staticDeps is ${deps}`, function () {
//     const actual = invokeWithDynamicDependencies(container, Foo, deps, []);
//     assert.deepStrictEqual(actual.args, deps.map(d => `static${d}`), `actual.args`);
//   });

//   it(`handles dynamicDeps is null`, function () {
//     const actual = invokeWithDynamicDependencies(container, Foo, [], null);
//     assert.strictEqual(actual.args.length, 1, `actual.args.length`);
//     assert.strictEqual(actual.args[0], null, `actual.args[0]`);
//   });

//   it(`handles dynamicDeps is undefined`, function () {
//     const actual = invokeWithDynamicDependencies(container, Foo, [], undefined);
//     assert.strictEqual(actual.args.length, 0, `actual.args.length`);
//   });

//   it(_`handles dynamicDeps is ${deps}`, function () {
//     const actual = invokeWithDynamicDependencies(container, Foo, [], deps);
//     assert.deepStrictEqual(actual.args, deps, `actual.args`);
//   });

//   it(_`handles staticDeps is ${deps} and dynamicDeps is ${deps}`, function () {
//     const actual = invokeWithDynamicDependencies(container, Foo, deps, deps);
//     assert.strictEqual(actual.args[0], `static${deps[0]}`, `actual.args[0]`);
//     assert.strictEqual(actual.args[1], `static${deps[1]}`, `actual.args[1]`);
//     assert.strictEqual(actual.args[2], `static${deps[2]}`, `actual.args[2]`);
//     assert.strictEqual(actual.args[3], deps[0], `actual.args[3]`);
//     assert.strictEqual(actual.args[4], deps[1], `actual.args[4]`);
//     assert.strictEqual(actual.args[5], deps[2], `actual.args[5]`);
//   });
// });
