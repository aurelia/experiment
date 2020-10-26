(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@aurelia/runtime-html", "./test-context"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createFixture = void 0;
    const runtime_html_1 = require("@aurelia/runtime-html");
    const test_context_1 = require("./test-context");
    function createFixture(template, $class, registrations = [], autoStart = true, ctx = test_context_1.TestContext.create()) {
        const { container, lifecycle, platform, observerLocator } = ctx;
        container.register(...registrations);
        const root = ctx.doc.body.appendChild(ctx.doc.createElement('div'));
        const host = root.appendChild(ctx.createElement('app'));
        const au = new runtime_html_1.Aurelia(container);
        const App = runtime_html_1.CustomElement.define({ name: 'app', template }, $class || class {
        });
        const component = new App();
        let startPromise = void 0;
        if (autoStart) {
            au.app({ host: host, component });
            startPromise = au.start();
        }
        return {
            startPromise,
            ctx,
            host: ctx.doc.firstElementChild,
            container,
            lifecycle,
            platform,
            testHost: root,
            appHost: host,
            au,
            component,
            observerLocator,
            start: async () => {
                await au.app({ host: host, component }).start();
            },
            tearDown: async () => {
                await au.stop();
                root.remove();
                au.dispose();
            }
        };
    }
    exports.createFixture = createFixture;
});
//# sourceMappingURL=startup.js.map