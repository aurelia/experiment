/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { ICustomElementViewModel } from '@aurelia/runtime-html';
import { IRouteableComponent } from './interfaces.js';
import { Queue, QueueItem } from './queue.js';
import { IRouter } from './router.js';
import { ViewportInstruction } from './viewport-instruction.js';
import { Scope } from './scope.js';
import { Navigation, IStoredNavigation } from './navigation.js';
import { Runner } from './runner.js';
import { IRoute } from './route.js';

/**
 * @internal - Shouldn't be used directly
 */
export interface INavigatorStore {
  readonly length: number;
  readonly state: Record<string, unknown> | null;
  go(delta?: number, suppressPopstate?: boolean): Promise<void>;
  pushNavigatorState(state: IStoredNavigatorState): Promise<void>;
  replaceNavigatorState(state: IStoredNavigatorState): Promise<void>;
  popNavigatorState(): Promise<void>;
}

/**
 * @internal - Shouldn't be used directly
 */
export interface INavigatorViewer {
  start(options: INavigatorViewerOptions): void;
  stop(): void;
  setTitle(title: string): void;
}
/**
 * @internal - Shouldn't be used directly
 */
export interface INavigatorViewerOptions {
}

/**
 * @internal - Shouldn't be used directly
 */
export class NavigatorViewerState {
  public path!: string;
  public query!: string;
  public hash!: string;
  public instruction!: string;
}

/**
 * @internal - Shouldn't be used directly
 */
export class NavigatorViewerEvent extends NavigatorViewerState {
  public event!: PopStateEvent;
  public state?: INavigatorState;
}

export interface IStoredNavigatorEntry {
  instruction: string | ViewportInstruction[];
  fullStateInstruction: string | ViewportInstruction[];
  scope?: Scope | null;
  index?: number;
  firstEntry?: boolean; // Index might change to not require first === 0, firstEntry should be reliable
  route?: IRoute;
  path?: string;
  title?: string;
  query?: string;
  parameters?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface INavigatorEntry extends IStoredNavigatorEntry {
  fromBrowser?: boolean;
  origin?: ICustomElementViewModel | Element;
  replacing?: boolean;
  refreshing?: boolean;
  repeating?: boolean;
  untracked?: boolean;
  historyMovement?: number;
  resolve?: ((value?: void | PromiseLike<void>) => void);
  reject?: ((value?: void | PromiseLike<void>) => void);
}

export interface INavigatorOptions {
  viewer?: INavigatorViewer;
  store?: INavigatorStore;
  statefulHistoryLength?: number;
  callback?(instruction: Navigation): void;
  serializeCallback?(entry: Navigation, entries: Navigation[]): Promise<IStoredNavigatorEntry>;
}

/**
 * Public API - part of INavigationInstruction
 */
export interface INavigationFlags {
  first: boolean;
  new: boolean;
  refresh: boolean;
  forward: boolean;
  back: boolean;
  replace: boolean;
}

/**
 * @internal - Shouldn't be used directly
 */
export interface IStoredNavigatorState {
  state?: Record<string, unknown>;
  entries: IStoredNavigation[];
  currentEntry: IStoredNavigation;
}

/**
 * @internal - Shouldn't be used directly
 */
export interface INavigatorState {
  state?: Record<string, unknown>;
  entries: Navigation[];
  currentEntry: Navigation;
}

/**
 * @internal - Shouldn't be used directly
 */
export class Navigator {
  public currentEntry: Navigation;
  public entries: Navigation[] = [];

  private readonly pendingNavigations: Queue<Navigation>;

  private options: INavigatorOptions = {
    statefulHistoryLength: 0,
  };
  private isActive: boolean = false;
  private router!: IRouter;
  private readonly uninitializedEntry: Navigation;

  public constructor() {
    this.uninitializedEntry = new Navigation({
      instruction: 'NAVIGATOR UNINITIALIZED',
      fullStateInstruction: '',
    });
    this.currentEntry = this.uninitializedEntry;

    this.pendingNavigations = new Queue<Navigation>(this.processNavigations);
  }

  public get queued(): number {
    return this.pendingNavigations.length;
  }

  public start(router: IRouter, options?: INavigatorOptions): void {
    if (this.isActive) {
      throw new Error('Navigator has already been started');
    }

    this.isActive = true;
    this.router = router;
    this.options = { ...options };
  }

  public stop(): void {
    if (!this.isActive) {
      throw new Error('Navigator has not been started');
    }
    this.pendingNavigations.clear();
    this.isActive = false;
  }

  public async navigate(entry: Navigation): Promise<void> {
    return this.pendingNavigations.enqueue(entry);
  }

  public processNavigations: (qEntry: QueueItem<Navigation>) => void = (qEntry: QueueItem<Navigation>): void => {
    const entry = qEntry as Navigation;
    const navigationFlags: INavigationFlags = {
      first: false,
      new: false,
      refresh: false,
      forward: false,
      back: false,
      replace: false,
    };

    if (this.currentEntry === this.uninitializedEntry) { // Refresh or first entry
      this.loadState();
      if (this.currentEntry !== this.uninitializedEntry) {
        navigationFlags.refresh = true;
      } else {
        navigationFlags.first = true;
        navigationFlags.new = true;
        // TODO: Should this really be created here? Shouldn't it be in the viewer?
        this.currentEntry = new Navigation({
          index: 0,
          instruction: '',
          fullStateInstruction: '',
          // path: this.options.viewer.getPath(true),
          // fromBrowser: null,
        });
        this.entries = [];
      }
    }
    if (entry.index !== void 0 && !entry.replacing && !entry.refreshing) { // History navigation
      entry.historyMovement = entry.index - (this.currentEntry.index !== void 0 ? this.currentEntry.index : 0);
      entry.instruction = this.entries[entry.index] !== void 0 && this.entries[entry.index] !== null ? this.entries[entry.index].fullStateInstruction : entry.fullStateInstruction;
      entry.replacing = true;
      if (entry.historyMovement > 0) {
        navigationFlags.forward = true;
      } else if (entry.historyMovement < 0) {
        navigationFlags.back = true;
      }
    } else if (entry.refreshing || navigationFlags.refresh) { // Refreshing
      entry.index = this.currentEntry.index;
    } else if (entry.replacing) { // Replacing
      navigationFlags.replace = true;
      navigationFlags.new = true;
      entry.index = this.currentEntry.index;
    } else { // New entry
      navigationFlags.new = true;
      entry.index = this.currentEntry.index !== void 0 ? this.currentEntry.index + 1 : this.entries.length;
    }
    this.invokeCallback(entry, navigationFlags, this.currentEntry);
  };

  public async refresh(): Promise<void> {
    const entry = this.currentEntry;
    if (entry === this.uninitializedEntry) {
      return Promise.reject();
    }
    entry.replacing = true;
    entry.refreshing = true;
    return this.navigate(entry);
  }

  public async go(movement: number): Promise<void> {
    const newIndex = (this.currentEntry.index !== undefined ? this.currentEntry.index : 0) + movement;
    if (newIndex >= this.entries.length) {
      return Promise.reject();
    }
    const entry = this.entries[newIndex];
    return this.navigate(entry);
  }

  public async setEntryTitle(title: string): Promise<void> {
    this.currentEntry.title = title;
    return this.saveState();
  }

  public get titles(): string[] {
    if (this.currentEntry === this.uninitializedEntry) {
      return [];
    }
    const index = this.currentEntry.index !== void 0 ? this.currentEntry.index : 0;
    return this.entries.slice(0, index + 1).filter((value) => !!value.title).map((value) => value.title ? value.title : '');
  }

  // Get the stored navigator state (json okay)
  public getState(): IStoredNavigatorState {
    const state = this.options.store ? { ...this.options.store.state } : {};
    const entries = (state.entries ?? []) as IStoredNavigation[];
    const currentEntry = (state.currentEntry ?? null) as IStoredNavigation;
    return { state, entries, currentEntry };
  }

  // Load a stored state into Navigation entries
  public loadState(): void {
    const state = this.getState();
    this.entries = state.entries.map(entry => new Navigation(entry));
    this.currentEntry = state.currentEntry !== null
      ? new Navigation(state.currentEntry)
      : this.uninitializedEntry;
  }

  // Save storeable versions of Navigation entries
  public async saveState(push: boolean = false): Promise<void> {
    if (this.currentEntry === this.uninitializedEntry) {
      return Promise.resolve();
    }
    const storedEntry = this.currentEntry.toStored();
    this.entries[storedEntry.index !== void 0 ? storedEntry.index : 0] = new Navigation(storedEntry);

    // If preserving history, serialize entries that aren't preserved
    if (this.options.statefulHistoryLength! > 0) {
      const index = this.entries.length - this.options.statefulHistoryLength!;
      for (let i = 0; i < index; i++) {
        const entry = this.entries[i];
        if (typeof entry.instruction !== 'string' || typeof entry.fullStateInstruction !== 'string') {
          await this.serializeEntry(entry, this.entries.slice(index));
        }
      }
    }

    if (!this.options.store) {
      return Promise.resolve();
    }
    const state: IStoredNavigatorState = {
      entries: (this.entries ?? []).map((entry: Navigation) => this.toStoreableEntry(entry)),
      currentEntry: this.toStoreableEntry(storedEntry),
    };

    // for (const entry of this.entries) {
    //   state.entries.push(this.toStoreableEntry(entry));
    // }

    if (state.currentEntry.title !== void 0) {
      (this.options!.store! as any).setTitle(state.currentEntry.title);
    }

    if (push) {
      return this.options.store.pushNavigatorState(state);
    } else {
      return this.options.store.replaceNavigatorState(state);
    }
  }

  public toStoredEntry(entry: Navigation): IStoredNavigatorEntry {
    const {
      previous,
      fromBrowser,
      origin,
      replacing,
      refreshing,
      untracked,
      historyMovement,
      navigation,
      scope,

      resolve,
      reject,

      ...storableEntry } = entry;
    return storableEntry;
  }

  public async finalize(instruction: Navigation): Promise<void> {
    this.currentEntry = instruction;
    let index = this.currentEntry.index !== undefined ? this.currentEntry.index : 0;
    if (this.currentEntry.untracked) {
      if (instruction.fromBrowser && this.options.store) {
        await this.options.store.popNavigatorState();
      }
      index--;
      this.currentEntry.index = index;
      this.entries[index] = this.currentEntry;
      await this.saveState();
    } else if (this.currentEntry.replacing) {
      this.entries[index] = this.currentEntry;
      await this.saveState();
    } else { // New entry (add and discard later entries)
      if (this.options.serializeCallback !== void 0 && this.options.statefulHistoryLength! > 0) {
        // Need to clear the instructions we discard!
        const indexPreserve = this.entries.length - this.options.statefulHistoryLength!;
        for (const entry of this.entries.slice(index)) {
          if (typeof entry.instruction !== 'string' || typeof entry.fullStateInstruction !== 'string') {
            await this.options.serializeCallback(entry, this.entries.slice(indexPreserve, index));
          }
        }
      }
      this.entries = this.entries.slice(0, index);
      this.entries.push(this.currentEntry);
      await this.saveState(true);
    }
    if (this.currentEntry.resolve) {
      this.currentEntry.resolve();
    }
  }

  public async cancel(instruction: Navigation): Promise<void> {
    if (instruction.fromBrowser && this.options.store) {
      if (instruction.navigation && instruction.navigation.new) {
        await this.options.store.popNavigatorState();
      } else {
        await this.options.store.go(-(instruction.historyMovement || 0), true);
      }
    }
    if (this.currentEntry.resolve) {
      this.currentEntry.resolve();
    }
  }

  private invokeCallback(entry: Navigation, navigationFlags: INavigationFlags, previousEntry: Navigation): void {
    const instruction: Navigation = new Navigation({ ...entry });
    instruction.navigation = navigationFlags;
    instruction.previous = previousEntry;
    if (this.options.callback) {
      this.options.callback(instruction);
    }
  }

  private toStoreableEntry(entry: Navigation | IStoredNavigation): IStoredNavigation {
    const storeable = entry instanceof Navigation ? entry.toStored() : entry;
    storeable.instruction = this.router.instructionResolver.stringifyViewportInstructions(storeable.instruction);
    storeable.fullStateInstruction = this.router.instructionResolver.stringifyViewportInstructions(storeable.fullStateInstruction);
    if (typeof storeable.scope !== 'string') {
      storeable.scope = null;
    }
    return storeable;
  }

  private async serializeEntry(entry: Navigation, preservedEntries: Navigation[]): Promise<void> {
    const instructionResolver = this.router.instructionResolver;
    let excludeComponents = [];
    // Components in preserved entries should not be serialized/freed
    for (const preservedEntry of preservedEntries) {
      if (typeof preservedEntry.instruction !== 'string') {
        excludeComponents.push(...instructionResolver.flattenViewportInstructions(preservedEntry.instruction)
          .filter(instruction => instruction.viewport !== null)
          .map(instruction => instruction.componentInstance));
      }
      if (typeof preservedEntry.fullStateInstruction !== 'string') {
        excludeComponents.push(...instructionResolver.flattenViewportInstructions(preservedEntry.fullStateInstruction)
          .filter(instruction => instruction.viewport !== null)
          .map(instruction => instruction.componentInstance));
      }
    }
    // Make unique
    excludeComponents = excludeComponents.filter(
      (component, i, arr) => component !== null && arr.indexOf(component) === i
    ) as IRouteableComponent[];

    let instructions = [];
    // The instructions, one or two, with possible components to free
    if (typeof entry.fullStateInstruction !== 'string') {
      instructions.push(...entry.fullStateInstruction);
      entry.fullStateInstruction = instructionResolver.stringifyViewportInstructions(entry.fullStateInstruction);
    }
    if (typeof entry.instruction !== 'string') {
      instructions.push(...entry.instruction);
      entry.instruction = instructionResolver.stringifyViewportInstructions(entry.instruction);
    }
    // Process only those with instances and make unique
    instructions = instructions.filter(
      (instruction, i, arr) =>
        instruction !== null
        && instruction.componentInstance !== null
        && arr.indexOf(instruction) === i
    );

    // Already freed components (updated when component is freed)
    const alreadyDone: IRouteableComponent[] = [];
    for (const instruction of instructions) {
      await this.freeInstructionComponents(instruction, excludeComponents, alreadyDone);
    }
  }

  private freeInstructionComponents(instruction: ViewportInstruction, excludeComponents: IRouteableComponent[], alreadyDone: IRouteableComponent[]): void | Promise<void> {
    const component = instruction.componentInstance;
    const viewport = instruction.viewport;
    if (component === null || viewport === null || alreadyDone.some(done => done === component)) {
      return;
    }
    if (!excludeComponents.some(exclude => exclude === component)) {
      // console.log('>>> Runner.run', 'freeContent');
      return Runner.run(null,
        () => viewport.freeContent(component),
        () => {
          alreadyDone.push(component);
        },
      );
    }
    if (instruction.nextScopeInstructions !== null) {
      for (const nextInstruction of instruction.nextScopeInstructions) {
        // console.log('>>> Runner.run', 'freeInstructionComponents');
        return Runner.run(null,
          () => this.freeInstructionComponents(nextInstruction, excludeComponents, alreadyDone)
        );
      }
    }
  }
}
