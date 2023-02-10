var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { createContext, useCallback, useContext, useState } from 'react';
export var useRouter = function (_a) {
    var onNavigate = _a.onNavigate, onNavigateBack = _a.onNavigateBack, initialRoute = _a.initialRoute, routes = _a.routes, getRef = _a.getRef;
    var _b = useState([]), stack = _b[0], setStack = _b[1];
    var currentRoute = stack === null || stack === void 0 ? void 0 : stack[stack.length - 1];
    var navigate = useCallback(function (name, params, snap) {
        getRef === null || getRef === void 0 ? void 0 : getRef().snapToRelativeOffset(snap || 20);
        setTimeout(function () {
            setStack(function (state) {
                var next = routes === null || routes === void 0 ? void 0 : routes.find(function (route) { return route.name === name; });
                if (!next) {
                    return state;
                }
                var currentIndex = state.findIndex(function (route) { return route.name === next.name; });
                if (currentIndex > -1) {
                    var nextStack = __spreadArray([], state, true);
                    nextStack.splice(currentIndex, 1);
                    return __spreadArray(__spreadArray([], nextStack, true), [__assign(__assign({}, next), { params: params || next.params })], false);
                }
                onNavigate === null || onNavigate === void 0 ? void 0 : onNavigate(next.name);
                setTimeout(function () {
                    getRef === null || getRef === void 0 ? void 0 : getRef().snapToRelativeOffset(0);
                }, 1);
                return __spreadArray(__spreadArray([], state, true), [next], false);
            });
        }, 300);
    }, [getRef, onNavigate, routes]);
    var initialNavigation = function () {
        if (!routes)
            return;
        if (initialRoute) {
            var route = routes === null || routes === void 0 ? void 0 : routes.find(function (rt) { return rt.name === initialRoute; });
            if (route) {
                setStack([route]);
            }
        }
        else {
            setStack([routes[0]]);
        }
    };
    var goBack = function (name, snap) {
        getRef === null || getRef === void 0 ? void 0 : getRef().snapToRelativeOffset(snap || -10);
        setTimeout(function () {
            setStack(function (state) {
                var _a, _b;
                var next = routes === null || routes === void 0 ? void 0 : routes.find(function (route) { return route.name === name; });
                if (state.length === 1) {
                    close();
                    return state;
                }
                if (!next) {
                    var nextStack = __spreadArray([], state, true);
                    nextStack.pop();
                    if (currentRoute) {
                        (_a = getRef === null || getRef === void 0 ? void 0 : getRef()) === null || _a === void 0 ? void 0 : _a.snapToRelativeOffset(0);
                        onNavigateBack === null || onNavigateBack === void 0 ? void 0 : onNavigateBack((_b = nextStack[nextStack.length - 1]) === null || _b === void 0 ? void 0 : _b.name);
                    }
                    return nextStack;
                }
                var currentIndex = stack.findIndex(function (route) { return route.name === next.name; });
                if (currentIndex > -1) {
                    var nextStack = __spreadArray([], state, true);
                    nextStack.splice(currentIndex);
                    return __spreadArray(__spreadArray([], nextStack, true), [next], false);
                }
                onNavigateBack === null || onNavigateBack === void 0 ? void 0 : onNavigateBack(next.name);
                return __spreadArray(__spreadArray([], stack, true), [next], false);
            });
        }, 150);
    };
    var close = function () {
        var _a;
        (_a = getRef === null || getRef === void 0 ? void 0 : getRef()) === null || _a === void 0 ? void 0 : _a.hide();
    };
    var popToTop = function () {
        if (!stack[0]) {
            return;
        }
        goBack(stack[0].name);
    };
    return {
        currentRoute: currentRoute,
        navigate: navigate,
        goBack: goBack,
        close: close,
        popToTop: popToTop,
        hasRoutes: function () { return routes && routes.length > 0; },
        stack: stack,
        initialNavigation: initialNavigation
    };
};
export var RouterContext = createContext(undefined);
/**
 * A simple router to navigate between routes in a Sheet.
 */
export var useSheetRouter = function () { return useContext(RouterContext); };
export var RouterParamsContext = createContext(undefined);
/**
 * A hook that returns the params for current navigation route.
 */
export var useSheetRouteParams = function () {
    var context = useContext(RouterParamsContext);
    return context;
};
