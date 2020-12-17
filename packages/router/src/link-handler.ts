/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { IPlatform, CustomAttribute } from '@aurelia/runtime-html';
import { GotoCustomAttribute } from './resources/goto.js';
import { LoadCustomAttribute } from './resources/load.js';

/**
 * Provides information about how to handle an anchor event.
 *
 * @internal - Shouldn't be used directly.
 */
export interface ILinkHandlerOptions {
  /**
   * Attribute href should be used for instruction if present and
   * attribute load is not present
   */
  useHref?: boolean;
  /**
   * Callback method for when a link is clicked
   */
  callback(info: AnchorEventInfo): void;
}

/**
 * Provides information about how to handle an anchor event.
 *
 * @internal - Shouldn't be used directly.
 */
export interface AnchorEventInfo {
  /**
   * Indicates whether the event should be handled or not.
   */
  shouldHandleEvent: boolean;
  /**
   * The instruction (href) of the link or null if not-applicable.
   */
  instruction: string | null;
  /**
   * The anchor element or null if not-applicable.
   */
  anchor: Element | null;
}

/**
 * Class responsible for handling interactions that should trigger navigation.
 *
 * @ internal - Shouldn't be used directly.
 * TODO: remove the space between @ and i again at some point (this stripInternal currently screws up the types in the __tests__ package for some reason)
 */
export class LinkHandler {
  public window: Window;
  public document: Document;

  private options: ILinkHandlerOptions = {
    useHref: true,
    callback: () => { return; }
  };
  private isActive: boolean = false;

  public constructor(@IPlatform p: IPlatform) {
    this.window = p.window;
    this.document = p.document;
  }
  /**
   * Gets the href and a "should handle" recommendation, given an Event.
   *
   * @param event - The Event to inspect for target anchor and href.
   */
  private static getEventInfo(event: MouseEvent, win: Window, options: ILinkHandlerOptions): AnchorEventInfo {
    const info: AnchorEventInfo = {
      shouldHandleEvent: false,
      instruction: null,
      anchor: null
    };

    const target = info.anchor = event.currentTarget as Element;
    // Switch to this for delegation:
    // const target = info.anchor = LinkHandler.closestAnchor(event.target as Element);
    if (!target || !LinkHandler.targetIsThisWindow(target, win)) {
      return info;
    }

    if (target.hasAttribute('external')) {
      return info;
    }

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return info;
    }

    const gotoAttr = CustomAttribute.for(target, 'goto');
    const goto = gotoAttr !== void 0 ? (gotoAttr.viewModel as GotoCustomAttribute).value as string : null;
    const loadAttr = CustomAttribute.for(target, 'load');
    const load = loadAttr !== void 0 ? (loadAttr.viewModel as LoadCustomAttribute).value as string : null;
    const href = options.useHref && target.hasAttribute('href') ? target.getAttribute('href') : null;
    if ((goto === null || goto.length === 0) && (load === null || load.length === 0) && (href === null || href.length === 0)) {
      return info;
    }

    info.anchor = target;
    info.instruction = load ?? goto ?? href;

    const leftButtonClicked: boolean = event.button === 0;

    info.shouldHandleEvent = leftButtonClicked;
    return info;
  }

  /**
   * Finds the closest ancestor that's an anchor element.
   *
   * @param el - The element to search upward from.
   * @returns The link element that is the closest ancestor.
   */
  // private static closestAnchor(el: Element): Element | null {
  //   while (el !== null && el !== void 0) {
  //     if (el.tagName === 'A') {
  //       return el;
  //     }
  //     el = el.parentNode as Element;
  //   }
  //   return null;
  // }

  /**
   * Gets a value indicating whether or not an anchor targets the current window.
   *
   * @param target - The anchor element whose target should be inspected.
   * @returns True if the target of the link element is this window; false otherwise.
   */
  private static targetIsThisWindow(target: Element, win: Window): boolean {
    const targetWindow = target.getAttribute('target');

    return !targetWindow ||
      targetWindow === win.name ||
      targetWindow === '_self';
  }

  /**
   * Start the instance.
   *
   */
  public start(options: ILinkHandlerOptions): void {
    if (this.isActive) {
      throw new Error('Link handler has already been started');
    }

    this.isActive = true;
    this.options = { ...options };
  }

  /**
   * Stop the instance. Event handlers and other resources should be cleaned up here.
   */
  public stop(): void {
    if (!this.isActive) {
      throw new Error('Link handler has not been started');
    }
    this.isActive = false;
  }

  public readonly handler: EventListener = (e: Event) => {
    const info = LinkHandler.getEventInfo(e as MouseEvent, this.window, this.options);

    if (info.shouldHandleEvent) {
      e.preventDefault();
      this.options.callback(info);
    }
  };
}
