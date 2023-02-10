/* eslint-disable curly */
import { useEffect, useState } from 'react';
import { actionSheetEventManager } from '../eventmanager';
import { useProviderContext } from '../provider';
var useSheetManager = function (_a) {
    var id = _a.id, onHide = _a.onHide, onBeforeShow = _a.onBeforeShow, onContextUpdate = _a.onContextUpdate;
    var _b = useState(false), visible = _b[0], setVisible = _b[1];
    var currentContext = useProviderContext();
    useEffect(function () {
        if (!id)
            return;
        var subscriptions = [
            actionSheetEventManager.subscribe("show_".concat(id), function (data, context) {
                if (currentContext !== context)
                    return;
                if (visible)
                    return;
                onContextUpdate === null || onContextUpdate === void 0 ? void 0 : onContextUpdate();
                onBeforeShow === null || onBeforeShow === void 0 ? void 0 : onBeforeShow(data);
                setVisible(true);
            }),
            actionSheetEventManager.subscribe("hide_".concat(id), function (data, context) {
                if (context === void 0) { context = 'global'; }
                if (currentContext !== context)
                    return;
                onHide === null || onHide === void 0 ? void 0 : onHide(data);
            }),
        ];
        return function () {
            subscriptions.forEach(function (s) { var _a; return (_a = s === null || s === void 0 ? void 0 : s.unsubscribe) === null || _a === void 0 ? void 0 : _a.call(s); });
        };
    }, [id, onHide, onBeforeShow, onContextUpdate, visible, currentContext]);
    return {
        visible: visible,
        setVisible: setVisible
    };
};
export default useSheetManager;
