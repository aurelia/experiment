import {
  DI,
  IContainer,
  inject,
  InterfaceSymbol,
  Registration,
} from '@aurelia/kernel';
import { assert, createSpy, ISpy } from '@aurelia/testing';

describe('DI.createInterface() -> container.get()', function () {
  let container: IContainer;

  interface ITransient {}
  class Transient implements ITransient {}
  let ITransient: InterfaceSymbol<ITransient>;

  interface ISingleton {}
  class Singleton implements ISingleton {}
  let ISingleton: InterfaceSymbol<ISingleton>;

  interface IInstance {}
  class Instance implements IInstance {}
  let IInstance: InterfaceSymbol<IInstance>;
  let instance: Instance;

  interface ICallback {}
  class Callback implements ICallback {}
  let ICallback: InterfaceSymbol<ICallback>;

  let callback: ISpy<() => ICallback>;
  let get: ISpy<IContainer['get']>;

  beforeEach(function () {
    container = DI.createContainer();
    ITransient = DI.createInterface<ITransient>('ITransient').withDefault(x => x.transient(Transient));
    ISingleton = DI.createInterface<ISingleton>('ISingleton').withDefault(x => x.singleton(Singleton));
    instance = new Instance();
    IInstance = DI.createInterface<IInstance>('IInstance').withDefault(x => x.instance(instance));
    callback = createSpy(() => new Callback());
    ICallback = DI.createInterface<ICallback>('ICallback').withDefault(x => x.callback(callback));
    get = createSpy(container, 'get', true);
  });

  afterEach(function () {
    get.restore();
  });

  describe('leaf', function () {
    it(`transient registration returns a new instance each time`, function () {
      const actual1 = container.get(ITransient);
      assert.instanceOf(actual1, Transient, `actual1`);

      const actual2 = container.get(ITransient);
      assert.instanceOf(actual2, Transient, `actual2`);

      assert.notStrictEqual(actual1, actual2, `actual1`);

      assert.deepStrictEqual(
        get.calls,
        [
          [ITransient],
          [ITransient],
        ],
        `get.calls`,
      );
    });

    it(`singleton registration returns the same instance each time`, function () {
      const actual1 = container.get(ISingleton);
      assert.instanceOf(actual1, Singleton, `actual1`);

      const actual2 = container.get(ISingleton);
      assert.instanceOf(actual2, Singleton, `actual2`);

      assert.strictEqual(actual1, actual2, `actual1`);

      assert.deepStrictEqual(
        get.calls,
        [
          [ISingleton],
          [ISingleton],
        ],
        `get.calls`,
      );
    });

    it(`instance registration returns the same instance each time`, function () {
      const actual1 = container.get(IInstance);
      assert.instanceOf(actual1, Instance, `actual1`);

      const actual2 = container.get(IInstance);
      assert.instanceOf(actual2, Instance, `actual2`);

      assert.strictEqual(actual1, instance, `actual1`);
      assert.strictEqual(actual2, instance, `actual2`);

      assert.deepStrictEqual(
        get.calls,
        [
          [IInstance],
          [IInstance],
        ],
        `get.calls`,
      );
    });

    it(`callback registration is invoked each time`, function () {
      const actual1 = container.get(ICallback);
      assert.instanceOf(actual1, Callback, `actual1`);

      const actual2 = container.get(ICallback);
      assert.instanceOf(actual2, Callback, `actual2`);

      assert.notStrictEqual(actual1, actual2, `actual1`);

      assert.deepStrictEqual(
        callback.calls,
        [
          [container, container, container.getResolver(ICallback)],
          [container, container, container.getResolver(ICallback)],
        ],
        `callback.calls`,
      );

      assert.deepStrictEqual(
        get.calls,
        [
          [ICallback],
          [ICallback],
        ],
        `get.calls`,
      );
    });

    it(`InterfaceSymbol alias to transient registration returns a new instance each time`, function () {
      interface IAlias {}
      const IAlias = DI.createInterface<IAlias>('IAlias').withDefault(x => x.aliasTo(ITransient));

      const actual1 = container.get(IAlias);
      assert.instanceOf(actual1, Transient, `actual1`);

      const actual2 = container.get(IAlias);
      assert.instanceOf(actual2, Transient, `actual2`);

      assert.notStrictEqual(actual1, actual2, `actual1`);

      assert.deepStrictEqual(
        get.calls,
        [
          [IAlias],
          [ITransient, undefined],
          [IAlias],
          [ITransient, IAlias],
        ],
        `get.calls`,
      );
    });

    it(`InterfaceSymbol alias to singleton registration returns the same instance each time`, function () {
      interface IAlias {}
      const IAlias = DI.createInterface<IAlias>('IAlias').withDefault(x => x.aliasTo(ISingleton));

      const actual1 = container.get(IAlias);
      assert.instanceOf(actual1, Singleton, `actual1`);

      const actual2 = container.get(IAlias);
      assert.instanceOf(actual2, Singleton, `actual2`);

      assert.strictEqual(actual1, actual2, `actual1`);

      assert.deepStrictEqual(
        get.calls,
        [
          [IAlias],
          [ISingleton, undefined],
          [IAlias],
          [ISingleton, IAlias],
        ],
        `get.calls`,
      );
    });

    it(`InterfaceSymbol alias to instance registration returns the same instance each time`, function () {
      interface IAlias {}
      const IAlias = DI.createInterface<IAlias>('IAlias').withDefault(x => x.aliasTo(IInstance));

      const actual1 = container.get(IAlias);
      assert.instanceOf(actual1, Instance, `actual1`);

      const actual2 = container.get(IAlias);
      assert.instanceOf(actual2, Instance, `actual2`);

      assert.strictEqual(actual1, instance, `actual1`);
      assert.strictEqual(actual2, instance, `actual2`);

      assert.deepStrictEqual(
        get.calls,
        [
          [IAlias],
          [IInstance, undefined],
          [IAlias],
          [IInstance, IAlias],
        ],
        `get.calls`,
      );
    });

    // TODO: make test work
    it(`InterfaceSymbol alias to callback registration is invoked each time`, function () {
      interface IAlias {}
      const IAlias = DI.createInterface<IAlias>('IAlias').withDefault(x => x.aliasTo(ICallback));

      const actual1 = container.get(IAlias);
      assert.instanceOf(actual1, Callback, `actual1`);

      const actual2 = container.get(IAlias);
      assert.instanceOf(actual2, Callback, `actual2`);

      assert.notStrictEqual(actual1, actual2, `actual1`);

      assert.deepStrictEqual(
        callback.calls,
        [
          [container, container, container.getResolver(ICallback)],
          [container, container, container.getResolver(ICallback)],
        ],
        `callback.calls`,
      );

      assert.deepStrictEqual(
        get.calls,
        [
          [IAlias],
          [ICallback, undefined],
          [IAlias],
          [ICallback, IAlias],
        ],
        `get.calls`,
      );
    });

    it(`string alias to transient registration returns a new instance each time`, function () {
      container.register(Registration.alias(ITransient, 'alias'));

      const actual1 = container.get('alias');
      assert.instanceOf(actual1, Transient, `actual1`);

      const actual2 = container.get('alias');
      assert.instanceOf(actual2, Transient, `actual2`);

      assert.notStrictEqual(actual1, actual2, `actual1`);

      assert.deepStrictEqual(
        get.calls,
        [
          ['alias'],
          [ITransient, 'alias'],
          ['alias'],
          [ITransient, 'alias'],
        ],
        `get.calls`,
      );
    });

    it(`string alias to singleton registration returns the same instance each time`, function () {
      container.register(Registration.alias(ISingleton, 'alias'));

      const actual1 = container.get('alias');
      assert.instanceOf(actual1, Singleton, `actual1`);

      const actual2 = container.get('alias');
      assert.instanceOf(actual2, Singleton, `actual2`);

      assert.strictEqual(actual1, actual2, `actual1`);

      assert.deepStrictEqual(
        get.calls,
        [
          ['alias'],
          [ISingleton, 'alias'],
          ['alias'],
          [ISingleton, 'alias'],
        ],
        `get.calls`,
      );
    });

    it(`string alias to instance registration returns the same instance each time`, function () {
      container.register(Registration.alias(IInstance, 'alias'));

      const actual1 = container.get('alias');
      assert.instanceOf(actual1, Instance, `actual1`);

      const actual2 = container.get('alias');
      assert.instanceOf(actual2, Instance, `actual2`);

      assert.strictEqual(actual1, instance, `actual1`);
      assert.strictEqual(actual2, instance, `actual2`);

      assert.deepStrictEqual(
        get.calls,
        [
          ['alias'],
          [IInstance, 'alias'],
          ['alias'],
          [IInstance, 'alias'],
        ],
        `get.calls`,
      );
    });

    it(`string alias to callback registration is invoked each time`, function () {
      container.register(Registration.alias(ICallback, 'alias'));

      const actual1 = container.get('alias');
      assert.instanceOf(actual1, Callback, `actual1`);

      const actual2 = container.get('alias');
      assert.instanceOf(actual2, Callback, `actual2`);

      assert.notStrictEqual(actual1, actual2, `actual1`);

      assert.deepStrictEqual(
        callback.calls,
        [
          [container, container, container.getResolver(ICallback)],
          [container, container, container.getResolver(ICallback)],
        ],
        `callback.calls`,
      );

      assert.deepStrictEqual(
        get.calls,
        [
          ['alias'],
          [ICallback, 'alias'],
          ['alias'],
          [ICallback, 'alias'],
        ],
        `get.calls`,
      );
    });
  });

  // describe('parent without inject decorator', function () {
  //   function decorator(): ClassDecorator { return (target: any) => target; }
  //   interface IParent { dep: any; }
  //   let IParent: InterfaceSymbol<IParent>;

  //   function register(cls: any) {
  //     IParent = DI.createInterface<IParent>('IParent').withDefault(x => x.transient(cls));
  //   }

  //   it(`transient child registration throws`, function () {
  //     @decorator()
  //     class Parent implements IParent { constructor(public dep: ITransient) {} }
  //     register(Parent);

  //     assert.throws(() => container.get(IParent), /5/, `() => container.get(IParent)`);
  //   });

  //   it(`singleton child registration throws`, function () {
  //     @decorator()
  //     class Parent implements IParent { constructor(public dep: ISingleton) {} }
  //     register(Parent);

  //     assert.throws(() => container.get(IParent), /5/, `() => container.get(IParent)`);
  //   });

  //   it(`instance child registration throws`, function () {
  //     @decorator()
  //     class Parent implements IParent { constructor(public dep: IInstance) {} }
  //     register(Parent);

  //     assert.throws(() => container.get(IParent), /5/, `() => container.get(IParent)`);
  //   });

  //   it(`callback child registration throws`, function () {
  //     @decorator()
  //     class Parent implements IParent { constructor(public dep: ICallback) {} }
  //     register(Parent);

  //     assert.throws(() => container.get(IParent), /5/, `() => container.get(IParent)`);
  //   });
  // });

  describe('transient parent', function () {
    interface ITransientParent { dep: any; }
    let ITransientParent: InterfaceSymbol<ITransientParent>;

    function register(cls: any) {
      ITransientParent = DI.createInterface<ITransientParent>('ITransientParent').withDefault(x => x.transient(cls));
    }

    it(`transient child registration returns a new instance each time`, function () {
      @inject(ITransient)
      class TransientParent implements ITransientParent { constructor(public dep: ITransient) {} }
      register(TransientParent);

      const actual1 = container.get(ITransientParent);
      assert.instanceOf(actual1, TransientParent, `actual1`);
      assert.instanceOf(actual1.dep, Transient, `actual1.dep`);

      const actual2 = container.get(ITransientParent);
      assert.instanceOf(actual2, TransientParent, `actual2`);
      assert.instanceOf(actual2.dep, Transient, `actual2.dep`);

      assert.notStrictEqual(actual1, actual2, `actual1`);

      assert.notStrictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        get.calls,
        [
          [ITransientParent],
          [ITransient],
          [ITransientParent],
          [ITransient],
        ],
        `get.calls`,
      );
    });

    it(`singleton child registration returns the same instance each time`, function () {
      @inject(ISingleton)
      class TransientParent implements ITransientParent { constructor(public dep: ISingleton) {} }
      register(TransientParent);

      const actual1 = container.get(ITransientParent);
      assert.instanceOf(actual1, TransientParent, `actual1`);
      assert.instanceOf(actual1.dep, Singleton, `actual1.dep`);

      const actual2 = container.get(ITransientParent);
      assert.instanceOf(actual2, TransientParent, `actual2`);
      assert.instanceOf(actual2.dep, Singleton, `actual2.dep`);

      assert.notStrictEqual(actual1, actual2, `actual1`);

      assert.strictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        get.calls,
        [
          [ITransientParent],
          [ISingleton],
          [ITransientParent],
          [ISingleton],
        ],
        `get.calls`,
      );
    });

    it(`instance child registration returns the same instance each time`, function () {
      @inject(IInstance)
      class TransientParent implements ITransientParent { constructor(public dep: IInstance) {} }
      register(TransientParent);

      const actual1 = container.get(ITransientParent);
      assert.instanceOf(actual1, TransientParent, `actual1`);
      assert.instanceOf(actual1.dep, Instance, `actual1.dep`);

      const actual2 = container.get(ITransientParent);
      assert.instanceOf(actual2, TransientParent, `actual2`);
      assert.instanceOf(actual2.dep, Instance, `actual2.dep`);

      assert.notStrictEqual(actual1, actual2, `actual1`);

      assert.strictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        get.calls,
        [
          [ITransientParent],
          [IInstance],
          [ITransientParent],
          [IInstance],
        ],
        `get.calls`,
      );
    });

    it(`callback child registration is invoked each time`, function () {
      @inject(ICallback)
      class TransientParent implements ITransientParent { constructor(public dep: ICallback) {} }
      register(TransientParent);

      const actual1 = container.get(ITransientParent);
      assert.instanceOf(actual1, TransientParent, `actual1`);
      assert.instanceOf(actual1.dep, Callback, `actual1.dep`);

      const actual2 = container.get(ITransientParent);
      assert.instanceOf(actual2, TransientParent, `actual2`);
      assert.instanceOf(actual2.dep, Callback, `actual2.dep`);

      assert.notStrictEqual(actual1, actual2, `actual1`);
      assert.notStrictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        callback.calls,
        [
          [container, container, container.getResolver(ICallback)],
          [container, container, container.getResolver(ICallback)],
        ],
        `callback.calls`,
      );

      assert.deepStrictEqual(
        get.calls,
        [
          [ITransientParent],
          [ICallback],
          [ITransientParent],
          [ICallback],
        ],
        `get.calls`,
      );
    });
  });

  describe('singleton parent', function () {
    interface ISingletonParent { dep: any; }
    let ISingletonParent: InterfaceSymbol<ISingletonParent>;

    function register(cls: any) {
      ISingletonParent = DI.createInterface<ISingletonParent>('ISingletonParent').withDefault(x => x.singleton(cls));
    }

    it(`transient child registration is reused by the singleton parent`, function () {
      @inject(ITransient)
      class SingletonParent implements ISingletonParent { constructor(public dep: ITransient) {} }
      register(SingletonParent);

      const actual1 = container.get(ISingletonParent);
      assert.instanceOf(actual1, SingletonParent, `actual1`);
      assert.instanceOf(actual1.dep, Transient, `actual1.dep`);

      const actual2 = container.get(ISingletonParent);
      assert.instanceOf(actual2, SingletonParent, `actual2`);
      assert.instanceOf(actual2.dep, Transient, `actual2.dep`);

      assert.strictEqual(actual1, actual2, `actual1`);

      assert.strictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        get.calls,
        [
          [ISingletonParent],
          [ITransient],
          [ISingletonParent],
        ],
        `get.calls`,
      );
    });

    it(`singleton registration is reused by the singleton parent`, function () {
      @inject(ISingleton)
      class SingletonParent implements ISingletonParent { constructor(public dep: ISingleton) {} }
      register(SingletonParent);

      const actual1 = container.get(ISingletonParent);
      assert.instanceOf(actual1, SingletonParent, `actual1`);
      assert.instanceOf(actual1.dep, Singleton, `actual1.dep`);

      const actual2 = container.get(ISingletonParent);
      assert.instanceOf(actual2, SingletonParent, `actual2`);
      assert.instanceOf(actual2.dep, Singleton, `actual2.dep`);

      assert.strictEqual(actual1, actual2, `actual1`);

      assert.strictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        get.calls,
        [
          [ISingletonParent],
          [ISingleton],
          [ISingletonParent],
        ],
        `get.calls`,
      );
    });

    it(`instance registration is reused by the singleton parent`, function () {
      @inject(IInstance)
      class SingletonParent implements ISingletonParent { constructor(public dep: IInstance) {} }
      register(SingletonParent);

      const actual1 = container.get(ISingletonParent);
      assert.instanceOf(actual1, SingletonParent, `actual1`);
      assert.instanceOf(actual1.dep, Instance, `actual1.dep`);

      const actual2 = container.get(ISingletonParent);
      assert.instanceOf(actual2, SingletonParent, `actual2`);
      assert.instanceOf(actual2.dep, Instance, `actual2.dep`);

      assert.strictEqual(actual1, actual2, `actual1`);

      assert.strictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        get.calls,
        [
          [ISingletonParent],
          [IInstance],
          [ISingletonParent],
        ],
        `get.calls`,
      );
    });

    it(`callback registration is reused by the singleton parent`, function () {
      @inject(ICallback)
      class SingletonParent implements ISingletonParent { constructor(public dep: ICallback) {} }
      register(SingletonParent);

      const actual1 = container.get(ISingletonParent);
      assert.instanceOf(actual1, SingletonParent, `actual1`);
      assert.instanceOf(actual1.dep, Callback, `actual1.dep`);

      const actual2 = container.get(ISingletonParent);
      assert.instanceOf(actual2, SingletonParent, `actual2`);
      assert.instanceOf(actual2.dep, Callback, `actual2.dep`);

      assert.strictEqual(actual1, actual2, `actual1`);
      assert.strictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        callback.calls,
        [
          [container, container, container.getResolver(ICallback)],
        ],
        `callback.calls`,
      );

      assert.deepStrictEqual(
        get.calls,
        [
          [ISingletonParent],
          [ICallback],
          [ISingletonParent],
        ],
        `get.calls`,
      );
    });
  });

  describe('instance parent', function () {
    interface IInstanceParent { dep: any; }
    let IInstanceParent: InterfaceSymbol<IInstanceParent>;
    let instanceParent: IInstanceParent;

    function register(cls: any) {
      instanceParent = container.get(cls);
      get.reset();
      IInstanceParent = DI.createInterface<IInstanceParent>('IInstanceParent').withDefault(x => x.instance(instanceParent));
    }

    it(`transient registration is reused by the instance parent`, function () {
      @inject(ITransient)
      class InstanceParent implements IInstanceParent { constructor(public dep: ITransient) {} }
      register(InstanceParent);

      const actual1 = container.get(IInstanceParent);
      assert.instanceOf(actual1, InstanceParent, `actual1`);
      assert.instanceOf(actual1.dep, Transient, `actual1.dep`);

      const actual2 = container.get(IInstanceParent);
      assert.instanceOf(actual2, InstanceParent, `actual2`);
      assert.instanceOf(actual2.dep, Transient, `actual2.dep`);

      assert.strictEqual(actual1, actual2, `actual1`);

      assert.strictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        get.calls,
        [
          [IInstanceParent],
          [IInstanceParent],
        ],
        `get.calls`,
      );
    });

    it(`singleton registration is reused by the instance parent`, function () {
      @inject(ISingleton)
      class InstanceParent implements IInstanceParent { constructor(public dep: ISingleton) {} }
      register(InstanceParent);

      const actual1 = container.get(IInstanceParent);
      assert.instanceOf(actual1, InstanceParent, `actual1`);
      assert.instanceOf(actual1.dep, Singleton, `actual1.dep`);

      const actual2 = container.get(IInstanceParent);
      assert.instanceOf(actual2, InstanceParent, `actual2`);
      assert.instanceOf(actual2.dep, Singleton, `actual2.dep`);

      assert.strictEqual(actual1, actual2, `actual1`);

      assert.strictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        get.calls,
        [
          [IInstanceParent],
          [IInstanceParent],
        ],
        `get.calls`,
      );
    });

    it(`instance registration is reused by the instance parent`, function () {
      @inject(IInstance)
      class InstanceParent implements IInstanceParent { constructor(public dep: IInstance) {} }
      register(InstanceParent);

      const actual1 = container.get(IInstanceParent);
      assert.instanceOf(actual1, InstanceParent, `actual1`);
      assert.instanceOf(actual1.dep, Instance, `actual1.dep`);

      const actual2 = container.get(IInstanceParent);
      assert.instanceOf(actual2, InstanceParent, `actual2`);
      assert.instanceOf(actual2.dep, Instance, `actual2.dep`);

      assert.strictEqual(actual1, actual2, `actual1`);

      assert.strictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        get.calls,
        [
          [IInstanceParent],
          [IInstanceParent],
        ],
        `get.calls`,
      );
    });

    it(`callback registration is reused by the instance parent`, function () {
      @inject(ICallback)
      class InstanceParent implements IInstanceParent { constructor(public dep: ICallback) {} }
      register(InstanceParent);

      const actual1 = container.get(IInstanceParent);
      assert.instanceOf(actual1, InstanceParent, `actual1`);
      assert.instanceOf(actual1.dep, Callback, `actual1.dep`);

      const actual2 = container.get(IInstanceParent);
      assert.instanceOf(actual2, InstanceParent, `actual2`);
      assert.instanceOf(actual2.dep, Callback, `actual2.dep`);

      assert.strictEqual(actual1, actual2, `actual1`);
      assert.strictEqual(actual1.dep, actual2.dep, `actual1.dep`);

      assert.deepStrictEqual(
        callback.calls,
        [
          [container, container, container.getResolver(ICallback)],
        ],
        `callback.calls`,
      );

      assert.deepStrictEqual(
        get.calls,
        [
          [IInstanceParent],
          [IInstanceParent],
        ],
        `get.calls`,
      );
    });
  });
});

describe('defer registration', () => {
  class FakeCSSService {
    constructor(public data: any) {}
  }

  class FakeCSSHandler {
    public register(container: IContainer, data) {
      container.register(
        Registration.instance(
          FakeCSSService,
          new FakeCSSService(data)
        )
      );
    }
  }

  it(`enables the handler class to provide registrations for data`, () => {
    const container = DI.createContainer();
    const data = {};

    container.register(
      Registration.singleton('.css', FakeCSSHandler)
    );

    container.register(
      Registration.defer('.css', data)
    );

    const service = container.get(FakeCSSService);

    assert.strictEqual(service.data, data);
  });

  it(`passes the params to the container's register method if no handler is found`, () => {
    const container = DI.createContainer();
    const data = {
      wasCalled: false,
      register() {
        this.wasCalled = true;
      }
    };

    container.register(
      Registration.defer('.css', data)
    );

    assert.strictEqual(data.wasCalled, true);
  });

  [
    {
      name: 'string',
      value: 'some string value'
    },
    {
      name: 'boolean',
      value: true
    },
    {
      name: 'number',
      value: 42
    }
  ].forEach(x => {
    it (`does not pass ${x.name} params to the container's register when no handler is found`, () => {
      const container = DI.createContainer();
      container.register(
        Registration.defer('.css', x.value)
      );
    });
  });
});
