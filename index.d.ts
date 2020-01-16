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
    closeAnimationDuration?:number;
    defaultOverlayOpacity?:number;
    openAnimationDuration?:number;
    bounciness:number;
    closeOnPressBack?: boolean;
    defaultOverlayOpacity:number;
    gestureEnabled?: boolean;
    bounceOnOpen?: boolean;
    onClose?: () => void;
    onOpen?: () => void;
    customStyles?: StyleProp<ViewStyle>;
  };

  export default class ActionSheet extends Component<ActionSheetProps> {
    setModalVisible(): void;
   
  }
}