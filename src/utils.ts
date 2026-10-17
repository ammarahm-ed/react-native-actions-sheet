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
  // `boxShadow` replaces the deprecated `shadow*` trio, which RN-web 0.21 warns
  // about and which iOS refuses to draw without a background colour ("shadow set
  // but cannot calculate efficiently"). Android keeps its native `elevation`,
  // which already draws the shadow, so `boxShadow` is not stacked on top of it.
  if (Platform.OS === 'android') {
    return {elevation};
  }
  return {
    boxShadow: `0px ${0.5 * elevation}px ${0.7 * elevation}px rgba(0, 0, 0, 0.2)`,
  };
};

// Reanimated only reads hook dependency arrays on web, where its Babel plugin
// does not run. On native it derives them from the worklet closure, and since
// 4.6 its implementation warns on every render when an array is passed there
// ("dependencies should only be used in web implementation"), which floods dev
// consoles. Keep the arrays for web, drop them everywhere else.
export function webOnlyDeps<T extends unknown[]>(deps: T): T | undefined {
  return Platform.OS === 'web' ? deps : undefined;
}

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

export function debug(key: string, data: any) {
  //@ts-ignore
  if (!globalThis.__DEV__) return;
  console.log('action-sheet', 'debug', key, ':', data);
}

export const waitAsync = (ms: number): Promise<null> =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(null);
    }, ms);
  });
