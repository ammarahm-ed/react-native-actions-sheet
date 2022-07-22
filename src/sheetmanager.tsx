import ActionSheet from ".";
import { actionSheetEventManager } from "./eventmanager";

// Array of all the ids of ActionSheets currently rendered in the app.
const ids: string[] = [];
const refs: { [name: string]: ActionSheet } = {};
/**
 * SheetManager can be used to imperitively show/hide any ActionSheet with a
 * unique id prop.
 */
export class SheetManager {
  /**
   * Show an ActionSheet with a given id.
   *
   * @param id id of the ActionSheet to show
   * @param data Any data to pass to the ActionSheet. Will be available from `onBeforeShow` prop.
   * @param onClose Recieve payload from the Sheet when it closes
   */
  static async show<BeforeShowPayload extends any, ReturnPayload extends any>(
    id: string,
    data?: BeforeShowPayload,
    onClose?: (data: ReturnPayload) => void
  ): Promise<ReturnPayload> {
    return new Promise((resolve) => {
      let sub: () => void;
      const handler = (data: ReturnPayload) => {
        onClose && onClose(data);
        sub && sub();
        resolve(data);
      };
      sub = actionSheetEventManager.subscribe(`onclose_${id}`, handler);
      actionSheetEventManager.publish(`show_${id}`, data);
    });
  }

  /**
   * An async hide function. This is useful when you want to show one ActionSheet after closing another.
   *
   * @param id id of the ActionSheet to show
   * @param data Return some data to the caller on closing the Sheet.
   */
  static async hide<ReturnPayload extends any>(
    id: string,
    data?: unknown
  ): Promise<ReturnPayload> {
    return new Promise((resolve) => {
      let sub: () => void;
      const handler = (data: ReturnPayload) => {
        sub && sub();
        resolve(data);
      };
      sub = actionSheetEventManager.subscribe(`onclose_${id}`, handler);
      actionSheetEventManager.publish(`hide_${id}`, data);
    });
  }

  /**
   * Hide all the opened ActionSheets.
   */
  static hideAll() {
    ids.forEach((id) => actionSheetEventManager.publish(`hide_${id}`));
  }

  static registerRef = (id: string, instance: ActionSheet) => {
    refs[id] = instance;
  };

  /**
   *
   * Get internal ref of a sheet by the given id.
   * @returns
   */
  static get = (id: string) => {
    return refs[id];
  };

  static add = (id: string) => {
    if (ids.indexOf(id) < 0) {
      ids[ids.length] = id;
    }
  };

  static remove = (id: string) => {
    if (ids.indexOf(id) > 0) {
      ids.splice(ids.indexOf(id));
    }
  };
}
