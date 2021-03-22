"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginClient = exports.handleConnectionError = exports.defaultOptions = void 0;
const tslib_1 = require("tslib");
const events_1 = require("events");
const plugin_api_1 = require("@remixproject/plugin-api");
const plugin_utils_1 = require("@remixproject/plugin-utils");
exports.defaultOptions = {
    customTheme: false,
    customApi: plugin_api_1.remixProfiles,
};
/** Throw an error if client try to send a message before connection */
function handleConnectionError(devMode) {
    const err = devMode
        ? `Make sure the port of the IDE is ${devMode.port}`
        : 'If you are using a local IDE, make sure to add devMode in client options';
    throw new Error(`Not connected to the IDE. ${err}`);
}
exports.handleConnectionError = handleConnectionError;
class PluginClient {
    constructor(options = {}) {
        this.id = 0;
        this.isLoaded = false;
        this.events = new events_1.EventEmitter();
        this.activateService = {};
        this.options = Object.assign(Object.assign({}, exports.defaultOptions), options);
        this.events.once('loaded', () => {
            this.isLoaded = true;
            if (this.onActivation)
                this.onActivation();
        });
    }
    // Wait until this connection is settled
    onload(cb) {
        return new Promise((res, rej) => {
            const loadFn = () => {
                res();
                if (cb)
                    cb();
            };
            this.isLoaded ? loadFn() : this.events.once('loaded', () => loadFn());
        });
    }
    /**
     * Ask the plugin manager if current request can call a specific method
     * @param method The method to call
     * @param message An optional message to show to the user
     */
    askUserPermission(method, message) {
        // Internal call
        if (!this.currentRequest) {
            return Promise.resolve(true);
        }
        // External call
        if (this.methods.includes(method)) {
            const from = this.currentRequest.from;
            const to = this.name;
            return this.call('manager', 'canCall', from, to, method, message);
        }
        else {
            return Promise.resolve(false);
        }
    }
    /**
     * Called before deactivating the plugin
     * @param from profile of plugin asking to deactivate
     * @note PluginManager will always be able to deactivate
     */
    canDeactivate(from) {
        return true;
    }
    //////////////////////
    // CALL / ON / EMIT //
    //////////////////////
    /** Make a call to another plugin */
    call(name, key, ...payload) {
        if (!this.isLoaded)
            handleConnectionError(this.options.devMode);
        this.id++;
        return new Promise((res, rej) => {
            const callName = plugin_utils_1.callEvent(name, key, this.id);
            this.events.once(callName, (result, error) => {
                error
                    ? rej(new Error(`Error from IDE : ${error}`))
                    : res(result);
            });
            this.events.emit('send', { action: 'request', name, key, payload, id: this.id });
        });
    }
    /** Listen on event from another plugin */
    on(name, key, cb) {
        const eventName = plugin_utils_1.listenEvent(name, key);
        this.events.on(eventName, cb);
        this.events.emit('send', { action: 'on', name, key, id: this.id });
    }
    /** Listen once on event from another plugin */
    once(name, key, cb) {
        const eventName = plugin_utils_1.listenEvent(name, key);
        this.events.once(eventName, cb);
        this.events.emit('send', { action: 'once', name, key, id: this.id });
    }
    /** Remove all listeners on an event from an external plugin */
    off(name, key) {
        const eventName = plugin_utils_1.listenEvent(name, key);
        this.events.removeAllListeners(eventName);
        this.events.emit('send', { action: 'off', name, key, id: this.id });
    }
    /** Expose an event for the IDE */
    emit(key, ...payload) {
        if (!this.isLoaded)
            handleConnectionError(this.options.devMode);
        this.events.emit('send', { action: 'emit', key, payload });
    }
    /////////////
    // SERVICE //
    /////////////
    /**
     * Create a service under the client node
     * @param name The name of the service
     * @param service The service
     */
    createService(name, service) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.methods && this.methods.includes(name)) {
                throw new Error('A service cannot have the same name as an exposed method');
            }
            const _service = plugin_utils_1.createService(name, service);
            yield plugin_utils_1.activateService(this, _service);
            return _service;
        });
    }
    /**
     * Prepare a service to be lazy loaded
     * @param name The name of the subservice inside this service
     * @param factory A function to create the service on demand
     */
    prepareService(name, factory) {
        return this.activateService[name] = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.methods && this.methods.includes(name)) {
                throw new Error('A service cannot have the same name as an exposed method');
            }
            const service = yield factory();
            const _service = plugin_utils_1.createService(name, service);
            yield plugin_utils_1.activateService(this, _service);
            delete this.activateService[name];
            return _service;
        });
    }
}
exports.PluginClient = PluginClient;
//# sourceMappingURL=client.js.map