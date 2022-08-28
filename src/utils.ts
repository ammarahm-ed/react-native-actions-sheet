import {Platform, StatusBar} from 'react-native';

export function getDeviceHeight(
  statusBarTranslucent: boolean | undefined,
  height: number,
): number {
  if (Platform.OS === 'ios') return height;

  var currentStatusbarHeight = StatusBar.currentHeight || 0;
  var height = height + currentStatusbarHeight - 3;
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
