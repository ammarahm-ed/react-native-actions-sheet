/* eslint-disable curly */
import React, {useImperativeHandle} from 'react';
import Animated from 'react-native-reanimated';
import {useScrollHandlers} from '../hooks/use-scroll-handlers';
import {useSheetScrollable} from '../hooks/use-worklet-scrollable';

/**
 * Builds a sheet-aware scrollable from a react-native-gesture-handler scroll
 * component. The returned component picks the worklet path (default) or the
 * legacy `useScrollHandlers` path automatically, so `ScrollView` and `FlatList`
 * share a single implementation.
 */
export function createSheetScrollable<T>(
  Component: T,
  displayName: string,
): T {
  const RNGHComponent = Component as unknown as React.ComponentType<any>;
  const AnimatedComponent = Animated.createAnimatedComponent(RNGHComponent);

  function SheetScrollable(props: any, ref: React.Ref<any>) {
    const options = {
      hasRefreshControl: !!props.refreshControl,
      refreshControlBoundary: props.refreshControlGestureArea || 0.15,
    };
    const worklet = useSheetScrollable(options, props.onScroll ?? undefined);
    // Only register with the legacy JS gesture engine when the worklet engine is
    // not the one handling this scrollable.
    const handlers = useScrollHandlers<any>(options, !worklet.enabled);
    useImperativeHandle(ref, () =>
      worklet.enabled ? worklet.ref.current : handlers.ref.current,
    );

    if (worklet.enabled) {
      return (
        <AnimatedComponent
          {...props}
          ref={worklet.ref}
          simultaneousHandlers={worklet.simultaneousHandlers}
          scrollEventThrottle={worklet.scrollEventThrottle}
          onScroll={worklet.onScroll}
          bounces={false}
        />
      );
    }

    return (
      <RNGHComponent
        {...props}
        ref={handlers.ref}
        simultaneousHandlers={handlers.simultaneousHandlers}
        scrollEventThrottle={handlers.scrollEventThrottle}
        onScroll={(event: any) => {
          handlers.onScroll(event);
          props.onScroll?.(event);
        }}
        onLayout={(event: any) => {
          handlers.onLayout();
          props.onLayout?.(event);
        }}
        bounces={false}
      />
    );
  }
  SheetScrollable.displayName = displayName;

  return React.forwardRef(SheetScrollable) as unknown as T;
}
