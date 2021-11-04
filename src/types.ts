import { ViewStyle } from "react-native";


export type ActionSheetProps = {

     /**
      * Animate the opening and closing of ActionSheet.
  
 | Type | Required |
 | ---- | -------- |
 | boolean | no |
  
 Default: `true`
      */
     animated?: boolean;

     /**
      * Use if you want to show the ActionSheet Partially on Opening. **Requires `gestureEnabled=true`**
  
 | Type | Required |
 | ---- | -------- |
 | boolean | no |
  
 Default:`1`
      */

     initialOffsetFromBottom?: number;

     /**
      * When touch ends and user has not moved farther from the set springOffset, the ActionSheet will return to previous position.
  
 | Type | Required |
 | ---- | -------- |
 | number | no |
  
 Default: `50`
      */
     springOffset?: number;
     /**
      * Add elevation to the ActionSheet container. 
  
 | Type | Required |
 | ---- | -------- |
 | number | no |
  
 Default: `0`
  
 #
      */
     elevation?: number;

     /**
      * Color of the gestureEnabled Indicator.
  
 | Type | Required |
 | ---- | -------- |
 | string | no |
  
 Default: `"#f0f0f0"`
      */
     indicatorColor?: string;

     /**
      * Normally when the ActionSheet is fully opened, a small portion from the bottom is hidden by default. Use this prop if you want the ActionSheet to hover over the bottom of screen and not hide a little behind it.
  
 | Type | Required |
 | ---- | -------- |
 | number | no |
  
 Default:`0`
      */
     extraScroll?: number;
     /**
      * Color of the overlay/backdrop.
  
 | Type | Required |
 | ---- | -------- |
 | string | no |
  
 Default: `"black"`
      */
     overlayColor?: string;



     /**
      * Keep the header always visible even when gestures are disabled.
  
 | Type | Required |
 | ---- | -------- |
 | boolean | no |
  
 Default: `false`
      */
     headerAlwaysVisible?: boolean;

     /**
      * Delay draw of ActionSheet on open for android.
  
 | Type | Required |
 | ---- | -------- |
 | boolean | no |
  
 Default: `false`
      */

     delayActionSheetDraw?: boolean;

     /**
      * Delay draw of ActionSheet on open for android time.
  
 | Type | Required |
 | ---- | -------- |
 | number (ms) | no |
  
 Default: `50`
      */

     delayActionSheetDrawTime?: number;

     /**
      * Your custom header component. Using this will hide the default indicator.
  
 | Type | Required |
 | ---- | -------- |
 | React.ReactNode | no |
      */
     CustomHeaderComponent?: React.ReactNode;



     /**
      * Any custom styles for the container. 
  
 | Type | Required |
 | ---- | -------- |
 | Object | no |
      */
     containerStyle?: ViewStyle;

     /**
      * Control closing ActionSheet by touching on backdrop.
  
 | Type | Required |
 | ---- | -------- |
 | boolean | no |
  
 Default: `true`
      */
     closeOnTouchBackdrop?: boolean;

     /**
      * Render a component over the ActionSheet. Useful for rendering
      * Toast components with which user can interact.
      * 
| Type | Required |
| ---- | -------- |
| React.ReactNode | no |
      */

     ExtraOverlayComponent?: React.ReactNode;



     /**
      * Speed of opening animation. Higher means the ActionSheet will open more quickly.
  
 | Type | Required |
 | ---- | -------- |
 | number | no |
  
 Default: `12`
      */
     openAnimationSpeed?: number;
     /**
      * Duration of closing animation.
  
 | Type | Required |
 | ---- | -------- |
 | number | no |
  
 Default: `300`
      */
     closeAnimationDuration?: number;
     /**
      * 
 How much you want the ActionSheet to bounce when it is opened. 
  
 | Type | Required |
 | ---- | -------- |
 | number | no |
  
 Default: `8`
      */
     bounciness?: number;

     /**
      * Will the ActionSheet close on `hardwareBackPress` event.
  
 | Type | Required |
 | ---- | -------- |
 | boolean | no |
  
 Default: `true`
      */
     closeOnPressBack?: boolean;
     /**
      * Default opacity of the overlay/backdrop.
  
 | Type | Required |
 | ---- | -------- |
 | number 0 - 1 | no |
  
 Default: `0.3`
      */
     defaultOverlayOpacity?: number;

     /**
      * Enables gesture control of ActionSheet
  
 | Type | Required |
 | ---- | -------- |
 | boolean | no |
  
 Default: `false`
      */
     gestureEnabled?: boolean;

     /**
      * Bounces the ActionSheet on open.
  
 | Type | Required |
 | ---- | -------- |
 | boolean | no |
  
 Default: `false`
      */
     bounceOnOpen?: boolean;

     /**
      * Setting the keyboard persistance of the ScrollView component, should be one of "never", "always", or "handled"
  
 | Type | Required |
 | ---- | -------- |
 | string | no |
  
 Default: `"never"`
      */
     keyboardShouldPersistTaps?: boolean | "always" | "never" | "handled";

     /**
      * Set how keyboard should behave on tapping the ActionSheet.
      * | Type | Required |
 | ---- | -------- |
 | 'on-drag' | 'none' | 'interactive' | no |

 Default : `'none'`
      */

     keyboardDismissMode?: 'on-drag' | 'none' | 'interactive'

     /**
      * Determine whether the modal should go under the system statusbar.
  
 | Type | Required |
 | ---- | -------- |
 | boolean | no |
  
 Default: `true`
      */
     statusBarTranslucent?: boolean;

     /**
      * Prevent ActionSheet from closing on 
      * gesture or tapping on backdrop. 
      * Instead snap it to `bottomOffset` location
      * 
      * 
       * | Type | Required |
 | ---- | -------- |
 | boolean | no |
       */
     closable?: boolean;

     /**
     * Allow ActionSheet to draw under the StatusBar. 
     * This is enabled by default.
     * 
     * 
      * | Type | Required |
 | ---- | -------- |
 | boolean | no |
 Default: `true`
      */
     drawUnderStatusBar?: boolean;

     /**
      * Snap ActionSheet to this location if `closable` is set to false;
      * 
      * 
       * | Type | Required |
 | ---- | -------- |
 | number | no |
       */

     bottomOffset?: number;
    
       /**
     * Allow to choose will content change position when keyboard is visible. 
     * This is enabled by default.
     * 
     * 
      * | Type | Required |
 | ---- | -------- |
 | boolean | no |
 Default: `true`
      */
 
     keyboardHandlerEnabled?: boolean;

     /**
      * Test ID for unit testing
      */
     testID?: string

     /**
      * 
 Event called when the ActionSheet closes.
  
  
 * | Type | Required |
 | ---- | -------- |
 | function | no |
  
  
 #
      */

     onClose?: () => void;

     /**
      * An event called when the ActionSheet Opens.
  
 | Type | Required |
 | ---- | -------- |
 | function | no |
      */
     onOpen?: () => void;

     /**
      * Event called when position of ActionSheet changes.
      */
     onPositionChanged?: (hasReachedTop: boolean) => void;
};
