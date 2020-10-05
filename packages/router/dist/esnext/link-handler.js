import { IDOM, CustomAttribute } from '@aurelia/runtime';
/**
 * Class responsible for handling interactions that should trigger navigation.
 *
 * @internal - Shouldn't be used directly.
 */
let LinkHandler = /** @class */ (() => {
    class LinkHandler {
        constructor(dom) {
            this.options = {
                useHref: true,
                callback: () => { return; }
            };
            this.isActive = false;
            this.handler = (e) => {
                const info = LinkHandler.getEventInfo(e, this.window, this.options);
                if (info.shouldHandleEvent) {
                    e.preventDefault();
                    this.options.callback(info);
                }
            };
            this.window = dom.window;
            this.document = dom.document;
        }
        /**
         * Gets the href and a "should handle" recommendation, given an Event.
         *
         * @param event - The Event to inspect for target anchor and href.
         */
        static getEventInfo(event, win, options) {
            var _a;
            const info = {
                shouldHandleEvent: false,
                instruction: null,
                anchor: null
            };
            const target = info.anchor = event.currentTarget;
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
            const goto = gotoAttr !== void 0 ? gotoAttr.viewModel.value : null;
            const loadAttr = CustomAttribute.for(target, 'load');
            const load = loadAttr !== void 0 ? loadAttr.viewModel.value : null;
            const href = options.useHref && target.hasAttribute('href') ? target.getAttribute('href') : null;
            if ((goto === null || goto.length === 0) && (load === null || load.length === 0) && (href === null || href.length === 0)) {
                return info;
            }
            info.anchor = target;
            info.instruction = (_a = load !== null && load !== void 0 ? load : goto) !== null && _a !== void 0 ? _a : href;
            const leftButtonClicked = event.button === 0;
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
        static targetIsThisWindow(target, win) {
            const targetWindow = target.getAttribute('target');
            return !targetWindow ||
                targetWindow === win.name ||
                targetWindow === '_self';
        }
        /**
         * Start the instance.
         *
         */
        start(options) {
            if (this.isActive) {
                throw new Error('Link handler has already been started');
            }
            this.isActive = true;
            this.options = { ...options };
        }
        /**
         * Stop the instance. Event handlers and other resources should be cleaned up here.
         */
        stop() {
            if (!this.isActive) {
                throw new Error('Link handler has not been started');
            }
            this.isActive = false;
        }
    }
    LinkHandler.inject = [IDOM];
    return LinkHandler;
})();
export { LinkHandler };
//# sourceMappingURL=link-handler.js.map