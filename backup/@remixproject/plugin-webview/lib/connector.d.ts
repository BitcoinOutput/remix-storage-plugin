import type { Message, Api, PluginApi } from '@remixproject/plugin-utils';
import { ClientConnector, PluginClient, PluginOptions } from '@remixproject/plugin';
import { IRemixApi } from '@remixproject/plugin-api';
declare global {
    function acquireTheiaApi(): any;
}
/**
 * This Webview connector
 */
export declare class WebviewConnector implements ClientConnector {
    private options;
    source: {
        postMessage: (message: any, origin?: string) => void;
    };
    origin: string;
    isVscode: boolean;
    constructor(options: PluginOptions<any>);
    /** Send a message to the engine */
    send(message: Partial<Message>): void;
    /** Get messae from the engine */
    on(cb: (message: Partial<Message>) => void): void;
    forwardEvents(): void;
}
/**
 * Connect a Webview plugin client to a web engine
 * @param client An optional websocket plugin client to connect to the engine.
 */
export declare const createClient: <P extends Api = any, App extends Readonly<Record<string, Api>> = Readonly<IRemixApi>, C extends PluginClient<P, App> = any>(client: C) => C & PluginApi<App>;
