import { RefObject } from "react";
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from "react-native";
import { ActionSheetRef } from "../index";
/**
 * If you are using a `ScrollView` or `FlatList` in ActionSheet. You must attach `scrollHandlers`
 * with it to enable scrolling.
 * @param id Id for the handler. Could be any string value.
 * @param ref ref of the ActionSheet in which the ScrollView is present.
 * @returns
 */
declare const useScrollHandlers: (id: string, ref: RefObject<ActionSheetRef>) => {
    scrollEnabled: boolean;
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    ref: RefObject<ScrollView>;
    onLayout: (event: LayoutChangeEvent) => void;
};
export default useScrollHandlers;
//# sourceMappingURL=use-scroll-handlers.d.ts.map