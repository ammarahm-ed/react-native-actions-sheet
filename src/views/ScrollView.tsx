/* eslint-disable curly */
import React, {
  RefObject,
  useImperativeHandle
} from 'react';
import {
  Platform,
  ScrollView as RNScrollView,
  ScrollViewProps,
} from 'react-native';
import {
  NativeViewGestureHandlerProps,
  ScrollView as RNGHScrollView,
} from 'react-native-gesture-handler';
import { useScrollHandlers } from '../hooks/use-scroll-handlers';
type Props = ScrollViewProps &
  Partial<NativeViewGestureHandlerProps> &
  React.RefAttributes<RNScrollView> & {
    /**
     * By default refresh control gesture will work in top 15% area of the ScrollView. You can set a different value here.
     *
     * Accepts a value between 0-1.
     */
    refreshControlGestureArea?: number;
  };

function $ScrollView(
  props: Props,
  ref: React.ForwardedRef<RefObject<RNScrollView>>,
) {
  const handlers = useScrollHandlers<RNScrollView>({
    hasRefreshControl: !!props.refreshControl,
    refreshControlBoundary: props.refreshControlGestureArea || 0.15,
  });
  useImperativeHandle(ref, () => handlers.ref);

  const ScrollComponent = Platform.OS === 'web' ? RNScrollView : RNGHScrollView;
  return (
    <ScrollComponent
      {...props}
      {...handlers}
      onScroll={event => {
        handlers.onScroll(event);
        props.onScroll?.(event);
      }}
      onLayout={event => {
        handlers.onLayout();
        props.onLayout?.(event);
      }}
      bounces={false}
      scrollEventThrottle={1}
    />
  );
}



export const ScrollView = React.forwardRef(
  $ScrollView,
) as unknown as typeof RNScrollView;
