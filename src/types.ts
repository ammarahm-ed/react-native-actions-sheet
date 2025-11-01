import React from 'react';
import {
  GestureResponderEvent,
  LayoutRectangle,
  StyleProp,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import {SpringConfig} from 'react-native-reanimated/lib/typescript/animation/springUtils';
import EventManager from './eventmanager';
import {Route} from './hooks/use-router';

export interface Sheets {}

type DefaultSheetDefinition = {
  payload?: any;
  returnValue?: any;
  routes?: any;
};

export type SheetDefinition<T extends DefaultSheetDefinition = any> = T;

export type ActionSheetRef<SheetId extends keyof Sheets = never> = {
  /**
   * Show the ActionSheet.
   */
  show: (snapIndex?: number) => void;

  /**
   * Hide the ActionSheet.
   */
  hide: (data?: Sheets[SheetId]['returnValue']) => void;
  /**
   * @removed Use `show` or `hide` functions or SheetManager to open/close ActionSheet.
   */
  setModalVisible: (visible?: boolean) => void;

  /**
   * Provide a value between 0 to 100 for the action sheet to snap to.
   */
  snapToOffset: (offset: number) => void;
  /**
   * @removed Use `useScrollHandlers` hook to enable scrolling in ActionSheet.
   */
  /**
   * When multiple snap points aret on the action sheet, use this to snap it to different
   * position.
   */
  snapToIndex: (index: number) => void;
  /**
   * @removed Use `useScrollHandlers` hook to enable scrolling in ActionSheet.
   */
  handleChildScrollEnd: () => void;
  snapToRelativeOffset: (offset: number) => void;
  /**
   * Get the current snap index of the sheet.
   */
  currentSnapIndex: () => number;

  /**
   * Used internally for scrollable views.
   */
  modifyGesturesForLayout: (
    id: string,
    layout: LayoutRectangle | undefined,
    scrollOffset: number,
  ) => void;

  isGestureEnabled: () => boolean;
  isOpen: () => boolean;
  ev: EventManager;
  /**
   * Disable or enable sheet keyboard handler.
   */
  keyboardHandler: (enabled?: boolean) => void;
};

export type ActionSheetProps<SheetId extends keyof Sheets = never> = {
  children?: React.ReactNode;
  /**
   * A unique id for the ActionSheet. Defining this is optional. Usually when you register
   * a sheet with `registerSheet()` it's id get automatically assigned.
   *
   */
  id?: SheetId | (string & {});
  /**
   * Animate the opening and closing of ActionSheet.
   *
   * Default: `true`
   */
  animated?: boolean;

  /**
   * Choose how far off the user needs to drag the action sheet to make it snap to next point. The default is `50` which means
   * that user needs to drag the sheet up or down at least 50 display pixels for it to close or move to next snap point.
   * Otherwise it will just return to the initial position.
   *
   * Default: `50`
   */
  springOffset?: number;

  /**
   * When the action sheet is pulled beyond top position, it overdraws and bounces back. Set this to false if you need to disable this behaviour.
   */
  overdrawEnabled?: boolean;
  /**
   * Set how quickly the sheet will overdraw on pulling beyond top position. A lower value means faster overdraw.
   *
   * Default: `15`
   */
  overdrawFactor?: number;

  /**
   * Set the height of the overdraw View. If you set the `overdrawFactor` to a lower value, you should increase the size of the overdraw
   * to prevent the action sheet from showing background views etc.
   *
   * Default : `100`
   */
  overdrawSize?: number;

  /**
   * The open animation is a spring animation. You can modify it using the config below.
   */
  openAnimationConfig?: SpringConfig;
  /**
   * The open animation is a spring animation. You can modify it by providing a custom config.
   */
  closeAnimationConfig?: SpringConfig;
  /**
   * Provide snap points ranging from 0 to 100. ActionSheet will snap between these points. If no snap points
   * are provided, the default is a single snap point set to `100` which means that the sheet will be opened
   * 100% on becoming visible.
   */
  snapPoints?: number[];
  /**
   * When you have set the `snapPoints` prop. You can use this prop to set the inital snap point for the sheet. For example
   * if i have snap points set to `[30,60,100]` then setting this prop to `1` would mean the action sheet will snap to 60% on
   * becoming visible.
   */
  initialSnapIndex?: number;

  /**
   * Enable background interation. This way the user will be able to interact with the screen in background of the action sheet
   * when it is opened.
   */
  backgroundInteractionEnabled?: boolean;

  /**
   * The action sheet uses it's own keyboard handling. Set this prop to `false` to disable it if needed.
   */
  keyboardHandlerEnabled?: boolean;

  /**
   * Add elevation to the ActionSheet container.
   *
   * Default: `5`
   */
  elevation?: number;

  /**
   * Since `SheetManager.show` is now awaitable. You can return some data
   * to the caller by setting this prop. When the Sheet closes
   * the promise will resolve with the data.
   *
   * Note: It is however recommended to pass desired data via `SheetManager.hide` or `ref.hide`
   * functions intead to avoid unnecessary rerenders when closing the sheet.
   */
  payload?: Sheets[SheetId]['returnValue'];

  /**
   * Style the top indicator bar in ActionSheet.
   */
  indicatorStyle?: StyleProp<ViewStyle>;

  /**
   * Color of the overlay/backdrop.
   *
   * Default: `"black"`
   */
  overlayColor?: string;

  /**
   * Keep the header always visible even when gestures are disabled.
   *
   * Default: `false`
   */
  headerAlwaysVisible?: boolean;

  /**
   * Your custom header component. Using this will hide the default indicator.
   * */
  CustomHeaderComponent?: React.ReactNode;

  /**
   * Any custom styles for the container.
   * */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * Control closing ActionSheet by touching on backdrop.
   *
   * Default: `true`
   */
  closeOnTouchBackdrop?: boolean;

  /**
   * Callback when user touches the backdrop. Includes the GestureResponderEvent.
   *
   * Default: undefined
   */
  onTouchBackdrop?: (event: GestureResponderEvent) => void;

  /**
   * Render a component over the ActionSheet. Useful for rendering
   * Toast components with which user can interact. Should be `absolutely` positioned.
   *
   * */

  ExtraOverlayComponent?: React.ReactNode;

  /**
   * If any of the action sheets in a nested SheetProvider is not a modal, i.e uses `isModal={false}` then you must define
   * the provider with this prop. This allows the action sheet to be rendered correctly in fullscreen.
   *
   * */

  withNestedSheetProvider?: React.ReactNode;

  /**
   * Will the ActionSheet close on `hardwareBackPress` event.
   *
   * Default: `true`
   */
  closeOnPressBack?: boolean;
  /**
   * Default opacity of the overlay/backdrop.
   *
   * Default: `0.3`
   */
  defaultOverlayOpacity?: number;

  /**
   * Enables gesture control of ActionSheet.
   *
   * Default: `false`
   */
  gestureEnabled?: boolean;

  /**
   * Determine whether the modal should go under the system statusbar.
   *
   * Default: `true`
   */
  statusBarTranslucent?: boolean;

  /**
   * Prevent ActionSheet from closing on
   * gesture or tapping on backdrop.
   * Instead snap it to `bottomOffset` location
   *
   * */
  closable?: boolean;

  /**
   * Allow ActionSheet to draw under the StatusBar.
   * This is enabled by default.
   *
   * Default: `true`
   */
  drawUnderStatusBar?: boolean;

  /**
   * Set this to false to use a View instead of a Modal to show Sheet.
   */
  isModal?: boolean;

  /**
   * Set the distance where the sheet should appear from. A value of 1 means sheet starts appearing from the bottom of the screen.
   * @default 1
   */
  initialTranslateFactor?: number;

  /**
   * The default zIndex of wrapper `View` when `isModal` is set to false or background interaction is enabled is 9999. You can change it here.
   */

  zIndex?: number;

  /**
   * Test ID for sheet modal.
   *
   * @deprecated Use `testIDs.modal` instead.
   */
  testID?: string;

  /**
   * Test id for various sheet components for testing
   */
  testIDs?: {
    /**
     * Test id for backdrop. Can be used to close sheet in e2e tests.
     */
    backdrop?: string;
    /**
     * Test id for the modal
     */
    modal?: string;

    /**
     * Test id for the container that wraps all your components inside the sheet.
     */
    sheet?: string;
    /**
     * Test id for the root container when `isModal` is set to `false`.
     */
    root?: string;
  };

  /**
   * Apply padding to bottom based on device safe area insets.
   *
   * @default true
   */
  useBottomSafeAreaPadding?: boolean;

  /**
   * Event called when the ActionSheet closes.
   *
   * */

  onClose?: (data?: Sheets[SheetId]['returnValue']) => void;

  /**
   * Event called before ActionSheet opens. This is called only when using `SheetManager`.
   */
  onBeforeShow?: (data?: Sheets[SheetId]['payload']) => void;

  onBeforeClose?: (data?: Sheets[SheetId]['returnValue']) => void;

  /**
   * An event called when the ActionSheet Opens.
   *
   * */
  onOpen?: () => void;

  /**
   * Event called when the position of the ActionSheet changes.
   *
   * @param {number} percentage Sheet visible on the screen in percentage.
   */
  onChange?: (position: number) => void;

  /**
   * Additional props to pass to the backdrop element. Useful for adding custom accessibility props.
   */
  backdropProps?: Partial<TouchableOpacityProps>;

  /**
   * Default safeArea insets provided through a library such as
   * react-native-safe-area-insets. This also helps in giving a tiny boost
   * in performance as the sheet does not have to calculate insets anymore.
   *
   * @deprecated Insets are used internally by default through react-native-safe-area-insets. This prop is no-op.
   */
  safeAreaInsets?: {top: number; left: number; right: number; bottom: number};
  /**
   * A list of routes for the router.
   */
  routes?: Route[];
  /**
   * An event called when navigating to a route in stack
   */
  onNavigate?: (route: string) => void;
  /**
   * An event called when navigating back in stack.
   */
  onNavigateBack?: (route: string) => void;
  /**
   * Initial route to navigate to when the sheet opens.
   */
  initialRoute?: keyof Sheets[SheetId]['routes'] | (string & {});
  /**
   * Enable back navigation for router when pressing hardware back button or
   * touching the back drop. Remember that swiping down the sheet will still close
   * the sheet regardless of the route in stack.
   */
  enableRouterBackNavigation?: boolean;
  /**
   * Enable swipe gestures inside ScrollView/FlatList. Enabled by default.
   */
  enableGesturesInScrollView?: boolean;

  onSnapIndexChange?: (index: number) => void;

  /**
   * When `closable=false`, set this to true to not allow
   * sheet to go beyond minimum snap point position with drag.
   */
  disableDragBeyondMinimumSnapPoint?: boolean;
};
