import React, { ReactNode, useEffect, useReducer, useState } from "react";
import { actionSheetEventManager } from "./eventmanager";

/**
 * An object that holds all the sheet components against their ids.
 */
export const sheetsRegistry: {
  [context: string]: { [id: string]: React.ElementType };
} = {};

export interface SheetProps<BeforeShowPayload = any> {
  sheetId: string;
  payload?: BeforeShowPayload;
}

// Registers your Sheet with the SheetProvider.
export function registerSheet(
  id: string,
  Sheet: React.ElementType,
  ...contexts: string[]
) {
  if (!id || !Sheet) return;
  if (!contexts || contexts.length === 0) contexts = ["global"];
  for (let context of contexts) {
    const registry = !sheetsRegistry[context]
      ? (sheetsRegistry[context] = {})
      : sheetsRegistry[context];
    registry[id] = Sheet;
    actionSheetEventManager.publish(`${context}-on-register`);
  }
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
  const sheetIds = Object.keys(sheetsRegistry[context] || {});
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
      unsub?.unsubscribe();
    };
  }, [onRegister]);

  const renderSheet = (sheetId: string) => (
    <RenderSheet key={sheetId} id={sheetId} context={context} />
  );

  return (
    <>
      {children}
      {sheetIds.map(renderSheet)}
    </>
  );
}

const RenderSheet = ({ id, context }: { id: string; context: string }) => {
  const [payload, setPayload] = useState();
  const [visible, setVisible] = useState(false);
  const Sheet = sheetsRegistry[context] && sheetsRegistry[context][id];
  if (!Sheet) return null;

  const onShow = (data: any, ctx = "global") => {
    if (ctx !== context) return;
    setPayload(data);
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
    setPayload(undefined);
  };

  const onHide = (data: any, ctx = "global") => {
    if (ctx !== context) return;
    actionSheetEventManager.publish(`hide_${id}`, data);
  };

  useEffect(() => {
    if (visible) {
      actionSheetEventManager.publish(`show_${id}`, payload, context);
    }
  }, [visible]);

  useEffect(() => {
    let subs = [
      actionSheetEventManager.subscribe(`show_wrap_${id}`, onShow),
      actionSheetEventManager.subscribe(`onclose_${id}`, onClose),
      actionSheetEventManager.subscribe(`hide_wrap_${id}`, onHide),
    ];
    return () => {
      subs.forEach((s) => s.unsubscribe());
    };
  }, [id, context]);

  return !visible ? null : <Sheet sheetId={id} payload={payload} />;
};

export default SheetProvider;
