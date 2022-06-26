import React, { ReactNode } from "react";
export interface SheetProps {
    sheetId: string;
}
export declare function registerSheet(id: string, Sheet: React.ElementType, context?: string): void;
/**
 * The SheetProvider makes available the sheets in a given context. The default context is
 * `global`. However if you want to render a Sheet within another sheet or if you want to render
 * Sheets in a modal. You can use a seperate Provider with a custom context value.
 *
 * For example
```ts
// Define your SheetProvider in the component/modal where
// you want to show some Sheets.
<SheetProvider context="local-context" />

// Then register your sheet when for example the
// Modal component renders.

registerSheet('local-sheet', LocalSheet,'local-context');

```
 * @returns
 */
declare function SheetProvider({ context, children, }: {
    context?: string;
    children: ReactNode;
}): JSX.Element;
declare const _default: React.MemoExoticComponent<typeof SheetProvider>;
export default _default;
//# sourceMappingURL=provider.d.ts.map