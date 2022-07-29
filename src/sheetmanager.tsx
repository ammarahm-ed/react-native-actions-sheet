import ActionSheet from ".";
import { actionSheetEventManager } from "./eventmanager";

// Array of all the ids of ActionSheets currently rendered in the app.
const ids: string[] = [];
const refs: { [name: string]: ActionSheet } = {};
/**
 * SheetManager can be used to imperitively show/hide any ActionSheet with a
 * unique id prop.
 */
class SM {
  /**
   * Show an ActionSheet with a given id.
   *
   * @param id id of the ActionSheet to show
   * @param data Any data to pass to the ActionSheet. Will be available from `onBeforeShow` prop.
   * @param onClose Recieve payload from the Sheet when it closes
   */
  async show<BeforeShowPayload extends any, ReturnPayload extends any>(
    id: string,
    data?: BeforeShowPayload,
    onClose?: (data: ReturnPayload) => void
  ): Promise<ReturnPayload> {
    return new Promise((resolve) => {
      const handler = (data: ReturnPayload) => {
        onClose && onClose(data);
        sub?.unsubscribe();
        resolve(data);
      };
      var sub = actionSheetEventManager.subscribe(`onclose_${id}`, handler);
      actionSheetEventManager.publish(`show_${id}`, data);
    });
  }

  /**
   * An async hide function. This is useful when you want to show one ActionSheet after closing another.
   *
   * @param id id of the ActionSheet to show
   * @param data Return some data to the caller on closing the Sheet.
   */
  async hide<ReturnPayload extends any>(
    id: string,
    data?: unknown
  ): Promise<ReturnPayload> {
    return new Promise((resolve) => {
      const hideHandler = (data: ReturnPayload) => {
        sub?.unsubscribe();
        resolve(data);
      };
      var sub = actionSheetEventManager.subscribe(`onclose_${id}`, hideHandler);
      actionSheetEventManager.publish(`hide_${id}`, data);
    });
  }

  /**
   * Hide all the opened ActionSheets.
   */
  hideAll() {
    ids.forEach((id) => actionSheetEventManager.publish(`hide_${id}`));
  }

  registerRef = (id: string, instance: ActionSheet) => {
    refs[id] = instance;
  };

  /**
   *
   * Get internal ref of a sheet by the given id.
   * @returns
   */
  get = (id: string) => {
    return refs[id];
  };

  add = (id: string) => {
    if (ids.indexOf(id) < 0) {
      ids[ids.length] = id;
    }
  };

  remove = (id: string) => {
    if (ids.indexOf(id) > 0) {
      ids.splice(ids.indexOf(id));
    }
  };
}

export const SheetManager = new SM();
