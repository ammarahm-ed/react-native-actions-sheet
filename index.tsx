import ActionSheet from "./src/index";

export type ActionSheetRefObject = {
    /**
          * Open or close the ActionSheet.
          */
     setModalVisible(visible?: boolean): void;

     /**
     * Open the Action Sheet.
     */
     show(): void;

     /**
     * Close the ActionSheet.
     */
     hide(): void;


     /**
      * Attach this to any child ScrollView Component's onScrollEndDrag, 
      * onMomentumScrollEnd,onScrollAnimationEnd callbacks to handle the ActionSheet
      * closing and bouncing back properly.
      */
     handleChildScrollEnd(): void;

     /**
      * Snap ActionSheet to given offset
      */
     snapToOffset(offset: number): void;
}

export default ActionSheet;
