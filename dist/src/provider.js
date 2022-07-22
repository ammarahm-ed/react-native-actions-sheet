import React, { useEffect, useReducer, useRef, } from "react";
import { actionSheetEventManager } from "./eventmanager";
/**
 * An object that holds all the sheet components against their ids.
 */
var sheetsRegistry = {};
// Registers your Sheet with the SheetProvider.
export function registerSheet(id, Sheet, context) {
    if (!id || !Sheet)
        return;
    context = context || "global";
    var registry = !sheetsRegistry[context]
        ? (sheetsRegistry[context] = {})
        : sheetsRegistry[context];
    registry[id] = Sheet;
    actionSheetEventManager.publish("".concat(context, "-on-register"));
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
function SheetProvider(_a) {
    var _b = _a.context, context = _b === void 0 ? "global" : _b, children = _a.children;
    var _c = useReducer(function (x) { return x + 1; }, 0), forceUpdate = _c[1];
    var onRegister = React.useCallback(function () {
        // Rerender when a new sheet is added.
        forceUpdate();
    }, [forceUpdate]);
    useEffect(function () {
        var unsub = actionSheetEventManager.subscribe("".concat(context, "-on-register"), onRegister);
        return function () {
            unsub && unsub();
        };
    }, [onRegister]);
    return (<>
      {children}
      {Object.keys(sheetsRegistry[context] || {}).map(function (key) { return (<RenderSheet key={key} context={context}/>); })}
    </>);
}
var RenderSheet = function (_a) {
    var key = _a.key, context = _a.context;
    var payload = useRef();
    var Sheet = sheetsRegistry[context] && sheetsRegistry[context][key];
    if (!Sheet)
        return null;
    var onShow = function (data) { return (payload.current = data); };
    useEffect(function () {
        var sub = actionSheetEventManager.subscribe("show_".concat(key), onShow);
        return function () {
            sub && sub();
        };
    }, [key, context]);
    return <Sheet key={key} sheetId={key} payload={payload}/>;
};
export default React.memo(SheetProvider, function () { return true; });
