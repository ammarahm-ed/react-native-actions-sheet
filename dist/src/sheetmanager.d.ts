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
     */
    static show(id: string, data?: unknown): void;
    /**
     * An async hide function. This is useful when you want to show one ActionSheet after closing another.
     *
     * @param id id of the ActionSheet to show
     * @param data An data to pass to the ActionSheet. Will be available from `onClose` prop.
     */
    static hide(id: string, data?: unknown): Promise<boolean>;
    /**
     * Hide all the opened ActionSheets.
     */
    static hideAll(): void;
    static add: (id: string) => void;
    static remove: (id: string) => void;
}
//# sourceMappingURL=sheetmanager.d.ts.map