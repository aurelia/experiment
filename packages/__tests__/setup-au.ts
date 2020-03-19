import { DI, LoggerConfiguration, LogLevel } from '@aurelia/kernel';
import { TestRunner } from '@aurelia/testing';

import { RelativeToFileTests, JoinTests, QueryStringTests } from './1-kernel/path.spec';
import { ExpressionParserTests } from './4-jit/expression-parser.spec';
import { AttributePatternTests } from './4-jit/attribute-pattern.spec';

DI.createContainer()
  .register(LoggerConfiguration.create(console, LogLevel.debug))
  .get(TestRunner)
  .register(
    RelativeToFileTests,
    JoinTests,
    QueryStringTests,
    ExpressionParserTests,
    AttributePatternTests,
  ).start();
