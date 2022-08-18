import { useEffect, useRef } from "react";
import { actionSheetEventManager } from "../eventmanager";
/**
 * If you are using a `ScrollView` or `FlatList` in ActionSheet. You must attach `scrollHandlers`
 * with it to enable scrolling.
 * @param id Id for the handler. Could be any string value.
 * @param ref ref of the ActionSheet in which the ScrollView is present.
 * @returns
 */
function useScrollHandlers(id, ref) {
    //const [enabled,setEnabled] = useState(false);
    var scrollRef = useRef(null);
    var scrollLayout = useRef();
    var scrollOffset = useRef(0);
    var onScroll = function (event) {
        var _a;
        scrollOffset.current = event.nativeEvent.contentOffset.y;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.modifyGesturesForLayout(id, scrollLayout.current, scrollOffset.current);
    };
    useEffect(function () {
        var subscription = actionSheetEventManager.subscribe("onoffsetchange", function (offset) {
            var _a, _b, _c, _d, _e, _f;
            if (offset < 3) {
                //@ts-ignore
                (_b = (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.setNativeProps) === null || _b === void 0 ? void 0 : _b.call(_a, {
                    scrollEnabled: true
                });
                (_c = ref.current) === null || _c === void 0 ? void 0 : _c.modifyGesturesForLayout(id, scrollLayout.current, scrollOffset.current);
            }
            else {
                //@ts-ignore
                (_e = (_d = scrollRef.current) === null || _d === void 0 ? void 0 : _d.setNativeProps) === null || _e === void 0 ? void 0 : _e.call(_d, {
                    scrollEnabled: false
                });
                (_f = ref.current) === null || _f === void 0 ? void 0 : _f.modifyGesturesForLayout(id, undefined, 0);
            }
        });
        return function () {
            subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
        };
    });
    var onLayout = function (event) {
        scrollLayout.current = event.nativeEvent.layout;
    };
    return {
        scrollEnabled: false,
        onScroll: onScroll,
        ref: scrollRef,
        onLayout: onLayout,
        scrollEventThrottle: 30
    };
}
export default useScrollHandlers;
