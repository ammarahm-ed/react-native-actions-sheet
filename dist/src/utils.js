import { Dimensions, Platform, StatusBar } from 'react-native';
export function getDeviceHeight(statusBarTranslucent) {
    if (Platform.OS === 'ios')
        return Dimensions.get('screen').height;
    var currentStatusbarHeight = StatusBar.currentHeight || 0;
    var height = Dimensions.get('window').height + currentStatusbarHeight - 3;
    if (!statusBarTranslucent) {
        return height - currentStatusbarHeight;
    }
    return height;
}
export var getElevation = function (elevation) {
    return {
        elevation: elevation,
        shadowColor: 'black',
        shadowOffset: { width: 0.3 * elevation, height: 0.5 * elevation },
        shadowOpacity: 0.2,
        shadowRadius: 0.7 * elevation
    };
};
export var SUPPORTED_ORIENTATIONS = [
    'portrait',
    'portrait-upside-down',
    'landscape',
    'landscape-left',
    'landscape-right',
];
export var waitAsync = function (ms) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(null);
        }, ms);
    });
};
