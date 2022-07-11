import React, { ReactNode, useEffect, useReducer } from "react";
import { actionSheetEventManager } from "./eventmanager";

/**
 * An object that holds all the sheet components against their ids.
 */
const sheetsRegistry: {
  [context: string]: { [id: string]: React.ElementType };
} = {};

export interface SheetProps {
  sheetId: string;
}

// Registers your Sheet with the SheetProvider.
export function registerSheet(
  id: string,
  Sheet: React.ElementType,
  context?: string
) {
  if (!id || !Sheet) return;
  context = context || "global";
  const registry = !sheetsRegistry[context]
    ? (sheetsRegistry[context] = {})
    : sheetsRegistry[context];
  registry[id] = Sheet;
  actionSheetEventManager.publish(`${context}-on-register`);
}

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
function SheetProvider({
  context = "global",
  children,
}: {
  context?: string;
  children: ReactNode;
}) {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const onRegister = React.useCallback(() => {
    // Rerender when a new sheet is added.
    forceUpdate();
  }, [forceUpdate]);

  useEffect(() => {
    const unsub = actionSheetEventManager.subscribe(
      `${context}-on-register`,
      onRegister
    );
    return () => {
      unsub && unsub();
    };
  }, [onRegister]);

  const renderSheet = React.useCallback((key) => {
    const Sheet = sheetsRegistry[context] && sheetsRegistry[context][key];
    if (!Sheet) return null;
    return <Sheet key={key} sheetId={key} />;
  }, []);

  return (
    <>
      {children}
      {Object.keys(sheetsRegistry[context] || {}).map(renderSheet)}
    </>
  );
}

export default SheetProvider;
