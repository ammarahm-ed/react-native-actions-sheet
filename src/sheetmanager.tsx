/* eslint-disable curly */
import {RefObject} from 'react';
import {ActionSheetRef} from '.';
import {actionSheetEventManager} from './eventmanager';
import {providerRegistryStack, sheetsRegistry} from './provider';
let baseZindex = 999;
// Array of all the ids of ActionSheets currently rendered in the app.
const ids: string[] = [];
const refs: {[name: string]: RefObject<ActionSheetRef>} = {};

/**
 * Get rendered action sheets stack
 * @returns
 */
export function getSheetStack() {
  return ids.map(id => {
    return {
      id: id.split(':')[0],
      context: id.split(':')?.[1] || 'global',
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
    ? ids[ids.length - 1] === `${id}:${context}`
    : ids[ids.length - 1].startsWith(id);
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
  const index = ids.indexOf(`${id}:${context}`);
  if (index > -1) {
    return baseZindex + index + 1;
  }
  return baseZindex;
}

class _SheetManager {
  /**
   * Show the ActionSheet with a given id.
   *
   * @param id id of the ActionSheet to show
   * @param options
   */

  context(options?: {context?: string}) {
    if (!options) options = {};
    if (!options?.context) {
      // If no context is provided, use to current top most context
      // to render the sheet.
      options.context = providerRegistryStack[providerRegistryStack.length - 1];
    }
    return options.context;
  }

  async show<BeforeShowPayload extends any, ReturnPayload extends any>(
    id: string,
    options?: {
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
    },
  ): Promise<ReturnPayload> {
    return new Promise(resolve => {
      const currentContext = this.context(options);
      const handler = (data: ReturnPayload, context = 'global') => {
        if (
          context !== 'global' &&
          currentContext &&
          currentContext !== context
        )
          return;

        options?.onClose?.(data);
        sub?.unsubscribe();
        resolve(data);
      };
      var sub = actionSheetEventManager.subscribe(`onclose_${id}`, handler);

      // Check if the sheet is registered with any `SheetProviders`.
      let isRegisteredWithSheetProvider = false;
      for (let ctx in sheetsRegistry) {
        for (let _id in sheetsRegistry[ctx]) {
          if (_id === id) {
            isRegisteredWithSheetProvider = true;
          }
        }
      }
      actionSheetEventManager.publish(
        isRegisteredWithSheetProvider ? `show_wrap_${id}` : `show_${id}`,
        options?.payload,
        currentContext || 'global',
      );
    });
  }

  /**
   * An async hide function. This is useful when you want to show one ActionSheet after closing another.
   *
   * @param id id of the ActionSheet to show
   * @param data
   */
  async hide<ReturnPayload extends any>(
    id: string,
    options?: {
      /**
       * Return some data to the caller on closing the Sheet.
       */
      payload?: ReturnPayload;
      /**
       * Provide `context` of the `SheetProvider` to hide the action sheet.
       */
      context?: string;
    },
  ): Promise<ReturnPayload> {
    let currentContext = this.context(options);
    return new Promise(resolve => {
      let isRegisteredWithSheetProvider = false;
      // Check if the sheet is registered with any `SheetProviders`
      // and select the nearest context where sheet is registered.
      for (let ctx of providerRegistryStack.reverse()) {
        for (let _id in sheetsRegistry[ctx]) {
          if (_id === id && ids.includes(`${id}:${ctx}`)) {
            isRegisteredWithSheetProvider = true;
            currentContext = ctx;
            break;
          }
        }
      }

      const hideHandler = (data: ReturnPayload, context = 'global') => {
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
  hideAll(id?: string) {
    ids.forEach(_id => {
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
  get = (id: string, context?: string) => {
    if (!context) {
      for (let ctx of providerRegistryStack.reverse()) {
        for (let _id in sheetsRegistry[ctx]) {
          if (_id === id) {
            context = ctx;
            break;
          }
        }
      }
    }
    return refs[`${id}:${context}`];
  };

  add = (id: string, context: string) => {
    if (ids.indexOf(id) < 0) {
      ids[ids.length] = `${id}:${context}`;
    }
  };

  remove = (id: string, context: string) => {
    if (ids.indexOf(`${id}:${context}`) > -1) {
      ids.splice(ids.indexOf(`${id}:${context}`));
    }
  };
}

/**
 * SheetManager is used to imperitively show/hide any ActionSheet with a
 * unique id prop.
 */
export const SheetManager = new _SheetManager();
