import {ScrollView as RNScrollView} from 'react-native';
import {ScrollView as RNGHScrollView} from 'react-native-gesture-handler';
import {createSheetScrollable} from './create-sheet-scrollable';

/**
 * A ScrollView that cooperates with the ActionSheet's drag gesture. Use it in
 * place of the React Native / gesture-handler ScrollView for scrollable content
 * inside a sheet.
 */
export const ScrollView = createSheetScrollable<typeof RNScrollView>(
  RNGHScrollView as unknown as typeof RNScrollView,
  'SheetScrollView',
);
