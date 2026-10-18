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
 * Works with both gesture engines: the worklet engine (the default) resolves the
 * region on the UI thread, web's legacy PanResponder path resolves it on the JS
 * thread from the view's measured bounds. Only the native `legacyGestures` path
 * (where the sheet itself is JS-driven) treats it as a plain view.
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
