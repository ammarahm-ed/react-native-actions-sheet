import React from "react";
import { LayoutRectangle } from "react-native";
import type { ActionSheetProps } from "./types";
export declare type ActionSheetRef = {
    show: () => void;
    hide: (data: any) => void;
    /**
     * @deprecated Use `show` or `hide` functions or SheetManager to open/close ActionSheet.
     */
    setModalVisible: (visible?: boolean) => void;
    snapToOffset: (offset: number) => void;
    /**
     * @removed Use `useScrollHandlers` hook to enable scrolling in ActionSheet.
     */
    handleChildScrollEnd: () => void;
    modifyGesturesForLayout: (id: string, layout: LayoutRectangle | undefined, scrollOffset: number) => void;
};
declare const _default: React.ForwardRefExoticComponent<ActionSheetProps & React.RefAttributes<ActionSheetRef>>;
export default _default;
//# sourceMappingURL=index.d.ts.map