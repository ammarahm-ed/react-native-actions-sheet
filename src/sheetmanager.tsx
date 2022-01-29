import { DeviceEventEmitter, EmitterSubscription } from "react-native";

// Array of all the ids of ActionSheets currently rendered in the app.
const ids: string[] = [];

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
   */
  static show(id: string, data?: unknown) {
    DeviceEventEmitter.emit(`show_${id}`, data);
  }

  /**
   * An async hide function. This is useful when you want to show one ActionSheet after closing another.
   *
   * @param id id of the ActionSheet to show
   * @param data An data to pass to the ActionSheet. Will be available from `onClose` prop.
   */
  static async hide(id: string, data?: unknown): Promise<boolean> {
    return new Promise((resolve) => {
      let sub: EmitterSubscription;
      const fn = () => {
        resolve(true);
        sub?.remove();
      };
      sub = DeviceEventEmitter.addListener(`onclose_${id}`, fn);
      DeviceEventEmitter.emit(`hide_${id}`, data);
    });
  }

  /**
   * Hide all the opened ActionSheets.
   */
  static hideAll() {
    ids.forEach((id) => DeviceEventEmitter.emit(`hide_${id}`));
  }

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
