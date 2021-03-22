"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = exports.WebviewConnector = void 0;
const tslib_1 = require("tslib");
const plugin_1 = require("@remixproject/plugin");
/** Transform camelCase (JS) text into kebab-case (CSS) */
function toKebabCase(text) {
    return text.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}
;
/**
 * This Webview connector
 */
class WebviewConnector {
    constructor(options) {
        this.options = options;
        // @todo(#295) check if we can merge this statement in `this.isVscode = acquireVsCodeApi !== undefined`
        try {
            this.isVscode = acquireTheiaApi !== undefined;
            this.source = acquireTheiaApi();
            return;
        }
        catch (e) {
            this.isVscode = false;
        }
        // fallback to window parent (iframe)
        this.source = window.parent;
    }
    /** Send a message to the engine */
    send(message) {
        if (this.isVscode) {
            this.source.postMessage(message);
        }
        else if (this.origin || plugin_1.isHandshake(message)) {
            const origin = this.origin || '*';
            this.source.postMessage(message, origin);
        }
    }
    /** Get messae from the engine */
    on(cb) {
        window.addEventListener('message', (event) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!event.source)
                return;
            if (!event.data)
                return;
            if (!plugin_1.isPluginMessage(event.data))
                return;
            // Support for iframe
            if (!this.isVscode) {
                // Check that the origin is the right one (if any defined in the options)
                const isGoodOrigin = yield plugin_1.checkOrigin(event.origin, this.options);
                if (!isGoodOrigin)
                    return console.warn('Origin provided is not allow in message', event);
                if (plugin_1.isHandshake(event.data)) {
                    this.origin = event.origin;
                    this.source = event.source;
                    if (event.data.payload[1] && event.data.payload[1] == 'vscode')
                        this.forwardEvents();
                }
            }
            cb(event.data);
        }), false);
    }
    // vscode specific, webview iframe requires forwarding of keyboard events & links clicked 
    forwardEvents() {
        document.addEventListener('keydown', e => {
            const obj = {
                altKey: e.altKey,
                code: e.code,
                ctrlKey: e.ctrlKey,
                isComposing: e.isComposing,
                key: e.key,
                location: e.location,
                metaKey: e.metaKey,
                repeat: e.repeat,
                shiftKey: e.shiftKey,
                action: 'keydown'
            };
            window.parent.postMessage(obj, '*');
        });
        document.body.onclick = function (e) {
            var _a;
            const closest = (_a = e.target) === null || _a === void 0 ? void 0 : _a.closest("a");
            if (closest) {
                const href = closest.getAttribute('href');
                if (href != '#') {
                    window.parent.postMessage({
                        action: 'emit',
                        payload: {
                            href: href,
                        },
                    }, '*');
                    return false;
                }
            }
            return true;
        };
    }
}
exports.WebviewConnector = WebviewConnector;
/**
 * Connect a Webview plugin client to a web engine
 * @param client An optional websocket plugin client to connect to the engine.
 */
exports.createClient = (client) => {
    const c = client || new plugin_1.PluginClient();
    const options = c.options;
    const connector = new WebviewConnector(options);
    plugin_1.connectClient(connector, c);
    plugin_1.applyApi(c);
    if (!options.customTheme) {
        listenOnThemeChanged(c);
    }
    return c;
};
/** Set the theme variables in the :root */
function applyTheme(theme) {
    const brightness = theme.brightness || theme.quality;
    document.documentElement.style.setProperty(`--brightness`, brightness);
    if (theme.colors) {
        for (const [key, value] of Object.entries(theme.colors)) {
            document.documentElement.style.setProperty(`--${toKebabCase(key)}`, value);
        }
    }
    if (theme.breakpoints) {
        for (const [key, value] of Object.entries(theme.breakpoints)) {
            document.documentElement.style.setProperty(`--breakpoint-${key}`, `${value}px`);
        }
    }
    if (theme.fontFamily) {
        document.documentElement.style.setProperty(`--font-family`, theme.fontFamily);
    }
    if (theme.space) {
        document.documentElement.style.setProperty(`--space`, `${theme.space}px`);
    }
}
/** Start listening on theme changed */
function listenOnThemeChanged(client) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let cssLink;
        // Memorized the css link but only create it when needed
        const getLink = () => {
            if (!cssLink) {
                cssLink = document.createElement('link');
                cssLink.setAttribute('rel', 'stylesheet');
                document.head.prepend(cssLink);
            }
            return cssLink;
        };
        // If there is a url in the theme, use it
        const setLink = (theme) => {
            if (theme.url) {
                const url = theme.url.replace(/^http:/, "protocol:/").replace(/^https:/, "protocol:/");
                getLink().setAttribute('href', url.replace(/^protocol:/, "https:/"));
                getLink().setAttribute('href', url.replace(/^protocol:/, "http:/"));
                document.documentElement.style.setProperty('--theme', theme.quality);
            }
        };
        client.onload(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            // On Change
            client.on('theme', 'themeChanged', (theme) => {
                setLink(theme);
                applyTheme(theme);
            });
            // Initial load
            const theme = yield client.call('theme', 'currentTheme');
            setLink(theme);
            applyTheme(theme);
        }));
        return cssLink;
    });
}
//# sourceMappingURL=connector.js.map