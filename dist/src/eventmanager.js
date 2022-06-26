var EventManager = /** @class */ (function () {
    function EventManager() {
        this._registry = {};
    }
    EventManager.prototype.unsubscribeAll = function () {
        this._registry = {};
    };
    EventManager.prototype.subscribe = function (name, handler) {
        var _this = this;
        if (!name || !handler)
            throw new Error("name and handler are required.");
        if (!this._registry[name])
            this._registry[name] = [];
        this._registry[name].push(handler);
        return function () { return _this.unsubscribe(name, handler); };
    };
    EventManager.prototype.unsubscribe = function (name, handler) {
        if (!this._registry[name])
            return;
        var index = this._registry[name].indexOf(handler);
        if (index <= -1)
            return;
        this._registry[name].splice(index, 1);
    };
    EventManager.prototype.publish = function (name) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this._registry[name])
            return;
        var handlers = this._registry[name];
        handlers.forEach(function (handler) {
            handler.apply(void 0, args);
        });
    };
    return EventManager;
}());
export var actionSheetEventManager = new EventManager();
