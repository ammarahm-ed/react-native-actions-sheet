var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { actionSheetEventManager } from './eventmanager';
import { sheetsRegistry } from './provider';
var baseZindex = 999;
// Array of all the ids of ActionSheets currently rendered in the app.
var ids = [];
var refs = {};
/**
 * Get rendered action sheets stack
 * @returns
 */
export function getSheetStack() {
    return ids.map(function (id) {
        var _a;
        return {
            id: id.split(':')[0],
            context: ((_a = id.split(':')) === null || _a === void 0 ? void 0 : _a[1]) || 'global'
        };
    });
}
/**
 * A function that checks whether the action sheet is rendered on top or not.
 * @param id
 * @param context
 * @returns
 */
export function isRenderedOnTop(id, context) {
    return ids[ids.length - 1] === "".concat(id, ":").concat(context);
}
/**
 * Set the base zIndex upon which action sheets will be stacked. Should be called once in the global space.
 *
 * Default `baseZIndex` is `999`.
 *
 * @param zIndex
 */
export function setBaseZIndexForActionSheets(zIndex) {
    baseZindex = zIndex;
}
/**
 * Since non modal based sheets are stacked one above the other, they need to have
 * different zIndex for gestures to work correctly.
 * @param id
 * @param context
 * @returns
 */
export function getZIndexFromStack(id, context) {
    var index = ids.indexOf("".concat(id, ":").concat(context));
    if (index > -1) {
        return baseZindex + index + 1;
    }
    return baseZindex;
}
var SM = /** @class */ (function () {
    function SM() {
        this.registerRef = function (id, context, instance) {
            refs["".concat(id, ":").concat(context)] = instance;
        };
        /**
         *
         * Get internal ref of a sheet by the given id.
         * @returns
         */
        this.get = function (id, context) {
            if (context === void 0) { context = 'global'; }
            return refs["".concat(id, ":").concat(context)];
        };
        this.add = function (id, context) {
            if (ids.indexOf(id) < 0) {
                ids[ids.length] = "".concat(id, ":").concat(context);
            }
        };
        this.remove = function (id, context) {
            if (ids.indexOf("".concat(id, ":").concat(context)) > -1) {
                ids.splice(ids.indexOf("".concat(id, ":").concat(context)));
            }
        };
    }
    /**
     * Show the ActionSheet with a given id.
     *
     * @param id id of the ActionSheet to show
     * @param options
     */
    SM.prototype.show = function (id, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var handler = function (data, context) {
                            var _a;
                            if (context === void 0) { context = 'global'; }
                            if (context !== 'global' &&
                                (options === null || options === void 0 ? void 0 : options.context) &&
                                options.context !== context)
                                return;
                            (_a = options === null || options === void 0 ? void 0 : options.onClose) === null || _a === void 0 ? void 0 : _a.call(options, data);
                            sub === null || sub === void 0 ? void 0 : sub.unsubscribe();
                            resolve(data);
                        };
                        var sub = actionSheetEventManager.subscribe("onclose_".concat(id), handler);
                        // Check if the sheet is registered with any `SheetProviders`.
                        var isRegisteredWithSheetProvider = false;
                        for (var ctx in sheetsRegistry) {
                            for (var _id in sheetsRegistry[ctx]) {
                                if (_id === id) {
                                    isRegisteredWithSheetProvider = true;
                                }
                            }
                        }
                        actionSheetEventManager.publish(isRegisteredWithSheetProvider ? "show_wrap_".concat(id) : "show_".concat(id), options === null || options === void 0 ? void 0 : options.payload, options === null || options === void 0 ? void 0 : options.context);
                    })];
            });
        });
    };
    /**
     * An async hide function. This is useful when you want to show one ActionSheet after closing another.
     *
     * @param id id of the ActionSheet to show
     * @param data
     */
    SM.prototype.hide = function (id, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var hideHandler = function (data, context) {
                            if (context === void 0) { context = 'global'; }
                            if (context !== 'global' &&
                                (options === null || options === void 0 ? void 0 : options.context) &&
                                options.context !== context)
                                return;
                            sub === null || sub === void 0 ? void 0 : sub.unsubscribe();
                            resolve(data);
                        };
                        var sub = actionSheetEventManager.subscribe("onclose_".concat(id), hideHandler);
                        var isRegisteredWithSheetProvider = false;
                        // Check if the sheet is registered with any `SheetProviders`.
                        for (var ctx in sheetsRegistry) {
                            for (var _id in sheetsRegistry[ctx]) {
                                if (_id === id) {
                                    isRegisteredWithSheetProvider = true;
                                }
                            }
                        }
                        actionSheetEventManager.publish(isRegisteredWithSheetProvider ? "hide_wrap_".concat(id) : "hide_".concat(id), options === null || options === void 0 ? void 0 : options.payload, options === null || options === void 0 ? void 0 : options.context);
                    })];
            });
        });
    };
    /**
     * Hide all the opened ActionSheets.
     */
    SM.prototype.hideAll = function () {
        ids.forEach(function (id) {
            var _a;
            actionSheetEventManager.publish("hide_".concat((_a = id.split(':')) === null || _a === void 0 ? void 0 : _a[0]));
        });
    };
    return SM;
}());
/**
 * SheetManager is used to imperitively show/hide any ActionSheet with a
 * unique id prop.
 */
export var SheetManager = new SM();
