import { Dimensions, Platform, StatusBar } from "react-native";

export function getDeviceHeight(statusBarTranslucent: boolean | undefined):number {
  var height = Dimensions.get("window").height;

  if (Platform.OS === "android" && !statusBarTranslucent) {

    return StatusBar.currentHeight ?  height - StatusBar.currentHeight : height;
  }

  return height;
}

export const getElevation = (elevation: number) => {
  return {
    elevation,
    shadowColor: "black",
    shadowOffset: { width: 0.3 * elevation, height: 0.5 * elevation },
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation,
  };
};

export const SUPPORTED_ORIENTATIONS: ("portrait" | "portrait-upside-down" | "landscape" | "landscape-left" | "landscape-right")[] = [
  "portrait", "portrait-upside-down", "landscape", "landscape-left", "landscape-right"
];

export const waitAsync = (ms: number): Promise<null> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, ms);
  });
