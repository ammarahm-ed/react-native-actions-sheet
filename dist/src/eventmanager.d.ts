declare class EventManager {
    _registry: {
        [name: string]: Function[];
    };
    constructor();
    unsubscribeAll(): void;
    subscribe(name: string, handler: Function): () => void;
    unsubscribe(name: string, handler: Function): void;
    publish(name: string, ...args: any[]): void;
}
export declare const actionSheetEventManager: EventManager;
export {};
//# sourceMappingURL=eventmanager.d.ts.map