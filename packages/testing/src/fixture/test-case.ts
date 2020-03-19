import {
  ILogger,
  IContainer,
  Constructable,
  Registration,
  PLATFORM,
  LogLevel,
} from '@aurelia/kernel';
import {
  TestClass,
  TestMethod,
  TestMethodDataStrategy,
} from './decorators';
import {
  ITAPChannel,
  TAPLine,
  TAPOutput,
  TAPBailOut,
  TAPPlan,
  TAPTestPoint,
} from '../tap';

export type TestInvocation = (...args: readonly unknown[]) => unknown;
export type InvocableInstance = { [key: string]: TestInvocation };

export const enum TestState {
  pending = 1,
  running = 2,
  passed = 3,
  failed = 4,
  canceled = 5,
}

const $TestState = {
  [TestState.pending]: 'pending',
  [TestState.running]: 'running',
  [TestState.passed]: 'passed',
  [TestState.failed]: 'failed',
  [TestState.canceled]: 'canceled',
} as const;

export class TestCase {
  private _state: TestState = TestState.pending;
  private _startTime: number = 0;
  private _endTime: number = 0;
  private _error: unknown = void 0;

  public get state(): TestState {
    return this._state;
  }
  public get startTime(): number {
    return this._startTime;
  }
  public get endTime(): number {
    return this._endTime;
  }
  public get error(): unknown {
    return this._error;
  }

  public constructor(
    private readonly logger: ILogger,
    private readonly disposable: boolean,
    public readonly testMethod: TestMethod,
    public params: undefined | readonly unknown[],
  ) {}

  public async run(instance: InvocableInstance, output: TAPOutput): Promise<void> {
    if (this.state !== TestState.pending) {
      throw new Error(`Cannot run test in ${$TestState[this.state]} state`);
    }

    this._state = TestState.running;
    this._startTime = PLATFORM.now();
    const testMethod = this.testMethod;
    const key = testMethod.key;
    const params = this.params;

    try {
      if (params === void 0) {
        await instance[key as string]();
      } else {
        await instance[key as string](...params);
      }

      if (this.disposable) {
        instance.dispose();
      }

      this._state = TestState.passed;
      if (this.logger.config.level <= LogLevel.debug) {
        this.logger.debug(`${String(key)} PASS`);
      }
      output.addTestPoint(new TAPTestPoint(true, void 0, String(key))).flush();
    } catch (err) {
      this._error = err;
      this._state = TestState.failed;
      this.logger.error(err);
      this.logger.info(`${String(key)} FAIL`);
      output.addTestPoint(new TAPTestPoint(false, void 0, String(key))).addComment(err.message).flush();
    }

    this._endTime = PLATFORM.now();
  }
}

export class TestSuite {
  public readonly cases: TestCase[] = [];

  private _state: TestState = TestState.pending;
  private _startTime: number = 0;
  private _endTime: number = 0;

  public get state(): TestState {
    return this._state;
  }
  public get startTime(): number {
    return this._startTime;
  }
  public get endTime(): number {
    return this._endTime;
  }

  public constructor(
    private readonly logger: ILogger,
    private readonly container: IContainer,
    private readonly testClass: TestClass,
  ) {}

  public async run(output: TAPOutput): Promise<void> {
    if (this.state !== TestState.pending) {
      const msg = `Cannot run suite in ${$TestState[this.state]} state`;
      output.setBailOut(new TAPBailOut(msg)).flush();
      throw new Error(`Cannot run suite in ${$TestState[this.state]} state`);
    }

    this._state = TestState.running;
    this._startTime = PLATFORM.now();

    const Type = this.testClass.Type;
    const container = this.container;
    const cases = this.cases;
    for (let i = 0, ii = cases.length; i < ii; ++i) {
      const instance = container.get<InvocableInstance>(Type);
      // eslint-disable-next-line no-await-in-loop
      await cases[i].run(instance, output);
    }

    this._endTime = PLATFORM.now();
  }
}

export class TestResult {
  public constructor(
    public readonly code: number,
    public readonly key: string,
    public readonly data: unknown,
  ) {}

  public static parse(json: string): TestResult {
    const { code, key, data } = JSON.parse(json) as TestResult;
    return new TestResult(code, key, data);
  }
}

export class WebSocketTAPChannel implements ITAPChannel {
  public constructor(
    private readonly ws: WebSocket,
  ) {}

  public send(item: TAPLine): void {
    this.ws.send(item.toString());
  }
}

export class TestRunner {
  public readonly suites: TestSuite[] = [];
  public caseCount: number = 0;
  private length: number = 0;
  private ws!: WebSocket;

  public constructor(
    @ILogger
    private readonly logger: ILogger,
    @IContainer
    private readonly container: IContainer,
  ) {}

  public register(...classes: readonly Constructable[]): this {
    const suites = this.suites;
    const container = this.container;
    const logger = this.logger;
    for (let iClass = 0, iiClass = classes.length; iClass < iiClass; ++iClass) {
      const Type = classes[iClass];
      const disposable = 'dispose' in Type.prototype;
      Registration.transient(Type, Type).register(container);

      const testClass = TestClass.getOrCreate(Type);
      const suite = suites[this.length++] = new TestSuite(logger, container, testClass);
      const cases = suite.cases;
      const methods = testClass.methods;

      for (let iMethod = 0, iiMethod = methods.length; iMethod < iiMethod; ++iMethod) {
        const testMethod = methods[iMethod];
        const parameters = testMethod.parameters;

        if (parameters.length > 0) {
          switch (testMethod.dataStrategy) {
            case TestMethodDataStrategy.inline: {
              const firstParam = parameters[0];
              const data = firstParam.data;

              if (data !== void 0 && data.length > 0) {
                for (let iData = 0, iiData = data.length; iData < iiData; ++iData) {
                  const paramData = Array(parameters.length);
                  for (let iParam = 0, iiParam = parameters.length; iParam < iiParam; ++iParam) {
                    paramData[iParam] = parameters[iParam].data![iData];
                  }
                  cases[cases.length++] = new TestCase(logger, disposable, testMethod, paramData);
                  ++this.caseCount;
                }

                continue;
              }

              break;
            }
            case TestMethodDataStrategy.combi: {
              const paramDataLists = parameters.reduce((a, b) => a.flatMap(x => b.data!.map(y => [...x, y])), [[]] as unknown[][]);
              for (let iList = 0, iiList = paramDataLists.length; iList < iiList; ++iList) {
                const paramData = paramDataLists[iList];
                cases[cases.length++] = new TestCase(logger, disposable, testMethod, paramData);
                ++this.caseCount;
              }

              continue;
            }
          }
        }

        cases[cases.length++] = new TestCase(logger, disposable, testMethod, void 0);
        ++this.caseCount;
      }
    }
    return this;
  }

  public async start(): Promise<void> {
    if (this.length === 0) {
      throw new Error(`No test cases registered`);
    }

    this.ws = new WebSocket(`ws://${window.location.host}`);
    return new Promise(resolve => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.ws.addEventListener('open', async () => {
        await this.runTests();
        resolve();
      });
      this.ws.addEventListener('message', e => {
        switch (e.data) {
          case 'refresh':
            window.location.reload();
            break;
        }
      });
    });
  }

  private async runTests(): Promise<void> {
    const startTime = PLATFORM.now();
    this.logger.info(`Starting to run ${this.caseCount} test cases`);
    const channel = new WebSocketTAPChannel(this.ws);
    const output = new TAPOutput(channel).setPlan(new TAPPlan(1, this.caseCount)).flush();
    const suites = this.suites;
    for (let i = 0, ii = suites.length; i < ii; ++i) {
      // eslint-disable-next-line no-await-in-loop
      await suites[i].run(output);
    }
    const endTime = PLATFORM.now();
    this.logger.info(`Finished running ${this.caseCount} test cases in ${Math.round((endTime - startTime) * 10) / 10}ms`);
  }
}
