import { Profiler, Reporter } from '@aurelia/kernel';
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
  BindingIdentifierOrPattern,
  BindingType,
  CallFunctionExpression,
  CallMemberExpression,
  CallScopeExpression,
  ConditionalExpression,
  CustomExpression,
  ExpressionKind,
  ForOfStatement,
  IForOfStatement,
  IInterpolationExpression,
  Interpolation,
  IPrimitiveLiteralExpression,
  IsAssign,
  IsAssignable,
  IsBinary,
  IsBindingBehavior,
  IsConditional,
  IsExpressionOrStatement,
  IsLeftHandSide,
  IsPrimary,
  IsUnary,
  IsValueConverter,
  ObjectBindingPattern,
  ObjectLiteralExpression,
  PrimitiveLiteralExpression,
  TaggedTemplateExpression,
  TemplateExpression,
  UnaryExpression,
  UnaryOperator,
  ValueConverterExpression
} from '@aurelia/runtime';
import { Char } from '@aurelia/kernel';
import { Access, Precedence, Token, unescapeCode } from './common';

const $false = PrimitiveLiteralExpression.$false;
const $true = PrimitiveLiteralExpression.$true;
const $null = PrimitiveLiteralExpression.$null;
const $undefined = PrimitiveLiteralExpression.$undefined;
const $this = AccessThisExpression.$this;
const $parent = AccessThisExpression.$parent;

/** @internal */
export class ParserState {
  public index: number = 0;
  public startIndex: number = 0;
  public lastIndex: number = 0;
  public length: number;
  public currentToken: Token = Token.EOF;
  public tokenValue: string | number = '';
  public currentChar: number;
  public assignable: boolean = true;
  public get tokenRaw(): string {
    return this.input.slice(this.startIndex, this.index);
  }

  public constructor(
    public input: string,
  ) {
    this.length = input.length;
    this.currentChar = input.charCodeAt(0);
  }
}

const $state = new ParserState('');

const enum SyntaxError {
  InvalidExpressionStart = 100,
  UnconsumedToken = 101,
  DoubleDot = 102,
  InvalidMemberExpression = 103,
  UnexpectedEndOfExpression = 104,
  ExpectedIdentifier = 105,
  InvalidForDeclaration = 106,
  InvalidObjectLiteralPropertyDefinition = 107,
  UnterminatedQuote = 108,
  UnterminatedTemplate = 109,
  MissingExpectedToken = 110,
  UnexpectedCharacter = 111,
  MissingValueConverter = 112,
  MissingBindingBehavior = 113
}

const enum SemanticError {
  NotAssignable = 150,
  UnexpectedForOf = 151
}

export function parseExpression<TType extends BindingType = BindingType.BindCommand>(input: string, bindingType?: TType):
TType extends BindingType.Interpolation ? IInterpolationExpression :
  TType extends BindingType.ForCommand ? IForOfStatement :
    IsBindingBehavior {

  $state.input = input;
  $state.length = input.length;
  $state.index = 0;
  $state.currentChar = input.charCodeAt(0);
  return parse($state, Access.Reset, Precedence.Variadic, bindingType === void 0 ? BindingType.BindCommand : bindingType);
}

/** @internal */
// JUSTIFICATION: This is performance-critical code which follows a subset of the well-known ES spec.
// Knowing the spec, or parsers in general, will help with understanding this code and it is therefore not the
// single source of information for being able to figure it out.
// It generally does not need to change unless the spec changes or spec violations are found, or optimization
// opportunities are found (which would likely not fix these warnings in any case).
// It's therefore not considered to have any tangible impact on the maintainability of the code base.
// For reference, most of the parsing logic is based on: https://tc39.github.io/ecma262/#sec-ecmascript-language-expressions
// eslint-disable-next-line max-lines-per-function
export function parse<TPrec extends Precedence, TType extends BindingType>(state: ParserState, access: Access, minPrecedence: TPrec, bindingType: TType):
TPrec extends Precedence.Unary ? IsUnary :
  TPrec extends Precedence.Binary ? IsBinary :
    TPrec extends Precedence.LeftHandSide ? IsLeftHandSide :
      TPrec extends Precedence.Assign ? IsAssign :
        TPrec extends Precedence.Conditional ? IsConditional :
          TPrec extends Precedence.Primary ? IsPrimary :
            TPrec extends Precedence.Multiplicative ? IsBinary :
              TPrec extends Precedence.Additive ? IsBinary :
                TPrec extends Precedence.Relational ? IsBinary :
                  TPrec extends Precedence.Equality ? IsBinary :
                    TPrec extends Precedence.LogicalAND ? IsBinary :
                      TPrec extends Precedence.LogicalOR ? IsBinary :
                        TPrec extends Precedence.Variadic ?
                          TType extends BindingType.Interpolation ? IInterpolationExpression :
                            TType extends BindingType.ForCommand ? IForOfStatement :
                              never : never {

  if (bindingType === BindingType.CustomCommand) {
    return new CustomExpression(state.input) as any;
  }

  if (state.index === 0) {
    if (bindingType & BindingType.Interpolation) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parseInterpolation(state) as any;
    }
    nextToken(state);
    if (state.currentToken & Token.ExpressionTerminal) {
      throw Reporter.error(SyntaxError.InvalidExpressionStart, { state });
    }
  }

  state.assignable = Precedence.Binary > minPrecedence;
  let result = void 0 as unknown as IsExpressionOrStatement;

  if (state.currentToken & Token.UnaryOp) {
    /** parseUnaryExpression
     * https://tc39.github.io/ecma262/#sec-unary-operators
     *
     * UnaryExpression :
     * 1. LeftHandSideExpression
     * 2. void UnaryExpression
     * 3. typeof UnaryExpression
     * 4. + UnaryExpression
     * 5. - UnaryExpression
     * 6. ! UnaryExpression
     *
     * IsValidAssignmentTarget
     * 2,3,4,5,6 = false
     * 1 = see parseLeftHandSideExpression
     *
     * Note: technically we should throw on ++ / -- / +++ / ---, but there's nothing to gain from that
     */
    const op = TokenValues[state.currentToken & Token.Type] as UnaryOperator;
    nextToken(state);
    result = new UnaryExpression(op, parse(state, access, Precedence.LeftHandSide, bindingType));
    state.assignable = false;
  } else {
    /** parsePrimaryExpression
     * https://tc39.github.io/ecma262/#sec-primary-expression
     *
     * PrimaryExpression :
     * 1. this
     * 2. IdentifierName
     * 3. Literal
     * 4. ArrayLiteralExpression
     * 5. ObjectLiteralExpression
     * 6. TemplateLiteral
     * 7. ParenthesizedExpression
     *
     * Literal :
     * NullLiteral
     * BooleanLiteral
     * NumericLiteral
     * StringLiteral
     *
     * ParenthesizedExpression :
     * ( AssignmentExpression )
     *
     * IsValidAssignmentTarget
     * 1,3,4,5,6,7 = false
     * 2 = true
     */
    primary: switch (state.currentToken) {
      case Token.ParentScope: // $parent
        state.assignable = false;
        do {
          nextToken(state);
          access++; // ancestor
          if (consumeOpt(state, Token.Dot)) {
            if ((state.currentToken as Token) === Token.Dot) {
              throw Reporter.error(SyntaxError.DoubleDot, { state });
            } else if ((state.currentToken as Token) === Token.EOF) {
              throw Reporter.error(SyntaxError.ExpectedIdentifier, { state });
            }
          } else if (state.currentToken & Token.AccessScopeTerminal) {
            const ancestor = access & Access.Ancestor;
            result = ancestor === 0 ? $this : ancestor === 1 ? $parent : new AccessThisExpression(ancestor);
            access = Access.This;
            break primary;
          } else {
            throw Reporter.error(SyntaxError.InvalidMemberExpression, { state });
          }
        } while (state.currentToken === Token.ParentScope);
        // falls through
      case Token.Identifier: // identifier
        if (bindingType & BindingType.IsIterator) {
          result = new BindingIdentifier(state.tokenValue as string);
        } else {
          result = new AccessScopeExpression(state.tokenValue as string, access & Access.Ancestor);
          access = Access.Scope;
        }
        state.assignable = true;
        nextToken(state);
        break;
      case Token.ThisScope: // $this
        state.assignable = false;
        nextToken(state);
        result = $this;
        access = Access.This;
        break;
      case Token.OpenParen: // parenthesized expression
        nextToken(state);
        result = parse(state, Access.Reset, Precedence.Assign, bindingType);
        consume(state, Token.CloseParen);
        access = Access.Reset;
        break;
      case Token.OpenBracket:
        result = parseArrayLiteralExpression(state, access, bindingType);
        access = Access.Reset;
        break;
      case Token.OpenBrace:
        result = parseObjectLiteralExpression(state, bindingType);
        access = Access.Reset;
        break;
      case Token.TemplateTail:
        result = new TemplateExpression([state.tokenValue as string]);
        state.assignable = false;
        nextToken(state);
        access = Access.Reset;
        break;
      case Token.TemplateContinuation:
        result = parseTemplate(state, access, bindingType, result as IsLeftHandSide, false);
        access = Access.Reset;
        break;
      case Token.StringLiteral:
      case Token.NumericLiteral:
        result = new PrimitiveLiteralExpression(state.tokenValue);
        state.assignable = false;
        nextToken(state);
        access = Access.Reset;
        break;
      case Token.NullKeyword:
      case Token.UndefinedKeyword:
      case Token.TrueKeyword:
      case Token.FalseKeyword:
        result = TokenValues[state.currentToken & Token.Type] as IPrimitiveLiteralExpression;
        state.assignable = false;
        nextToken(state);
        access = Access.Reset;
        break;
      default:
        if (state.index >= state.length) {
          throw Reporter.error(SyntaxError.UnexpectedEndOfExpression, { state });
        } else {
          throw Reporter.error(SyntaxError.UnconsumedToken, { state });
        }
    }

    if (bindingType & BindingType.IsIterator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parseForOfStatement(state, result as BindingIdentifierOrPattern) as any;
    }
    if (Precedence.LeftHandSide < minPrecedence) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return result as any;
    }

    /** parseMemberExpression (Token.Dot, Token.OpenBracket, Token.TemplateContinuation)
     * MemberExpression :
     * 1. PrimaryExpression
     * 2. MemberExpression [ AssignmentExpression ]
     * 3. MemberExpression . IdentifierName
     * 4. MemberExpression TemplateLiteral
     *
     * IsValidAssignmentTarget
     * 1,4 = false
     * 2,3 = true
     *
     *
     * parseCallExpression (Token.OpenParen)
     * CallExpression :
     * 1. MemberExpression Arguments
     * 2. CallExpression Arguments
     * 3. CallExpression [ AssignmentExpression ]
     * 4. CallExpression . IdentifierName
     * 5. CallExpression TemplateLiteral
     *
     * IsValidAssignmentTarget
     * 1,2,5 = false
     * 3,4 = true
     */
    let name = state.tokenValue as string;
    while ((state.currentToken & Token.LeftHandSide) > 0) {
      const args: IsAssign[] = [];
      let strings: string[];
      switch ((state.currentToken as Token)) {
        case Token.Dot:
          state.assignable = true;
          nextToken(state);
          if ((state.currentToken & Token.IdentifierName) === 0) {
            throw Reporter.error(SyntaxError.ExpectedIdentifier, { state });
          }
          name = state.tokenValue as string;
          nextToken(state);
          // Change $This to $Scope, change $Scope to $Member, keep $Member as-is, change $Keyed to $Member, disregard other flags
          access = ((access & (Access.This | Access.Scope)) << 1) | (access & Access.Member) | ((access & Access.Keyed) >> 1);
          if ((state.currentToken as Token) === Token.OpenParen) {
            if (access === Access.Reset) { // if the left hand side is a literal, make sure we parse a CallMemberExpression
              access = Access.Member;
            }
            continue;
          }
          if (access & Access.Scope) {
            result = new AccessScopeExpression(name, (result as AccessScopeExpression | AccessThisExpression).ancestor);
          } else { // if it's not $Scope, it's $Member
            result = new AccessMemberExpression(result as IsLeftHandSide, name);
          }
          continue;
        case Token.OpenBracket:
          state.assignable = true;
          nextToken(state);
          access = Access.Keyed;
          result = new AccessKeyedExpression(result as IsLeftHandSide, parse(state, Access.Reset, Precedence.Assign, bindingType));
          consume(state, Token.CloseBracket);
          break;
        case Token.OpenParen:
          state.assignable = false;
          nextToken(state);
          while ((state.currentToken as Token) !== Token.CloseParen) {
            args.push(parse(state, Access.Reset, Precedence.Assign, bindingType));
            if (!consumeOpt(state, Token.Comma)) {
              break;
            }
          }
          consume(state, Token.CloseParen);
          if (access & Access.Scope) {
            result = new CallScopeExpression(name, args, (result as AccessScopeExpression | AccessThisExpression).ancestor);
          } else if (access & Access.Member) {
            result = new CallMemberExpression(result as IsLeftHandSide, name, args);
          } else {
            result = new CallFunctionExpression(result as IsLeftHandSide, args);
          }
          access = 0;
          break;
        case Token.TemplateTail:
          state.assignable = false;
          strings = [state.tokenValue as string];
          result = new TaggedTemplateExpression(strings, strings, result as IsLeftHandSide);
          nextToken(state);
          break;
        case Token.TemplateContinuation:
          result = parseTemplate(state, access, bindingType, result as IsLeftHandSide, true);
        default:
      }
    }
  }

  if (Precedence.Binary < minPrecedence) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result as any;
  }

  /** parseBinaryExpression
   * https://tc39.github.io/ecma262/#sec-multiplicative-operators
   *
   * MultiplicativeExpression : (local precedence 6)
   * UnaryExpression
   * MultiplicativeExpression * / % UnaryExpression
   *
   * AdditiveExpression : (local precedence 5)
   * MultiplicativeExpression
   * AdditiveExpression + - MultiplicativeExpression
   *
   * RelationalExpression : (local precedence 4)
   * AdditiveExpression
   * RelationalExpression < > <= >= instanceof in AdditiveExpression
   *
   * EqualityExpression : (local precedence 3)
   * RelationalExpression
   * EqualityExpression == != === !== RelationalExpression
   *
   * LogicalANDExpression : (local precedence 2)
   * EqualityExpression
   * LogicalANDExpression && EqualityExpression
   *
   * LogicalORExpression : (local precedence 1)
   * LogicalANDExpression
   * LogicalORExpression || LogicalANDExpression
   */
  while ((state.currentToken & Token.BinaryOp) > 0) {
    const opToken = state.currentToken;
    if ((opToken & Token.Precedence) <= minPrecedence) {
      break;
    }
    nextToken(state);
    result = new BinaryExpression(TokenValues[opToken & Token.Type] as BinaryOperator, result as IsBinary, parse(state, access, opToken & Token.Precedence, bindingType));
    state.assignable = false;
  }
  if (Precedence.Conditional < minPrecedence) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result as any;
  }

  /**
   * parseConditionalExpression
   * https://tc39.github.io/ecma262/#prod-ConditionalExpression
   *
   * ConditionalExpression :
   * 1. BinaryExpression
   * 2. BinaryExpression ? AssignmentExpression : AssignmentExpression
   *
   * IsValidAssignmentTarget
   * 1,2 = false
   */

  if (consumeOpt(state, Token.Question)) {
    const yes = parse(state, access, Precedence.Assign, bindingType);
    consume(state, Token.Colon);
    result = new ConditionalExpression(result as IsBinary, yes, parse(state, access, Precedence.Assign, bindingType));
    state.assignable = false;
  }
  if (Precedence.Assign < minPrecedence) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result as any;
  }

  /** parseAssignmentExpression
   * https://tc39.github.io/ecma262/#prod-AssignmentExpression
   * Note: AssignmentExpression here is equivalent to ES Expression because we don't parse the comma operator
   *
   * AssignmentExpression :
   * 1. ConditionalExpression
   * 2. LeftHandSideExpression = AssignmentExpression
   *
   * IsValidAssignmentTarget
   * 1,2 = false
   */
  if (consumeOpt(state, Token.Equals)) {
    if (!state.assignable) {
      throw Reporter.error(SemanticError.NotAssignable, { state });
    }
    result = new AssignExpression(result as IsAssignable, parse(state, access, Precedence.Assign, bindingType));
  }
  if (Precedence.Variadic < minPrecedence) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result as any;
  }

  /** parseValueConverter
   */
  while (consumeOpt(state, Token.Bar)) {
    if (state.currentToken === Token.EOF) {
      throw Reporter.error(112);
    }
    const name = state.tokenValue as string;
    nextToken(state);
    const args = new Array<IsAssign>();
    while (consumeOpt(state, Token.Colon)) {
      args.push(parse(state, access, Precedence.Assign, bindingType));
    }
    result = new ValueConverterExpression(result as IsValueConverter, name, args);
  }

  /** parseBindingBehavior
   */
  while (consumeOpt(state, Token.Ampersand)) {
    if (state.currentToken === Token.EOF) {
      throw Reporter.error(113);
    }
    const name = state.tokenValue as string;
    nextToken(state);
    const args = new Array<IsAssign>();
    while (consumeOpt(state, Token.Colon)) {
      args.push(parse(state, access, Precedence.Assign, bindingType));
    }
    result = new BindingBehaviorExpression(result as IsBindingBehavior, name, args);
  }
  if (state.currentToken !== Token.EOF) {
    if (bindingType & BindingType.Interpolation) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return result as any;
    }
    if (state.tokenRaw === 'of') {
      throw Reporter.error(SemanticError.UnexpectedForOf, { state });
    }
    throw Reporter.error(SyntaxError.UnconsumedToken, { state });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result as any;
}

/**
 * parseArrayLiteralExpression
 * https://tc39.github.io/ecma262/#prod-ArrayLiteralExpression
 *
 * ArrayLiteralExpression :
 * [ Elision(opt) ]
 * [ ElementList ]
 * [ ElementList, Elision(opt) ]
 *
 * ElementList :
 * Elision(opt) AssignmentExpression
 * ElementList, Elision(opt) AssignmentExpression
 *
 * Elision :
 * ,
 * Elision ,
 */
function parseArrayLiteralExpression(state: ParserState, access: Access, bindingType: BindingType): ArrayBindingPattern | ArrayLiteralExpression {
  nextToken(state);
  const elements = new Array<IsAssign>();
  while (state.currentToken !== Token.CloseBracket) {
    if (consumeOpt(state, Token.Comma)) {
      elements.push($undefined);
      if ((state.currentToken as Token) === Token.CloseBracket) {
        break;
      }
    } else {
      elements.push(parse(state, access, Precedence.Assign, bindingType & ~BindingType.IsIterator));
      if (consumeOpt(state, Token.Comma)) {
        if ((state.currentToken as Token) === Token.CloseBracket) {
          break;
        }
      } else {
        break;
      }
    }
  }
  consume(state, Token.CloseBracket);
  if (bindingType & BindingType.IsIterator) {
    return new ArrayBindingPattern(elements);
  } else {
    state.assignable = false;
    return new ArrayLiteralExpression(elements);
  }
}

function parseForOfStatement(state: ParserState, result: BindingIdentifierOrPattern): ForOfStatement {
  if ((result.$kind & ExpressionKind.IsForDeclaration) === 0) {
    throw Reporter.error(SyntaxError.InvalidForDeclaration, { state });
  }
  if (state.currentToken !== Token.OfKeyword) {
    throw Reporter.error(SyntaxError.InvalidForDeclaration, { state });
  }
  nextToken(state);
  const declaration = result;
  const statement = parse(state, Access.Reset, Precedence.Variadic, BindingType.None);
  return new ForOfStatement(declaration, statement as IsBindingBehavior);
}

/**
 * parseObjectLiteralExpression
 * https://tc39.github.io/ecma262/#prod-Literal
 *
 * ObjectLiteralExpression :
 * { }
 * { PropertyDefinitionList }
 *
 * PropertyDefinitionList :
 * PropertyDefinition
 * PropertyDefinitionList, PropertyDefinition
 *
 * PropertyDefinition :
 * IdentifierName
 * PropertyName : AssignmentExpression
 *
 * PropertyName :
 * IdentifierName
 * StringLiteral
 * NumericLiteral
 */
function parseObjectLiteralExpression(state: ParserState, bindingType: BindingType): ObjectBindingPattern | ObjectLiteralExpression {
  const keys = new Array<string | number>();
  const values = new Array<IsAssign>();
  nextToken(state);
  while (state.currentToken !== Token.CloseBrace) {
    keys.push(state.tokenValue);
    // Literal = mandatory colon
    if (state.currentToken & Token.StringOrNumericLiteral) {
      nextToken(state);
      consume(state, Token.Colon);
      values.push(parse(state, Access.Reset, Precedence.Assign, bindingType & ~BindingType.IsIterator));
    } else if (state.currentToken & Token.IdentifierName) {
      // IdentifierName = optional colon
      const { currentChar, currentToken, index } = state;
      nextToken(state);
      if (consumeOpt(state, Token.Colon)) {
        values.push(parse(state, Access.Reset, Precedence.Assign, bindingType & ~BindingType.IsIterator));
      } else {
        // Shorthand
        state.currentChar = currentChar;
        state.currentToken = currentToken;
        state.index = index;
        values.push(parse(state, Access.Reset, Precedence.Primary, bindingType & ~BindingType.IsIterator));
      }
    } else {
      throw Reporter.error(SyntaxError.InvalidObjectLiteralPropertyDefinition, { state });
    }
    if ((state.currentToken as Token) !== Token.CloseBrace) {
      consume(state, Token.Comma);
    }
  }
  consume(state, Token.CloseBrace);
  if (bindingType & BindingType.IsIterator) {
    return new ObjectBindingPattern(keys, values);
  } else {
    state.assignable = false;
    return new ObjectLiteralExpression(keys, values);
  }
}

function parseInterpolation(state: ParserState): Interpolation {
  const parts = [];
  const expressions: (IsBindingBehavior | IInterpolationExpression)[] = [];
  const length = state.length;
  let result = '';
  while (state.index < length) {
    switch (state.currentChar) {
      case Char.Dollar:
        if (state.input.charCodeAt(state.index + 1) === Char.OpenBrace) {
          parts.push(result);
          result = '';

          state.index += 2;
          state.currentChar = state.input.charCodeAt(state.index);
          nextToken(state);
          const expression = parse(state, Access.Reset, Precedence.Variadic, BindingType.Interpolation);
          expressions.push(expression);
          continue;
        } else {
          result += '$';
        }
        break;
      case Char.Backslash:
        result += String.fromCharCode(unescapeCode(nextChar(state)));
        break;
      default:
        result += String.fromCharCode(state.currentChar);
    }
    nextChar(state);
  }
  if (expressions.length) {
    parts.push(result);
    return new Interpolation(parts, expressions as IsBindingBehavior[]);
  }
  return null!;
}

/**
 * parseTemplateLiteralExpression
 * https://tc39.github.io/ecma262/#prod-Literal
 *
 * TemplateExpression :
 * NoSubstitutionTemplate
 * TemplateHead
 *
 * NoSubstitutionTemplate :
 * ` TemplateCharacters(opt) `
 *
 * TemplateHead :
 * ` TemplateCharacters(opt) ${
 *
 * TemplateSubstitutionTail :
 * TemplateMiddle
 * TemplateTail
 *
 * TemplateMiddle :
 * } TemplateCharacters(opt) ${
 *
 * TemplateTail :
 * } TemplateCharacters(opt) `
 *
 * TemplateCharacters :
 * TemplateCharacter TemplateCharacters(opt)
 *
 * TemplateCharacter :
 * $ [lookahead ≠ {]
 * \ EscapeSequence
 * SourceCharacter (but not one of ` or \ or $)
 */
function parseTemplate(state: ParserState, access: Access, bindingType: BindingType, result: IsLeftHandSide, tagged: boolean): TaggedTemplateExpression | TemplateExpression {
  const cooked = [state.tokenValue as string];
  // TODO: properly implement raw parts / decide whether we want this
  consume(state, Token.TemplateContinuation);
  const expressions = [parse(state, access, Precedence.Assign, bindingType)];
  while ((state.currentToken = scanTemplateTail(state)) !== Token.TemplateTail) {
    cooked.push(state.tokenValue as string);
    consume(state, Token.TemplateContinuation);
    expressions.push(parse(state, access, Precedence.Assign, bindingType));
  }
  cooked.push(state.tokenValue as string);
  state.assignable = false;
  if (tagged) {
    nextToken(state);
    return new TaggedTemplateExpression(cooked, cooked, result, expressions);
  } else {
    nextToken(state);
    return new TemplateExpression(cooked, expressions);
  }
}

function nextToken(state: ParserState): void {
  while (state.index < state.length) {
    state.startIndex = state.index;
    if ((state.currentToken = (CharScanners[state.currentChar](state)) as Token) != null) { // a null token means the character must be skipped
      return;
    }
  }
  state.currentToken = Token.EOF;
}

function nextChar(state: ParserState): number {
  return state.currentChar = state.input.charCodeAt(++state.index);
}

function scanIdentifier(state: ParserState): Token {
  // run to the next non-idPart
  while (IdParts[nextChar(state)]);

  const token: Token|undefined = KeywordLookup[state.tokenValue = state.tokenRaw];
  return token === undefined ? Token.Identifier : token;
}

function scanNumber(state: ParserState, isFloat: boolean): Token {
  let char = state.currentChar;
  if (isFloat === false) {
    do {
      char = nextChar(state);
    } while (char <= Char.Nine && char >= Char.Zero);

    if (char !== Char.Dot) {
      state.tokenValue = parseInt(state.tokenRaw, 10);
      return Token.NumericLiteral;
    }
    // past this point it's always a float
    char = nextChar(state);
    if (state.index >= state.length) {
      // unless the number ends with a dot - that behaves a little different in native ES expressions
      // but in our AST that behavior has no effect because numbers are always stored in variables
      state.tokenValue = parseInt(state.tokenRaw.slice(0, -1), 10);
      return Token.NumericLiteral;
    }
  }

  if (char <= Char.Nine && char >= Char.Zero) {
    do {
      char = nextChar(state);
    } while (char <= Char.Nine && char >= Char.Zero);
  } else {
    state.currentChar = state.input.charCodeAt(--state.index);
  }

  state.tokenValue = parseFloat(state.tokenRaw);
  return Token.NumericLiteral;
}

function scanString(state: ParserState): Token {
  const quote = state.currentChar;
  nextChar(state); // Skip initial quote.

  let unescaped = 0;
  const buffer = new Array<string>();
  let marker = state.index;

  while (state.currentChar !== quote) {
    if (state.currentChar === Char.Backslash) {
      buffer.push(state.input.slice(marker, state.index));
      nextChar(state);
      unescaped = unescapeCode(state.currentChar);
      nextChar(state);
      buffer.push(String.fromCharCode(unescaped));
      marker = state.index;
    } else if (state.index >= state.length) {
      throw Reporter.error(SyntaxError.UnterminatedQuote, { state });
    } else {
      nextChar(state);
    }
  }

  const last = state.input.slice(marker, state.index);
  nextChar(state); // Skip terminating quote.

  // Compute the unescaped string value.
  buffer.push(last);
  const unescapedStr = buffer.join('');

  state.tokenValue = unescapedStr;
  return Token.StringLiteral;
}

function scanTemplate(state: ParserState): Token {
  let tail = true;
  let result = '';

  while (nextChar(state) !== Char.Backtick) {
    if (state.currentChar === Char.Dollar) {
      if ((state.index + 1) < state.length && state.input.charCodeAt(state.index + 1) === Char.OpenBrace) {
        state.index++;
        tail = false;
        break;
      } else {
        result += '$';
      }
    } else if (state.currentChar === Char.Backslash) {
      result += String.fromCharCode(unescapeCode(nextChar(state)));
    } else {
      if (state.index >= state.length) {
        throw Reporter.error(SyntaxError.UnterminatedTemplate, { state });
      }
      result += String.fromCharCode(state.currentChar);
    }
  }

  nextChar(state);
  state.tokenValue = result;
  if (tail) {
    return Token.TemplateTail;
  }
  return Token.TemplateContinuation;
}

function scanTemplateTail(state: ParserState): Token {
  if (state.index >= state.length) {
    throw Reporter.error(SyntaxError.UnterminatedTemplate, { state });
  }
  state.index--;
  return scanTemplate(state);
}

function consumeOpt(state: ParserState, token: Token): boolean {
  if (state.currentToken === token) {
    nextToken(state);
    return true;
  }

  return false;
}

function consume(state: ParserState, token: Token): void {
  if (state.currentToken === token) {
    nextToken(state);
  } else {
    throw Reporter.error(SyntaxError.MissingExpectedToken, { state, expected: token });
  }
}

/**
 * Array for mapping tokens to token values. The indices of the values
 * correspond to the token bits 0-38.
 * For this to work properly, the values in the array must be kept in
 * the same order as the token bits.
 * Usage: TokenValues[token & Token.Type]
 */
const TokenValues = [
  $false, $true, $null, $undefined, '$this', '$parent',

  '(', '{', '.', '}', ')', ',', '[', ']', ':', '?', '\'', '"',

  '&', '|', '||', '&&', '==', '!=', '===', '!==', '<', '>',
  '<=', '>=', 'in', 'instanceof', '+', '-', 'typeof', 'void', '*', '%', '/', '=', '!',
  Token.TemplateTail, Token.TemplateContinuation,
  'of'
];

const KeywordLookup: {
  [key: string]: Token;
} = Object.create(null);
KeywordLookup.true = Token.TrueKeyword;
KeywordLookup.null = Token.NullKeyword;
KeywordLookup.false = Token.FalseKeyword;
KeywordLookup.undefined = Token.UndefinedKeyword;
KeywordLookup.$this = Token.ThisScope;
KeywordLookup.$parent = Token.ParentScope;
KeywordLookup.in = Token.InKeyword;
KeywordLookup.instanceof = Token.InstanceOfKeyword;
KeywordLookup.typeof = Token.TypeofKeyword;
KeywordLookup.void = Token.VoidKeyword;
KeywordLookup.of = Token.OfKeyword;

/**
 * Ranges of code points in pairs of 2 (eg 0x41-0x5B, 0x61-0x7B, ...) where the second value is not inclusive (5-7 means 5 and 6)
 * Single values are denoted by the second value being a 0
 *
 * Copied from output generated with "node build/generate-unicode.js"
 *
 * See also: https://en.wikibooks.org/wiki/Unicode/Character_reference/0000-0FFF
 */
const codes = {
  /* [$0-9A-Za_a-z] */
  AsciiIdPart: [0x24, 0, 0x30, 0x3A, 0x41, 0x5B, 0x5F, 0, 0x61, 0x7B],
  IdStart: /* IdentifierStart */[0x24, 0, 0x41, 0x5B, 0x5F, 0, 0x61, 0x7B, 0xAA, 0, 0xBA, 0, 0xC0, 0xD7, 0xD8, 0xF7, 0xF8, 0x2B9, 0x2E0, 0x2E5, 0x1D00, 0x1D26, 0x1D2C, 0x1D5D, 0x1D62, 0x1D66, 0x1D6B, 0x1D78, 0x1D79, 0x1DBF, 0x1E00, 0x1F00, 0x2071, 0, 0x207F, 0, 0x2090, 0x209D, 0x212A, 0x212C, 0x2132, 0, 0x214E, 0, 0x2160, 0x2189, 0x2C60, 0x2C80, 0xA722, 0xA788, 0xA78B, 0xA7AF, 0xA7B0, 0xA7B8, 0xA7F7, 0xA800, 0xAB30, 0xAB5B, 0xAB5C, 0xAB65, 0xFB00, 0xFB07, 0xFF21, 0xFF3B, 0xFF41, 0xFF5B],
  Digit: /* DecimalNumber */[0x30, 0x3A],
  Skip: /* Skippable */[0, 0x21, 0x7F, 0xA1]
};

/**
 * Decompress the ranges into an array of numbers so that the char code
 * can be used as an index to the lookup
 */
function decompress(lookup: (CharScanner | number)[] | null, $set: Set<number> | null, compressed: number[], value: CharScanner | number | boolean): void {
  const rangeCount = compressed.length;
  for (let i = 0; i < rangeCount; i += 2) {
    const start = compressed[i];
    let end = compressed[i + 1];
    end = end > 0 ? end : start + 1;
    if (lookup) {
      lookup.fill(value as CharScanner | number, start, end);
    }
    if ($set) {
      for (let ch = start; ch < end; ch++) {
        $set.add(ch);
      }
    }
  }
}

// CharFuncLookup functions
function returnToken(token: Token): (s: ParserState) => Token {
  return s => {
    nextChar(s);
    return token;
  };
}
const unexpectedCharacter: CharScanner = s => {
  throw Reporter.error(SyntaxError.UnexpectedCharacter, { state: s });
};
unexpectedCharacter.notMapped = true;

// ASCII IdentifierPart lookup
const AsciiIdParts = new Set<number>();
decompress(null, AsciiIdParts, codes.AsciiIdPart, true);

// IdentifierPart lookup
const IdParts = new Uint8Array(0xFFFF);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
decompress(IdParts as any, null, codes.IdStart, 1);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
decompress(IdParts as any, null, codes.Digit, 1);

type CharScanner = ((p: ParserState) => Token | null) & { notMapped?: boolean };

// Character scanning function lookup
const CharScanners = new Array<CharScanner>(0xFFFF);
CharScanners.fill(unexpectedCharacter, 0, 0xFFFF);

decompress(CharScanners, null, codes.Skip, s => {
  nextChar(s);
  return null;
});
decompress(CharScanners, null, codes.IdStart, scanIdentifier);
decompress(CharScanners, null, codes.Digit, s => scanNumber(s, false));

CharScanners[Char.DoubleQuote] =
CharScanners[Char.SingleQuote] = s => {
  return scanString(s);
};
CharScanners[Char.Backtick] = s => {
  return scanTemplate(s);
};

// !, !=, !==
CharScanners[Char.Exclamation] = s => {
  if (nextChar(s) !== Char.Equals) {
    return Token.Exclamation;
  }
  if (nextChar(s) !== Char.Equals) {
    return Token.ExclamationEquals;
  }
  nextChar(s);
  return Token.ExclamationEqualsEquals;
};

// =, ==, ===
CharScanners[Char.Equals] =  s => {
  if (nextChar(s) !== Char.Equals) {
    return Token.Equals;
  }
  if (nextChar(s) !== Char.Equals) {
    return Token.EqualsEquals;
  }
  nextChar(s);
  return Token.EqualsEqualsEquals;
};

// &, &&
CharScanners[Char.Ampersand] = s => {
  if (nextChar(s) !== Char.Ampersand) {
    return Token.Ampersand;
  }
  nextChar(s);
  return Token.AmpersandAmpersand;
};

// |, ||
CharScanners[Char.Bar] = s => {
  if (nextChar(s) !== Char.Bar) {
    return Token.Bar;
  }
  nextChar(s);
  return Token.BarBar;
};

// .
CharScanners[Char.Dot] = s => {
  if (nextChar(s) <= Char.Nine && s.currentChar >= Char.Zero) {
    return scanNumber(s, true);
  }
  return Token.Dot;
};

// <, <=
CharScanners[Char.LessThan] =  s => {
  if (nextChar(s) !== Char.Equals) {
    return Token.LessThan;
  }
  nextChar(s);
  return Token.LessThanEquals;
};

// >, >=
CharScanners[Char.GreaterThan] =  s => {
  if (nextChar(s) !== Char.Equals) {
    return Token.GreaterThan;
  }
  nextChar(s);
  return Token.GreaterThanEquals;
};

CharScanners[Char.Percent]      = returnToken(Token.Percent);
CharScanners[Char.OpenParen]    = returnToken(Token.OpenParen);
CharScanners[Char.CloseParen]   = returnToken(Token.CloseParen);
CharScanners[Char.Asterisk]     = returnToken(Token.Asterisk);
CharScanners[Char.Plus]         = returnToken(Token.Plus);
CharScanners[Char.Comma]        = returnToken(Token.Comma);
CharScanners[Char.Minus]        = returnToken(Token.Minus);
CharScanners[Char.Slash]        = returnToken(Token.Slash);
CharScanners[Char.Colon]        = returnToken(Token.Colon);
CharScanners[Char.Question]     = returnToken(Token.Question);
CharScanners[Char.OpenBracket]  = returnToken(Token.OpenBracket);
CharScanners[Char.CloseBracket] = returnToken(Token.CloseBracket);
CharScanners[Char.OpenBrace]    = returnToken(Token.OpenBrace);
CharScanners[Char.CloseBrace]   = returnToken(Token.CloseBrace);
