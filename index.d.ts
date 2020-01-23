import { Component } from "react";
import { StyleProp, ViewStyle } from "react-native";
 

declare module "react-native-actions-sheet" {
  export type ActionSheetProps = {
    animated?: boolean;
    initialOffsetFromBottom?: number;
    springOffset?: number;
    elevation?: number;
    indicatorColor?: string;
    overlayColor?: string;
    footerAlwaysVisible?:false, 
    headerAlwaysVisible?:false,
    containerStyle?: StyleProp<ViewStyle>,
    footerHeight?:80,
    footerStyle?:StyleProp<ViewStyle>,
    closeAnimationDuration?:number;
    openAnimationDuration?:number;
    bounciness?:number;
    closeOnPressBack?: boolean;
    defaultOverlayOpacity:number;
    gestureEnabled?: boolean;
    bounceOnOpen?: boolean;
    onClose?: () => void;
    onOpen?: () => void;
  };

  export default class ActionSheet extends Component<ActionSheetProps> {
    setModalVisible(): void;
   
  }
}
