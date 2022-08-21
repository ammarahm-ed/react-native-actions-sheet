var EventManager = /** @class */ (function () {
    function EventManager() {
        this._registry = new Map();
    }
    EventManager.prototype.unsubscribeAll = function () {
        this._registry.clear();
    };
    EventManager.prototype.subscribe = function (name, handler, once) {
        var _this = this;
        if (once === void 0) { once = false; }
        if (!name || !handler)
            throw new Error('name and handler are required.');
        this._registry.set(handler, { name: name, once: once });
        return { unsubscribe: function () { return _this.unsubscribe(name, handler); } };
    };
    EventManager.prototype.unsubscribe = function (_name, handler) {
        return this._registry["delete"](handler);
    };
    EventManager.prototype.publish = function (name) {
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this._registry.forEach(function (props, handler) {
            if (props.name === name)
                handler.apply(void 0, args);
            if (props.once)
                _this._registry["delete"](handler);
        });
    };
    EventManager.prototype.remove = function () {
        var _this = this;
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i] = arguments[_i];
        }
        this._registry.forEach(function (props, handler) {
            if (names.includes(props.name))
                _this._registry["delete"](handler);
        });
    };
    return EventManager;
}());
export default EventManager;
export var actionSheetEventManager = new EventManager();
