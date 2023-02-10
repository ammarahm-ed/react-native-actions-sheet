import React from 'react';
import { LayoutRectangle } from 'react-native';
import EventManager from './eventmanager';
import type { ActionSheetProps } from './types';
export declare type ActionSheetRef = {
    /**
     * Show the ActionSheet.
     */
    show: () => void;
    /**
     * Hide the ActionSheet.
     */
    hide: (data?: any) => void;
    /**
     * @removed Use `show` or `hide` functions or SheetManager to open/close ActionSheet.
     */
    setModalVisible: (visible?: boolean) => void;
    /**
     * Provide a value between 0 to 100 for the action sheet to snap to.
     */
    snapToOffset: (offset: number) => void;
    /**
     * @removed Use `useScrollHandlers` hook to enable scrolling in ActionSheet.
     */
    /**
     * When multiple snap points aret on the action sheet, use this to snap it to different
     * position.
     */
    snapToIndex: (index: number) => void;
    /**
     * @removed Use `useScrollHandlers` hook to enable scrolling in ActionSheet.
     */
    handleChildScrollEnd: () => void;
    snapToRelativeOffset: (offset: number) => void;
    /**
     * Used internally for scrollable views.
     */
    modifyGesturesForLayout: (id: string, layout: LayoutRectangle | undefined, scrollOffset: number) => void;
    isGestureEnabled: () => boolean;
    isOpen: () => boolean;
    ev: EventManager;
};
declare const _default: React.ForwardRefExoticComponent<ActionSheetProps & React.RefAttributes<ActionSheetRef>>;
export default _default;
//# sourceMappingURL=index.d.ts.map