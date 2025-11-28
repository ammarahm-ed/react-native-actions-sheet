/* eslint-disable curly */
import React, {RefObject, useImperativeHandle} from 'react';
import {FlatList as RNGHFlatList} from 'react-native-gesture-handler';
import {useScrollHandlers} from '../hooks/use-scroll-handlers';
import {FlatListProps} from 'react-native';
type Props<T = any> = FlatListProps<T> &
  React.RefAttributes<RNGHFlatList> & {
    /**
     * By default refresh control gesture will work in top 15% area of the ScrollView. You can set a different value here.
     *
     * Accepts a value between 0-1.
     */
    refreshControlGestureArea?: number;
  };

function $FlatList<T>(props: Props<T>, ref: RefObject<RNGHFlatList>) {
  const handlers = useScrollHandlers<any>({
    hasRefreshControl: !!props.refreshControl,
    refreshControlBoundary: props.refreshControlGestureArea || 0.15,
  });
  useImperativeHandle(ref, () => handlers.ref.current);

  return (
    <RNGHFlatList
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

export const FlatList = React.forwardRef($FlatList) as <T = any>(
  props: Props<T> & { ref?: React.Ref<RNGHFlatList> }
) => React.ReactElement;
