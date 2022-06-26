import React from "react";
import { ViewStyle } from "react-native";
export declare type ActionSheetProps = {
    children: React.ReactNode;
    /**
     * A unique id for the ActionSheet. You must set this if you are using `SheetManager`.
     *
     */
    id?: string;
    /**
     * Animate the opening and closing of ActionSheet.
     *
     * Default: `true`
     */
    animated?: boolean;
    /**
     * Use if you want to show the ActionSheet Partially on Opening. **Requires `gestureEnabled=true`**
     *
     * Default:`1`
     */
    initialOffsetFromBottom?: number;
    /**
     * When touch ends and user has not moved farther from the set springOffset, the ActionSheet will return to previous position.
     *
     * Default: `50`
     */
    springOffset?: number;
    /**
     * Add elevation to the ActionSheet container.
     *
     * Default: `0`
     */
    elevation?: number;
    /**
     * Color of the gestureEnabled Indicator.
     *
     * Default: `"#f0f0f0"`
     *
     * @deprecated use `indicatorStyle` prop instead.
     */
    indicatorColor?: string;
    /**
     * Style the top indicator bar in ActionSheet.
     */
    indicatorStyle?: ViewStyle;
    /**
     * Normally when the ActionSheet is fully opened, a small portion from the bottom is hidden by default. Use this prop if you want the ActionSheet to hover over the bottom of screen and not hide a little behind it.
     *
     * Default:`0`
     */
    extraScroll?: number;
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
     * Delay draw of ActionSheet on open for android.
     *
     * Default: `false`
     */
    delayActionSheetDraw?: boolean;
    /**
     * Delay draw of ActionSheet on open for android time.
     *
     * Default: `50`
     */
    delayActionSheetDrawTime?: number;
    /**
     * Your custom header component. Using this will hide the default indicator.
     * */
    CustomHeaderComponent?: React.ReactNode;
    /**
     * Any custom styles for the container.
     * */
    containerStyle?: ViewStyle;
    /**
     * Control closing ActionSheet by touching on backdrop.
     *
     * Default: `true`
     */
    closeOnTouchBackdrop?: boolean;
    /**
     * Render a component over the ActionSheet. Useful for rendering
     * Toast components with which user can interact.
     *
     * */
    ExtraOverlayComponent?: React.ReactNode;
    /**
     * Speed of opening animation. Higher means the ActionSheet will open more quickly.
     *
     * Default: `12`
     */
    openAnimationSpeed?: number;
    /**
     * Duration of closing animation.
     *
     * Default: `300`
     */
    closeAnimationDuration?: number;
    /**
     * How much you want the ActionSheet to bounce when it is opened.
     *
     * Default: `8`
     */
    bounciness?: number;
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
     * Bounces the ActionSheet on open.
     *
     * Default: `false`
     */
    bounceOnOpen?: boolean;
    /**
     * Setting the keyboard persistance of the ScrollView component, should be one of "never", "always", or "handled".
     *
     * Default: `"never"`
     */
    keyboardShouldPersistTaps?: boolean | "always" | "never" | "handled";
    /**
     * Set how keyboard should behave on tapping the ActionSheet.
     *
     * Default : `'none'`
     */
    keyboardDismissMode?: "on-drag" | "none" | "interactive";
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
     * Snap ActionSheet to this location if `closable` is set to false;
     *
     * */
    bottomOffset?: number;
    /**
     * Allow to choose will content change position when keyboard is visible.
     * This is enabled by default.
     *
     * Default: `true`
     */
    keyboardHandlerEnabled?: boolean;
    /**
     * Set this to false to use a View instead of a Modal to show Sheet.
     */
    isModal?: boolean;
    /**
     * Test ID for sheet modal.
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
         * Test id for internal scroll view.
         */
        scrollview?: string;
    };
    /**
     * Event called when the ActionSheet closes.
     *
     * */
    onClose?: (data?: unknown) => void;
    /**
     * Event called before ActionSheet opens. This is called only when using `SheetManager`.
     */
    onBeforeShow?: (data?: unknown) => void;
    /**
     * An event called when the ActionSheet Opens.
     *
     * */
    onOpen?: () => void;
    /**
     * Event called when position of ActionSheet changes.
     */
    onPositionChanged?: (hasReachedTop: boolean) => void;
};
//# sourceMappingURL=types.d.ts.map