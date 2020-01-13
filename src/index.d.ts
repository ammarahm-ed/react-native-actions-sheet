import { Component } from "react";
import { StyleProp, ViewStyle } from "react-native";
 

declare module "react-native-actions-sheet" {
  export type ActionSheetProps = {

    animated?: boolean;
    animationType?: "none" | "fade" | "slide";
    initialOffsetFromBottom?: number,
    bounceOffset?: number;
    springOffset?: number;
    elevation?: number;
    indicatorColor?: string;
    overlayColor?: string;
    closeOnPressBack?: boolean;
    gestureEnabled?: boolean,
    bounceOnOpen?: boolean,
    onClose?: () => void;
    onOpen?: () => void;
    customStyles?: StyleProp<ViewStyle>;
  };

  export default class ActionSheet extends Component<ActionSheetProps> {
    setModalVisible(): void;
   
  }
}