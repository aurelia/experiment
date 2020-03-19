/* eslint-disable compat/compat */
/* eslint-disable no-fallthrough */
import { Char, PLATFORM } from '@aurelia/kernel';

/** @internal */
export const enum Token {
  EOF            = 0b0_00000,
  Hash           = 0b0_00001,
  Exclamation    = 0b0_00010,
  Hyphen         = 0b0_00011,
  DotDot         = 0b0_00100,
  Newline        = 0b0_00101,
  OneSpace       = 0b0_00110,
  WhiteSpace     = 0b0_00111,
  Number         = 0b0_01000,
  TodoKeyword    = 0b0_01001,
  SkipKeyword    = 0b0_01010,
  OkKeyword      = 0b0_01011,
  NotKeyword     = 0b0_01100,
  TapKeyword     = 0b0_01101,
  VersionKeyword = 0b0_01110,
  BailKeyword    = 0b0_01111,
  OutKeyword     = 0b0_10000,
}

export class TAPParser {
  private static readonly instance: TAPParser = new TAPParser('');

  public index: number = 0;
  public startIndex: number = 0;
  public lastIndex: number = 0;
  public length: number;
  public currentToken: Token = Token.EOF;
  public tokenValue: string | number = '';
  public currentChar: number;
  public get tokenRaw(): string {
    return this.input.slice(this.startIndex, this.index);
  }

  private constructor(
    public input: string,
  ) {
    this.length = input.length;
    this.currentChar = input.charCodeAt(0);
  }

  public static parse(input: string, output: TAPOutput): TAPOutput {
    return TAPParser.instance.parse(input, output);
  }

  private parse(input: string, output: TAPOutput): TAPOutput {
    this.input = input;
    this.length = input.length;
    this.index = 0;
    this.currentChar = input.charCodeAt(0);

    if (this.nextToken() === Token.TapKeyword) {
      output.setVersion(this.parseVersion());
      if (this.nextToken() === Token.EOF) {
        return output;
      }
      if (this.currentToken !== Token.Newline) {
        this.unexpectedToken();
      }
      this.nextToken();
    }

    if (this.currentToken === Token.Number) {
      output.setPlan(this.parsePlan());
      if (this.nextToken() === Token.EOF) {
        return output;
      }
      if (this.currentToken as Token !== Token.Newline) {
        this.unexpectedToken();
      }
      this.nextToken();
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      switch (this.currentToken) {
        case Token.EOF:
          return output;
        case Token.BailKeyword:
          output.setBailOut(this.parseBailout());
          break;
        case Token.OkKeyword:
        case Token.NotKeyword:
          output.addTestPoint(this.parseTestPoint());
          break;
        case Token.Hash:
          output.addComment(this.parseComment());
          break;
      }

      if (this.index + 1 === this.length) {
        return output;
      }
      if (this.nextToken() !== Token.Newline) {
        this.unexpectedToken();
      }
    }
  }

  private parseVersion(): TAPVersion {
    const startIndex = this.startIndex;
    if (
      this.currentToken === Token.TapKeyword &&
      this.nextToken() === Token.OneSpace &&
      this.nextToken() === Token.VersionKeyword &&
      this.nextToken() === Token.OneSpace &&
      this.nextToken() === Token.Number
    ) {
      return new TAPVersion(this.tokenValue as number, this.input.slice(startIndex, this.index + 1));
    }
    this.unexpectedToken();
  }

  private parsePlan(): TAPPlan {
    const startIndex = this.startIndex;
    if (this.currentToken === Token.Number) {
      const start = this.tokenValue as number;
      if (
        this.nextToken() === Token.DotDot &&
        this.nextToken() === Token.Number
      ) {
        const end = this.tokenValue as number;
        let directive: TAPDirective | undefined;
        if (this.nextToken() === Token.WhiteSpace) {
          if (this.nextToken() === Token.Hash) {
            directive = this.parseDirective();
          } else {
            this.unexpectedToken();
          }
        } else {
          directive = void 0;
        }

        return new TAPPlan(
          start,
          end,
          directive,
          this.input.slice(startIndex, this.index + 1),
        );
      }
    }
    this.unexpectedToken();
  }

  private parseBailout(): TAPBailOut {
    const startIndex = this.startIndex;
    if (
      this.currentToken === Token.BailKeyword &&
      this.nextToken() === Token.OutKeyword &&
      this.nextToken() === Token.Exclamation
    ) {
      const reasonIndex = this.index;
      while (this.currentChar !== Char.LineFeed && this.index + 1 < this.length) {
        this.nextChar();
      }

      const reason = reasonIndex === this.index ? void 0 : this.input.slice(reasonIndex, this.index + 1);
      return new TAPBailOut(
        reason,
        this.input.slice(startIndex, this.index + 1),
      );
    }
    this.unexpectedToken();
  }

  private parseTestPoint(): TAPTestPoint {
    const startIndex = this.startIndex;

    let ok: boolean;
    if (
      this.currentToken === Token.OkKeyword
    ) {
      ok = true;
    } else if (
      this.currentToken === Token.NotKeyword &&
      this.nextToken() === Token.OneSpace &&
      this.nextToken() === Token.OkKeyword
    ) {
      ok = false;
    } else {
      this.unexpectedToken();
    }

    let number: number | undefined;
    let description: string | undefined;
    let directive: TAPDirective | undefined;

    if (this.currentChar === Char.Space) {
      if (
        this.nextChar() <= Char.Nine &&
        this.currentChar >= Char.Zero
      ) {
        const numberStart = this.index;
        while (this.nextChar() <= Char.Nine && this.currentChar >= Char.Zero);

        number = parseInt(this.input.slice(numberStart, this.index), 10);
      } else {
        number = void 0;
      }

      if (
        this.currentChar === Char.Space &&
        this.nextChar() === Char.Minus &&
        this.nextChar() === Char.Space
      ) {
        this.nextChar();
      }

      const descriptionStart = this.index;
      while (this.currentChar as number !== Char.Hash && this.currentChar as number !== Char.LineFeed && this.index + 1 < this.length) {
        this.nextChar();
      }

      if (descriptionStart === this.index) {
        description = void 0;
      } else {
        description = this.input.slice(descriptionStart, this.index);
      }

      if (this.currentChar as number === Char.Hash) {
        directive = this.parseDirective();
      } else {
        directive = void 0;
      }

      return new TAPTestPoint(
        ok,
        number,
        description,
        directive,
        this.input.slice(startIndex, this.index + 1),
      );
    }
    this.unexpectedToken();
  }

  private parseComment(): TAPComment {
    const startIndex = this.startIndex;
    if (
      this.currentToken === Token.Hash
    ) {
      const commentStart = this.index;
      while (this.currentChar !== Char.LineFeed && this.index + 1 < this.length) {
        this.nextChar();
      }

      return new TAPComment(
        this.input.slice(commentStart, this.index + 1),
        this.input.slice(startIndex, this.index + 1),
      );
    }
    this.unexpectedToken();
  }

  private parseDirective(): TAPDirective {
    const startIndex = this.startIndex;

    if (
      this.currentToken === Token.Hash &&
      this.nextToken() === Token.WhiteSpace
    ) {
      let type: 'TODO' | 'SKIP';
      switch (this.nextToken()) {
        case Token.TodoKeyword:
          type = 'TODO';
          break;
        case Token.SkipKeyword:
          type = 'SKIP';
          break;
        default:
          this.unexpectedToken();
      }

      while (this.currentChar === Char.Space || this.currentChar === Char.Tab) {
        this.nextChar();
      }

      const reasonStart = this.index;
      while (this.currentChar !== Char.LineFeed && this.index + 1 < this.length) {
        this.nextChar();
      }

      const reason = reasonStart === this.index ? void 0 : this.input.slice(reasonStart, this.index + 1);
      return new TAPDirective(type, reason, this.input.slice(startIndex, this.index + 1));
    }

    this.unexpectedToken();
  }

  private nextChar(): number {
    return this.currentChar = this.input.charCodeAt(++this.index);
  }

  private nextToken(): Token {
    if (this.index === this.length) {
      return this.currentToken = Token.EOF;
    }

    this.startIndex = this.index;
    switch (this.currentChar) {
      case Char.UpperT:
      case Char.LowerT:
        switch (this.nextChar()) {
          case Char.UpperA:
          case Char.LowerA:
            switch (this.nextChar()) {
              case Char.UpperP:
              case Char.LowerP:
                this.nextChar();
                return this.currentToken = Token.TapKeyword;
              default:
                this.unexpectedCharacter();
            }
          case Char.UpperO:
          case Char.LowerO:
            switch (this.nextChar()) {
              case Char.UpperD:
              case Char.LowerD:
                switch (this.nextChar()) {
                  case Char.UpperO:
                  case Char.LowerO:
                    this.nextChar();
                    return this.currentToken = Token.TodoKeyword;
                  default:
                    this.unexpectedCharacter();
                }
              default:
                this.unexpectedCharacter();
            }
          default:
            this.unexpectedCharacter();
        }
      case Char.LowerN:
        if (
          this.nextChar() === Char.LowerO &&
          this.nextChar() === Char.LowerT
        ) {
          this.nextChar();
          return this.currentToken = Token.NotKeyword;
        }
        this.unexpectedCharacter();
      case Char.UpperB:
      case Char.LowerB:
        switch (this.nextChar()) {
          case Char.UpperA:
          case Char.LowerA:
            switch (this.nextChar()) {
              case Char.UpperI:
              case Char.LowerI:
                switch (this.nextChar()) {
                  case Char.UpperL:
                  case Char.LowerL:
                    this.nextChar();
                    return this.currentToken = Token.BailKeyword;
                  default:
                    this.unexpectedCharacter();
                }
              default:
                this.unexpectedCharacter();
            }
          default:
            this.unexpectedCharacter();
        }
      case Char.UpperO:
        switch (this.nextChar()) {
          case Char.UpperU:
          case Char.LowerU:
            switch (this.nextChar()) {
              case Char.UpperT:
              case Char.LowerT:
                this.nextChar();
                return this.currentToken = Token.OutKeyword;
              default:
                this.unexpectedCharacter();
            }
          default:
            this.unexpectedCharacter();
        }
      case Char.LowerO:
        switch (this.nextChar()) {
          case Char.UpperU:
          case Char.LowerU:
            switch (this.nextChar()) {
              case Char.UpperT:
              case Char.LowerT:
                this.nextChar();
                return this.currentToken = Token.OutKeyword;
              default:
                this.unexpectedCharacter();
            }
          case Char.LowerK:
            this.nextChar();
            return this.currentToken = Token.OkKeyword;
          default:
            this.unexpectedCharacter();
        }
      case Char.UpperS:
      case Char.LowerS:
        switch (this.nextChar()) {
          case Char.UpperK:
          case Char.LowerK:
            switch (this.nextChar()) {
              case Char.UpperI:
              case Char.LowerI:
                switch (this.nextChar()) {
                  case Char.UpperP:
                  case Char.LowerP:
                    while (this.nextChar() !== Char.Space);
                    return this.currentToken = Token.SkipKeyword;
                  default:
                    this.unexpectedCharacter();
                }
              default:
                this.unexpectedCharacter();
            }
          default:
            this.unexpectedCharacter();
        }
      case Char.Hash:
        this.nextChar();
        return this.currentToken = Token.Hash;
      case Char.Minus:
        this.nextChar();
        return this.currentToken = Token.Hyphen;
      case Char.Exclamation:
        this.nextChar();
        return this.currentToken = Token.Exclamation;
      case Char.Dot:
        if (
          this.nextChar() === Char.Dot
        ) {
          this.nextChar();
          return this.currentToken = Token.DotDot;
        }
        this.unexpectedCharacter();
      case Char.Zero:
      case Char.One:
      case Char.Two:
      case Char.Three:
      case Char.Four:
      case Char.Five:
      case Char.Six:
      case Char.Seven:
      case Char.Eight:
      case Char.Nine:
        while (this.nextChar() <= Char.Nine && this.currentChar >= Char.Zero);
        this.tokenValue = parseInt(this.tokenRaw, 10);
        return this.currentToken = Token.Number;
      case Char.Space:
        if (this.nextChar() !== Char.Space) {
          return this.currentToken = Token.OneSpace;
        }
        while (this.nextChar() === Char.Space || this.currentChar as number === Char.Tab);
        return this.currentToken = Token.WhiteSpace;
      case Char.Tab:
        while (this.nextChar() === Char.Space || this.currentChar === Char.Tab);
        return this.currentToken = Token.WhiteSpace;
      case Char.LineFeed:
        this.nextChar();
        return this.currentToken = Token.Newline;
      default:
        this.unexpectedCharacter();
    }
  }

  private unexpectedCharacter(): never {
    throw new Error(`Unexpected character ${String.fromCharCode(this.currentChar)} at position ${this.index} of ${this.input}`);
  }

  private unexpectedToken(): never {
    throw new Error(`Unexpected token ${tokenToString(this.currentToken)} at position ${this.index} of ${this.input}`);
  }

  private missingExpectedToken(token: Token): never {
    throw new Error(`Missing expected token ${tokenToString(token)} at position ${this.index} of ${this.input}`);
  }
}

function tokenToString(token: Token): string {
  switch (token) {
    case Token.EOF: return 'EOF';
    case Token.Hash: return 'Hash';
    case Token.Exclamation: return 'Exclamation';
    case Token.Newline: return 'Newline';
    case Token.WhiteSpace: return 'WhiteSpace';
    case Token.OneSpace: return 'OneSpace';
    case Token.Hyphen: return 'Hyphen';
    case Token.DotDot: return 'DotDot';
    case Token.Number: return 'Number';
    case Token.TodoKeyword: return 'TodoKeyword';
    case Token.SkipKeyword: return 'SkipKeyword';
    case Token.OkKeyword: return 'OkKeyword';
    case Token.NotKeyword: return 'NotKeyword';
    case Token.TapKeyword: return 'TapKeyword';
    case Token.VersionKeyword: return 'VersionKeyword';
    case Token.BailKeyword: return 'BailKeyword';
    case Token.OutKeyword: return 'OutKeyword';
  }
}

export interface ITAPChannel {
  send(item: TAPLine): void;
}

export type TAPItem = TAPTestPoint | TAPVersion | TAPPlan | TAPBailOut;
export type TAPLine = TAPItem | TAPComment;

const noopChannel = { send: PLATFORM.noop };

export const enum TAPLineKind {
  testPoint = 1,
  version   = 2,
  plan      = 3,
  bailOut   = 4,
  comment   = 5,
}

export class TAPOutput {
  private lineNumber: number = 0;
  private pointNumber: number = 0;
  private isLazyPlan: boolean = false;

  private lastObject: TAPItem | undefined = void 0;
  private readonly buffer: TAPLine[] = [];
  private cursor: number = 0;

  public constructor(
    private readonly channel: ITAPChannel = noopChannel,
    private readonly testPoints: TAPTestPoint[] = [],
    private version?: TAPVersion,
    private plan?: TAPPlan,
    private bailOut?: TAPBailOut,
  ) {}

  public setVersion(version: TAPVersion): this {
    if (this.version !== void 0) {
      throw new Error(`The TAP version can only be set once`);
    }
    if (this.lineNumber > 0) {
      throw new Error(`The TAP version line must be the first line`);
    }
    this.buffer.push(this.version = this.lastObject = version);
    ++this.lineNumber;

    return this;
  }

  public setPlan(plan: TAPPlan): this {
    if (this.plan !== void 0) {
      throw new Error(`The TAP plan can only be set once`);
    }
    if (this.pointNumber > 0) {
      this.isLazyPlan = true;
    }
    this.buffer.push(this.plan = this.lastObject = plan);
    ++this.lineNumber;

    return this;
  }

  public setBailOut(bailOut: TAPBailOut): this {
    if (this.bailOut !== void 0) {
      throw new Error(`The TAP bailOut can only be set once`);
    }
    this.buffer.push(this.bailOut = this.lastObject = bailOut);
    ++this.lineNumber;

    return this;
  }

  public addTestPoint(testPoint: TAPTestPoint): this {
    if (this.isLazyPlan) {
      throw new Error(`The TAP plan must come at either the start or the end of the run, and it was determined that it came at the end of the run, so no more test points can be added.`);
    }
    this.buffer.push(this.lastObject = testPoint);
    this.testPoints.push(testPoint);
    if (testPoint.number === void 0) {
      testPoint.number = ++this.pointNumber;
    } else {
      this.pointNumber = testPoint.number;
    }
    ++this.lineNumber;

    return this;
  }

  public addComment(comment: TAPComment): this {
    if (this.lastObject === void 0) {
      throw new Error(`TAP output cannot start with a comment`);
    }
    this.buffer.push(comment);
    this.lastObject.addComment(comment);

    return this;
  }

  public flush(): this {
    while (this.cursor + 1 < this.buffer.length) {
      this.channel.send(this.buffer[this.cursor]);
      ++this.cursor;
    }

    return this;
  }

  public toString(): string {
    return this.buffer.join('\n');
  }

  public [Symbol.toPrimitive](): string {
    return this.toString();
  }
}

export class TAPVersion {
  public get kind(): TAPLineKind.version { return TAPLineKind.version; }
  public comments: TAPComment[] | undefined = void 0;

  private s: string;

  public constructor(
    public readonly version: number,
    s?: string,
  ) {
    if (s === void 0) {
      s = `TAP version ${version}`;
    }
    this.s = s;
  }

  public addComment(comment: TAPComment): void {
    if (this.comments === void 0) {
      this.comments = [comment];
    } else {
      this.comments.push(comment);
    }

    this.s = `${this.s}\n${comment.toString()}`;
  }

  public toString(): string { return this.s; }
  public [Symbol.toPrimitive](): string { return this.s; }
}

export class TAPPlan {
  public get kind(): TAPLineKind.plan { return TAPLineKind.plan; }
  public comments: TAPComment[] | undefined = void 0;

  private s: string;

  public constructor(
    public readonly start: number,
    public readonly end: number,
    public readonly directive?: TAPDirective,
    s?: string,
  ) {
    if (s === void 0) {
      s = `${start}..${end}`;
      if (directive !== void 0) {
        s = `${s} ${directive.toString()}`;
      }
    }
    this.s = s;
  }

  public addComment(comment: TAPComment): void {
    if (this.comments === void 0) {
      this.comments = [comment];
    } else {
      this.comments.push(comment);
    }

    this.s = `${this.s}\n${comment.toString()}`;
  }

  public toString(): string { return this.s; }
  public [Symbol.toPrimitive](): string { return this.s; }
}

export class TAPDirective {
  private readonly s: string;

  public constructor(
    public readonly type: 'TODO' | 'SKIP',
    public readonly reason?: string,
    s?: string,
  ) {
    if (s === void 0) {
      s = `# ${type}`;
      if (reason !== void 0) {
        s = `${s} ${reason}`;
      }
    }
    this.s = s;
  }

  public toString(): string { return this.s; }
  public [Symbol.toPrimitive](): string { return this.s; }
}

export class TAPTestPoint {
  public get kind(): TAPLineKind.testPoint { return TAPLineKind.testPoint; }
  public comments: TAPComment[] | undefined = void 0;

  private s: string;

  public constructor(
    public readonly ok: boolean,
    public number?: number,
    public readonly description?: string,
    public readonly directive?: TAPDirective,
    s?: string,
  ) {
    if (s === void 0) {
      s = ok ? 'ok' : 'not ok';
      if (number !== void 0) {
        s = `${s} ${number}`;
      }
      if (description !== void 0) {
        s = `${s} ${description}`;
      }
      if (directive !== void 0) {
        s = `${s} ${directive.toString()}`;
      }
    }
    this.s = s;
  }

  public addComment(comment: TAPComment): void {
    if (this.comments === void 0) {
      this.comments = [comment];
    } else {
      this.comments.push(comment);
    }

    this.s = `${this.s}\n${comment.toString()}`;
  }

  public toString(): string { return this.s; }
  public [Symbol.toPrimitive](): string { return this.s; }
}

export class TAPBailOut {
  public get kind(): TAPLineKind.bailOut { return TAPLineKind.bailOut; }
  public comments: TAPComment[] | undefined = void 0;

  private s: string;

  public constructor(
    public readonly reason?: string,
    s?: string,
  ) {
    if (s === void 0) {
      s = `Bail out!`;
      if (reason !== void 0) {
        s = `${s} ${reason}`;
      }
    }
    this.s = s;
  }

  public addComment(comment: TAPComment): void {
    if (this.comments === void 0) {
      this.comments = [comment];
    } else {
      this.comments.push(comment);
    }

    this.s = `${this.s}\n${comment.toString()}`;
  }

  public toString(): string { return this.s; }
  public [Symbol.toPrimitive](): string { return this.s; }
}

export class TAPComment {
  public get kind(): TAPLineKind.comment { return TAPLineKind.comment; }
  private readonly s: string;

  public constructor(
    public readonly text: string,
    s?: string,
  ) {
    if (s === void 0) {
      s = `# ${text}`;
    }
    this.s = s;
  }

  public toString(): string { return this.s; }
  public [Symbol.toPrimitive](): string { return this.s; }
}
