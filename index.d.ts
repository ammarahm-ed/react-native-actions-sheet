import { Component } from "react";
import { StyleProp, ViewStyle } from "react-native";
 

declare module "react-native-actions-sheet" {
  export type ActionSheetProps = {
    animated?: boolean;
    initialOffsetFromBottom?: number;
    springOffset?: number;
    elevation?: number;
    indicatorColor?: string;
    extraScroll?:number;
    overlayColor?: string;
    footerAlwaysVisible?:false, 
    headerAlwaysVisible?:false,
    CustomHeaderComponent?:React.ReactNode,
    CustomFooterComponent?:React.ReactNode,
    containerStyle?: StyleProp<ViewStyle>,
    footerHeight?:number,
    footerStyle?:StyleProp<ViewStyle>,
    closeAnimationDuration?:number;
    openAnimationDuration?:number;
    bounciness?:number;
    closeOnPressBack?: boolean;
    defaultOverlayOpacity?:number;
    gestureEnabled?: boolean;
    bounceOnOpen?: boolean;
    onClose?: () => void;
    onOpen?: () => void;
  };

  export default class ActionSheet extends Component<ActionSheetProps> {
    setModalVisible(): void;
   
  }
}
