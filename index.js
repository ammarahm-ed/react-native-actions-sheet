import ActionSheet from "./src";
import { DeviceEventEmitter } from "react-native";
/**
 * Adds an event listener for when ActionSheet reach its maximum height.
 *
 * @param callback Function to execute.
 *
 */

export const addHasReachedTopListener = (callback) => {
  return DeviceEventEmitter.addListener("hasReachedTop", callback);
};

/**
 * Remove addHasReachedTopListener.
 *
 * @param callback Function to execute.
 *
 */

export const removeHasReachedTopListener = (callback) => {
  return DeviceEventEmitter.removeListener("hasReachedTop", callback);
};

export default ActionSheet;
