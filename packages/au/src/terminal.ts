import { cursorTo, clearLine } from 'readline';

export const enum Cursor {
  save    = '\x1B7',
  restore = '\x1B8',
  show    = '\x1B[?25h',
  hide    = '\x1B[?25l',
}

export class Terminal {
  public constructor(
    private readonly stream: NodeJS.WriteStream,
  ) { }

  public start(): void {
    this.saveCursor();
  }

  public stop(): void {
    this.restoreCursor();
    this.newline();
  }

  public saveCursor(): void {
    this.stream.write(Cursor.save);
  }

  public restoreCursor(): void {
    this.stream.write(Cursor.restore);
  }

  public updateCurrentLine(text: string): void {
    cursorTo(this.stream, 0);
    this.stream.write(text);
    clearLine(this.stream, 1);
  }

  public newline(): void {
    this.stream.write('\n');
  }

  public writeLine(msg: string): void {
    this.stream.write(`${msg}\n`);
  }
}
