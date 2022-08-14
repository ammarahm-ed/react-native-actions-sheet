import { useEffect, useRef } from "react";
import { actionSheetEventManager } from "../eventmanager";
/**
 * If you are using a `ScrollView` or `FlatList` in ActionSheet. You must attach `scrollHandlers`
 * with it to enable scrolling.
 * @param id Id for the handler. Could be any string value.
 * @param ref ref of the ActionSheet in which the ScrollView is present.
 * @returns
 */
var useScrollHandlers = function (id, ref) {
    //const [enabled,setEnabled] = useState(false);
    var scrollRef = useRef(null);
    var scrollLayout = useRef();
    var scrollOffset = useRef(0);
    var onScroll = function (event) {
        var _a;
        scrollOffset.current = event.nativeEvent.contentOffset.y;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.modifyGesturesForLayout(id, scrollLayout.current, scrollOffset.current);
    };
    // const onMomentumScrollEnd = (
    //   event: NativeSyntheticEvent<NativeScrollEvent>
    // ) => {};
    useEffect(function () {
        var subscription = actionSheetEventManager.subscribe("onoffsetchange", function (offset) {
            var _a, _b, _c, _d;
            if (offset < 3) {
                (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.setNativeProps({
                    scrollEnabled: true
                });
                (_b = ref.current) === null || _b === void 0 ? void 0 : _b.modifyGesturesForLayout(id, scrollLayout.current, scrollOffset.current);
            }
            else {
                (_c = scrollRef.current) === null || _c === void 0 ? void 0 : _c.setNativeProps({
                    scrollEnabled: false
                });
                (_d = ref.current) === null || _d === void 0 ? void 0 : _d.modifyGesturesForLayout(id, undefined, 0);
            }
        });
        return function () {
            subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
        };
    });
    // const onTouchStart = () => {};
    var onLayout = function (event) {
        scrollLayout.current = event.nativeEvent.layout;
    };
    return {
        scrollEnabled: false,
        onScroll: onScroll,
        ref: scrollRef,
        onLayout: onLayout
    };
};
export default useScrollHandlers;
