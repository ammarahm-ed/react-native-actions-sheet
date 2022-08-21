import React from 'react';
import {Button, Text, View} from 'react-native';
import ActionSheet, {
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';

function ConfirmSheet(props: SheetProps) {
  console.log('opening sheet');
  return (
    <ActionSheet
      id={props.sheetId}
      statusBarTranslucent={false}
      drawUnderStatusBar={false}
      gestureEnabled={true}
      containerStyle={{
        paddingHorizontal: 12,
      }}
      springOffset={50}
      defaultOverlayOpacity={0.3}>
      <Text
        style={{
          marginBottom: 10,
          color: 'black',
        }}>
        Pressing yes or no will return the result back to the caller.
      </Text>
      <Button
        title="No"
        onPress={() => {
          SheetManager.hide(props.sheetId, {
            payload: false,
          });
        }}
      />
      <View
        style={{
          height: 10,
        }}
      />
      <Button
        title="Yes"
        onPress={() => {
          SheetManager.hide(props.sheetId, {
            payload: true,
          });
        }}
      />
    </ActionSheet>
  );
}

export default ConfirmSheet;
