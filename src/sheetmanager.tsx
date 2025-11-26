/* eslint-disable curly */
import {RefObject} from 'react';
import {actionSheetEventManager} from './eventmanager';
import {providerRegistryStack, sheetsRegistry} from './provider';
import {ActionSheetProps, ActionSheetRef, Sheets} from './types';
let baseZindex = 999;
// Array of all the ids of ActionSheets currently rendered in the app.
const renderedSheetIds: string[] = [];
const refs: {[name: string]: RefObject<ActionSheetRef>} = {};

/**
 * Get rendered action sheets stack
 * @returns
 */
export function getSheetStack() {
  return renderedSheetIds.map(id => {
    const [sheetId, context] = id.split(':');
    return {
      id: sheetId,
      context: context || 'global',
    };
  });
}

/**
 * A function that checks whether the action sheet with the given id is rendered on top or not.
 * @param id
 * @param context
 * @returns
 */
export function isRenderedOnTop(id: string, context?: string) {
  return context
    ? renderedSheetIds[renderedSheetIds.length - 1] === `${id}:${context}`
    : renderedSheetIds[renderedSheetIds.length - 1].startsWith(id);
}

/**
 * Set the base zIndex upon which action sheets will be stacked. Should be called once in the global space.
 *
 * Default `baseZIndex` is `999`.
 *
 * @param zIndex
 */
export function setBaseZIndexForActionSheets(zIndex: number) {
  baseZindex = zIndex;
}

/**
 * Since non modal based sheets are stacked one above the other, they need to have
 * different zIndex for gestures to work correctly.
 * @param id
 * @param context
 * @returns
 */
export function getZIndexFromStack(id: string, context: string) {
  const index = renderedSheetIds.indexOf(`${id}:${context}`);
  if (index > -1) {
    return baseZindex + index + 1;
  }
  return baseZindex;
}

class _SheetManager {
  context(options?: {context?: string; id?: string}) {
    if (!options) options = {};
    if (!options?.context) {
      // If no context is provided, use to current top most context
      // to render the sheet.
      for (const context of providerRegistryStack.slice().reverse()) {
        // We only automatically select nested sheet providers.
        if (context.startsWith('$$-auto') || context === 'global') {
          options.context = context;
          break;
        }
      }
    }
    return options.context;
  }

  /**
   * Show the ActionSheet with an id.
   *
   * @param id id of the ActionSheet to show
   * @param options
   */
  async show<SheetId extends keyof Sheets>(
    id: SheetId | (string & {}),
    options?: {
      /**
       * Any data to pass to the ActionSheet. Will be available from the component `props` or in `onBeforeShow` prop on the action sheet.
       */
      payload?: Sheets[SheetId]['payload'];

      /**
       * Recieve payload from the Sheet when it closes
       */
      onClose?: (data: Sheets[SheetId]['returnValue'] | undefined) => void;

      /**
       * Provide `context` of the `SheetProvider` where you want to show the action sheet.
       */
      context?: string;

      /**
       * Override a ActionSheet's props that were defined when the component was declared.
       * 
       * You need to forward these props to the ActionSheet component manually.
       * ```tsx
       * function ExampleSheet(props: SheetProps<'example-sheet'>) {
  return (
    <ActionSheet
      disableElevation={true}
      gestureEnabled
      {...props.overrideProps}
    />
  );
}
       * ```
       */
      overrideProps?: ActionSheetProps<SheetId>;
    },
  ): Promise<Sheets[SheetId]['returnValue']> {
    return new Promise(resolve => {
      let currentContext = this.context({
        ...options,
        id: id,
      });
      const handler = (data: any, context = 'global') => {
        if (currentContext !== context) return;
        options?.onClose?.(data);
        sub?.unsubscribe();
        resolve(data);
      };
      var sub = actionSheetEventManager.subscribe(`onclose_${id}`, handler);

      // Check if the sheet is registered.
      let isRegisteredWithSheetProvider = false;
      for (let _id in sheetsRegistry) {
        if (_id === id) {
          isRegisteredWithSheetProvider = true;
        }
      }
      actionSheetEventManager.publish(
        isRegisteredWithSheetProvider ? `show_wrap_${id}` : `show_${id}`,
        options?.payload,
        currentContext || 'global',
        options?.overrideProps,
      );
    });
  }

  /**
   * Update a currently rendered ActionSheet with new payload or override it's props.
   */
  async update<SheetId extends keyof Sheets>(
    id: SheetId,
    options: {
      /**
       * Provide `context` of the `SheetProvider` where the action sheet is rendered.
       */
      context?: string;
      /**
       * Any data to pass to the ActionSheet. Will be available from the component `props` or in `onBeforeShow` prop on the action sheet.
       */
      payload: Sheets[SheetId]['payload'];

      /**
       * Override a ActionSheet's props that were defined when the component was declared.
       * 
       * You need to forward these props to the ActionSheet component manually.
       * ```tsx
       * function ExampleSheet(props: SheetProps<'example-sheet'>) {
  return (
    <ActionSheet
      disableElevation={true}
      gestureEnabled
      {...props.overrideProps}
    />
  );
}
       * ```
       */
      overrideProps?: ActionSheetProps<SheetId>;

      /**
       * If there are multiple sheets active with the same id, you can provide this function to select
       * which sheet to update based on current payload or other sheet data.
       */
      shouldUpdate?: (sheet: {
        id: SheetId;
        context: string;
        ref: RefObject<ActionSheetRef<SheetId>>;
      }) => Promise<boolean>;
    },
  ) {
    if (!options || !id) return;

    const renderedSheets = this.getActiveSheets(id);
    if (!renderedSheets.length) {
      if (__DEV__) {
        console.warn('Found no sheets to update with id: ', id);
      }
      return;
    }

    if (options.shouldUpdate && renderedSheets.length > 1) {
      for (const sheet of renderedSheets) {
        const shouldUpdate = await options.shouldUpdate?.(sheet);
        if (shouldUpdate) {
          actionSheetEventManager.publish(
            `update_${sheet.id}`,
            options?.payload,
            sheet.context || 'global',
            options?.overrideProps,
          );
        }
      }
    } else {
      actionSheetEventManager.publish(
        `update_${id}`,
        options?.payload,
        renderedSheets.pop().context || 'global',
        options?.overrideProps,
      );
    }
  }

  /**
   * An async hide function. This is useful when you want to show one ActionSheet after closing another.
   *
   * @param id id of the ActionSheet to show
   * @param data
   */
  async hide<SheetId extends keyof Sheets>(
    id: SheetId | (string & {}),
    options?: {
      /**
       * Return some data to the caller on closing the Sheet.
       */
      payload?: Sheets[SheetId]['returnValue'];
      /**
       * Provide `context` of the `SheetProvider` to hide the action sheet.
       */
      context?: string;
    },
  ): Promise<Sheets[SheetId]['returnValue']> {
    let currentContext = this.context({
      ...options,
      id: id,
    });
    return new Promise(resolve => {
      let isRegisteredWithSheetProvider = false;
      // Check if the sheet is registered with any `SheetProviders`
      // and select the nearest context where sheet is registered.

      for (const _id of renderedSheetIds) {
        if (_id === `${id}:${currentContext}`) {
          isRegisteredWithSheetProvider = true;
          break;
        }
      }

      const hideHandler = (data: any, context = 'global') => {
        if (
          context !== 'global' &&
          currentContext &&
          currentContext !== context
        )
          return;
        sub?.unsubscribe();
        resolve(data);
      };
      var sub = actionSheetEventManager.subscribe(`onclose_${id}`, hideHandler);
      actionSheetEventManager.publish(
        isRegisteredWithSheetProvider ? `hide_wrap_${id}` : `hide_${id}`,
        options?.payload,
        !isRegisteredWithSheetProvider ? 'global' : currentContext,
      );
    });
  }

  /**
   * Hide all the opened ActionSheets.
   *
   * @param id Hide all sheets for the specific id.
   */
  hideAll<SheetId extends keyof Sheets>(id?: SheetId | (string & {})) {
    renderedSheetIds.forEach(_id => {
      if (id && !_id.startsWith(id)) return;
      actionSheetEventManager.publish(`hide_${_id.split(':')?.[0]}`);
    });
  }

  registerRef = (
    id: string,
    context: string,
    instance: RefObject<ActionSheetRef>,
  ) => {
    refs[`${id}:${context}`] = instance;
  };

  /**
   *
   * Get internal ref of a sheet by the given id.
   *
   * @param id Id of the sheet
   * @param context Context in which the sheet is rendered. Normally this function returns the top most rendered sheet ref automatically.
   */
  get = <SheetId extends keyof Sheets>(
    id: SheetId | (string & {}),
    context?: string,
  ): RefObject<ActionSheetRef<SheetId>> => {
    if (!context) {
      for (let _id of renderedSheetIds.reverse()) {
        if (_id.includes(`${id}:`)) {
          context = _id.split(':')[1];
        }
      }
    }
    return refs[`${id}:${context}`] as RefObject<ActionSheetRef<SheetId>>;
  };

  add = (id: string, context: string) => {
    if (renderedSheetIds.indexOf(id) < 0) {
      renderedSheetIds[renderedSheetIds.length] =
        `${id}:${context || 'global'}`;
    }
  };

  remove = (id: string, context: string) => {
    if (renderedSheetIds.indexOf(`${id}:${context}`) > -1) {
      renderedSheetIds.splice(
        renderedSheetIds.indexOf(`${id}:${context || 'global'}`),
      );
    }
  };
  /**
   * Get all rendered sheets for a Sheet Id.
   */
  getActiveSheets<SheetId extends keyof Sheets>(id: SheetId) {
    return renderedSheetIds
      .filter(renderdId => renderdId.startsWith(id))
      .map(renderdId => {
        const [id, context] = renderdId.split(':');
        return {
          id: id as SheetId,
          context,
          ref: this.get<SheetId>(id, context),
        };
      });
  }
}

/**
 * SheetManager is used to imperitively show/hide any ActionSheet with a
 * unique id prop.
 */
export const SheetManager = new _SheetManager();
