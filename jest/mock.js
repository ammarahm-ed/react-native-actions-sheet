/**
 * Jest mock for react-native-actions-sheet.
 *
 * ```js
 * jest.mock('react-native-actions-sheet', () =>
 *   require('react-native-actions-sheet/jest/mock'),
 * );
 * ```
 *
 * The sheet is not rendered natively here, so this mock keeps the parts tests
 * actually assert on:
 *
 * - `<ActionSheet>` renders its `children` while it is shown and exposes the
 *   ref API (`show`, `hide`, `snapToIndex`, ...) through `useImperativeHandle`.
 *   Every method is a `jest.fn()`, so `expect(ref.current.show).toHaveBeenCalled()`
 *   works. `initialVisible` is not a real prop, so call `show()` first -- exactly
 *   like the real component, which renders nothing until it is shown.
 * - `SheetManager.show` / `hide` resolve their promises, so
 *   `await SheetManager.show('id')` keeps working.
 * - `ScrollView` / `FlatList` are React Native's own.
 * - The hooks return inert stand-ins (`useSheetPosition` returns shared-value
 *   shaped `{value}` objects) so components that read them render.
 */
const React = require('react');
const {ScrollView, FlatList, View} = require('react-native');

/** Numeric values match the `CloseRequestType` enum in src/types.ts. */
const CloseRequestType = {
  SWIPE: 0,
  BACK_PRESS: 1,
  TOUCH_BACKDROP: 2,
  0: 'SWIPE',
  1: 'BACK_PRESS',
  2: 'TOUCH_BACKDROP',
};

const noop = () => {};
/** `jest.fn()` inside jest, a plain no-op anywhere else. */
const spy = implementation =>
  typeof jest === 'undefined' ? implementation || noop : jest.fn(implementation);
/** A SharedValue stand-in: `.value` reads and writes never throw. */
const sharedValue = value => ({value});
const inertRef = () => ({current: null});

const SheetRefContext = React.createContext(null);
const SheetPayloadContext = React.createContext(undefined);

function createRefApi(getState) {
  return {
    show: spy(() => getState().setVisible(true)),
    hide: spy(data => {
      getState().setVisible(false);
      getState().props.onClose?.(data);
    }),
    setModalVisible: spy(visible => getState().setVisible(visible !== false)),
    snapToOffset: spy(),
    snapToIndex: spy(index => getState().setSnapIndex(index)),
    snapToRelativeOffset: spy(),
    handleChildScrollEnd: spy(),
    currentSnapIndex: spy(() => getState().snapIndex),
    modifyGesturesForLayout: spy(),
    isGestureEnabled: spy(() => true),
    isOpen: spy(() => getState().visible),
    ev: {on: spy(), off: spy(), emit: spy(), publish: spy()},
    keyboardHandler: spy(),
    currentPayload: spy(() => getState().props.payload),
  };
}

/**
 * Renders `children` only while shown, and registers the ref API on `ref`.
 */
const ActionSheet = React.forwardRef(function ActionSheet(props, ref) {
  const [visible, setVisible] = React.useState(false);
  const [snapIndex, setSnapIndex] = React.useState(props.initialSnapIndex || 0);
  const state = React.useRef({});
  state.current = {visible, snapIndex, setVisible, setSnapIndex, props};
  const api = React.useMemo(() => createRefApi(() => state.current), []);
  React.useImperativeHandle(ref, () => api, [api]);

  if (!visible) return null;
  return React.createElement(
    SheetRefContext.Provider,
    {value: {current: api}},
    React.createElement(
      SheetPayloadContext.Provider,
      {value: props.payload},
      React.createElement(View, {testID: props.testID}, props.children),
    ),
  );
});

function useSheetRef() {
  const ref = React.useRef(null);
  if (!ref.current) {
    const state = {
      visible: false,
      snapIndex: 0,
      props: {},
      setVisible: () => {},
      setSnapIndex: () => {},
    };
    ref.current = createRefApi(() => state);
  }
  return ref;
}

const useSheetPayload = () => undefined;
const useSheetPosition = () => ({
  y: sharedValue(0),
  height: sharedValue(0),
  progress: sharedValue(0),
});
const useSheetScrollable = () => ({
  enabled: false,
  ref: inertRef(),
  onScroll: noop,
  simultaneousHandlers: [],
  scrollEventThrottle: 16,
});
const useSheetGestureRegion = () => ({enabled: false, ref: inertRef()});
const useScrollHandlers = () => ({
  onScroll: noop,
  onBeginDrag: noop,
  onEndDrag: noop,
  onMomentumScrollEnd: noop,
  scrollEventThrottle: 16,
});
const useProviderContext = () => 'global';
const useSheetIDContext = () => undefined;
const useSheetRouteParams = () => ({});
const useSheetRouter = () => ({
  stack: [],
  hasRoutes: () => false,
  push: spy(),
  pop: spy(),
  goBack: spy(),
  canGoBack: () => false,
  initialNavigation: spy(),
  navigate: spy(),
});

const SheetProvider = ({children}) => children ?? null;
const SheetRegister = () => null;
const SheetGestureBlocker = ({children, style, ...rest}) =>
  React.createElement(View, {...rest, style}, children);
const Route = () => null;

const SheetManager = {
  show: spy(() => Promise.resolve(undefined)),
  hide: spy(() => Promise.resolve(undefined)),
  remove: spy(),
  get: spy(() => undefined),
  add: spy(),
  registerRef: spy(),
};

const registerSheet = spy();
const setBaseZIndexForActionSheets = spy();
const getSheetStack = () => [];
const isRenderedOnTop = () => true;

module.exports = {
  __esModule: true,
  default: ActionSheet,
  ActionSheet,
  SheetManager,
  SheetProvider,
  SheetRegister,
  SheetGestureBlocker,
  ScrollView,
  FlatList,
  Route,
  CloseRequestType,
  registerSheet,
  setBaseZIndexForActionSheets,
  getSheetStack,
  isRenderedOnTop,
  useSheetRef,
  useSheetPayload,
  useSheetPosition,
  useSheetScrollable,
  useSheetGestureRegion,
  useScrollHandlers,
  useProviderContext,
  useSheetIDContext,
  useSheetRouteParams,
  useSheetRouter,
  SheetRefContext,
};
