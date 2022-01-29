import { Dimensions, Platform, StatusBar } from "react-native";
export function getDeviceHeight(statusBarTranslucent) {
    var height = Dimensions.get("window").height;
    if (Platform.OS === "android" && !statusBarTranslucent) {
        return StatusBar.currentHeight ? height - StatusBar.currentHeight : height;
    }
    return height;
}
export var getElevation = function (elevation) {
    return {
        elevation: elevation,
        shadowColor: "black",
        shadowOffset: { width: 0.3 * elevation, height: 0.5 * elevation },
        shadowOpacity: 0.2,
        shadowRadius: 0.7 * elevation
    };
};
export var SUPPORTED_ORIENTATIONS = [
    "portrait", "portrait-upside-down", "landscape", "landscape-left", "landscape-right"
];
export var waitAsync = function (ms) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(null);
        }, ms);
    });
};
