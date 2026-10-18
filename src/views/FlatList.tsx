import React from 'react';
import {FlatList as RNGHFlatList} from 'react-native-gesture-handler';
import {FlatListProps} from 'react-native';
import {createSheetScrollable} from './create-sheet-scrollable';

type Props<T = any> = FlatListProps<T> &
  React.RefAttributes<RNGHFlatList> & {
    /**
     * By default refresh control gesture will work in top 15% area of the ScrollView. You can set a different value here.
     *
     * Accepts a value between 0-1.
     */
    refreshControlGestureArea?: number;
  };

/**
 * A FlatList that cooperates with the ActionSheet's drag gesture. Use it in
 * place of the React Native / gesture-handler FlatList for scrollable content
 * inside a sheet.
 */
export const FlatList = createSheetScrollable<
  <T = any>(props: Props<T>) => React.ReactElement
>(RNGHFlatList as any, 'SheetFlatList');
