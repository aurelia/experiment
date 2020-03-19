import { Char } from '@aurelia/kernel';

export function unescapeCode(code: number): number {
  switch (code) {
    case Char.LowerB: return Char.Backspace;
    case Char.LowerT: return Char.Tab;
    case Char.LowerN: return Char.LineFeed;
    case Char.LowerV: return Char.VerticalTab;
    case Char.LowerF: return Char.FormFeed;
    case Char.LowerR: return Char.CarriageReturn;
    case Char.DoubleQuote: return Char.DoubleQuote;
    case Char.SingleQuote: return Char.SingleQuote;
    case Char.Backslash: return Char.Backslash;
    default: return code;
  }
}

export const enum Access {
  Reset                   = 0b0000000000000,
  Ancestor                = 0b0000111111111,
  This                    = 0b0001000000000,
  Scope                   = 0b0010000000000,
  Member                  = 0b0100000000000,
  Keyed                   = 0b1000000000000
}

export const enum Precedence {
  Variadic                = 0b000111101,
  Assign                  = 0b000111110,
  Conditional             = 0b000111111,
  LogicalOR               = 0b001000000,
  LogicalAND              = 0b010000000,
  Equality                = 0b011000000,
  Relational              = 0b100000000,
  Additive                = 0b101000000,
  Multiplicative          = 0b110000000,
  Binary                  = 0b111000000,
  LeftHandSide            = 0b111000001,
  Primary                 = 0b111000010,
  Unary                   = 0b111000011,
}
/** @internal */
export const enum Token {
  EOF                     = 0b110000000000_000_000000,
  ExpressionTerminal      = 0b100000000000_000_000000,
  AccessScopeTerminal     = 0b010000000000_000_000000,
  ClosingToken            = 0b001000000000_000_000000,
  OpeningToken            = 0b000100000000_000_000000,
  BinaryOp                = 0b000010000000_000_000000,
  UnaryOp                 = 0b000001000000_000_000000,
  LeftHandSide            = 0b000000100000_000_000000,
  StringOrNumericLiteral  = 0b000000011000_000_000000,
  NumericLiteral          = 0b000000010000_000_000000,
  StringLiteral           = 0b000000001000_000_000000,
  IdentifierName          = 0b000000000110_000_000000,
  Keyword                 = 0b000000000100_000_000000,
  Identifier              = 0b000000000010_000_000000,
  Contextual              = 0b000000000001_000_000000,
  Precedence              = 0b000000000000_111_000000,
  Type                    = 0b000000000000_000_111111,
  FalseKeyword            = 0b000000000100_000_000000,
  TrueKeyword             = 0b000000000100_000_000001,
  NullKeyword             = 0b000000000100_000_000010,
  UndefinedKeyword        = 0b000000000100_000_000011,
  ThisScope               = 0b000000000110_000_000100,
  ParentScope             = 0b000000000110_000_000101,
  OpenParen               = 0b010100100000_000_000110,
  OpenBrace               = 0b000100000000_000_000111,
  Dot                     = 0b000000100000_000_001000,
  CloseBrace              = 0b111000000000_000_001001,
  CloseParen              = 0b111000000000_000_001010,
  Comma                   = 0b110000000000_000_001011,
  OpenBracket             = 0b010100100000_000_001100,
  CloseBracket            = 0b111000000000_000_001101,
  Colon                   = 0b110000000000_000_001110,
  Question                = 0b110000000000_000_001111,
  Ampersand               = 0b110000000000_000_010000,
  Bar                     = 0b110000000000_000_010011,
  BarBar                  = 0b110010000000_010_010100,
  AmpersandAmpersand      = 0b110010000000_011_010101,
  EqualsEquals            = 0b110010000000_100_010110,
  ExclamationEquals       = 0b110010000000_100_010111,
  EqualsEqualsEquals      = 0b110010000000_100_011000,
  ExclamationEqualsEquals = 0b110010000000_100_011001,
  LessThan                = 0b110010000000_101_011010,
  GreaterThan             = 0b110010000000_101_011011,
  LessThanEquals          = 0b110010000000_101_011100,
  GreaterThanEquals       = 0b110010000000_101_011101,
  InKeyword               = 0b110010000100_101_011110,
  InstanceOfKeyword       = 0b110010000100_101_011111,
  Plus                    = 0b010011000000_110_100000,
  Minus                   = 0b010011000000_110_100001,
  TypeofKeyword           = 0b000001000100_000_100010,
  VoidKeyword             = 0b000001000100_000_100011,
  Asterisk                = 0b110010000000_111_100100,
  Percent                 = 0b110010000000_111_100101,
  Slash                   = 0b110010000000_111_100110,
  Equals                  = 0b100000000000_000_100111,
  Exclamation             = 0b000001000000_000_101000,
  TemplateTail            = 0b010000100000_000_101001,
  TemplateContinuation    = 0b010000100000_000_101010,
  OfKeyword               = 0b100000000101_000_101011
}

