export declare type EventHandler = (...args: any[]) => void;
export declare type EventHandlerSubscription = {
    unsubscribe: () => void;
};
declare class EventManager {
    _registry: Map<EventHandler, {
        name: string;
        once: boolean;
    }>;
    constructor();
    unsubscribeAll(): void;
    subscribe(name: string, handler: EventHandler, once?: boolean): {
        unsubscribe: () => boolean;
    };
    unsubscribe(_name: string, handler: EventHandler): boolean;
    publish(name: string, ...args: any[]): void;
    remove(...names: string[]): void;
}
export default EventManager;
export declare const actionSheetEventManager: EventManager;
//# sourceMappingURL=eventmanager.d.ts.map