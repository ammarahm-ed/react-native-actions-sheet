import React from 'react';
import {Text} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetRef,
} from 'react-native-actions-sheet';
import {Button} from '../components/button';

function NestedSheet() {
  const ref = useSheetRef('nested-sheets');
  return (
    <ActionSheet
      gestureEnabled
      isModal={false}
      containerStyle={{
        paddingHorizontal: 12,
        height: 400,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: 'black',
          fontSize: 30,
          textAlign: 'center',
          marginBottom: 10,
        }}>
        Hello!
      </Text>

      <Button
        title="Open a nested sheet"
        onPress={() => {
          SheetManager.show('nested-sheets');
        }}
      />

      <Button
        title="Hide this sheet"
        onPress={() => {
          ref.current.hide();
        }}
      />

      <Button
        title="Hide All Sheets"
        onPress={() => {
          SheetManager.hideAll();
        }}
      />
    </ActionSheet>
  );
}

export default NestedSheet;
