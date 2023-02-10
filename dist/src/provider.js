/* eslint-disable curly */
import React, { createContext, useContext, useEffect, useReducer, useRef, useState, } from 'react';
import { actionSheetEventManager } from './eventmanager';
export var providerRegistryStack = [];
/**
 * An object that holds all the sheet components against their ids.
 */
export var sheetsRegistry = {
    global: {}
};
// Registers your Sheet with the SheetProvider.
export function registerSheet(id, Sheet) {
    var contexts = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        contexts[_i - 2] = arguments[_i];
    }
    if (!id || !Sheet)
        return;
    if (!contexts || contexts.length === 0)
        contexts = ['global'];
    for (var _a = 0, contexts_1 = contexts; _a < contexts_1.length; _a++) {
        var context = contexts_1[_a];
        var registry = !sheetsRegistry[context]
            ? (sheetsRegistry[context] = {})
            : sheetsRegistry[context];
        registry[id] = Sheet;
        actionSheetEventManager.publish("".concat(context, "-on-register"));
    }
}
/**
 * The SheetProvider makes available the sheets in a given context. The default context is
 * `global`. However if you want to render a Sheet within another sheet or if you want to render
 * Sheets in a modal. You can use a seperate Provider with a custom context value.
 *
 * For example
```ts
// Define your SheetProvider in the component/modal where
// you want to show some Sheets.
<SheetProvider context="local-context" />

// Then register your sheet when for example the
// Modal component renders.

registerSheet('local-sheet', LocalSheet,'local-context');

```
 * @returns
 */
export function SheetProvider(_a) {
    var _b = _a.context, context = _b === void 0 ? 'global' : _b, children = _a.children;
    var providerRegistryIndexRef = useRef(0);
    var _c = useReducer(function (x) { return x + 1; }, 0), forceUpdate = _c[1];
    var sheetIds = Object.keys(sheetsRegistry[context] || sheetsRegistry['global'] || {});
    var onRegister = React.useCallback(function () {
        // Rerender when a new sheet is added.
        forceUpdate();
    }, [forceUpdate]);
    useEffect(function () {
        providerRegistryIndexRef.current =
            providerRegistryStack.indexOf(context) > -1
                ? providerRegistryStack.indexOf(context)
                : providerRegistryStack.push(context) - 1;
        var unsub = actionSheetEventManager.subscribe("".concat(context, "-on-register"), onRegister);
        return function () {
            providerRegistryStack.splice(providerRegistryIndexRef.current, 1);
            unsub === null || unsub === void 0 ? void 0 : unsub.unsubscribe();
        };
    }, [context, onRegister]);
    var renderSheet = function (sheetId) { return (<RenderSheet key={sheetId} id={sheetId} context={context}/>); };
    return (<>
      {children}
      {sheetIds.map(renderSheet)}
    </>);
}
var ProviderContext = createContext('global');
export var useProviderContext = function () { return useContext(ProviderContext); };
var RenderSheet = function (_a) {
    var _b, _c;
    var id = _a.id, context = _a.context;
    var _d = useState(), payload = _d[0], setPayload = _d[1];
    var _e = useState(false), visible = _e[0], setVisible = _e[1];
    var Sheet = context.startsWith('$$-auto-')
        ? (_b = sheetsRegistry['global']) === null || _b === void 0 ? void 0 : _b[id]
        : sheetsRegistry[context]
            ? (_c = sheetsRegistry[context]) === null || _c === void 0 ? void 0 : _c[id]
            : undefined;
    var onShow = React.useCallback(function (data, ctx) {
        if (ctx === void 0) { ctx = 'global'; }
        if (ctx !== context)
            return;
        setPayload(data);
        setVisible(true);
    }, [context]);
    var onClose = React.useCallback(function (_data, ctx) {
        if (ctx === void 0) { ctx = 'global'; }
        if (context !== ctx)
            return;
        setPayload(undefined);
        setVisible(false);
    }, [context]);
    var onHide = React.useCallback(function (data, ctx) {
        if (ctx === void 0) { ctx = 'global'; }
        actionSheetEventManager.publish("hide_".concat(id), data, ctx);
    }, [id]);
    useEffect(function () {
        if (visible) {
            actionSheetEventManager.publish("show_".concat(id), payload, context);
        }
    }, [context, id, payload, visible]);
    useEffect(function () {
        var subs = [
            actionSheetEventManager.subscribe("show_wrap_".concat(id), onShow),
            actionSheetEventManager.subscribe("onclose_".concat(id), onClose),
            actionSheetEventManager.subscribe("hide_wrap_".concat(id), onHide),
        ];
        return function () {
            subs.forEach(function (s) { return s.unsubscribe(); });
        };
    }, [id, context, onShow, onHide, onClose]);
    if (!Sheet)
        return null;
    return !visible ? null : (<ProviderContext.Provider value={context}>
      <Sheet sheetId={id} payload={payload}/>
    </ProviderContext.Provider>);
};
