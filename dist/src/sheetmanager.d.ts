import ActionSheet from ".";
/**
 * SheetManager can be used to imperitively show/hide any ActionSheet with a
 * unique id prop.
 */
declare class SM {
    /**
     * Show an ActionSheet with a given id.
     *
     * @param id id of the ActionSheet to show
     * @param data Any data to pass to the ActionSheet. Will be available from `onBeforeShow` prop.
     * @param onClose Recieve payload from the Sheet when it closes
     */
    show<BeforeShowPayload extends any, ReturnPayload extends any>(id: string, data?: BeforeShowPayload, onClose?: (data: ReturnPayload) => void): Promise<ReturnPayload>;
    /**
     * An async hide function. This is useful when you want to show one ActionSheet after closing another.
     *
     * @param id id of the ActionSheet to show
     * @param data Return some data to the caller on closing the Sheet.
     */
    hide<ReturnPayload extends any>(id: string, data?: unknown): Promise<ReturnPayload>;
    /**
     * Hide all the opened ActionSheets.
     */
    hideAll(): void;
    registerRef: (id: string, instance: ActionSheet) => void;
    /**
     *
     * Get internal ref of a sheet by the given id.
     * @returns
     */
    get: (id: string) => ActionSheet;
    add: (id: string) => void;
    remove: (id: string) => void;
}
export declare const SheetManager: SM;
export {};
//# sourceMappingURL=sheetmanager.d.ts.map