import { useEffect, useState } from "react";
import { actionSheetEventManager } from "../eventmanager";
var useSheetManager = function (_a) {
    var id = _a.id, onHide = _a.onHide, onBeforeShow = _a.onBeforeShow, onContextUpdate = _a.onContextUpdate;
    var _b = useState(false), visible = _b[0], setVisible = _b[1];
    useEffect(function () {
        if (!id)
            return;
        var subscriptions = [
            actionSheetEventManager.subscribe("show_".concat(id), function (data, context) {
                onContextUpdate === null || onContextUpdate === void 0 ? void 0 : onContextUpdate(context);
                onBeforeShow === null || onBeforeShow === void 0 ? void 0 : onBeforeShow(data);
                setTimeout(function () {
                    setVisible(true);
                }, 1);
            }),
            actionSheetEventManager.subscribe("hide_".concat(id), function (data) {
                onHide === null || onHide === void 0 ? void 0 : onHide(data);
            }),
        ];
        return function () {
            subscriptions.forEach(function (s) { var _a; return (_a = s === null || s === void 0 ? void 0 : s.unsubscribe) === null || _a === void 0 ? void 0 : _a.call(s); });
        };
    }, [id, onHide, onBeforeShow]);
    return {
        visible: visible,
        setVisible: setVisible
    };
};
export default useSheetManager;
