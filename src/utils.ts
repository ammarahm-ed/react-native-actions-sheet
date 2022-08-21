import {Dimensions, Platform, StatusBar} from 'react-native';

export function getDeviceHeight(
  statusBarTranslucent: boolean | undefined,
): number {
  if (Platform.OS === 'ios') return Dimensions.get('screen').height;

  var currentStatusbarHeight = StatusBar.currentHeight || 0;
  var height = Dimensions.get('window').height + currentStatusbarHeight - 3;
  if (!statusBarTranslucent) {
    return height - currentStatusbarHeight;
  }
  return height;
}

export const getElevation = (elevation: number) => {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: {width: 0.3 * elevation, height: 0.5 * elevation},
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation,
  };
};

export const SUPPORTED_ORIENTATIONS: (
  | 'portrait'
  | 'portrait-upside-down'
  | 'landscape'
  | 'landscape-left'
  | 'landscape-right'
)[] = [
  'portrait',
  'portrait-upside-down',
  'landscape',
  'landscape-left',
  'landscape-right',
];

export const waitAsync = (ms: number): Promise<null> =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(null);
    }, ms);
  });
