/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import {
  AccessKeyedExpression,
  AccessMemberExpression,
  AccessScopeExpression,
  AccessThisExpression,
  ArrayBindingPattern,
  ArrayLiteralExpression,
  AssignExpression,
  BinaryExpression,
  BinaryOperator,
  BindingBehaviorExpression,
  BindingIdentifier,
  BindingType,
  CallFunctionExpression,
  CallMemberExpression,
  CallScopeExpression,
  ConditionalExpression,
  ExpressionKind,
  ForOfStatement,
  Interpolation,
  ObjectBindingPattern,
  ObjectLiteralExpression,
  PrimitiveLiteralExpression,
  TaggedTemplateExpression,
  TemplateExpression,
  UnaryExpression,
  ValueConverterExpression,
  IsLeftHandSide,
  IsAssign
} from '@aurelia/runtime';
import {
  Access,
  Precedence,
  parseExpression,
  parse,
  ParserState
} from '@aurelia/jit';
import { assert, fact, combiData } from '@aurelia/testing';
import {
  latin1IdentifierPartChars,
  latin1IdentifierStartChars,
  otherBMPIdentifierPartChars
} from './unicode';

function createTaggedTemplate(cooked: string[], func: IsLeftHandSide, expressions?: readonly IsAssign[]): TaggedTemplateExpression {
  return new TaggedTemplateExpression(cooked, cooked, func, expressions);
}

const binaryMultiplicative: BinaryOperator[] = ['*', '%', '/'];
const binaryAdditive: BinaryOperator[] = ['+', '-'];
const binaryRelational: [BinaryOperator, string][] = [
  ['<', '<'],
  ['<=', '<='],
  ['>', '>'],
  ['>=', '>='],
  ['in', ' in '],
  ['instanceof', ' instanceof '],
];
const binaryEquality: BinaryOperator[] = ['==', '!=', '===', '!=='];

const $false = PrimitiveLiteralExpression.$false;
const $true = PrimitiveLiteralExpression.$true;
const $null = PrimitiveLiteralExpression.$null;
const $undefined = PrimitiveLiteralExpression.$undefined;
const $str = PrimitiveLiteralExpression.$empty;
const $tpl = TemplateExpression.$empty;
const $arr = ArrayLiteralExpression.$empty;
const $obj = ObjectLiteralExpression.$empty;
const $this = AccessThisExpression.$this;
const $parent = AccessThisExpression.$parent;

const $a = new AccessScopeExpression('a');
const $b = new AccessScopeExpression('b');
const $c = new AccessScopeExpression('c');
const $num0 = new PrimitiveLiteralExpression(0);
const $num1 = new PrimitiveLiteralExpression(1);

const codes = {
  // SyntaxError
  InvalidExpressionStart: 'Code 100',
  UnconsumedToken: 'Code 101',
  DoubleDot: 'Code 102',
  InvalidMemberExpression: 'Code 103',
  UnexpectedEndOfExpression: 'Code 104',
  ExpectedIdentifier: 'Code 105',
  InvalidForDeclaration: 'Code 106',
  InvalidObjectLiteralPropertyDefinition: 'Code 107',
  UnterminatedQuote: 'Code 108',
  UnterminatedTemplate: 'Code 109',
  MissingExpectedToken: 'Code 110',
  UnexpectedCharacter: 'Code 111',

  // SemanticError
  NotAssignable: 'Code 150',
  UnexpectedForOf: 'Code 151'
};

function bindingTypeToString(bindingType: BindingType): string {
  switch (bindingType) {
    case BindingType.BindCommand:
      return 'BindCommand';
    case BindingType.OneTimeCommand:
      return 'OneTimeCommand';
    case BindingType.ToViewCommand:
      return 'ToViewCommand';
    case BindingType.FromViewCommand:
      return 'FromViewCommand';
    case BindingType.TwoWayCommand:
      return 'TwoWayCommand';
    case BindingType.CallCommand:
      return 'CallCommand';
    case BindingType.CaptureCommand:
      return 'CaptureCommand';
    case BindingType.DelegateCommand:
      return 'DelegateCommand';
    case BindingType.ForCommand:
      return 'ForCommand';
    case BindingType.Interpolation:
      return 'Interpolation';
    case undefined:
      return 'BindCommand';
    default:
      return 'fix your tests fred';
  }
}

function verifyResultOrError(expr: string, expected: any, expectedMsg?: string, bindingType?: BindingType): any {
  let error: Error = null;
  let actual: any = null;
  try {
    actual = parseExpression(expr, bindingType as any);
  } catch (e) {
    error = e;
  }
  if (bindingType === BindingType.Interpolation && !(expected instanceof Interpolation)) {
    if (error != null) {
      throw new Error(`Expected expression "${expr}" with BindingType.${bindingTypeToString(bindingType)} not to throw, but it threw "${error.message}"`);
    }
  } else if (expectedMsg == null) {
    if (error == null) {
      assert.deepStrictEqual(actual, expected);
    } else {
      throw new Error(`Expected expression "${expr}" with BindingType.${bindingTypeToString(bindingType)} parse successfully, but it threw "${error.message}"`);
    }
  } else {
    if (error == null) {
      throw new Error(`Expected expression "${expr}" with BindingType.${bindingTypeToString(bindingType)} to throw "${expectedMsg}", but no error was thrown`);
    } else {
      if (!error.message.startsWith(expectedMsg)) {
        throw new Error(`Expected expression "${expr}" with BindingType.${bindingTypeToString(bindingType)} to throw "${expectedMsg}", but got "${error.message}" instead`);
      }
    }
  }
}

// #region Simple lists

// The goal here is to pre-create arrays of string+ast expression pairs that each represent a unique
// path taken in the expression parser. We're creating them here at the module level simply to speed up
// the tests. They're never modified, so it's safe to reuse the same expression for multiple tests.

// They're called Simple..Lists because we're not creating any combinations / nested expressions yet.
// Instead, these lists will be the inputs for combinations further down below.

// Note: we're more or less following the same ordering here as the tc39 spec description comments;
// those comments (https://tc39.github.io/... in expression-parser.ts) are partial extracts from the spec
// with mostly just omissions; the only modification is the special parsing rules related to AccessThisExpression

// 1. parsePrimaryExpression.this
const AccessThisList: [string, any][] = [
  [`$this`,             $this],
  [`$parent`,           $parent],
  [`$parent.$parent`,   new AccessThisExpression(2)]
];
// 2. parsePrimaryExpression.IdentifierName
const AccessScopeList: [string, any][] = [
  ...AccessThisList.map(([input, expr]) => [`${input}.a`, new AccessScopeExpression('a', expr.ancestor)] as [string, any]),
  [`$this.$parent`,     new AccessScopeExpression('$parent')],
  [`$parent.$this`,     new AccessScopeExpression('$this', 1)],
  [`a`,                 $a]
];
// 3. parsePrimaryExpression.Literal
const SimpleStringLiteralList: [string, any][] = [
  [`''`,                $str],
  [`""`,                $str]
];
const SimpleNumberLiteralList: [string, any][] = [
  [`1`,                 $num1],
  [`1.1`,               new PrimitiveLiteralExpression(1.1)],
  [`.1`,                new PrimitiveLiteralExpression(0.1)],
  [`0.1`,               new PrimitiveLiteralExpression(0.1)]
];
const KeywordPrimitiveLiteralList: [string, any][] = [
  [`undefined`,         $undefined],
  [`null`,              $null],
  [`true`,              $true],
  [`false`,             $false]
];
// concatenation of 3.
const SimplePrimitiveLiteralList: [string, any][] = [
  ...SimpleStringLiteralList,
  ...SimpleNumberLiteralList,
  ...KeywordPrimitiveLiteralList
];

// 4. parsePrimaryExpression.ArrayLiteral
const SimpleArrayLiteralList: [string, any][] = [
  [`[]`,                $arr]
];
// 5. parsePrimaryExpression.ObjectLiteral
const SimpleObjectLiteralList: [string, any][] = [
  [`{}`,                $obj]
];
// 6. parsePrimaryExpression.TemplateLiteral
const SimpleTemplateLiteralList: [string, any][] = [
  [`\`\``,              $tpl],
  [`\`\${a}\``,         new TemplateExpression(['', ''], [$a])]
];
// concatenation of 3., 4., 5., 6.
const SimpleLiteralList: [string, any][] = [
  ...SimplePrimitiveLiteralList,
  ...SimpleTemplateLiteralList,
  ...SimpleArrayLiteralList,
  ...SimpleObjectLiteralList
];
// 7. parsePrimaryExpression.ParenthesizedExpression
// Note: this is simply one of each precedence group, except for Primary because
// parenthesized and primary are already from the same precedence group
const SimpleParenthesizedList: [string, any][] = [
  [`(a[b])`,            new AccessKeyedExpression($a, $b)],
  [`(a.b)`,             new AccessMemberExpression($a, 'b')],
  [`(a\`\`)`,           createTaggedTemplate([''], $a, [])],
  [`($this())`,         new CallFunctionExpression($this, [])],
  [`(a())`,             new CallScopeExpression('a', [])],
  [`(!a)`,              new UnaryExpression('!', $a)],
  [`(a+b)`,             new BinaryExpression('+', $a, $b)],
  [`(a?b:c)`,           new ConditionalExpression($a, $b, new AccessScopeExpression('c'))],
  [`(a=b)`,             new AssignExpression($a, $b)]
];
// concatenation of 1 through 7 (all Primary expressions)
// This forms the group Precedence.Primary
const SimplePrimaryList: [string, any][] = [
  ...AccessThisList,
  ...AccessScopeList,
  ...SimpleLiteralList,
  ...SimpleParenthesizedList
];
// 2. parseMemberExpression.MemberExpression [ AssignmentExpression ]
const SimpleAccessKeyedList: [string, any][] = [
  ...SimplePrimaryList
    .map(([input, expr]) => [`${input}[b]`, new AccessKeyedExpression(expr, $b)] as [string, any])
];
// 3. parseMemberExpression.MemberExpression . IdentifierName
const SimpleAccessMemberList: [string, any][] = [
  ...[...AccessScopeList, ...SimpleLiteralList]
    .map(([input, expr]) => [`${input}.b`, new AccessMemberExpression(expr, 'b')] as [string, any])
];
// 4. parseMemberExpression.MemberExpression TemplateLiteral
const SimpleTaggedTemplateList: [string, any][] = [
  ...SimplePrimaryList
    .map(([input, expr]) => [`${input}\`\``, createTaggedTemplate([''], expr, [])] as [string, any]),

  ...SimplePrimaryList
    .map(([input, expr]) => [`${input}\`\${a}\``, createTaggedTemplate(['', ''], expr, [$a])] as [string, any])
];
// 1. parseCallExpression.MemberExpression Arguments (this one doesn't technically fit the spec here)
const SimpleCallFunctionList: [string, any][] = [
  ...[...AccessThisList, ...SimpleLiteralList]
    .map(([input, expr]) => [`${input}()`, new CallFunctionExpression(expr, [])] as [string, any])
];
// 2. parseCallExpression.MemberExpression Arguments
const SimpleCallScopeList: [string, any][] = [
  ...[...AccessScopeList]
    .map(([input, expr]) => [`${input}()`, new CallScopeExpression(expr.name, [], expr.ancestor)] as [string, any])
];
// 3. parseCallExpression.MemberExpression Arguments
const SimpleCallMemberList: [string, any][] = [
  ...[...AccessScopeList, ...SimpleLiteralList]
    .map(([input, expr]) => [`${input}.b()`, new CallMemberExpression(expr, 'b', [])] as [string, any])
];
// concatenation of 1-3 of MemberExpression and 1-3 of CallExpression
const SimpleLeftHandSideList: [string, any][] = [
  ...SimpleAccessKeyedList,
  ...SimpleAccessMemberList,
  ...SimpleTaggedTemplateList,
  ...SimpleCallFunctionList,
  ...SimpleCallScopeList,
  ...SimpleCallMemberList
];

// concatenation of Primary and Member+CallExpression
// This forms the group Precedence.LeftHandSide
// used only for testing complex UnaryExpression expressions
const SimpleIsLeftHandSideList: [string, any][] = [
  ...SimplePrimaryList,
  ...SimpleLeftHandSideList
];

// same as SimpleIsLeftHandSideList but without $parent and $this (ergo, LeftHandSide according to the actual spec)
const SimpleIsNativeLeftHandSideList: [string, any][] = [
  ...AccessScopeList,
  ...SimpleLiteralList,
  ...SimpleParenthesizedList,
  ...SimpleLeftHandSideList
];

// parseUnaryExpression (this is actually at the top in the parser due to the order in which expressions must be parsed)
const SimpleUnaryList: [string, any][] = [
  [`!$1`, new UnaryExpression('!', new AccessScopeExpression('$1'))],
  [`-$2`, new UnaryExpression('-', new AccessScopeExpression('$2'))],
  [`+$3`, new UnaryExpression('+', new AccessScopeExpression('$3'))],
  [`void $4`, new UnaryExpression('void', new AccessScopeExpression('$4'))],
  [`typeof $5`, new UnaryExpression('typeof', new AccessScopeExpression('$5'))]
];
// concatenation of UnaryExpression + LeftHandSide
// This forms the group Precedence.LeftHandSide and includes Precedence.Unary
const SimpleIsUnaryList: [string, any][] = [
  ...SimpleIsLeftHandSideList,
  ...SimpleUnaryList
];

// This forms the group Precedence.Multiplicative
const SimpleMultiplicativeList: [string, any][] = [
  [`$6*$7`, new BinaryExpression('*', new AccessScopeExpression('$6'), new AccessScopeExpression('$7'))],
  [`$8%$9`, new BinaryExpression('%', new AccessScopeExpression('$8'), new AccessScopeExpression('$9'))],
  [`$10/$11`, new BinaryExpression('/', new AccessScopeExpression('$10'), new AccessScopeExpression('$11'))]
];
const SimpleIsMultiplicativeList: [string, any][] = [
  ...SimpleIsUnaryList,
  ...SimpleMultiplicativeList
];

// This forms the group Precedence.Additive
const SimpleAdditiveList: [string, any][] = [
  [`$12+$13`, new BinaryExpression('+', new AccessScopeExpression('$12'), new AccessScopeExpression('$13'))],
  [`$14-$15`, new BinaryExpression('-', new AccessScopeExpression('$14'), new AccessScopeExpression('$15'))]
];
const SimpleIsAdditiveList: [string, any][] = [
  ...SimpleIsMultiplicativeList,
  ...SimpleAdditiveList
];

// This forms the group Precedence.Relational
const SimpleRelationalList: [string, any][] = [
  [`$16<$17`, new BinaryExpression('<', new AccessScopeExpression('$16'), new AccessScopeExpression('$17'))],
  [`$18>$19`, new BinaryExpression('>', new AccessScopeExpression('$18'), new AccessScopeExpression('$19'))],
  [`$20<=$21`, new BinaryExpression('<=', new AccessScopeExpression('$20'), new AccessScopeExpression('$21'))],
  [`$22>=$23`, new BinaryExpression('>=', new AccessScopeExpression('$22'), new AccessScopeExpression('$23'))],
  [`$24 in $25`, new BinaryExpression('in', new AccessScopeExpression('$24'), new AccessScopeExpression('$25'))],
  [`$26 instanceof $27`, new BinaryExpression('instanceof', new AccessScopeExpression('$26'), new AccessScopeExpression('$27'))]
];
const SimpleIsRelationalList: [string, any][] = [
  ...SimpleIsAdditiveList,
  ...SimpleRelationalList
];

// This forms the group Precedence.Equality
const SimpleEqualityList: [string, any][] = [
  [`$28==$29`, new BinaryExpression('==', new AccessScopeExpression('$28'), new AccessScopeExpression('$29'))],
  [`$30!=$31`, new BinaryExpression('!=', new AccessScopeExpression('$30'), new AccessScopeExpression('$31'))],
  [`$32===$33`, new BinaryExpression('===', new AccessScopeExpression('$32'), new AccessScopeExpression('$33'))],
  [`$34!==$35`, new BinaryExpression('!==', new AccessScopeExpression('$34'), new AccessScopeExpression('$35'))]
];
const SimpleIsEqualityList: [string, any][] = [
  ...SimpleIsRelationalList,
  ...SimpleEqualityList
];

// This forms the group Precedence.LogicalAND
const SimpleLogicalANDList: [string, any][] = [
  [`$36&&$37`, new BinaryExpression('&&', new AccessScopeExpression('$36'), new AccessScopeExpression('$37'))]
];
const SimpleIsLogicalANDList: [string, any][] = [
  ...SimpleIsEqualityList,
  ...SimpleLogicalANDList
];

// This forms the group Precedence.LogicalOR
const SimpleLogicalORList: [string, any][] = [
  [`$38||$39`, new BinaryExpression('||', new AccessScopeExpression('$38'), new AccessScopeExpression('$39'))]
];
const SimpleIsLogicalORList: [string, any][] = [
  ...SimpleIsLogicalANDList,
  ...SimpleLogicalORList
];

// This forms the group Precedence.Conditional
const SimpleConditionalList: [string, any][] = [
  [`a?b:c`, new ConditionalExpression($a, $b, new AccessScopeExpression('c'))]
];
const SimpleIsConditionalList: [string, any][] = [
  ...SimpleIsLogicalORList,
  ...SimpleConditionalList
];

// This forms the group Precedence.Assign
const SimpleAssignList: [string, any][] = [
  [`a=b`, new AssignExpression($a, $b)]
];
const SimpleIsAssignList: [string, any][] = [
  ...SimpleIsConditionalList,
  ...SimpleAssignList
];

// This forms the group Precedence.Variadic
const SimpleValueConverterList: [string, any][] = [
  [`a|b`, new ValueConverterExpression($a, 'b', [])],
  [`a|b:c`, new ValueConverterExpression($a, 'b', [new AccessScopeExpression('c')])],
  [`a|b:c:d`, new ValueConverterExpression($a, 'b', [new AccessScopeExpression('c'), new AccessScopeExpression('d')])]
];
const SimpleIsValueConverterList: [string, any][] = [
  ...SimpleIsAssignList,
  ...SimpleValueConverterList
];

const SimpleBindingBehaviorList: [string, any][] = [
  [`a&b`, new BindingBehaviorExpression($a, 'b', [])],
  [`a&b:c`, new BindingBehaviorExpression($a, 'b', [new AccessScopeExpression('c')])],
  [`a&b:c:d`, new BindingBehaviorExpression($a, 'b', [new AccessScopeExpression('c'), new AccessScopeExpression('d')])]
];

const SimpleIsBindingBehaviorList: [string, any][] = [
  ...SimpleIsValueConverterList,
  ...SimpleBindingBehaviorList
];

// #endregion

const BindingTypeList = [
  undefined,
  BindingType.BindCommand,
  BindingType.ToViewCommand,
  BindingType.FromViewCommand,
  BindingType.TwoWayCommand,
  BindingType.TriggerCommand,
  BindingType.DelegateCommand,
  BindingType.CaptureCommand,
  BindingType.CallCommand
];

// #region Complex lists
// This is where the fun begins :) We're now going to create large lists of combinations in order
// to hit every possible (non-error) edge case. The fundamental edge cases are written by hand, which
// we then supplement by mixing in the simple lists created above. This generates a fair amount of redundancy
// in the tests, but that's a perfectly acceptable tradeoff as it will cause issues to surface that you would
// otherwise never think of.

// We're validating all (meaningful) strings that can be escaped and combining them
// with normal leading and trailing strings to verify escaping works correctly in different situations
// This array is used to verify parsing of string PrimitiveLiteralExpression, and the strings in TemplateExpression and TaggedTemplateExpression
const stringEscapables = [
  [`\\\\`, `\\`],
  [`\\\``, `\``],
  [`\\'`,  `'`],
  [`\\"`,  `"`],
  [`\\f`,  `\f`],
  [`\\n`,  `\n`],
  [`\\r`,  `\r`],
  [`\\t`,  `\t`],
  [`\\b`,  `\b`],
  [`\\v`,  `\v`]
].map(([raw, cooked]) => [
  [raw,         cooked],
  [`${raw}`,   `${cooked}`],
  [`x${raw}`,  `x${cooked}`],
  [`${raw}x`,  `${cooked}x`],
  [`x${raw}x`, `x${cooked}x`]
]).reduce((acc, cur) => acc.concat(cur));

// Verify all string escapes, unicode characters, double and single quotes
const ComplexStringLiteralList: [string, any][] = [
  ...[
    ['foo',                new PrimitiveLiteralExpression('foo')],
    ['äöüÄÖÜß',            new PrimitiveLiteralExpression('äöüÄÖÜß')],
    ['ಠ_ಠ',               new PrimitiveLiteralExpression('ಠ_ಠ')],
    ...stringEscapables.map(([raw, cooked]) => [raw, new PrimitiveLiteralExpression(cooked)])
  ].map(([input, expr]): [string, any][] => [
    [`'${input}'`, expr],
    [`"${input}"`, expr]
  ]).reduce((acc, cur) => acc.concat(cur))
];

// Verify different floating point notations and parsing numbers that are outside the "safe" integer range
const ComplexNumberList: [string, any][] = [
  ['9007199254740992',                                                  new PrimitiveLiteralExpression(9007199254740992)],
  ['0.9007199254740992',                                                new PrimitiveLiteralExpression(0.9007199254740992)],
  ['.9007199254740992',                                                 new PrimitiveLiteralExpression(0.9007199254740992)],
  ['.90071992547409929007199254740992',                                 new PrimitiveLiteralExpression(0.90071992547409929007199254740992)],
  ['9007199254740992.9007199254740992',                                 new PrimitiveLiteralExpression(9007199254740992.9007199254740992)],
  ['9007199254740992.90071992547409929007199254740992',                 new PrimitiveLiteralExpression(9007199254740992.90071992547409929007199254740992)],
  ['90071992547409929007199254740992',                                  new PrimitiveLiteralExpression(90071992547409929007199254740992)],
  ['90071992547409929007199254740992.9007199254740992',                 new PrimitiveLiteralExpression(90071992547409929007199254740992.9007199254740992)],
  ['90071992547409929007199254740992.90071992547409929007199254740992', new PrimitiveLiteralExpression(90071992547409929007199254740992.90071992547409929007199254740992)]
];

// Verify various combinations of nested and chained parts/expressions, with/without escaped strings
// Also combine this with the full list of SimpleIsAssign (once and twice) to validate parsing precedence of arguments
const ComplexTemplateLiteralList: [string, any][] = [
  [`\`a\``,                       new TemplateExpression(['a'], [])],
  [`\`\\\${a}\``,                 new TemplateExpression([`\${a}`], [])],
  [`\`$a\``,                      new TemplateExpression(['$a'], [])],
  [`\`\${a}\${b}\``,              new TemplateExpression(['', '', ''],                       [$a, $b])],
  [`\`a\${a}\${b}\``,             new TemplateExpression(['a', '', ''],                      [$a, $b])],
  [`\`\${a}a\${b}\``,             new TemplateExpression(['', 'a', ''],                      [$a, $b])],
  [`\`a\${a}a\${b}\``,            new TemplateExpression(['a', 'a', ''],                     [$a, $b])],
  [`\`\${a}\${b}a\``,             new TemplateExpression(['', '', 'a'],                      [$a, $b])],
  [`\`\${a}a\${b}a\``,            new TemplateExpression(['', 'a', 'a'],                     [$a, $b])],
  [`\`a\${a}a\${b}a\``,           new TemplateExpression(['a', 'a', 'a'],                    [$a, $b])],
  [`\`\${\`\${a}\`}\``,           new TemplateExpression(['', ''], [new TemplateExpression(['', ''],   [$a])])],
  [`\`\${\`a\${a}\`}\``,          new TemplateExpression(['', ''], [new TemplateExpression(['a', ''],  [$a])])],
  [`\`\${\`\${a}a\`}\``,          new TemplateExpression(['', ''], [new TemplateExpression(['', 'a'],  [$a])])],
  [`\`\${\`a\${a}a\`}\``,         new TemplateExpression(['', ''], [new TemplateExpression(['a', 'a'], [$a])])],
  [`\`\${\`\${\`\${a}\`}\`}\``,   new TemplateExpression(['', ''], [new TemplateExpression(['', ''], [new TemplateExpression(['', ''],   [$a])])])],
  ...stringEscapables.map(([raw, cooked]): [string, any][] => [
    [`\`${raw}\``,                new TemplateExpression([cooked],              [])],
    [`\`\${a}${raw}\``,           new TemplateExpression(['', cooked],        [$a])],
    [`\`${raw}\${a}\``,           new TemplateExpression([cooked, ''],        [$a])],
    [`\`${raw}\${a}${raw}\``,     new TemplateExpression([cooked, cooked],    [$a])],
    [`\`\${a}${raw}\${a}\``,      new TemplateExpression(['', cooked, ''],    [$a, $a])],
  ]).reduce((acc, cur) => acc.concat(cur)),
  ...SimpleIsAssignList
    .map(([input, expr]) => [`\`\${${input}}\``, new TemplateExpression(['', ''], [expr])] as [string, any]),
  ...SimpleIsAssignList
    .map(([input, expr]) => [`\`\${${input}}\${${input}}\``, new TemplateExpression(['', '', ''], [expr, expr])] as [string, any])
];

// Verify various combinations of specified and unspecified (elision) array items
// Also combine this with the full list of SimpleIsAssign (once and twice) to validate parsing precedence of element expressions
const ComplexArrayLiteralList: [string, any][] = [
  [`[,]`,                 new ArrayLiteralExpression([$undefined])],
  [`[,,]`,                new ArrayLiteralExpression([$undefined, $undefined])],
  [`[,,,]`,               new ArrayLiteralExpression([$undefined, $undefined, $undefined])],
  [`[a,]`,                new ArrayLiteralExpression([$a])],
  [`[a,,]`,               new ArrayLiteralExpression([$a, $undefined])],
  [`[a,a,]`,              new ArrayLiteralExpression([$a, $a])],
  [`[a,,,]`,              new ArrayLiteralExpression([$a, $undefined, $undefined])],
  [`[a,a,,]`,             new ArrayLiteralExpression([$a, $a, $undefined])],
  [`[,a]`,                new ArrayLiteralExpression([$undefined, $a])],
  [`[,a,]`,               new ArrayLiteralExpression([$undefined, $a])],
  [`[,a,,]`,              new ArrayLiteralExpression([$undefined, $a, $undefined])],
  [`[,a,a,]`,             new ArrayLiteralExpression([$undefined, $a, $a])],
  [`[,,a]`,               new ArrayLiteralExpression([$undefined, $undefined, $a])],
  [`[,a,a]`,              new ArrayLiteralExpression([$undefined, $a, $a])],
  [`[,,a,]`,              new ArrayLiteralExpression([$undefined, $undefined, $a])],
  [`[,,,a]`,              new ArrayLiteralExpression([$undefined, $undefined, $undefined, $a])],
  [`[,,a,a]`,             new ArrayLiteralExpression([$undefined, $undefined, $a, $a])],
  ...SimpleIsAssignList.map(([input, expr]): [string, any][] => [
    [`[${input}]`,           new ArrayLiteralExpression([expr])],
    [`[${input},${input}]`,  new ArrayLiteralExpression([expr, expr])]
  ]).reduce((acc, cur) => acc.concat(cur))
];

// Verify various combinations of shorthand, full, string and number property definitions
// Also combine this with the full list of SimpleIsAssign (once and twice) to validate parsing precedence of value expressions
const ComplexObjectLiteralList: [string, any][] = [
  [`{a}`,                 new ObjectLiteralExpression(['a'], [$a])],
  [`{a:a}`,               new ObjectLiteralExpression(['a'], [$a])],
  [`{'a':a}`,             new ObjectLiteralExpression(['a'], [$a])],
  [`{"a":a}`,             new ObjectLiteralExpression(['a'], [$a])],
  [`{1:a}`,               new ObjectLiteralExpression([1], [$a])],
  [`{'1':a}`,             new ObjectLiteralExpression(['1'], [$a])],
  [`{"1":a}`,             new ObjectLiteralExpression(['1'], [$a])],
  [`{'a':a,b}`,           new ObjectLiteralExpression(['a', 'b'], [$a, $b])],
  [`{"a":a,b}`,           new ObjectLiteralExpression(['a', 'b'], [$a, $b])],
  [`{1:a,b}`,             new ObjectLiteralExpression([1, 'b'], [$a, $b])],
  [`{'1':a,b}`,           new ObjectLiteralExpression(['1', 'b'], [$a, $b])],
  [`{"1":a,b}`,           new ObjectLiteralExpression(['1', 'b'], [$a, $b])],
  [`{a,'b':b}`,           new ObjectLiteralExpression(['a', 'b'], [$a, $b])],
  [`{a,"b":b}`,           new ObjectLiteralExpression(['a', 'b'], [$a, $b])],
  [`{a,1:b}`,             new ObjectLiteralExpression(['a', 1], [$a, $b])],
  [`{a,'1':b}`,           new ObjectLiteralExpression(['a', '1'], [$a, $b])],
  [`{a,"1":b}`,           new ObjectLiteralExpression(['a', '1'], [$a, $b])],
  [`{a,b}`,               new ObjectLiteralExpression(['a', 'b'], [$a, $b])],
  [`{a:a,b}`,             new ObjectLiteralExpression(['a', 'b'], [$a, $b])],
  [`{a,b:b}`,             new ObjectLiteralExpression(['a', 'b'], [$a, $b])],
  [`{a:a,b,c}`,           new ObjectLiteralExpression(['a', 'b', 'c'], [$a, $b, $c])],
  [`{a,b:b,c}`,           new ObjectLiteralExpression(['a', 'b', 'c'], [$a, $b, $c])],
  [`{a,b,c:c}`,           new ObjectLiteralExpression(['a', 'b', 'c'], [$a, $b, $c])],
  [`{a:a,b:b,c}`,         new ObjectLiteralExpression(['a', 'b', 'c'], [$a, $b, $c])],
  [`{a:a,b,c:c}`,         new ObjectLiteralExpression(['a', 'b', 'c'], [$a, $b, $c])],
  [`{a,b:b,c:c}`,         new ObjectLiteralExpression(['a', 'b', 'c'], [$a, $b, $c])],
  ...SimpleIsAssignList.map(([input, expr]): [string, any][] => [
    [`{a:${input}}`,            new ObjectLiteralExpression(['a'], [expr])],
    [`{a:${input},b:${input}}`, new ObjectLiteralExpression(['a', 'b'], [expr, expr])]
  ]).reduce((acc, cur) => acc.concat(cur))
];

const ComplexLiteralList: [string, any][] = [
  ...ComplexStringLiteralList,
  ...ComplexNumberList,
  ...ComplexTemplateLiteralList,
  ...ComplexArrayLiteralList,
  ...ComplexObjectLiteralList,
];

const ComplexAccessKeyedList: [string, any][] = [
  ...SimpleIsAssignList
    .map(([input, expr]) => [`a[${input}]`, new AccessKeyedExpression($a, expr)] as [string, any])
];

const ComplexAccessMemberList: [string, any][] = [
  ...[
    ...KeywordPrimitiveLiteralList,
    [`typeof`],
    [`void`],
    [`$this`],
    [`$parent`],
    [`in`],
    [`instanceof`],
    [`of`]]
    .map(([input]) => [`a.${input}`, new AccessMemberExpression($a, input)] as [string, any])
];

const ComplexTaggedTemplateList: [string, any][] = [
  [`a\`a\``,                       createTaggedTemplate(['a'],           $a, [])],
  [`a\`\\\${a}\``,                 createTaggedTemplate([`\${a}`],       $a, [])],
  [`a\`$a\``,                      createTaggedTemplate(['$a'],          $a, [])],
  [`a\`\${b}\${c}\``,              createTaggedTemplate(['', '', ''],    $a, [$b, $c])],
  [`a\`a\${b}\${c}\``,             createTaggedTemplate(['a', '', ''],   $a, [$b, $c])],
  [`a\`\${b}a\${c}\``,             createTaggedTemplate(['', 'a', ''],   $a, [$b, $c])],
  [`a\`a\${b}a\${c}\``,            createTaggedTemplate(['a', 'a', ''],  $a, [$b, $c])],
  [`a\`\${b}\${c}a\``,             createTaggedTemplate(['', '', 'a'],   $a, [$b, $c])],
  [`a\`\${b}a\${c}a\``,            createTaggedTemplate(['', 'a', 'a'],  $a, [$b, $c])],
  [`a\`a\${b}a\${c}a\``,           createTaggedTemplate(['a', 'a', 'a'], $a, [$b, $c])],
  [`a\`\${\`\${a}\`}\``,           createTaggedTemplate(['', ''],        $a, [new TemplateExpression(['', ''],   [$a])])],
  [`a\`\${\`a\${a}\`}\``,          createTaggedTemplate(['', ''],        $a, [new TemplateExpression(['a', ''],  [$a])])],
  [`a\`\${\`\${a}a\`}\``,          createTaggedTemplate(['', ''],        $a, [new TemplateExpression(['', 'a'],  [$a])])],
  [`a\`\${\`a\${a}a\`}\``,         createTaggedTemplate(['', ''],        $a, [new TemplateExpression(['a', 'a'], [$a])])],
  [`a\`\${\`\${\`\${a}\`}\`}\``,   createTaggedTemplate(['', ''],        $a, [new TemplateExpression(['', ''], [new TemplateExpression(['', ''],   [$a])])])],
  ...stringEscapables.map(([raw, cooked]): [string, any][] => [
    [`a\`${raw}\``,                createTaggedTemplate([cooked],         $a,     [])],
    [`a\`\${a}${raw}\``,           createTaggedTemplate(['', cooked],     $a,   [$a])],
    [`a\`${raw}\${a}\``,           createTaggedTemplate([cooked, ''],     $a,   [$a])],
    [`a\`${raw}\${a}${raw}\``,     createTaggedTemplate([cooked, cooked], $a,   [$a])],
    [`a\`\${a}${raw}\${a}\``,      createTaggedTemplate(['', cooked, ''], $a,   [$a, $a])],
  ]).reduce((acc, cur) => acc.concat(cur)),
  ...SimpleIsAssignList
    .map(([input, expr]) => [`a\`\${${input}}\``, createTaggedTemplate(['', ''], $a, [expr])] as [string, any]),
  ...SimpleIsAssignList
    .map(([input, expr]) => [`a\`\${${input}}\${${input}}\``, createTaggedTemplate(['', '', ''], $a, [expr, expr])] as [string, any])
];

const ComplexCallFunctionList: [string, any][] = [
  ...SimpleIsAssignList
    .map(([input, expr]) => [`$this(${input})`, new CallFunctionExpression($this, [expr])] as [string, any]),
  ...SimpleIsAssignList
    .map(([input, expr]) => [`$this(${input},${input})`, new CallFunctionExpression($this, [expr, expr])] as [string, any])
];

const ComplexCallScopeList: [string, any][] = [
  ...SimpleIsAssignList
    .map(([input, expr]) => [`a(${input})`, new CallScopeExpression('a', [expr])] as [string, any]),
  ...SimpleIsAssignList
    .map(([input, expr]) => [`a(${input},${input})`, new CallScopeExpression('a', [expr, expr])] as [string, any])
];

const ComplexCallMemberList: [string, any][] = [
  ...SimpleIsAssignList
    .map(([input, expr]) => [`a.b(${input})`, new CallMemberExpression($a, 'b', [expr])] as [string, any]),
  ...SimpleIsAssignList
    .map(([input, expr]) => [`a.b(${input},${input})`, new CallMemberExpression($a, 'b', [expr, expr])] as [string, any])
];

const ComplexLeftHandSideList: [string, any][] = [
  ...ComplexAccessKeyedList,
  ...ComplexAccessMemberList,
  ...ComplexTaggedTemplateList,
  ...ComplexCallFunctionList,
  ...ComplexCallScopeList,
  ...ComplexCallMemberList
];

const ComplexIsLeftHandSideList: [string, any][] = [
  ...ComplexLiteralList,
  ...ComplexLeftHandSideList
];

const ComplexUnaryList: [string, any][] = [
  ...SimpleIsLeftHandSideList
    .map(([input, expr]) => [`!${input}`, new UnaryExpression('!', expr)] as [string, any]),
  ...SimpleIsLeftHandSideList
    .map(([input, expr]) => [`+${input}`, new UnaryExpression('+', expr)] as [string, any]),
  ...SimpleIsLeftHandSideList
    .map(([input, expr]) => [`-${input}`, new UnaryExpression('-', expr)] as [string, any]),
  ...SimpleIsLeftHandSideList
    .map(([input, expr]) => [`void ${input}`, new UnaryExpression('void', expr)] as [string, any]),
  ...SimpleIsLeftHandSideList
    .map(([input, expr]) => [`typeof ${input}`, new UnaryExpression('typeof', expr)] as [string, any])
];

const ComplexIsUnaryList: [string, any][] = [
  ...ComplexIsLeftHandSideList,
  ...ComplexUnaryList
];

// Combine a precedence group with all precedence groups below it, the precedence group on the same
// level, and a precedence group above it, and verify that the precedence/associativity is correctly enforced
const ComplexMultiplicativeList: [string, any][] = [
  ...binaryMultiplicative.map(op => [
    ...SimpleIsMultiplicativeList.map(([i1, e1]) => [`${i1}${op}a`, new BinaryExpression(op, e1, $a)]),
    ...SimpleUnaryList
      .map(([i1, e1]) => SimpleMultiplicativeList.map(([i2, e2]) => [`${i2}${op}${i1}`, new BinaryExpression(op, e2, e1)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleMultiplicativeList
      .map(([i1, e1]) => SimpleMultiplicativeList.map(([i2, e2]) => [`${i1}${op}${i2}`, new BinaryExpression(e2.operation, new BinaryExpression(op, new BinaryExpression(e1.operation, e1.left, e1.right), e2.left), e2.right)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleAdditiveList
      .map(([i1, e1]) => SimpleMultiplicativeList.map(([i2, e2]) => [`${i1}${op}${i2}`, new BinaryExpression(e1.operation, e1.left, new BinaryExpression(e2.operation, new BinaryExpression(op, e1.right, e2.left), e2.right))]))
      .reduce((a, b) => a.concat(b))
  ] as [string, any][]).reduce((a, b) => a.concat(b))
];
const ComplexIsMultiplicativeList: [string, any][] = [
  ...ComplexIsUnaryList,
  ...ComplexMultiplicativeList
];

const ComplexAdditiveList: [string, any][] = [
  ...binaryAdditive.map(op => [
    ...SimpleIsAdditiveList.map(([i1, e1]) => [`${i1}${op}a`, new BinaryExpression(op, e1, $a)]),
    ...SimpleMultiplicativeList
      .map(([i1, e1]) => SimpleAdditiveList.map(([i2, e2]) => [`${i2}${op}${i1}`, new BinaryExpression(op, e2, e1)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleAdditiveList
      .map(([i1, e1]) => SimpleAdditiveList.map(([i2, e2]) => [`${i1}${op}${i2}`, new BinaryExpression(e2.operation, new BinaryExpression(op, new BinaryExpression(e1.operation, e1.left, e1.right), e2.left), e2.right)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleRelationalList
      .map(([i1, e1]) => SimpleAdditiveList.map(([i2, e2]) => [`${i1}${op}${i2}`, new BinaryExpression(e1.operation, e1.left, new BinaryExpression(e2.operation, new BinaryExpression(op, e1.right, e2.left), e2.right))]))
      .reduce((a, b) => a.concat(b))
  ] as [string, any][]).reduce((a, b) => a.concat(b))
];
const ComplexIsAdditiveList: [string, any][] = [
  ...ComplexIsMultiplicativeList,
  ...ComplexAdditiveList
];

const ComplexRelationalList: [string, any][] = [
  ...binaryRelational.map(([op, txt]) => [
    ...SimpleIsRelationalList.map(([i1, e1]) => [`${i1}${txt}a`, new BinaryExpression(op, e1, $a)]),
    ...SimpleAdditiveList
      .map(([i1, e1]) => SimpleRelationalList.map(([i2, e2]) => [`${i2}${txt}${i1}`, new BinaryExpression(op, e2, e1)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleRelationalList
      .map(([i1, e1]) => SimpleRelationalList.map(([i2, e2]) => [`${i1}${txt}${i2}`, new BinaryExpression(e2.operation, new BinaryExpression(op, new BinaryExpression(e1.operation, e1.left, e1.right), e2.left), e2.right)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleEqualityList
      .map(([i1, e1]) => SimpleRelationalList.map(([i2, e2]) => [`${i1}${txt}${i2}`, new BinaryExpression(e1.operation, e1.left, new BinaryExpression(e2.operation, new BinaryExpression(op, e1.right, e2.left), e2.right))]))
      .reduce((a, b) => a.concat(b))
  ] as [string, any][]).reduce((a, b) => a.concat(b))
];
const ComplexIsRelationalList: [string, any][] = [
  ...ComplexIsAdditiveList,
  ...ComplexRelationalList
];

const ComplexEqualityList: [string, any][] = [
  ...binaryEquality.map(op => [
    ...SimpleIsEqualityList.map(([i1, e1]) => [`${i1}${op}a`, new BinaryExpression(op, e1, $a)]),
    ...SimpleRelationalList
      .map(([i1, e1]) => SimpleEqualityList.map(([i2, e2]) => [`${i2}${op}${i1}`, new BinaryExpression(op, e2, e1)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleEqualityList
      .map(([i1, e1]) => SimpleEqualityList.map(([i2, e2]) => [`${i1}${op}${i2}`, new BinaryExpression(e2.operation, new BinaryExpression(op, new BinaryExpression(e1.operation, e1.left, e1.right), e2.left), e2.right)]))
      .reduce((a, b) => a.concat(b)),
    ...SimpleLogicalANDList
      .map(([i1, e1]) => SimpleEqualityList.map(([i2, e2]) => [`${i1}${op}${i2}`, new BinaryExpression(e1.operation, e1.left, new BinaryExpression(e2.operation, new BinaryExpression(op, e1.right, e2.left), e2.right))]))
      .reduce((a, b) => a.concat(b))
  ] as [string, any][]).reduce((a, b) => a.concat(b))
];
const ComplexIsEqualityList: [string, any][] = [
  ...ComplexIsRelationalList,
  ...ComplexEqualityList
];

const ComplexLogicalANDList: [string, any][] = [
  ...SimpleIsLogicalANDList.map(([i1, e1]) => [`${i1}&&a`, new BinaryExpression('&&', e1, $a)] as [string, any]),
  ...SimpleEqualityList
    .map(([i1, e1]) => SimpleLogicalANDList.map(([i2, e2]) => [`${i2}&&${i1}`, new BinaryExpression('&&', e2, e1)]) as [string, any][])
    .reduce((a, b) => a.concat(b)),
  ...SimpleLogicalANDList
    .map(([i1, e1]) => SimpleLogicalANDList.map(([i2, e2]) => [`${i1}&&${i2}`, new BinaryExpression(e2.operation, new BinaryExpression('&&', new BinaryExpression(e1.operation, e1.left, e1.right), e2.left), e2.right)]) as [string, any][])
    .reduce((a, b) => a.concat(b)),
  ...SimpleLogicalORList
    .map(([i1, e1]) => SimpleLogicalANDList.map(([i2, e2]) => [`${i1}&&${i2}`, new BinaryExpression(e1.operation, e1.left, new BinaryExpression(e2.operation, new BinaryExpression('&&', e1.right, e2.left), e2.right))]) as [string, any][])
    .reduce((a, b) => a.concat(b))
];
const ComplexIsLogicalANDList: [string, any][] = [
  ...ComplexIsEqualityList,
  ...ComplexLogicalANDList
];

const ComplexLogicalORList: [string, any][] = [
  ...SimpleIsLogicalORList.map(([i1, e1]) => [`${i1}||a`, new BinaryExpression('||', e1, $a)] as [string, any]),
  ...SimpleLogicalANDList
    .map(([i1, e1]) => SimpleLogicalORList.map(([i2, e2]) => [`${i2}||${i1}`, new BinaryExpression('||', e2, e1)]) as [string, any][])
    .reduce((a, b) => a.concat(b)),
  ...SimpleLogicalORList
    .map(([i1, e1]) => SimpleLogicalORList.map(([i2, e2]) => [`${i1}||${i2}`, new BinaryExpression(e2.operation, new BinaryExpression('||', new BinaryExpression(e1.operation, e1.left, e1.right), e2.left), e2.right)]) as [string, any][])
    .reduce((a, b) => a.concat(b)),
  ...SimpleConditionalList
    .map(([i1, e1]) => SimpleLogicalORList.map(([i2, e2]) => [`${i1}||${i2}`, new ConditionalExpression(e1.condition, e1.yes, new BinaryExpression(e2.operation, new BinaryExpression('||', e1.no, e2.left), e2.right))]) as [string, any][])
    .reduce((a, b) => a.concat(b))
];
const ComplexIsLogicalORList: [string, any][] = [
  ...ComplexIsLogicalANDList,
  ...ComplexLogicalORList
];

const ComplexConditionalList: [string, any][] = [
  ...SimpleIsLogicalORList.map(([i1, e1]) => [`${i1}?0:1`, new ConditionalExpression(e1, $num0, $num1)] as [string, any]),
  ...SimpleIsAssignList.map(([i1, e1]) => [`0?1:${i1}`, new ConditionalExpression($num0, $num1, e1)] as [string, any]),
  ...SimpleIsAssignList.map(([i1, e1]) => [`0?${i1}:1`, new ConditionalExpression($num0, e1, $num1)] as [string, any]),
  ...SimpleConditionalList.map(([i1, e1]) => [`${i1}?0:1`, new ConditionalExpression(e1.condition, e1.yes, new ConditionalExpression(e1.no, $num0, $num1))] as [string, any])
];
const ComplexIsConditionalList: [string, any][] = [
  ...ComplexIsLogicalORList,
  ...ComplexConditionalList
];

const ComplexAssignList: [string, any][] = [
  ...SimpleIsAssignList.map(([i1, e1]) => [`a=${i1}`, new AssignExpression($a, e1)] as [string, any]),
  ...SimpleIsAssignList.map(([i1, e1]) => [`a=b=${i1}`, new AssignExpression($a, new AssignExpression($b, e1))] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}=a`, new AssignExpression(e1, $a)] as [string, any]),
  ...SimpleAccessMemberList.map(([i1, e1]) => [`${i1}=a`, new AssignExpression(e1, $a)] as [string, any]),
  ...SimpleAccessKeyedList.map(([i1, e1]) => [`${i1}=a`, new AssignExpression(e1, $a)] as [string, any]),
  ...SimpleAssignList.map(([i1, e1]) => [`${i1}=c`, new AssignExpression(e1.target, new AssignExpression(e1.value, $c))] as [string, any])
];
const ComplexIsAssignList: [string, any][] = [
  ...ComplexIsConditionalList,
  ...ComplexAssignList
];

const ComplexValueConverterList: [string, any][] = [
  ...SimpleIsAssignList.map(([i1, e1]) => [`${i1}|a`, new ValueConverterExpression(e1, 'a', [])] as [string, any]),
  ...SimpleIsAssignList.map(([i1, e1]) => [`${i1}|a:${i1}`, new ValueConverterExpression(e1, 'a', [e1])] as [string, any]),
  ...SimpleIsAssignList.map(([i1, e1]) => [`${i1}|a:${i1}:${i1}`, new ValueConverterExpression(e1, 'a', [e1, e1])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}|a|b`, new ValueConverterExpression(new ValueConverterExpression(e1, 'a', []), 'b', [])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}|a|b|c`, new ValueConverterExpression(new ValueConverterExpression(new ValueConverterExpression(e1, 'a', []), 'b', []), 'c', [])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}|a:${i1}:${i1}`, new ValueConverterExpression(e1, 'a', [e1, e1])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}|a:${i1}:${i1}:${i1}`, new ValueConverterExpression(e1, 'a', [e1, e1, e1])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}|a:${i1}:${i1}:${i1}|b|c:${i1}:${i1}:${i1}`, new ValueConverterExpression(new ValueConverterExpression(new ValueConverterExpression(e1, 'a', [e1, e1, e1]), 'b', []), 'c', [e1, e1, e1])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}|a:${i1}:${i1}:${i1}|b:${i1}:${i1}:${i1}|c`, new ValueConverterExpression(new ValueConverterExpression(new ValueConverterExpression(e1, 'a', [e1, e1, e1]), 'b', [e1, e1, e1]), 'c', [])] as [string, any])
];
const ComplexIsValueConverterList: [string, any][] = [
  ...ComplexIsAssignList,
  ...ComplexValueConverterList
];

const ComplexBindingBehaviorList: [string, any][] = [
  ...SimpleIsValueConverterList.map(([i1, e1]) => [`${i1}&a`, new BindingBehaviorExpression(e1, 'a', [])] as [string, any]),
  ...SimpleIsAssignList.map(([i1, e1]) => [`${i1}&a:${i1}`, new BindingBehaviorExpression(e1, 'a', [e1])] as [string, any]),
  ...SimpleIsAssignList.map(([i1, e1]) => [`${i1}&a:${i1}:${i1}`, new BindingBehaviorExpression(e1, 'a', [e1, e1])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}&a&b`, new BindingBehaviorExpression(new BindingBehaviorExpression(e1, 'a', []), 'b', [])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}&a&b&c`, new BindingBehaviorExpression(new BindingBehaviorExpression(new BindingBehaviorExpression(e1, 'a', []), 'b', []), 'c', [])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}&a:${i1}:${i1}`, new BindingBehaviorExpression(e1, 'a', [e1, e1])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}&a:${i1}:${i1}:${i1}`, new BindingBehaviorExpression(e1, 'a', [e1, e1, e1])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}&a:${i1}:${i1}:${i1}&b&c:${i1}:${i1}:${i1}`, new BindingBehaviorExpression(new BindingBehaviorExpression(new BindingBehaviorExpression(e1, 'a', [e1, e1, e1]), 'b', []), 'c', [e1, e1, e1])] as [string, any]),
  ...AccessScopeList.map(([i1, e1]) => [`${i1}&a:${i1}:${i1}:${i1}&b:${i1}:${i1}:${i1}&c`, new BindingBehaviorExpression(new BindingBehaviorExpression(new BindingBehaviorExpression(e1, 'a', [e1, e1, e1]), 'b', [e1, e1, e1]), 'c', [])] as [string, any])
];
const ComplexIsBindingBehaviorList: [string, any][] = [
  ...ComplexIsValueConverterList,
  ...ComplexBindingBehaviorList
];

const SimpleForDeclarations: [string, any][] = [
  [`a`,           new BindingIdentifier('a')],
  [`{}`,          new ObjectBindingPattern([], [])],
  [`[]`,          new ArrayBindingPattern([])],
];

const ForDeclarations: [string, any][] = [
  [`{a}`,         new ObjectBindingPattern(['a'], [$a])],
  [`{a:a}`,       new ObjectBindingPattern(['a'], [$a])],
  [`{a,b}`,       new ObjectBindingPattern(['a', 'b'], [$a, $b])],
  [`{a:a,b}`,     new ObjectBindingPattern(['a', 'b'], [$a, $b])],
  [`{a,b:b}`,     new ObjectBindingPattern(['a', 'b'], [$a, $b])],
  [`{a:a,b,c}`,   new ObjectBindingPattern(['a', 'b', 'c'], [$a, $b, $c])],
  [`{a,b:b,c}`,   new ObjectBindingPattern(['a', 'b', 'c'], [$a, $b, $c])],
  [`{a,b,c:c}`,   new ObjectBindingPattern(['a', 'b', 'c'], [$a, $b, $c])],
  [`{a:a,b:b,c}`, new ObjectBindingPattern(['a', 'b', 'c'], [$a, $b, $c])],
  [`{a:a,b,c:c}`, new ObjectBindingPattern(['a', 'b', 'c'], [$a, $b, $c])],
  [`{a,b:b,c:c}`, new ObjectBindingPattern(['a', 'b', 'c'], [$a, $b, $c])],
  [`[,]`,         new ArrayBindingPattern([$undefined])],
  [`[,,]`,        new ArrayBindingPattern([$undefined, $undefined])],
  [`[,,,]`,       new ArrayBindingPattern([$undefined, $undefined, $undefined])],
  [`[a,]`,        new ArrayBindingPattern([$a])],
  [`[a,,]`,       new ArrayBindingPattern([$a, $undefined])],
  [`[a,a,]`,      new ArrayBindingPattern([$a, $a])],
  [`[a,,,]`,      new ArrayBindingPattern([$a, $undefined, $undefined])],
  [`[a,a,,]`,     new ArrayBindingPattern([$a, $a, $undefined])],
  [`[,a]`,        new ArrayBindingPattern([$undefined, $a])],
  [`[,a,]`,       new ArrayBindingPattern([$undefined, $a])],
  [`[,a,,]`,      new ArrayBindingPattern([$undefined, $a, $undefined])],
  [`[,a,a,]`,     new ArrayBindingPattern([$undefined, $a, $a])],
  [`[,,a]`,       new ArrayBindingPattern([$undefined, $undefined, $a])],
  [`[,a,a]`,      new ArrayBindingPattern([$undefined, $a, $a])],
  [`[,,a,]`,      new ArrayBindingPattern([$undefined, $undefined, $a])],
  [`[,,,a]`,      new ArrayBindingPattern([$undefined, $undefined, $undefined, $a])],
  [`[,,a,a]`,     new ArrayBindingPattern([$undefined, $undefined, $a, $a])]
];

const ForOfStatements: [string, any][] = [
  ...SimpleForDeclarations.map(([decInput, decExpr]) => [
    ...SimpleIsBindingBehaviorList.map(([forInput, forExpr]) => [`${decInput} of ${forInput}`, new ForOfStatement(decExpr, forExpr)])
  ] as [string, any][]).reduce((a, c) => a.concat(c)),
  ...ForDeclarations.map(([decInput, decExpr]) => [
    ...AccessScopeList.map(([forInput, forExpr]) => [`${decInput} of ${forInput}`, new ForOfStatement(decExpr, forExpr)])
  ] as [string, any][]).reduce((a, c) => a.concat(c))
];

const InterpolationList: [string, any][] = [
  [`a`,                       null],
  [`\\\${a`,                  null],
  [`\\\${a}`,                 null],
  [`\\\${a}\\\${a}`,          null],
  [`$a`,                      null],
  [`$a$a`,                    null],
  [`$\\{a`,                   null],
  [`\${a}\${b}`,              new Interpolation(['', '', ''],                       [$a, $b])],
  [`a\${a}\${b}`,             new Interpolation(['a', '', ''],                      [$a, $b])],
  [`\${a}a\${b}`,             new Interpolation(['', 'a', ''],                      [$a, $b])],
  [`a\${a}a\${b}`,            new Interpolation(['a', 'a', ''],                     [$a, $b])],
  [`\${a}\${b}a`,             new Interpolation(['', '', 'a'],                      [$a, $b])],
  [`\${a}a\${b}a`,            new Interpolation(['', 'a', 'a'],                     [$a, $b])],
  [`a\${a}a\${b}a`,           new Interpolation(['a', 'a', 'a'],                    [$a, $b])],
  [`\${\`\${a}\`}`,           new Interpolation(['', ''], [new TemplateExpression(['', ''],   [$a])])],
  [`\${\`a\${a}\`}`,          new Interpolation(['', ''], [new TemplateExpression(['a', ''],  [$a])])],
  [`\${\`\${a}a\`}`,          new Interpolation(['', ''], [new TemplateExpression(['', 'a'],  [$a])])],
  [`\${\`a\${a}a\`}`,         new Interpolation(['', ''], [new TemplateExpression(['a', 'a'], [$a])])],
  [`\${\`\${\`\${a}\`}\`}`,   new Interpolation(['', ''], [new TemplateExpression(['', ''], [new TemplateExpression(['', ''],   [$a])])])],
  ...stringEscapables.map(([raw, cooked]): [string, any][] => [
    [`${raw}`,                null],
    [`\${a}${raw}`,           new Interpolation(['', cooked],        [$a])],
    [`${raw}\${a}`,           new Interpolation([cooked, ''],        [$a])],
    [`${raw}\${a}${raw}`,     new Interpolation([cooked, cooked],    [$a])],
    [`\${a}${raw}\${a}`,      new Interpolation(['', cooked, ''],    [$a, $a])],
  ]).reduce((acc, cur) => acc.concat(cur)),
  ...SimpleIsAssignList
    .map(([input, expr]) => [`\${${input}}`, new Interpolation(['', ''], [expr])] as [string, any]),
  ...SimpleIsAssignList
    .map(([input, expr]) => [`\${${input}}\${${input}}`, new Interpolation(['', '', ''], [expr, expr])] as [string, any])
];

export class ExpressionParserTests {
  @fact() 'parse SimpleIsBindingBehaviorList'(
    @combiData(...BindingTypeList) bindingType: BindingType,
    @combiData(...SimpleIsBindingBehaviorList) [input, expected]: [string, any],
  ) {
    verifyResultOrError(input, expected, null, bindingType);
  }

  @fact() 'parse SimpleBindingBehaviorList with Precedence.Unary'(
    @combiData(...BindingTypeList) bindingType: BindingType,
    @combiData(...SimpleBindingBehaviorList) [input, expected]: [string, any],
  ) {
    const state = new ParserState(input);
    const result = parse(state, Access.Reset, Precedence.Unary, bindingType);
    if ((result.$kind & ExpressionKind.IsPrimary) > 0 ||
      (result.$kind & ExpressionKind.Unary) === ExpressionKind.Unary) {
      if ((expected.$kind & ExpressionKind.IsPrimary) > 0 ||
        (expected.$kind & ExpressionKind.Unary) === ExpressionKind.Unary) {
        assert.deepStrictEqual(result, expected);
        assert.strictEqual(state.index >= state.length, true, `state.index >= state.length`);
      } else {
        assert.strictEqual(state.index < state.length, true, `state.index < state.length`);
        assert.notStrictEqual(result.$kind, expected.$kind, 'result.$kind');
      }
    } else {
      throw new Error('Should not parse anything higher than UnaryExpression');
    }
  }

  @fact() 'parse SimpleBindingBehaviorList with Precedence.Binary'(
    @combiData(...BindingTypeList) bindingType: BindingType,
    @combiData(...SimpleBindingBehaviorList) [input, expected]: [string, any],
  ) {
    const state = new ParserState(input);
    const result = parse(state, Access.Reset, Precedence.Binary, bindingType);
    if ((result.$kind & ExpressionKind.IsPrimary) > 0 ||
      (result.$kind & ExpressionKind.Unary) === ExpressionKind.Unary ||
      (result.$kind & ExpressionKind.Binary) === ExpressionKind.Binary) {
      if ((expected.$kind & ExpressionKind.IsPrimary) > 0 ||
        (expected.$kind & ExpressionKind.Unary) === ExpressionKind.Unary ||
        (expected.$kind & ExpressionKind.Binary) === ExpressionKind.Binary) {
        assert.deepStrictEqual(result, expected);
        assert.strictEqual(state.index >= state.length, true, `state.index >= state.length`);
      } else {
        assert.strictEqual(state.index < state.length, true, `state.index < state.length`);
        assert.notStrictEqual(result.$kind, expected.$kind, 'result.$kind');
      }
    } else {
      throw new Error('Should not parse anything higher than BinaryExpression');
    }
  }

  @fact() 'parse SimpleBindingBehaviorList with Precedence.Conditional'(
    @combiData(...BindingTypeList) bindingType: BindingType,
    @combiData(...SimpleBindingBehaviorList) [input, expected]: [string, any],
  ) {
    const state = new ParserState(input);
    const result = parse(state, Access.Reset, Precedence.Conditional, bindingType);
    if ((result.$kind & ExpressionKind.IsPrimary) > 0 ||
      (result.$kind & ExpressionKind.Unary) === ExpressionKind.Unary ||
      (result.$kind & ExpressionKind.Binary) === ExpressionKind.Binary ||
      (result.$kind & ExpressionKind.Conditional) === ExpressionKind.Conditional) {
      if ((expected.$kind & ExpressionKind.IsPrimary) > 0 ||
        (expected.$kind & ExpressionKind.Unary) === ExpressionKind.Unary ||
        (expected.$kind & ExpressionKind.Binary) === ExpressionKind.Binary ||
        (expected.$kind & ExpressionKind.Conditional) === ExpressionKind.Conditional) {
        assert.deepStrictEqual(result, expected);
        assert.strictEqual(state.index >= state.length, true, `state.index >= state.length`);
      } else {
        assert.strictEqual(state.index < state.length, true, `state.index < state.length`);
        assert.notStrictEqual(result.$kind, expected.$kind, 'result.$kind');
      }
    } else {
      throw new Error('Should not parse anything higher than ConditionalExpression');
    }
  }

  @fact() 'parse SimpleBindingBehaviorList with Precedence.Assign'(
    @combiData(...BindingTypeList) bindingType: BindingType,
    @combiData(...SimpleBindingBehaviorList) [input, expected]: [string, any],
  ) {
    const state = new ParserState(input);
    const result = parse(state, Access.Reset, Precedence.Assign, bindingType);
    if ((result.$kind & ExpressionKind.IsPrimary) > 0 ||
      (result.$kind & ExpressionKind.Unary) === ExpressionKind.Unary ||
      (result.$kind & ExpressionKind.Binary) === ExpressionKind.Binary ||
      (result.$kind & ExpressionKind.Conditional) === ExpressionKind.Conditional ||
      (result.$kind & ExpressionKind.Assign) === ExpressionKind.Assign) {
      if ((expected.$kind & ExpressionKind.IsPrimary) > 0 ||
        (expected.$kind & ExpressionKind.Unary) === ExpressionKind.Unary ||
        (expected.$kind & ExpressionKind.Binary) === ExpressionKind.Binary ||
        (expected.$kind & ExpressionKind.Conditional) === ExpressionKind.Conditional ||
        (expected.$kind & ExpressionKind.Assign) === ExpressionKind.Assign) {
        assert.deepStrictEqual(result, expected);
        assert.strictEqual(state.index >= state.length, true, `state.index >= state.length`);
      } else {
        assert.strictEqual(state.index < state.length, true, `state.index < state.length`);
        assert.notStrictEqual(result.$kind, expected.$kind, 'result.$kind');
      }
    } else {
      throw new Error('Should not parse anything higher than AssignExpression');
    }
  }

  @fact() 'parse SimpleBindingBehaviorList with Precedence.Variadic'(
    @combiData(...BindingTypeList) bindingType: BindingType,
    @combiData(...SimpleBindingBehaviorList) [input, expected]: [string, any],
  ) {
    const state = new ParserState(input);
    const result = parse(state, Access.Reset, Precedence.Variadic, bindingType);
    assert.deepStrictEqual(result, expected);
  }

  @fact() 'parse ComplexIsBindingBehaviorList'(
    @combiData(...ComplexIsBindingBehaviorList) [input, expected]: [string, any],
  ) {
    assert.deepStrictEqual(parseExpression(input), expected);
  }

  // https://tc39.github.io/ecma262/#sec-runtime-semantics-iteratordestructuringassignmentevaluation
  @fact() 'parse ForOfStatement'(
    @combiData(...ForOfStatements) [input, expected]: [string, any],
  ) {
    assert.deepStrictEqual(parseExpression(input, BindingType.ForCommand as any), expected);
  }

  @fact() 'parse Interpolation'(
    @combiData(...InterpolationList) [input, expected]: [string, any],
  ) {
    assert.deepStrictEqual(parseExpression(input, BindingType.Interpolation as any), expected);
  }

  @fact() 'parse unicode IdentifierStart'(
    @combiData(...latin1IdentifierStartChars) char: string,
  ) {
    assert.deepStrictEqual(parseExpression(char), new AccessScopeExpression(char, 0));
  }

  @fact() 'parse unicode IdentifierPart'(
    @combiData(...latin1IdentifierPartChars) char: string,
  ) {
    const identifier = `$${char}`;
    assert.deepStrictEqual(parseExpression(identifier), new AccessScopeExpression(identifier, 0));
  }

  /* eslint-disable function-call-argument-newline */
  @fact() 'throw Code 100 (InvalidExpressionStart)'(
    @combiData(
      ')', '}', ']', '%', '*',
      ',', '/', ':', '>', '<',
      '=', '?', 'of', 'instanceof', 'in', ' '
    ) input: string,
  ) {
    verifyResultOrError(input, null, 'Code 100');
  }
  /* eslint-enable function-call-argument-newline */

  @fact() 'throw Code 101 (UnconsumedToken) on spread'(
    @combiData(
      '..', '...', '..a', '...a', '..1', '...1', '.a.', '.a..'
    ) input: string,
  ) {
    verifyResultOrError(input, null, 'Code 101');
  }

  @fact() 'throw Code 101 (UnconsumedToken) on terminal'(
    @combiData(...SimpleIsAssignList) [input]: string,
    @combiData(')', ']', '}') op: string,
  ) {
    verifyResultOrError(`${input}${op}`, null, 'Code 101');
  }

  @fact() 'throw Code 101 (UnconsumedToken) on "$this!"'() {
    verifyResultOrError(`$this!`, null, 'Code 101');
  }

  @fact() 'throw Code 102 (DoubleDot)'(
    @combiData('$parent', '$parent.$parent') start: string,
    @combiData('..', '...') middle: string,
    @combiData('', 'bar', '$parent') end: string,
  ) {
    verifyResultOrError(`${start}${middle}${end}`, null, 'Code 102');
  }

  @fact() 'throw Code 103 (InvalidMemberExpression)'(
    @combiData('!', ' of', ' typeof', '=') nonTerminal: string,
  ) {
    verifyResultOrError(`$parent${nonTerminal}`, null, 'Code 103');
  }

  @fact() 'throw Code 104 (UnexpectedEndOfExpression)'(
    @combiData('!', '(', '+', '-', '.', '[', 'typeof') op: string,
  ) {
    verifyResultOrError(op, null, 'Code 104');
  }

  @fact() 'throw Code 105 (ExpectedIdentifier) on trailing dot'(
    @combiData(...SimpleIsLeftHandSideList) [input, expr]: [string, any],
  ) {
    if (typeof expr['value'] !== 'number' || input.includes('.')) { // only non-float numbers are allowed to end on a dot
      verifyResultOrError(`${input}.`, null, 'Code 105');
    } else {
      verifyResultOrError(`${input}.`, expr, null);
    }
  }

  @fact() 'throw Code 105 (ExpectedIdentifier) on trailing dots'(
    @combiData(...SimpleIsNativeLeftHandSideList) [input, expr]: [string, any],
    @combiData('..', '...') dots: string,
  ) {
    verifyResultOrError(`${input}${dots}`, null, 'Code 105');
  }

  @fact() 'throw Code 105 (ExpectedIdentifier) on leading and trailing dots'(
    @combiData('.1.', '.1..') input: string,
  ) {
    verifyResultOrError(input, null, 'Code 105');
  }

  @fact() 'throw Code 106 (InvalidForDeclaration)'(
    @combiData(
      ...SimpleIsBindingBehaviorList,
      [`a`, new BindingIdentifier('a')],
    ) [input]: [string],
  ) {
    verifyResultOrError(input, null, 'Code 106', BindingType.ForCommand);
  }

  @fact() 'throw Code 107 (InvalidObjectLiteralPropertyDefinition)'(
    @combiData('{', '{[]}', '{[}', '{[a]}', '{[a}', '{{', '{(') input: string,
  ) {
    verifyResultOrError(input, null, 'Code 107');
  }

  @fact() 'throw Code 108 (UnterminatedQuote)'(
    @combiData('"', '\'') input: string,
  ) {
    verifyResultOrError(input, null, 'Code 108');
  }

  @fact() 'throw Code 109 (UnterminatedTemplate)'(
    @combiData('`', '` ', `\`\${a}`) input: string,
  ) {
    verifyResultOrError(input, null, 'Code 109');
  }

  @fact() 'throw Code 110 (MissingExpectedToken) on missing terminal'(
    @combiData(...SimpleIsAssignList) [input]: [string],
    @combiData('(', '[') op: string,
  ) {
    verifyResultOrError(`${op}${input}`, null, 'Code 110');
  }

  @fact() 'throw Code 110 (MissingExpectedToken) on missing colon'(
    @combiData(...SimpleIsConditionalList) [input]: [string],
  ) {
    verifyResultOrError(`${input}?${input}`, null, 'Code 110');
  }

  @fact() 'throw Code 110 (MissingExpectedToken) on missing brace'(
    @combiData(...AccessScopeList) [input]: [string],
  ) {
    verifyResultOrError(`{${input}`, null, 'Code 110');
  }

  @fact() 'throw Code 110 (MissingExpectedToken) on object literal shorthand with primitives'(
    @combiData(...SimpleStringLiteralList) [input]: [string],
  ) {
    verifyResultOrError(`{${input}}`, null, 'Code 110');
  }

  @fact() 'throw Code 110 (MissingExpectedToken) on invalid object literal'(
    @combiData('{24}', '{24, 24}', '{\'\'}', '{a.b}', '{a[b]}', '{a()}') input: string,
  ) {
    verifyResultOrError(input, null, 'Code 110');
  }

  @fact() 'throw Code 111 (UnexpectedCharacter)'(
    @combiData('#', ';', '@', '^', '~', '\\', 'foo;') input: string,
  ) {
    verifyResultOrError(input, null, 'Code 111');
  }

  @fact() 'throw Code 112 (MissingValueConverter)'(
    @combiData(...SimpleIsAssignList) [input]: [string],
  ) {
    verifyResultOrError(`${input}|`, null, 'Code 112');
  }

  @fact() 'throw Code 113 (MissingBindingBehavior)'(
    @combiData(...SimpleIsAssignList) [input]: [string],
  ) {
    verifyResultOrError(`${input}&`, null, 'Code 113');
  }

  @fact() 'throw Code 150 (NotAssignable)'(
    @combiData(
      [`$this`, $this],
      ...SimpleLiteralList,
      ...SimpleUnaryList
    ) [input]: [string],
  ) {
    verifyResultOrError(`${input}=a`, null, 'Code 150');
  }

  @fact() 'throw Code 151 (UnexpectedForOf)'(
    @combiData(...SimpleIsBindingBehaviorList.filter(([, e]) => !e.ancestor)) [input]: [string],
  ) {
    verifyResultOrError(`${input} of`, null, 'Code 151');
  }

  @fact() 'unknown unicode IdentifierPart'(
    @combiData(...otherBMPIdentifierPartChars) char: string,
  ) {
    verifyResultOrError(`$${char}`, null, codes.UnexpectedCharacter);
  }
}

// #endregion
