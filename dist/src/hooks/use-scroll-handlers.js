/* eslint-disable curly */
import React, { useEffect, useRef } from 'react';
import { Platform, } from 'react-native';
/**
 * If you are using a `ScrollView` or `FlatList` in ActionSheet. You must attach `scrollHandlers`
 * with it to enable vertical scrolling. For horizontal ScrollViews, you should not use this hook.
 * @param id Id for the handler. Could be any string value.
 * @param ref ref of the ActionSheet in which the ScrollView is present.
 * @returns
 */
export function useScrollHandlers(id, ref) {
    //const [enabled,setEnabled] = useState(false);
    var scrollRef = useRef(null);
    var scrollLayout = useRef();
    var scrollOffset = useRef(0);
    var prevState = useRef(false);
    var subscription = useRef();
    var onScroll = function (event) {
        var _a;
        scrollOffset.current = event.nativeEvent.contentOffset.y;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.modifyGesturesForLayout(id, scrollLayout.current, scrollOffset.current);
    };
    var disableScrolling = React.useCallback(function () {
        var _a, _b;
        //@ts-ignore
        (_b = (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.setNativeProps) === null || _b === void 0 ? void 0 : _b.call(_a, {
            scrollEnabled: false
        });
        if (Platform.OS === 'web') {
            //@ts-ignore
            scrollRef.current.style.touchAction = 'none';
            //@ts-ignore
            scrollRef.current.style.overflowY = 'hidden';
        }
    }, [scrollRef]);
    var enableScrolling = React.useCallback(function () {
        var _a, _b;
        //@ts-ignore
        (_b = (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.setNativeProps) === null || _b === void 0 ? void 0 : _b.call(_a, {
            scrollEnabled: true
        });
        if (Platform.OS === 'web') {
            //@ts-ignore
            scrollRef.current.style.overflowY = 'scroll';
            //@ts-ignore
            scrollRef.current.style.touchAction = 'auto';
        }
    }, [scrollRef]);
    useEffect(function () {
        return function () {
            var _a;
            (_a = subscription.current) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        };
    }, [id, ref, disableScrolling, enableScrolling]);
    var onLayout = function (event) {
        var _a, _b;
        scrollLayout.current = event.nativeEvent.layout;
        subscription.current = (_a = ref.current) === null || _a === void 0 ? void 0 : _a.ev.subscribe('onoffsetchange', function (offset) {
            var _a;
            (_a = ref.current) === null || _a === void 0 ? void 0 : _a.modifyGesturesForLayout(id, scrollLayout.current, scrollOffset.current);
            if (offset < 3) {
                if (prevState.current)
                    return;
                prevState.current = true;
                enableScrolling();
            }
            else {
                if (!prevState.current)
                    return;
                prevState.current = false;
                disableScrolling();
            }
        });
        (_b = ref.current) === null || _b === void 0 ? void 0 : _b.modifyGesturesForLayout(id, scrollLayout.current, scrollOffset.current);
    };
    return {
        scrollEnabled: false,
        onScroll: onScroll,
        ref: scrollRef,
        onLayout: onLayout,
        scrollEventThrottle: 50
    };
}
