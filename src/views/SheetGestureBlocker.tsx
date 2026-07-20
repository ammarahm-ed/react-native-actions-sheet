import React from 'react';
import {Platform, StyleProp, ViewStyle} from 'react-native';
import Animated from 'react-native-reanimated';
import {useSheetGestureRegion} from '../hooks/use-worklet-scrollable';

export type SheetGestureBlockerProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Wraps content whose area should not drag the ActionSheet. Any drag that begins
 * inside this view leaves the sheet where it is — useful for sliders, color
 * pickers, maps, drawing canvases and similar controls.
 *
 * Only has an effect with the worklet gesture engine (the default). With
 * `legacyGestures`, it renders as a plain view.
 */
export function SheetGestureBlocker({
  children,
  style,
}: SheetGestureBlockerProps) {
  const {ref} = useSheetGestureRegion();
  return (
    <Animated.View
      ref={ref}
      style={style}
      // Ensure the view is a real native view so it can be measured on Android.
      collapsable={Platform.OS === 'android' ? false : undefined}>
      {children}
    </Animated.View>
  );
}
