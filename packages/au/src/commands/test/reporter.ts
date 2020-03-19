import {
  ILogger,
  format,
} from '@aurelia/kernel';
import {
  ITAPChannel,
  TAPLine,
  TAPTestPoint,
  TAPLineKind,
} from '@aurelia/testing';
import {
  IProcess,
} from '@aurelia/runtime-node';
import {
  ITask,
  IScheduler,
} from '@aurelia/runtime';

import {
  Terminal,
} from '../../terminal';

export class PerTestLineReporter implements ITAPChannel {
  public constructor(
    @ILogger
    private readonly logger: ILogger,
  ) { }

  public send(line: TAPLine): void {
    this.logger.info(line.toString());
  }
}

function toTestResult(tp: TAPTestPoint): TestResult {
  const directive = tp.directive;
  if (tp.ok) {
    return TestResult.ok;
  } else if (directive === void 0) {
    return TestResult.notOk;
  } else if (directive.type === 'SKIP') {
    return TestResult.skip;
  } else if (directive.type === 'TODO') {
    return TestResult.todo;
  }
  return TestResult.none;
}

export class ProgressReporter implements ITAPChannel {
  private readonly bar: ProgressBar = new ProgressBar();
  private readonly terminal: Terminal;
  private running: boolean = false;
  private task: ITask | null = null;

  public constructor(
    @ILogger
    private readonly logger: ILogger,
    @IProcess proc: IProcess,
    @IScheduler private readonly scheduler: IScheduler,
  ) {
    this.terminal = new Terminal(proc.stdout);
  }

  public send(line: TAPLine): void {
    const bar = this.bar;

    switch (line.kind) {
      case TAPLineKind.testPoint: {
        bar.results.add(toTestResult(line));

        if (line.number === bar.results.totalCount - 1) {
          this.stop();
        }
        break;
      }
      case TAPLineKind.plan: {
        bar.results.totalCount = line.end - line.start;
        this.start();
        break;
      }
      case TAPLineKind.comment: {

        break;
      }
      case TAPLineKind.bailOut: {

        break;
      }
    }
  }

  public start(): void {
    if (this.running) {
      return;
    }
    this.running = true;

    this.terminal.start();
    this.task = this.scheduler.queueIdleTask(
      () => this.renderProgress(),
      {
        persistent: true,
      },
    );
  }

  public stop(): void {
    if (!this.running) {
      return;
    }
    this.running = false;

    this.task!.cancel();
    this.task = null;
    this.terminal.stop();

    const counters = this.bar.results.counters;

    if (counters.highestResultType === TestResult.notOk) {
      process.exitCode = 1;
    }

    this.reportOutcome(counters[TestResult.notOk], 'Failed', 'green', 'red');
    this.reportOutcome(counters[TestResult.ok], 'Passed', 'red', 'green');
    this.reportOutcome(counters[TestResult.skip], 'Skipped', 'green', 'yellow');
    this.reportOutcome(counters[TestResult.todo], 'Todo', 'green', 'yellow');

    this.bar.reset();
  }

  private reportOutcome(
    count: number,
    label: string,
    colorIfZero: keyof typeof format,
    colorIfNonZero: keyof typeof format,
  ): void {
    this.terminal.writeLine(format[count === 0 ? colorIfZero : colorIfNonZero](`${label}: ${count}`));
  }

  private renderProgress(): void {
    this.terminal.updateCurrentLine(this.bar.render());
  }
}

export const enum TestResult {
  none  = 0,
  ok    = 1,
  skip  = 2,
  todo  = 3,
  notOk = 4,
}

export class FormatStrings {
  public [TestResult.none]: string;
  public [TestResult.ok]: string;
  public [TestResult.skip]: string;
  public [TestResult.todo]: string;
  public [TestResult.notOk]: string;

  public constructor(
    public prefix: string = '[',
    public suffix: string = ']',
    none: string = format.grey('-'),
    ok: string = format.green('='),
    skip: string = format.yellow('='),
    todo: string = format.yellow('='),
    notOk: string = format.red('='),
  ) {
    this[TestResult.none] = none;
    this[TestResult.ok] = ok;
    this[TestResult.skip] = skip;
    this[TestResult.todo] = todo;
    this[TestResult.notOk] = notOk;
  }
}

export class TestResultCounters {
  public [TestResult.none]: number = 0;
  public [TestResult.ok]: number = 0;
  public [TestResult.skip]: number = 0;
  public [TestResult.todo]: number = 0;
  public [TestResult.notOk]: number = 0;

  public get highestResultType(): TestResult {
    if (this[TestResult.notOk] > 0) {
      return TestResult.notOk;
    }

    if (this[TestResult.todo] > 0) {
      return TestResult.todo;
    }

    if (this[TestResult.skip] > 0) {
      return TestResult.skip;
    }

    if (this[TestResult.ok] > 0) {
      return TestResult.ok;
    }

    return TestResult.none;
  }

  public increment(result: TestResult): void {
    ++this[result];
  }

  public reset(): void {
    this[TestResult.notOk] = 0;
    this[TestResult.todo] = 0;
    this[TestResult.skip] = 0;
    this[TestResult.ok] = 0;
    this[TestResult.none] = 0;
  }
}

export class TestResults {
  public readonly counters: TestResultCounters = new TestResultCounters();
  public readonly list: TestResult[];

  private count: number = 0;
  private _totalCount: number;
  public get totalCount(): number {
    return this._totalCount;
  }
  public set totalCount(value: number) {
    this._totalCount = value;

    const results = this.list;
    if (results.length < value) {
      const len = results.length;
      results.length = value;
      results.fill(TestResult.none, len, value);
    }
  }

  public constructor(
    totalCount: number = 0,
  ) {
    this._totalCount = totalCount;
    this.list = Array(totalCount).fill(TestResult.none);
  }

  public add(result: TestResult): void {
    this.list[this.count] = result;
    ++this.counters[result];

    if (++this.count > this._totalCount) {
      this._totalCount = this.count;
    }
  }

  public reset(): void {
    this.counters.reset();
    this.list.length = 0;
    this.count = 0;
    this._totalCount = 0;
  }
}

export class ProgressBar {
  public readonly counters: TestResultCounters = new TestResultCounters();
  public readonly results: TestResults = new TestResults();

  public constructor(
    public width: number = 40,
    public formatStrings: FormatStrings = new FormatStrings(),
  ) {}

  public render(): string {
    const strings = this.formatStrings;
    const results = this.results;
    const width = this.width;
    const total = results.totalCount;
    const buffer = Array<string>(width).fill('');
    const chunkSize = total / width;
    let nextChunk = chunkSize | 0;
    let cursor = 0;

    const counters = new TestResultCounters();

    for (let i = 0; i < total; ++i) {
      ++counters[results.list[i]];

      if (i === nextChunk) {
        buffer[cursor] = strings[counters.highestResultType];
        counters.reset();

        nextChunk = (chunkSize * (++cursor + 1)) | 0;
      }
    }

    return `${strings.prefix}${buffer.join('')}${strings.suffix}`;
  }

  public reset(): void {
    this.counters.reset();
    this.results.reset();
  }
}
