/* eslint-disable curly */
import React, {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState
} from 'react';
import { actionSheetEventManager } from './eventmanager';
import { ActionSheetRef, Sheets } from './types';

export const providerRegistryStack: string[] = [];

/**
 * An object that holds all the sheet components against their ids.
 */
export const sheetsRegistry: {
  [context: string]: {[id: string]: React.ElementType};
} = {
  global: {},
};

export interface SheetProps<SheetId extends keyof Sheets = never> {
  sheetId: SheetId | (string & {});
  payload?: Sheets[SheetId]['payload'];
}

// Registers your Sheet with the SheetProvider.
export function registerSheet<SheetId extends keyof Sheets = never>(
  id: SheetId | (string & {}),
  Sheet: React.ElementType,
  ...contexts: string[]
) {
  if (!id || !Sheet) return;
  if (!contexts || contexts.length === 0) contexts = ['global'];
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
export function SheetProvider({
  context = 'global',
  children,
}: {
  context?: string;
  children?: ReactNode;
}) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const sheetIds = Object.keys(
    sheetsRegistry[context] || sheetsRegistry['global'] || {},
  );
  const onRegister = React.useCallback(() => {
    // Rerender when a new sheet is added.
    forceUpdate();
  }, [forceUpdate]);

  useEffect(() => {
    providerRegistryStack.indexOf(context) > -1
      ? providerRegistryStack.indexOf(context)
      : providerRegistryStack.push(context) - 1;
    const unsub = actionSheetEventManager.subscribe(
      `${context}-on-register`,
      onRegister,
    );
    return () => {
      providerRegistryStack.splice(providerRegistryStack.indexOf(context), 1);
      unsub?.unsubscribe();
    };
  }, [context, onRegister]);

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
const ProviderContext = createContext('global');
const SheetIDContext = createContext<string | undefined>(undefined);

export const SheetRefContext = createContext<RefObject<ActionSheetRef | null>>(
  {} as any,
);

const SheetPayloadContext = createContext<any>(undefined);

/**
 * Get id of the current context.
 */
export const useProviderContext = () => useContext(ProviderContext);
/**
 * Get id of the current sheet
 */
export const useSheetIDContext = () => useContext(SheetIDContext);
/**
 * Get the current Sheet's internal ref.
 * @returns
 */
// export const useSheetRef = <SheetId extends keyof Sheets = never>(): RefObject<
//   ActionSheetRef<SheetId>
// > => useContext(SheetRefContext) as RefObject<
// ActionSheetRef<SheetId>
// >;

export function useSheetRef<SheetId extends keyof Sheets = never>(
  _id?: SheetId | (string & {}),
) {
  return useContext(SheetRefContext) as RefObject<
    ActionSheetRef<SheetId>
  >;
}

/**
 * Get the payload this sheet was opened with.
 * @returns
 */
export function useSheetPayload<SheetId extends keyof Sheets = never>(
  _id?: SheetId | (string & {}),
) {
  return useContext(SheetPayloadContext) as Sheets[SheetId]['payload'];
}

const RenderSheet = ({id, context}: {id: string; context: string}) => {
  const [payload, setPayload] = useState();
  const [visible, setVisible] = useState(false);
  const ref = useRef<ActionSheetRef | null>(null);
  const clearPayloadTimeoutRef = useRef<NodeJS.Timeout>(null);
  const Sheet = context.startsWith('$$-auto-')
    ? sheetsRegistry?.global?.[id]
    : sheetsRegistry[context]
    ? sheetsRegistry[context]?.[id]
    : undefined;

  const onShow = React.useCallback(
    (data: any, ctx = 'global') => {
      if (ctx !== context) return;
      clearTimeout(clearPayloadTimeoutRef.current);
      setPayload(data);
      setVisible(true);
    },
    [context],
  );

  const onClose = React.useCallback(
    (_data: any, ctx = 'global') => {
      if (context !== ctx) return;
      setVisible(false);
      clearTimeout(clearPayloadTimeoutRef.current);
      clearPayloadTimeoutRef.current = setTimeout(() => {
        setPayload(undefined);
      }, 50);
    },
    [context],
  );

  const onHide = React.useCallback(
    (data: any, ctx = 'global') => {
      actionSheetEventManager.publish(`hide_${id}`, data, ctx);
    },
    [id],
  );

  useEffect(() => {
    if (visible) {
      actionSheetEventManager.publish(`show_${id}`, payload, context);
    }
  }, [context, id, payload, visible]);

  useEffect(() => {
    let subs = [
      actionSheetEventManager.subscribe(`show_wrap_${id}`, onShow),
      actionSheetEventManager.subscribe(`onclose_${id}`, onClose),
      actionSheetEventManager.subscribe(`hide_wrap_${id}`, onHide),
    ];
    return () => {
      subs.forEach(s => s.unsubscribe());
    };
  }, [id, context, onShow, onHide, onClose]);

  if (!Sheet) return null;

  return !visible ? null : (
    <ProviderContext.Provider value={context}>
      <SheetIDContext.Provider value={id}>
        <SheetRefContext.Provider value={ref}>
          <SheetPayloadContext.Provider value={payload}>
            <Sheet sheetId={id} payload={payload} />
          </SheetPayloadContext.Provider>
        </SheetRefContext.Provider>
      </SheetIDContext.Provider>
    </ProviderContext.Provider>
  );
};
