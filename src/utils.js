import { Dimensions, Platform, StatusBar } from "react-native";

export function getDeviceHeight(statusBarTranslucent) {
  var height = Dimensions.get("window").height;

  if (Platform.OS === "android" && !statusBarTranslucent) {
    return height - StatusBar.currentHeight;
  }

  return height;
}

export const getElevation = (elevation) => {
  return {
    elevation,
    shadowColor: "black",
    shadowOffset: { width: 0.3 * elevation, height: 0.5 * elevation },
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation,
  };
};

export const SUPPORTED_ORIENTATIONS = [
  "portrait",
  "portrait-upside-down",
  "landscape",
  "landscape-left",
  "landscape-right",
];

export const waitAsync = (ms) =>
new Promise((resolve, reject) => {
  setTimeout(() => {
	resolve();
  }, ms);
});
