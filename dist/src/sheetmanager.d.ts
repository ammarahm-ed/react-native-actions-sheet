/**
 * SheetManager can be used to imperitively show/hide any ActionSheet with a
 * unique id prop.
 */
export declare class SheetManager {
    /**
     * Show an ActionSheet with a given id.
     *
     * @param id id of the ActionSheet to show
     * @param data Any data to pass to the ActionSheet. Will be available from `onBeforeShow` prop.
     * @param onClose Recieve payload from the Sheet when it closes
     */
    static show<BeforeShowPayload extends any, ReturnPayload extends any>(id: string, data?: BeforeShowPayload, onClose?: (data: ReturnPayload) => void): Promise<ReturnPayload>;
    /**
     * An async hide function. This is useful when you want to show one ActionSheet after closing another.
     *
     * @param id id of the ActionSheet to show
     * @param data Return some data to the caller on closing the Sheet.
     */
    static hide<ReturnPayload extends any>(id: string, data?: unknown): Promise<ReturnPayload>;
    /**
     * Hide all the opened ActionSheets.
     */
    static hideAll(): void;
    static add: (id: string) => void;
    static remove: (id: string) => void;
}
//# sourceMappingURL=sheetmanager.d.ts.map