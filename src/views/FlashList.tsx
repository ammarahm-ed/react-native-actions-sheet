/* eslint-disable curly */
import {
  FlashList as SPFlashList,
  FlashListRef,
  FlashListProps,
} from '@shopify/flash-list';
import React from 'react';
import {ScrollView as RNScrollView} from 'react-native';
import {NativeViewGestureHandlerProps} from 'react-native-gesture-handler';
import {ScrollView as SheetScrollView} from './ScrollView';
type Props<T = any> = FlashListProps<T> &
  Partial<NativeViewGestureHandlerProps> &
  React.RefAttributes<RNScrollView> & {
    /**
     * By default refresh control gesture will work in top 15% area of the ScrollView. You can set a different value here.
     *
     * Accepts a value between 0-1.
     */
    refreshControlGestureArea?: number;
  };

function $FlashList<T = any>(
  props: Props<T>,
  ref: React.ForwardedRef<FlashListRef<T>>,
) {
  return (
    <SPFlashList
      {...props}
      ref={ref}
      bounces={false}
      renderScrollComponent={SheetScrollView as any}
    />
  );
}

export const FlashList = React.forwardRef(
  $FlashList,
) as unknown as typeof SPFlashList;

type MasonaryProps<T = any> = FlashListProps<T> &
  Partial<NativeViewGestureHandlerProps> &
  React.RefAttributes<RNScrollView> & {
    /**
     * By default refresh control gesture will work in top 15% area of the ScrollView. You can set a different value here.
     *
     * Accepts a value between 0-1.
     */
    refreshControlGestureArea?: number;
  };

function $MasonaryFlashList<T = any>(
  props: MasonaryProps<T>,
  ref: React.ForwardedRef<any>,
) {
  return (
    <SPFlashList
      {...props}
      ref={ref as any}
      bounces={false}
      renderScrollComponent={SheetScrollView as any}
    />
  );
}

export const MasonaryFlashList = React.forwardRef(
  $MasonaryFlashList,
) as unknown as typeof SPFlashList;
