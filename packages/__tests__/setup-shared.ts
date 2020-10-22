import { RuntimeHtmlConfiguration } from '@aurelia/runtime-html';
import { Scheduler } from '@aurelia/scheduler';
import { assert, ensureSchedulerEmpty, HTMLTestContext, TestContext } from '@aurelia/testing';

interface ExtendedSuite extends Mocha.Suite {
  $duration?: number;
}

function getRootSuite(suite: ExtendedSuite): ExtendedSuite {
  while (!suite.parent.root) {
    suite = suite.parent;
  }
  return suite;
}

export function $setup($window: Window & typeof globalThis) {
  const ctx = (TestContext.createHTMLTestContext = function () {
    return HTMLTestContext.create(RuntimeHtmlConfiguration, $window);
  })();
  Scheduler.set(globalThis, ctx.scheduler);
  const platform = ctx.platform;
  const globalStart = platform.performanceNow();
  let firstTestStart = 0;

  let currentRootSuite: ExtendedSuite = (void 0)!;
  let currentSuite: ExtendedSuite = (void 0)!;
  let start: number;

  // eslint-disable-next-line
  beforeEach(function() {
    start = platform.performanceNow();
    if (firstTestStart === 0) {
      firstTestStart = start;
      console.log(`Test initialization took ${Math.round(firstTestStart - globalStart)}ms`);
    }
    const totalElapsed = start - firstTestStart;
    const ts = new Date(totalElapsed).toISOString().slice(14, -1);

    const title = this.currentTest!.fullTitle();
    if (title.length > 1000) {
      console.log(`[${ts}] Super long title! "${title.slice(0, 1000)}...(+${title.length - 1000})"`);
    }
    const nextSuite = this.currentTest!.parent as ExtendedSuite;
    if (currentSuite !== nextSuite) {
      if (currentSuite !== void 0) {
        const duration = currentSuite.$duration;
        const total = currentSuite.total();
        const perTest = duration / total;
        if (perTest > 20) {
          console.log(`[${ts}] slow: ${String(total).padStart(5, ' ')} tests after ${String(Math.round(duration)).padStart(5, ' ')}ms (${String(Math.round(perTest)).padStart(3, ' ')}ms/test): "${currentSuite.fullTitle()}"`);
        }
      }
      currentSuite = nextSuite;
    }
    const nextRootSuite = getRootSuite(nextSuite);
    if (currentRootSuite !== nextRootSuite) {
      console.log(`[${ts}] > ${String(nextRootSuite.total()).padStart(5, ' ')} tests in "${nextRootSuite.fullTitle()}"`);
      currentRootSuite = nextRootSuite;
    }
  });

  // eslint-disable-next-line
  afterEach(function() {
    const elapsed = platform.performanceNow() - start;
    let suite = currentSuite;
    do {
      suite.$duration = (suite.$duration || 0) + elapsed;
      suite = suite.parent;
    } while (suite);
    try {
      assert.isSchedulerEmpty();
    } catch (ex) {
      ensureSchedulerEmpty();
      throw ex;
    }
  });
}