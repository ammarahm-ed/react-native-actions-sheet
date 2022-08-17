import { RefObject } from "react";
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ActionSheetRef } from "../index";
/**
 * If you are using a `ScrollView` or `FlatList` in ActionSheet. You must attach `scrollHandlers`
 * with it to enable scrolling.
 * @param id Id for the handler. Could be any string value.
 * @param ref ref of the ActionSheet in which the ScrollView is present.
 * @returns
 */
declare function useScrollHandlers<T>(id: string, ref: RefObject<ActionSheetRef>): {
    scrollEnabled: boolean;
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    ref: RefObject<T>;
    onLayout: (event: LayoutChangeEvent) => void;
};
export default useScrollHandlers;
//# sourceMappingURL=use-scroll-handlers.d.ts.map