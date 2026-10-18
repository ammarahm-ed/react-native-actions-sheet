// The close-handshake tests exercise sheet state, not gesture or animation
// rendering, so the native modules are stubbed. This keeps the suite honest
// about what it covers: it asserts on isOpen()/registry/promise settlement, and
// does not pretend to verify gestures or layout (that is what the on-device
// probe and the example app are for).
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const {View} = require('react-native');
  // Any builder call (withRef, onChange, onFinalize, ...) returns the gesture,
  // so the stub does not have to track the builder surface.
  const makeGesture = () => {
    const g = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === 'then') return undefined;
          return (..._args) => g;
        },
      },
    );
    return g;
  };
  return {
    Gesture: {
      Pan: makeGesture, Tap: makeGesture, LongPress: makeGesture,
      Race: makeGesture, Simultaneous: makeGesture, Exclusive: makeGesture,
    },
    GestureDetector: ({children}) => children,
    GestureHandlerRootView: ({children, ...p}) => React.createElement(View, p, children),
    Directions: {},
    State: {},
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const {View, ScrollView, FlatList} = require('react-native');
  const shared = v => ({value: v, get: () => v, set: () => {}, addListener: () => {}});
  const Animated = {
    View, ScrollView, FlatList, Text: require('react-native').Text,
    createAnimatedComponent: c => c,
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: v => shared(v),
    useAnimatedStyle: fn => {
      try { return fn(); } catch { return {}; }
    },
    useAnimatedReaction: () => {},
    useDerivedValue: fn => {
      try { return shared(fn()); } catch { return shared(0); }
    },
    useAnimatedRef: () => ({current: null}),
    runOnJS: fn => fn,
    runOnUI: fn => fn,
    // Animations complete immediately: the sheet's teardown runs from the
    // `callback` in the animation config, so a stub that never calls it would
    // leave the component permanently "animating" and the tests meaningless.
    // Honour `duration` so the close animation occupies real wall-clock time;
    // with an instant stub there is no "mid-animation" window to test at all.
    withTiming: (v, config, callback) => {
      const done = callback || (config && config.callback);
      const ms = (config && config.duration) || 0;
      if (typeof done === 'function') setTimeout(() => done(true), ms);
      return v;
    },
    withSpring: (v, config, callback) => {
      const done = callback || (config && config.callback);
      const ms = (config && config.duration) || 0;
      if (typeof done === 'function') setTimeout(() => done(true), ms);
      return v;
    },
    withDelay: (_d, v) => v,
    interpolate: (v) => v,
    Extrapolation: {},
    // Every easing helper returns a callable/returnable token; the tests do not
    // assert on timing curves.
    Easing: new Proxy(
      {},
      {
        get: () => {
          const fn = () => fn;
          return fn;
        },
      },
    ),
    measure: () => null,
    cancelAnimation: () => {},
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    SafeAreaProvider: ({children}) => children,
    SafeAreaView: ({children, ...p}) => React.createElement(View, p, children),
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
    useSafeAreaFrame: () => ({x: 0, y: 0, width: 390, height: 844}),
  };
});
