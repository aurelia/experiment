import { DebugConfiguration } from '@aurelia/debug';
import { DI, IContainer, IRegistry, Registration } from '@aurelia/kernel';
import {
  IDOM,
  ILifecycle,
  IObserverLocator,
  IProjectorLocator,
  IRenderer,
  IScheduler,
  ITemplateCompiler,
} from '@aurelia/runtime';
import { HTMLDOM } from '@aurelia/runtime-html';
import { createDOMScheduler } from '@aurelia/scheduler-dom';

export class HTMLTestContext {
  public readonly wnd: Window;
  public readonly doc: Document;
  public readonly dom: HTMLDOM;

  public readonly UIEvent: typeof UIEvent;
  public readonly Event: typeof Event;
  public readonly CustomEvent: typeof CustomEvent;
  public readonly Node: typeof Node;
  public readonly Element: typeof Element;
  public readonly HTMLElement: typeof HTMLElement;
  public readonly HTMLDivElement: typeof HTMLDivElement;
  public readonly Text: typeof Text;
  public readonly Comment: typeof Comment;
  public readonly DOMParser: typeof DOMParser;

  private readonly config: IRegistry;

  public get container(): IContainer {
    if (this._container === void 0) {
      this._container = DI.createContainer().register(this.config);
      Registration.instance(IDOM, this.dom).register(this._container);
      Registration.instance(HTMLTestContext, this).register(this._container);
      Registration.instance(IScheduler, createDOMScheduler(this._container, this.wnd)).register(this._container);
      this._container.register(DebugConfiguration);
    }
    return this._container;
  }
  public get scheduler(): IScheduler {
    if (this._scheduler === void 0) {
      this._scheduler = this.container.register(
        Registration.instance(IScheduler, createDOMScheduler(this.container, this.wnd))
      ).getAll(IScheduler)[0];
    }
    return this._scheduler;
  }
  public get templateCompiler(): ITemplateCompiler {
    if (this._templateCompiler === void 0) {
      this._templateCompiler = this.container.get(ITemplateCompiler);
    }
    return this._templateCompiler;
  }
  public get observerLocator(): IObserverLocator {
    if (this._observerLocator === void 0) {
      this._observerLocator = this.container.getAll(IObserverLocator)[0];
    }
    return this._observerLocator;
  }
  public get lifecycle(): ILifecycle {
    if (this._lifecycle === void 0) {
      this._lifecycle = this.container.get(ILifecycle);
    }
    return this._lifecycle;
  }
  public get renderer(): IRenderer {
    if (this._renderer === void 0) {
      this._renderer = this.container.get(IRenderer);
    }
    return this._renderer;
  }
  public get projectorLocator(): IProjectorLocator {
    if (this._projectorLocator === void 0) {
      this._projectorLocator = this.container.get(IProjectorLocator);
    }
    return this._projectorLocator;
  }
  public get domParser(): HTMLDivElement {
    if (this._domParser === void 0) {
      this._domParser = this.doc.createElement('div');
    }
    return this._domParser;
  }

  private _container?: IContainer;
  private _scheduler?: IScheduler;
  private _templateCompiler?: ITemplateCompiler;
  private _observerLocator?: IObserverLocator;
  private _lifecycle?: ILifecycle;
  private _renderer?: IRenderer;
  private _projectorLocator?: IProjectorLocator;
  private _domParser?: HTMLDivElement;

  private constructor(
    config: IRegistry,
    wnd: Window,
    UIEventType: typeof UIEvent,
    EventType: typeof Event,
    CustomEventType: typeof CustomEvent,
    NodeType: typeof Node,
    ElementType: typeof Element,
    HTMLElementType: typeof HTMLElement,
    HTMLDivElementType: typeof HTMLDivElement,
    TextType: typeof Text,
    CommentType: typeof Comment,
    DOMParserType: typeof DOMParser,
    CSSStyleSheetType: typeof CSSStyleSheet,
    ShadowRootType: typeof ShadowRoot
  ) {
    this.config = config;
    this.wnd = wnd;
    this.UIEvent = UIEventType;
    this.Event = EventType;
    this.CustomEvent = CustomEventType;
    this.Node = NodeType;
    this.Element = ElementType;
    this.HTMLElement = HTMLElementType;
    this.HTMLDivElement = HTMLDivElementType;
    this.Text = TextType;
    this.Comment = CommentType;
    this.DOMParser = DOMParserType;
    this.doc = wnd.document;
    this.dom = new HTMLDOM(this.wnd, this.doc, NodeType, ElementType, HTMLElementType, CustomEventType, CSSStyleSheetType, ShadowRootType);
    this._container = void 0;
    this._scheduler = void 0;
    this._templateCompiler = void 0;
    this._observerLocator = void 0;
    this._lifecycle = void 0;
    this._renderer = void 0;
    this._projectorLocator = void 0;
    this._domParser = void 0;
  }

  public static create(
    config: IRegistry,
    wnd: Window,
    UIEventType: typeof UIEvent,
    EventType: typeof Event,
    CustomEventType: typeof CustomEvent,
    NodeType: typeof Node,
    ElementType: typeof Element,
    HTMLElementType: typeof HTMLElement,
    HTMLDivElementType: typeof HTMLDivElement,
    TextType: typeof Text,
    CommentType: typeof Comment,
    DOMParserType: typeof DOMParser,
    CSSStyleSheetType: typeof CSSStyleSheet,
    ShadowRootType: typeof ShadowRoot
  ): HTMLTestContext {
    return new HTMLTestContext(
      config,
      wnd,
      UIEventType,
      EventType,
      CustomEventType,
      NodeType,
      ElementType,
      HTMLElementType,
      HTMLDivElementType,
      TextType,
      CommentType,
      DOMParserType,
      CSSStyleSheetType,
      ShadowRootType
    );
  }

  public createElementFromMarkup(markup: string): HTMLElement {
    this.domParser.innerHTML = markup;
    return this.domParser.firstElementChild as HTMLElement;
  }

  public createElement(name: string): HTMLElement {
    return this.doc.createElement(name);
  }

  public createAttribute(name: string, value: string): Attr {
    const attr = this.doc.createAttribute(name);
    attr.value = value;
    return attr;
  }
}

export const TestContext = {
  createHTMLTestContext(): HTMLTestContext {
    throw new Error('No createHTMLTestContext function has been provided. Did you forget to call initializeJSDOMTestContext() or initializeBrowserTestContext()?');
  }
};
