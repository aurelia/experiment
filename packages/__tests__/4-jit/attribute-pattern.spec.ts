/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { DI, Constructable } from '@aurelia/kernel';
import {
  attributePattern,
  AttributePatternDefinition,
  IAttributePattern,
  ISyntaxInterpreter,
  AttributePattern
} from '@aurelia/jit';
import { assert, fact, combiData } from '@aurelia/testing';

export class AttributePatternTests {
  @fact() 'PART.PART'(
    @combiData(
      ['value.bind',  'PART.PART', ['value', 'bind']],
      ['.bind',       null,        []],
      ['bind',        null,        []],
      ['value.',      null,        []],
      ['value',       null,        []],
      ['.',           null,        []],
    ) [value, match, values]: [string, string, string[]],
  ) {
    this.runTest(
      [
        { pattern: 'PART.PART', symbols: '.' }
      ],
      value,
      match,
      values,
    );
  }

  @fact() 'PART.PART + asdf.PART + PART.asdf'(
    @combiData(
      ['value.bind', 'PART.PART',  ['value', 'bind']],
      ['.bind',       null,        []],
      ['bind',        null,        []],
      ['value.',      null,        []],
      ['value',       null,        []],
      ['.',           null,        []]
    ) [value, match, values]: [string, string, string[]],
  ) {
    this.runTest(
      [
        { pattern: 'PART.PART', symbols: '.' },
        { pattern: 'asdf.PART', symbols: '.' },
        { pattern: 'PART.asdf', symbols: '.' }
      ],
      value,
      match,
      values,
    );
  }

  @fact() 'PART.PART + :PART'(
    @combiData(
      ['value.bind',  'PART.PART',    ['value', 'bind']],
      [':.:',         'PART.PART',    [':', ':']],
      [':value.bind', 'PART.PART',    [':value', 'bind']],
      ['value.bind:', 'PART.PART',    ['value', 'bind:']],
      [':value',      ':PART',        ['value']],
      [':.',          ':PART',        ['.']],
      [':value.',     ':PART',        ['value.']],
      ['.bind',       null,           []],
      ['bind',        null,           []],
      ['value.',      null,           []],
      ['value',       null,           []],
      ['value:',      null,           []],
      ['.',           null,           []],
      [':',           null,           []],
      ['::',          null,           []],
      ['..',          null,           []],
      ['.:',          null,           []],
      ['.value:',     null,           []],
      ['value:bind',  null,           []],
    ) [value, match, values]: [string, string, string[]],
  ) {
    this.runTest(
      [
        { pattern: 'PART.PART', symbols: '.' },
        { pattern: ':PART', symbols: ':' }
      ],
      value,
      match,
      values,
    );
  }

  @fact() 'PART.PART + @PART'(
    @combiData(
      ['value.bind',  'PART.PART',    ['value', 'bind']],
      ['@.@',         'PART.PART',    ['@', '@']],
      ['@value.bind', 'PART.PART',    ['@value', 'bind']],
      ['value.bind@', 'PART.PART',    ['value', 'bind@']],
      ['@value',      '@PART',        ['value']],
      ['@.',          '@PART',        ['.']],
      ['@value.',     '@PART',        ['value.']],
      ['.bind',       null,           []],
      ['bind',        null,           []],
      ['value.',      null,           []],
      ['value',       null,           []],
      ['value@',      null,           []],
      ['.',           null,           []],
      ['@',           null,           []],
      ['@@',          null,           []],
      ['..',          null,           []],
      ['.@',          null,           []],
      ['.value@',     null,           []],
      ['value@bind',  null,           []],
    ) [value, match, values]: [string, string, string[]],
  ) {
    this.runTest(
      [
        { pattern: 'PART.PART', symbols: '.' },
        { pattern: '@PART', symbols: '@' },
      ],
      value,
      match,
      values,
    );
  }

  @fact() 'PART.PART + :PART + @PART'(
    @combiData(
      ['value.bind',   'PART.PART',    ['value', 'bind']],
      [':value',       ':PART',        ['value']],
      ['@value',       '@PART',        ['value']],
      [':.:',          'PART.PART',    [':', ':']],
      ['@.@',          'PART.PART',    ['@', '@']],
      [':value.bind',  'PART.PART',    [':value', 'bind']],
      ['@value.bind',  'PART.PART',    ['@value', 'bind']],
      ['@:value.bind', 'PART.PART',    ['@:value', 'bind']],
      [':@value.bind', 'PART.PART',    [':@value', 'bind']],
      ['@:value',      '@PART',        [':value']],
      [':@value',      ':PART',        ['@value']],
      ['value.bind:',  'PART.PART',    ['value', 'bind:']],
      ['value.bind@',  'PART.PART',    ['value', 'bind@']],
      [':value',       ':PART',        ['value']],
      ['@value',       '@PART',        ['value']],
      [':.',           ':PART',        ['.']],
      ['@.',           '@PART',        ['.']],
      [':value.',      ':PART',        ['value.']],
      ['@value.',      '@PART',        ['value.']],
      ['.bind',        null,           []],
      ['bind',         null,           []],
      ['value.',       null,           []],
      ['value',        null,           []],
      ['value:',       null,           []],
      ['value@',       null,           []],
      ['.',            null,           []],
      ['..',           null,           []],
      [':',            null,           []],
      ['@',            null,           []],
      ['::',           null,           []],
      ['@@',           null,           []],
      ['.:',           null,           []],
      ['.@',           null,           []],
      ['.value:',      null,           []],
      ['.value@',      null,           []],
      ['value:bind',   null,           []],
      ['value@bind',   null,           []],
    ) [value, match, values]: [string, string, string[]],
  ) {
    this.runTest(
      [
        { pattern: 'PART.PART', symbols: '.' },
        { pattern: '@PART', symbols: '@' },
        { pattern: ':PART', symbols: ':' },
      ],
      value,
      match,
      values,
    );
  }

  private runTest(
    defs: AttributePatternDefinition[],
    value: string,
    match: string,
    values: string[],
  ) {
    let receivedRawName: string;
    let receivedRawValue: string;
    let receivedParts: string[];
    @attributePattern(...defs)
    class ThePattern {}
    for (const { pattern } of defs) {
      ThePattern.prototype[pattern] = (rawName, rawValue, parts) => {
        receivedRawName = rawName;
        receivedRawValue = rawValue;
        receivedParts = parts;
      };
    }
    const container = DI.createContainer();
    container.register(ThePattern);
    const interpreter = container.get(ISyntaxInterpreter);
    const attrPattern = container.get(IAttributePattern);
    const patternDefs = AttributePattern.getPatternDefinitions(attrPattern.constructor as Constructable);
    interpreter.add(patternDefs);

    const result = interpreter.interpret(value);
    if (match != null) {
      assert.strictEqual(
        patternDefs.map(d => d.pattern).includes(result.pattern),
        true,
        `patternDefs.map(d => d.pattern).indexOf(result.pattern) >= 0`
      );
      attrPattern[result.pattern](value, 'foo', result.parts);
      assert.strictEqual(receivedRawName, value, `receivedRawName`);
      assert.strictEqual(receivedRawValue, 'foo', `receivedRawValue`);
      assert.deepStrictEqual(receivedParts, result.parts, `receivedParts`);
    } else {
      assert.strictEqual(
        !patternDefs.map(d => d.pattern).includes(result.pattern),
        true,
        `patternDefs.map(d => d.pattern).indexOf(result.pattern) === -1`
      );
    }

    assert.deepStrictEqual(result.parts, values, `result.parts`);
  }
}
