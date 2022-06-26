import React, { useEffect, useReducer } from "react";
/**
 * An object that holds all the sheet components against their ids.
 */
var sheetsRegistry = {};
var events = {
    "on-register": null
};
export function registerSheet(id, Sheet) {
    if (!id || !Sheet)
        return;
    sheetsRegistry[id] = <Sheet key={id} sheetId={id}/>;
    if (events["on-register"])
        events["on-register"]();
}
function SheetProvider() {
    var _a = useReducer(function (x) { return x + 1; }, 0), forceUpdate = _a[1];
    var onRegister = React.useCallback(function () {
        // Rerender when a new sheet is added.
        console.log("new sheet added");
        forceUpdate();
    }, [forceUpdate]);
    useEffect(function () {
        events["on-register"] = onRegister;
    }, [onRegister]);
    useEffect(function () {
        console.log("rerender on sheet added");
    });
    return <>{Object.keys(sheetsRegistry).map(function (key) { return sheetsRegistry[key]; })}</>;
}
export default React.memo(SheetProvider, function () { return true; });
