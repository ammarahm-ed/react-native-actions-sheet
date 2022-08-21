import { RefObject } from 'react';
import { ActionSheetRef } from '.';
declare class SM {
    /**
     * Show the ActionSheet with a given id.
     *
     * @param id id of the ActionSheet to show
     * @param options
     */
    show<BeforeShowPayload extends any, ReturnPayload extends any>(id: string, options?: {
        /**
         * Any data to pass to the ActionSheet. Will be available from the component `props` or in `onBeforeShow` prop on the action sheet.
         */
        payload?: BeforeShowPayload;
        /**
         * Recieve payload from the Sheet when it closes
         */
        onClose?: (data: ReturnPayload | undefined) => void;
        /**
         * Provide `context` of the `SheetProvider` where you want to show the action sheet.
         */
        context?: string;
    }): Promise<ReturnPayload>;
    /**
     * An async hide function. This is useful when you want to show one ActionSheet after closing another.
     *
     * @param id id of the ActionSheet to show
     * @param data
     */
    hide<ReturnPayload extends any>(id: string, options?: {
        /**
         * Return some data to the caller on closing the Sheet.
         */
        payload?: unknown;
        /**
         * Provide `context` of the `SheetProvider` to hide the action sheet.
         */
        context?: string;
    }): Promise<ReturnPayload>;
    /**
     * Hide all the opened ActionSheets.
     */
    hideAll(): void;
    registerRef: (id: string, context: string, instance: RefObject<ActionSheetRef>) => void;
    /**
     *
     * Get internal ref of a sheet by the given id.
     * @returns
     */
    get: (id: string, context?: string) => RefObject<ActionSheetRef>;
    add: (id: string, context: string) => void;
    remove: (id: string, context: string) => void;
}
/**
 * SheetManager is used to imperitively show/hide any ActionSheet with a
 * unique id prop.
 */
export declare const SheetManager: SM;
export {};
//# sourceMappingURL=sheetmanager.d.ts.map