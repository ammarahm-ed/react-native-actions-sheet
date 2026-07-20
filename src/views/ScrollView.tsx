/* eslint-disable curly */
import React, {RefObject, useImperativeHandle} from 'react';
import {ScrollView as RNScrollView, ScrollViewProps} from 'react-native';
import {ScrollView as RNGHScrollView} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import {useScrollHandlers} from '../hooks/use-scroll-handlers';
import {useSheetScrollable} from '../hooks/use-worklet-scrollable';

const AnimatedRNGHScrollView = Animated.createAnimatedComponent(RNGHScrollView);

type Props = ScrollViewProps &
  React.RefAttributes<RNScrollView> & {
    /**
     * By default refresh control gesture will work in top 15% area of the ScrollView. You can set a different value here.
     *
     * Accepts a value between 0-1.
     */
    refreshControlGestureArea?: number;
  };

function $ScrollView(props: Props, ref: RefObject<RNScrollView>) {
  const options = {
    hasRefreshControl: !!props.refreshControl,
    refreshControlBoundary: props.refreshControlGestureArea || 0.15,
  };
  const handlers = useScrollHandlers<RNScrollView>(options);
  const worklet = useSheetScrollable(options, props.onScroll ?? undefined);
  useImperativeHandle(ref, () =>
    worklet.enabled ? worklet.ref.current : handlers.ref.current,
  );

  if (worklet.enabled) {
    return (
      <AnimatedRNGHScrollView
        {...props}
        ref={worklet.ref}
        simultaneousHandlers={worklet.simultaneousHandlers}
        scrollEventThrottle={worklet.scrollEventThrottle}
        onScroll={worklet.onScroll}
        onTouchStart={event => {
          worklet.onTouchStart();
          props.onTouchStart?.(event);
        }}
        bounces={false}
      />
    );
  }

  return (
    <RNGHScrollView
      {...props}
      ref={handlers.ref}
      simultaneousHandlers={handlers.simultaneousHandlers}
      scrollEventThrottle={handlers.scrollEventThrottle}
      onScroll={event => {
        handlers.onScroll(event);
        props.onScroll?.(event);
      }}
      onLayout={event => {
        handlers.onLayout();
        props.onLayout?.(event);
      }}
      bounces={false}
    />
  );
}

export const ScrollView = React.forwardRef(
  $ScrollView,
) as unknown as typeof RNScrollView;
