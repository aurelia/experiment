import {
  ITaskQueue,
  ITask,
  QueueTaskOptions,
  IScheduler,
} from '@aurelia/runtime';
import {
  Writable,
  IContainer,
  ILogger,
} from '@aurelia/kernel';

import {
  normalizePath,
  countSlashes,
} from '../path-utils';
import {
  FSEntry,
  FileEntry,
  DirEntry,
  FSFlags,
  isDir,
  FSEntryResolver,
} from '../fs-entry';

import {
  watch,
  FSWatcher,
} from 'fs';

export class FindFileContext {
  public finished: boolean = false;

  private pendingOperations: number = 0;
  private resolvePendingOperations: (() => void) | undefined = void 0;;
  public pendingOperationsFinished: Promise<void> | undefined = void 0;
  private activeDepth = 0;

  public needsToWait(ctrl: FSController): boolean {
    return this.activeDepth > 0 && this.activeDepth !== ctrl.depth;
  }

  public enqueue(ctrl: FSController): void {
    if (++this.pendingOperations === 1) {
      this.activeDepth = ctrl.depth;
      this.pendingOperationsFinished = new Promise(resolve => {
        this.resolvePendingOperations = resolve;
      });
    }
  }

  public dequeue(ctrl: FSController): void {
    if (--this.pendingOperations === 0) {
      this.activeDepth = 0;
      this.resolvePendingOperations!();
      this.resolvePendingOperations = this.pendingOperationsFinished = void 0;
    }
  }
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}

const controllerLookup = new Map<string, FSController>();

export class FSController {
  public parent: FSController | undefined = void 0;

  public readonly children: FSController[] = [];
  public readonly entries: FSEntry[] = [];
  public readonly files: FileEntry[] = [];
  public readonly dirs: DirEntry[] = [];

  public readonly observer: DirObserver;

  private readonly logger: ILogger;
  public readonly depth: number;

  public constructor(
    public readonly container: IContainer,
    public readonly entry: DirEntry,
  ) {
    this.depth = countSlashes(entry.path);
    const logger = this.logger = container.get(ILogger);
    logger.debug(`Creating new controller for dir: ${entry.path}`);

    this.observer = new DirObserver(
      container.get(IScheduler).getIdleTaskQueue(),
      entry,
      container.get(FSEntryResolver),
    );
  }

  public static getOrCreate(
    container: IContainer,
    dir: string,
  ): Promise<FSController> | FSController {
    dir = normalizePath(dir);

    let controller = controllerLookup.get(dir);
    if (controller === void 0) {
      const resolver = container.get(FSEntryResolver);
      return (resolver.getEntry(dir) as Promise<DirEntry>).then(function (entry) {
        controllerLookup.set(dir, controller = new FSController(container, entry));
        return controller;
      });
    }

    return controller;
  }

  public findFile(
    matcher: (file: FileEntry) => boolean,
    recurse: boolean,
    ctx: FindFileContext = new FindFileContext(),
  ): Promise<FileEntry | undefined> | FileEntry | undefined {
    if (ctx.finished) {
      return void 0;
    }

    if (ctx.needsToWait(this)) {
      return ctx.pendingOperationsFinished!.then(() => this.findFile$afterPendingOperationsFinished(matcher, recurse, ctx));
    }

    return this.findFile$afterPendingOperationsFinished(matcher, recurse, ctx);
  }

  private findFile$afterPendingOperationsFinished(
    matcher: (file: FileEntry) => boolean,
    recurse: boolean,
    ctx: FindFileContext,
  ): Promise<FileEntry | undefined> | FileEntry | undefined {
    if (ctx.finished) {
      return void 0;
    }

    if (!this.entriesLoaded) {
      return this.loadEntries().then(() => this.findFile$AfterLoadEntries(matcher, recurse, ctx));
    }

    return this.findFile$AfterLoadEntries(matcher, recurse, ctx);
  }

  private findFile$AfterLoadEntries(
    matcher: (file: FileEntry) => boolean,
    recurse: boolean,
    ctx: FindFileContext,
  ): Promise<FileEntry | undefined> | FileEntry | undefined {
    ctx.dequeue(this);

    if (ctx.finished) {
      return void 0;
    }

    const file = this.files.find(matcher);
    if (file === void 0) {
      if (recurse && !this.entry.isSymlink) {
        if (!this.childrenLoaded) {
          return this.loadChildren().then(() => this.findFile$AfterLoadChildren(matcher, ctx));
        }

        return this.findFile$AfterLoadChildren(matcher, ctx);
      }

      return void 0;
    }

    this.logger.debug(`Found file: ${file.path} at dir: ${this.entry.path}`);

    ctx.finished = true;

    return file;
  }

  private findFile$AfterLoadChildren(
    matcher: (file: FileEntry) => boolean,
    ctx: FindFileContext,
  ): Promise<FileEntry | undefined> | FileEntry | undefined {
    if (ctx.finished) {
      return void 0;
    }

    const findFileResults = this.children.map(x => x.findFile(matcher, true, ctx));
    if (findFileResults.some(isPromise)) {
      return Promise.all(findFileResults).then(results => this.findFile$AfterRecurse(results, matcher, ctx));
    }

    return this.findFile$AfterRecurse(findFileResults as (FileEntry | undefined)[], matcher, ctx);
  }

  private findFile$AfterRecurse(
    results: (FileEntry | undefined)[],
    matcher: (file: FileEntry) => boolean,
    ctx: FindFileContext,
  ): FileEntry | undefined {
    const result = results.find(x => x !== void 0 && matcher(x));
    if (result === void 0) {
      return void 0;
    }

    // Note: the race condition here is intentional: the first controller that yields a result should effectively disable further processing by other controllers
    // in order to be "as lazy as possible". You could think of this method as a `Promise.race` call with an added condition: returns the first promise that does not
    // resolve to undefined.
    ctx.finished = true;

    return result;
  }

  public subscribe(handler: HandleFSEvent): void {
    this.observer.subscribe(handler);
    for (const child of this.children) {
      child.subscribe(handler);
    }
  }

  public unsubscribe(handler: HandleFSEvent): void {
    this.observer.unsubscribe(handler);
    for (const child of this.children) {
      child.unsubscribe(handler);
    }
  }

  private loadEntriesPromise: Promise<void> | undefined = void 0;
  private entriesLoaded: boolean = false;
  private async loadEntries(): Promise<void> {
    if (this.loadEntriesPromise === void 0) {
      this.loadEntriesPromise = (async () => {
        const entries = await this.observer.getEntries();
        for (const entry of entries) {
          this.entries.push(entry);
          if (entry.flags === FSFlags.file) {
            this.files.push(entry);
          } else {
            this.dirs.push(entry);
          }
        }
        this.entriesLoaded = true;
      })();
    }
    return this.loadEntriesPromise;
  }

  private loadChildrenPromise: Promise<void> | undefined = void 0;
  private childrenLoaded: boolean = false;
  private async loadChildren(): Promise<void> {
    if (this.loadChildrenPromise === void 0) {
      this.loadChildrenPromise = (async () => {
        const dirs = this.entries.filter(isDir);
        const container = this.container;
        this.children.push(...(await Promise.all(dirs.map(async x => FSController.getOrCreate(container, x.path)))));
        this.childrenLoaded = true;
      })();
    }
    return this.loadChildrenPromise;
  }

  public dispose(): void {
    controllerLookup.delete(this.entry.path);

    this.children.length = 0;
    this.entries.length = 0;

    (this as Writable<FSController>).parent = void 0;
    (this as Writable<FSController>).children = (void 0)!;
    (this as Writable<FSController>).entries = (void 0)!;
    (this as Writable<FSController>).observer = (void 0)!;
    (this as Writable<FSController>).entry = (void 0)!;
  }
}

type WatcherOptions = { encoding?: BufferEncoding | null; persistent?: boolean; recursive?: boolean };
const watcherOptions: Required<WatcherOptions> = {
  encoding: 'utf8', // default
  persistent: true, // default
  recursive: false, // default
};

const queueTaskOptions: QueueTaskOptions = {
  delay: 0, // default
  preempt: false, // default
  persistent: false, // default
  reusable: true, // default
};

class NodeFSEvent {
  public constructor(
    public readonly eventType: 'change' | 'rename',
    public readonly filename: string,
  ) {}
}

class NodeFSEventBuffer {
  private readonly indices: Map<string, number> = new Map();
  private readonly entries: NodeFSEvent[] = [];

  public constructor(
    public readonly eventType: 'change' | 'rename',
  ) {}

  public get isEmpty(): boolean {
    return this.entries.length === 0;
  }

  public append(filename: string): void {
    if (typeof filename === 'string') { // Node docs warn that filename could potentially be null. Chokidar ignores it in that situation, so we will too.
      filename = normalizePath(filename);
      const entries = this.entries;
      const indices = this.indices;
      if (!indices.has(filename)) {
        const idx = entries.length;
        indices.set(filename, idx);
        entries[idx] = new NodeFSEvent(this.eventType, filename);
      }
    }
  }

  public flush(): readonly NodeFSEvent[] {
    const entries = this.entries.splice(0);
    this.indices.clear();
    return entries;
  }
}

export const enum FSEventType {
  created,
  deleted,
  modified,
  moved,
}

export interface IFSCreatedEvent {
  readonly type: FSEventType.created;

  readonly entry: FSEntry;
}

export interface IFSModifiedEvent {
  readonly type: FSEventType.modified;

  readonly entry: FSEntry;
}

export interface IFSDeletedEvent {
  readonly type: FSEventType.deleted;

  readonly oldEntry: FSEntry;
}

export interface IFSMovedEvent {
  readonly type: FSEventType.moved;

  readonly entry: FSEntry;
  readonly oldEntry: FSEntry;
}

export type IFSEvent = IFSCreatedEvent | IFSModifiedEvent | IFSDeletedEvent | IFSMovedEvent;

class FSEvent {
  private constructor(
    public readonly type: FSEventType,
    public readonly entry: FSEntry | undefined,
    public readonly oldEntry: FSEntry | undefined,
  ) {}

  public static created(
    entry: FSEntry,
  ): IFSCreatedEvent {
    return new FSEvent(
      FSEventType.created,
      entry,
      void 0,
    ) as IFSCreatedEvent;
  }

  public static modified(
    entry: FSEntry,
  ): IFSModifiedEvent {
    return new FSEvent(
      FSEventType.modified,
      entry,
      void 0,
    ) as IFSModifiedEvent;
  }

  public static deleted(
    oldEntry: FSEntry,
  ): IFSDeletedEvent {
    return new FSEvent(
      FSEventType.deleted,
      void 0,
      oldEntry,
    ) as IFSDeletedEvent;
  }

  public static moved(
    entry: FSEntry,
    oldEntry: FSEntry,
  ): IFSMovedEvent {
    return new FSEvent(
      FSEventType.moved,
      entry,
      oldEntry,
    ) as IFSMovedEvent;
  }
}

export type HandleFSEvent = (batch: FSEventBatch) => unknown;

export class FSEventBatch {
  public constructor(
    public readonly created: readonly IFSCreatedEvent[],
    public readonly modified: readonly IFSModifiedEvent[],
    public readonly deleted: readonly IFSDeletedEvent[],
    public readonly moved: readonly IFSMovedEvent[],
  ) {}
}

const dirObserverLookup = new WeakMap<DirEntry, DirObserver>();

export class DirObserver {
  private subscriberCount: number = 0;
  private task: ITask | null = null;
  private watcher: FSWatcher | null = null;

  private prevIndices: Map<string, number> = new Map();
  private prevEntries: FSEntry[] = [];
  private curIndices: Map<string, number> = new Map();
  private curEntries: FSEntry[] = [];

  private readonly changeBuffer: NodeFSEventBuffer = new NodeFSEventBuffer('change');
  private readonly renameBuffer: NodeFSEventBuffer = new NodeFSEventBuffer('rename');

  private readonly fsEventHandlers: HandleFSEvent[] = [];

  public constructor(
    private readonly tq: ITaskQueue,
    private readonly entry: DirEntry,
    private readonly resolver: FSEntryResolver,
  ) {
    this.flush = this.flush.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
  }

  public static for(
    dir: DirEntry,
    tq: ITaskQueue,
    resolver: FSEntryResolver,
  ): DirObserver {
    if (dir.isSymlink) {
      return this.for(dir.real, tq, resolver);
    }

    let observer = dirObserverLookup.get(dir);
    if (observer === void 0) {
      dirObserverLookup.set(dir, observer = new DirObserver(tq, dir, resolver));
    }
    return observer;
  }

  public subscribe(handler: HandleFSEvent): void {
    const idx = this.fsEventHandlers.indexOf(handler);
    if (idx === -1) {
      this.fsEventHandlers.push(handler);
      if (++this.subscriberCount === 1) {
        this.start();
      }
    }
  }

  public unsubscribe(handler: HandleFSEvent): void {
    const idx = this.fsEventHandlers.indexOf(handler);
    if (idx >= 0) {
      this.fsEventHandlers.splice(idx, 1);
      if (--this.subscriberCount === 0) {
        this.stop();
      }
    }
  }

  private async flush(): Promise<void> {
    const nodeChangeEvents = this.changeBuffer.flush();
    const nodeRenameEvents = this.renameBuffer.flush();

    await this.getEntries();

    if (!this.changeBuffer.isEmpty || !this.renameBuffer.isEmpty) {
      throw new Error(`Detected a race condition in directory read while new changes took place. This scenario is not yet handled, so we're aborting in order to guarantee consistent state. Please report that this happened, and in the meantime simply restart the tool.`);
    }

    const prevIndices = this.prevIndices;
    const prevEntries = this.prevEntries;
    const curIndices = this.curIndices;
    const curEntries = this.curEntries;

    const removedEntries = prevEntries.filter(prev => !curIndices.has(prev.real.path));
    const addedEntries = curEntries.filter(cur => !prevIndices.has(cur.real.path));

    // Only use the node rename events to map removed to added entries and transform them to move events.
    // Then remove those entries, and after processing simply use the remainder of added/removed entries to produce the rest of the events.
    const movedEvents = [] as IFSMovedEvent[];
    for (let i = 0, ii = nodeRenameEvents.length; i < ii; ++i) {
      const cur = nodeRenameEvents[i];
      let addedEntryIdx = addedEntries.findIndex(x => x.path === cur.filename);
      if (addedEntryIdx === -1) {
        const removedEntryIdx = removedEntries.findIndex(x => x.path === cur.filename);
        if (removedEntryIdx === -1) {
          continue;
        }

        const next = nodeRenameEvents[i + 1];
        if (next === void 0) {
          break;
        }

        addedEntryIdx = addedEntries.findIndex(x => x.path === next.filename);
        if (addedEntryIdx === -1) {
          continue;
        }

        movedEvents.push(FSEvent.moved(addedEntries[addedEntryIdx], removedEntries[removedEntryIdx]));
        addedEntries.splice(addedEntryIdx, 1);
        removedEntries.splice(removedEntryIdx, 1);
        ++i;
      }
    }

    const deletedEvents = removedEntries.map(FSEvent.deleted);
    const createdEvents = addedEntries.map(FSEvent.created);

    const modifiedEvents = curEntries.filter(x => nodeChangeEvents.some(e => x.path === e.filename) && !addedEntries.some(a => a.path === x.path)).map(FSEvent.modified);

    const batch = new FSEventBatch(
      createdEvents,
      modifiedEvents,
      deletedEvents,
      movedEvents,
    );

    await Promise.all(this.fsEventHandlers.slice().map(handle => handle(batch)));

    if (!this.changeBuffer.isEmpty || !this.renameBuffer.isEmpty) {
      this.task = this.tq.queueTask(this.flush, queueTaskOptions);
    } else {
      this.task = null;
    }
  }

  private handleEvent(eventType: string, filename: string): void {
    switch (eventType) {
      case 'change':
        this.changeBuffer.append(filename);
        break;
      case 'rename':
        this.renameBuffer.append(filename);
        break;
    }
    if (this.task === null) {
      this.task = this.tq.queueTask(this.flush, queueTaskOptions);
    }
  }

  public async getEntries(): Promise<readonly FSEntry[]> {
    const curIndices = this.prevIndices;
    const curEntries = this.prevEntries;

    this.prevIndices = this.curIndices;
    this.prevEntries = this.curEntries;

    this.curIndices = curIndices;
    this.curEntries = curEntries;

    curIndices.clear();
    curEntries.length = 0;

    const entries = await this.entry.getEntries(this.resolver);
    for (const entry of entries) {

      const idx = curEntries.length;
      curEntries[idx] = entry;
      curIndices.set(entry.path, idx);
    }

    return this.curEntries;
  }

  public start(): void {
    if (this.watcher === null) {
      this.watcher = watch(this.entry.path, watcherOptions, this.handleEvent);
    }
  }

  public stop(): void {
    if (this.watcher !== null) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
