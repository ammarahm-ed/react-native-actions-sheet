/* eslint-disable curly */
export type EventHandler = (...args: any[]) => void;
export type EventHandlerSubscription = {
  unsubscribe: () => void;
};

class EventManager {
  _registry: Map<
    EventHandler,
    {
      name: string;
      once: boolean;
    }
  >;
  constructor() {
    this._registry = new Map();
  }

  unsubscribeAll() {
    this._registry.clear();
  }

  subscribe(name: string, handler: EventHandler, once = false) {
    if (!name || !handler) throw new Error('name and handler are required.');
    this._registry.set(handler, {name, once});
    return {unsubscribe: () => this.unsubscribe(name, handler)};
  }

  unsubscribe(_name: string, handler: EventHandler) {
    return this._registry.delete(handler);
  }

  publish(name: string, ...args: any[]) {
    this._registry.forEach((props, handler) => {
      if (props.name === name) handler(...args);
      if (props.once) this._registry.delete(handler);
    });
  }

  remove(...names: string[]) {
    this._registry.forEach((props, handler) => {
      if (names.includes(props.name)) this._registry.delete(handler);
    });
  }
}
export default EventManager;

export const actionSheetEventManager = new EventManager();
