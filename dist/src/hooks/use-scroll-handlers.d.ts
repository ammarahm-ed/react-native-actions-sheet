import React, { RefObject } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ActionSheetRef } from '../index';
/**
 * If you are using a `ScrollView` or `FlatList` in ActionSheet. You must attach `scrollHandlers`
 * with it to enable vertical scrolling. For horizontal ScrollViews, you should not use this hook.
 * @param id Id for the handler. Could be any string value.
 * @param ref ref of the ActionSheet in which the ScrollView is present.
 * @returns
 */
export declare function useScrollHandlers<T>(id: string, ref: RefObject<ActionSheetRef>): {
    scrollEnabled: boolean;
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    ref: React.RefObject<T>;
    onLayout: (event: LayoutChangeEvent) => void;
    scrollEventThrottle: number;
};
//# sourceMappingURL=use-scroll-handlers.d.ts.map