/* eslint-disable curly */
import React, { useEffect, useReducer, useState } from 'react';
import { actionSheetEventManager } from './eventmanager';
/**
 * An object that holds all the sheet components against their ids.
 */
export var sheetsRegistry = {};
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
    var _c = useReducer(function (x) { return x + 1; }, 0), forceUpdate = _c[1];
    var sheetIds = Object.keys(sheetsRegistry[context] || {});
    var onRegister = React.useCallback(function () {
        // Rerender when a new sheet is added.
        forceUpdate();
    }, [forceUpdate]);
    useEffect(function () {
        var unsub = actionSheetEventManager.subscribe("".concat(context, "-on-register"), onRegister);
        return function () {
            unsub === null || unsub === void 0 ? void 0 : unsub.unsubscribe();
        };
    }, [context, onRegister]);
    var renderSheet = function (sheetId) { return (<RenderSheet key={sheetId} id={sheetId} context={context}/>); };
    return (<>
      {children}
      {sheetIds.map(renderSheet)}
    </>);
}
var RenderSheet = function (_a) {
    var id = _a.id, context = _a.context;
    var _b = useState(), payload = _b[0], setPayload = _b[1];
    var _c = useState(false), visible = _c[0], setVisible = _c[1];
    var Sheet = sheetsRegistry[context] && sheetsRegistry[context][id];
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
        setVisible(false);
        setPayload(undefined);
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
    return !visible ? null : <Sheet sheetId={id} payload={payload}/>;
};
