import React, {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {actionSheetEventManager} from './eventmanager';
import {ActionSheetProps, ActionSheetRef, Sheets} from './types';

export const providerRegistryStack: string[] = [];

/**
 * An object that holds all the sheet components against their ids.
 */
export const sheetsRegistry: {[id: string]: React.ElementType} = {};

export interface SheetProps<SheetId extends keyof Sheets = never> {
  sheetId: SheetId | (string & {});
  payload?: Sheets[SheetId]['payload'];
  overrideProps?: ActionSheetProps;
}

// Registers your Sheet with the SheetProvider.
export function registerSheet<SheetId extends keyof Sheets = never>(
  id: SheetId | (string & {}),
  Sheet: React.ElementType,
  /**
   * @deprecated Does nothing
   */
  ..._contexts: string[]
) {
  if (!id || !Sheet) return;
  sheetsRegistry[id] = Sheet;
  actionSheetEventManager.publish('context-on-register');
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
  const [sheetIds, setSheetIds] = useState(Object.keys(sheetsRegistry));

  useEffect(() => {
    if (providerRegistryStack.indexOf(context) === -1) {
      providerRegistryStack.push(context);
    } else {
      if (__DEV__) {
        console.warn(
          `You are trying to register multiple SheetProviders with the same context id: ${context}. Use a unique context id for each SheetProvider in your app.`,
        );
      }
    }
    const onRegister = () => {
      setSheetIds(Object.keys(sheetsRegistry));
    };
    const sub = actionSheetEventManager.subscribe(
      `context-on-register`,
      onRegister,
    );
    setSheetIds(Object.keys(sheetsRegistry));
    return () => {
      providerRegistryStack.splice(providerRegistryStack.indexOf(context), 1);
      sub?.unsubscribe();
    };
  }, [context]);

  const renderSheet = React.useCallback(
    (sheetId: string) => (
      <RenderSheet key={sheetId + context} id={sheetId} context={context} />
    ),
    [context],
  );

  return (
    <ProviderContext.Provider value={context}>
      {children}
      {sheetIds.map(renderSheet)}
    </ProviderContext.Provider>
  );
}
const ProviderContext = createContext('global');
const SheetIDContext = createContext<string | undefined>(undefined);

export const SheetRefContext = createContext<RefObject<ActionSheetRef | null>>(
  {} as any,
);

const SheetPayloadContext = createContext<any>(undefined);

/**
 * Get id of the current context in which this component is rendered.
 */
export const useProviderContext = () => useContext(ProviderContext);
/**
 * Get id of the current sheet in which the current component is rendered.
 */
export const useSheetIDContext = () => useContext(SheetIDContext);
/**
 * Get the current Sheet's internal ref.
 * @returns
 */
export function useSheetRef<SheetId extends keyof Sheets = never>(
  _id?: SheetId | (string & {}),
) {
  return useContext(SheetRefContext) as RefObject<ActionSheetRef<SheetId>>;
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
  const [overrideProps, setOverrideProps] = useState<ActionSheetProps>(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef<ActionSheetRef | null>(null);
  const clearPayloadTimeoutRef = useRef<NodeJS.Timeout>(null);
  const Sheet = sheetsRegistry[id] || null;
  const visibleRef = useRef(false);
  visibleRef.current = visible;
  const snapIndex = useRef<number>(undefined);

  useEffect(() => {
    if (visible) {
      actionSheetEventManager.publish(`show_${id}`, payload, context, snapIndex.current);
    }
  }, [context, id, payload, visible]);

  useEffect(() => {
    const onShow = (data: any, ctx = 'global', overrideProps: ActionSheetProps, snapIndexValue: number) => {
      if (ctx !== context) return;
      clearTimeout(clearPayloadTimeoutRef.current);
      setPayload(data);
      setOverrideProps(overrideProps);
      snapIndex.current = snapIndexValue
      setVisible(true);
    };

    const onClose = (_data: any, ctx = 'global') => {
      if (context !== ctx) return;
      setVisible(false);
      clearTimeout(clearPayloadTimeoutRef.current);
      clearPayloadTimeoutRef.current = setTimeout(() => {
        setPayload(undefined);
      }, 50);
    };

    const onHide = (data: any, ctx = 'global') => {
      actionSheetEventManager.publish(`hide_${id}`, data, ctx);
    };

    const onUpdate = (data: any, ctx = 'global', overrideProps) => {
      if (ctx !== context || !visibleRef.current) return;
      clearTimeout(clearPayloadTimeoutRef.current);
      setPayload(data);
      setOverrideProps(overrideProps);
    };

    let subs = [
      actionSheetEventManager.subscribe(`update_${id}`, onUpdate),
      actionSheetEventManager.subscribe(`show_wrap_${id}`, onShow),
      actionSheetEventManager.subscribe(`onclose_${id}`, onClose),
      actionSheetEventManager.subscribe(`hide_wrap_${id}`, onHide),
    ];
    return () => {
      subs.forEach(s => s.unsubscribe());
    };
  }, []);

  if (!Sheet) return null;

  return !visible ? null : (
    <SheetIDContext.Provider value={id}>
      <SheetRefContext.Provider value={ref}>
        <SheetPayloadContext.Provider value={payload}>
          <Sheet sheetId={id} payload={payload} overrideProps={overrideProps} />
        </SheetPayloadContext.Provider>
      </SheetRefContext.Provider>
    </SheetIDContext.Provider>
  );
};


export type SheetRegisterProps = {
  sheets: {
    [K in keyof Sheets]: React.ElementType;
  };
};
/**
 * Registers the sheet components with the global Sheet registery allowing
 * you to open sheets from anywhere in the app.
 *
 * We recommend you to use this once in your app in your `<App/>` component.
 *
 * @example
 * ```tsx
 * import {SheetProvider, SheetDefinition} from "react-native-actions-sheet";
 *
 * declare module 'react-native-actions-sheet' {
 *  export interface Sheets {
 *    'example-sheet': SheetDefinition;
 *    }
 * }
 *
 * const App = () => {
 *  return <View>
 *    <SheetRegister
 *      sheets={
 *      "example-sheet": ExampleSheet
 *    }
 *    />
 * </View>
 * }
 * ```
 */
export function SheetRegister(props: SheetRegisterProps): React.JSX.Element {
  useEffect(() => {
    Object.keys(props.sheets).forEach(id => {
      if (!props.sheets[id]) {
        throw new Error(
          `SheetRegistry trying to register ${id} that is not a React Component.`,
        );
      }
      if (sheetsRegistry[id]) {
        if (__DEV__) {
          console.warn(
            `SheetRegistry tried to register sheet with the same id ${id} multiple times. If you are registering Sheets will multiple SheetRegistery components, make sure the ids are unique.`,
          );
        }
        return;
      }
      sheetsRegistry[id] = props.sheets[id];
    });
    actionSheetEventManager.publish('context-on-register');
    return () => {
      Object.keys(props.sheets).forEach(id => {
        delete sheetsRegistry[id];
      });
      actionSheetEventManager.publish('context-on-register');
    };
  }, [props.sheets]);

  return null;
}