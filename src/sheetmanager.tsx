import {RefObject} from 'react';
import {ActionSheetRef} from '.';
import {actionSheetEventManager} from './eventmanager';
import {sheetsRegistry} from './provider';

// Array of all the ids of ActionSheets currently rendered in the app.
const ids: string[] = [];
const refs: {[name: string]: RefObject<ActionSheetRef>} = {};

class SM {
  /**
   * Show the ActionSheet with a given id.
   *
   * @param id id of the ActionSheet to show
   * @param options
   */
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
      const handler = (data: ReturnPayload) => {
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
        options?.context,
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
      payload?: unknown;
      /**
       * Provide `context` of the `SheetProvider` to hide the action sheet.
       */
      context?: string;
    },
  ): Promise<ReturnPayload> {
    return new Promise(resolve => {
      const hideHandler = (data: ReturnPayload) => {
        sub?.unsubscribe();
        resolve(data);
      };
      var sub = actionSheetEventManager.subscribe(`onclose_${id}`, hideHandler);

      let isRegisteredWithSheetProvider = false;

      // Check if the sheet is registered with any `SheetProviders`.
      for (let ctx in sheetsRegistry) {
        for (let _id in sheetsRegistry[ctx]) {
          if (_id === id) {
            isRegisteredWithSheetProvider = true;
          }
        }
      }

      actionSheetEventManager.publish(
        isRegisteredWithSheetProvider ? `hide_wrap_${id}` : `hide_${id}`,
        options?.payload,
        options?.context,
      );
    });
  }

  /**
   * Hide all the opened ActionSheets.
   */
  hideAll() {
    ids.forEach(id => actionSheetEventManager.publish(`hide_${id}`));
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
   * @returns
   */
  get = (id: string, context = 'global') => {
    return refs[`${id}:${context}`];
  };

  add = (id: string, context: string) => {
    if (ids.indexOf(id) < 0) {
      ids[ids.length] = `${id}:${context}`;
    }
  };

  remove = (id: string, context: string) => {
    if (ids.indexOf(`${id}:${context}`) > 0) {
      ids.splice(ids.indexOf(`${id}:${context}`));
    }
  };
}

/**
 * SheetManager is used to imperitively show/hide any ActionSheet with a
 * unique id prop.
 */
export const SheetManager = new SM();
