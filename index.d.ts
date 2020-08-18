import { Component } from "react";
import { StyleProp, ViewStyle } from "react-native";

declare module "react-native-actions-sheet" {
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
     * Keep footer visible. Currently when you overdraw, the footer appears, however you can change this by setting this to `true`.

| Type | Required |
| ---- | -------- |
| boolean | no |

Default: `false`
     */
    footerAlwaysVisible?: boolean;

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
| React.Component | no |
     */
    CustomHeaderComponent?: React.ReactNode;

    /**
     * A footer component if you want to add some info at the bottom. 

| Type | Required |
| ---- | -------- |
| React.Component | no |

**Note:** Remember to give footer a fixed height and provide ActionSheet the `footerHeight` prop with same value. If you have added margins etc, add those values to `footerHeight` also.

     */
    CustomFooterComponent?: React.ReactNode;

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
     * Height of the footer

| Type | Required |
| ---- | -------- |
| number | no |
Default: `80`
     */
    footerHeight?: number;

    /**
     * Custom Styles for the footer container.

| Type | Required |
| ---- | -------- |
| Object | no |
     */
    footerStyle?: ViewStyle;

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
    keyboardShouldPersistTaps?: string;

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
     * Snap ActionSheet to this location if `closable` is set to false;
     * 
     * 
      * | Type | Required |
| ---- | -------- |
| number | no |
      */

    bottomOffset?: number;

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
  };

  export default class ActionSheet extends Component<ActionSheetProps> {
    /**
     * ActionSheet can be opened or closed using its ref.
     */
    setModalVisible(visible?: boolean): void;

    /**
     * Snap ActionSheet to given offset
     */
    snapToOffset(offset: number): void;
  }
}
