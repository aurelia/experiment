import { Constructable, PLATFORM } from '@aurelia/kernel';

const emptyArray = PLATFORM.emptyArray;

export function fact(): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor): void {
    const Type = target.constructor as Constructable;
    TestMethod.getOrCreate(Type, key);
  };
}

export function inlineData(...paramLists: readonly (readonly unknown[])[]): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor): void {
    const Type = target.constructor as Constructable;
    const testMethod = TestMethod.getOrCreate(Type, key);
    switch (testMethod.dataStrategy) {
      case TestMethodDataStrategy.none:
        testMethod.dataStrategy = TestMethodDataStrategy.inline;
        break;
      case TestMethodDataStrategy.inline:
        break;
      case TestMethodDataStrategy.combi:
        throw new Error(`Cannot combine method-level inlineData with parameter-level inlineData. Please pick one or the other for a given test method.`);
    }

    const testParameters = testMethod.parameters;
    for (let i = 0, ii = testParameters.length; i < ii; ++i) {
      let testParameter = testParameters[i];
      if (testParameter === void 0) {
        testParameter = testParameters[i] = new TestParameter(testMethod, i);
      }
      let data = testParameter.data;
      if (data === void 0) {
        data = testParameter.data = Array(paramLists.length);
      }
      for (let j = 0, jj = paramLists.length; j < jj; ++j) {
        const paramList = paramLists[j];
        data[j] = paramList[i];
      }
    }
  };
}

export function combiData(...items: readonly unknown[]): ParameterDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Object, key: string | symbol, index: number): void {
    const Type = target.constructor as Constructable;
    const testMethod = TestMethod.getOrCreate(Type, key);
    switch (testMethod.dataStrategy) {
      case TestMethodDataStrategy.none:
        testMethod.dataStrategy = TestMethodDataStrategy.combi;
        break;
      case TestMethodDataStrategy.combi:
        break;
      case TestMethodDataStrategy.inline:
        throw new Error(`Cannot combine method-level inlineData with parameter-level inlineData. Please pick one or the other for a given test method.`);
    }

    const testParameters = testMethod.parameters;
    let testParameter = testParameters[index];
    if (testParameter === void 0) {
      testParameter = testParameters[index] = new TestParameter(testMethod, index);
    }
    testParameter.data = items.slice();
  };
}

const testClassLookup = new WeakMap<Constructable, TestClass>();

export class TestClass {
  public readonly methods: TestMethod[] = [];
  public readonly methodIndices: Map<PropertyKey, number> = new Map();

  public constructor(
    public readonly Type: Constructable,
  ) {}

  public static getOrCreate(
    Type: Constructable,
  ): TestClass {
    let testClass = testClassLookup.get(Type);
    if (testClass === void 0) {
      testClassLookup.set(Type, testClass = new TestClass(Type));
    }
    return testClass;
  }
}

export const enum TestMethodDataStrategy {
  none = 0,
  inline = 1,
  combi = 2,
}

export class TestMethod {
  public readonly parameters: TestParameter[];
  public dataStrategy: TestMethodDataStrategy = TestMethodDataStrategy.none;

  public constructor(
    public readonly parent: TestClass,
    public readonly key: PropertyKey,
    public readonly descriptor: PropertyDescriptor,
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const length = (descriptor.value as Function).length;
    this.parameters = length === 0 ? emptyArray : Array(length);
  }

  public static getOrCreate(
    Type: Constructable,
    key: PropertyKey,
  ): TestMethod {
    const testClass = TestClass.getOrCreate(Type);

    const methodIndices = testClass.methodIndices;
    const methods = testClass.methods;
    let methodIdx = methodIndices.get(key);
    if (methodIdx === void 0) {
      const descriptor = Object.getOwnPropertyDescriptor(Type.prototype, key);
      if (descriptor === void 0) {
        throw new Error(`No method named ${String(key)} exists on type ${Type.name}`);
      }

      if (typeof descriptor.value !== 'function') {
        throw new Error(`${Type.name}#${String(key)} is not a function`);
      }

      methodIndices.set(key, methodIdx = methods.length);
      return methods[methodIdx] = new TestMethod(testClass, key, descriptor);
    }

    return methods[methodIdx];
  }
}

export class TestParameter {
  public data: unknown[] | undefined = void 0;

  public constructor(
    public readonly parent: TestMethod,
    public readonly idx: number,
  ) {}

  public static getOrCreate(
    Type: Constructable,
    key: PropertyKey,
    idx: number,
  ): TestParameter {
    const testMethod = TestMethod.getOrCreate(Type, key);

    const parameters = testMethod.parameters;
    let parameter = parameters[idx];
    if (parameter === void 0) {
      parameter = parameters[idx] = new TestParameter(testMethod, idx);
    }

    return parameter;
  }
}
