import React from 'react';
import {Button, Text, View} from 'react-native';
import ActionSheet, {
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';

function ConfirmSheet(props: SheetProps) {
  return (
    <ActionSheet
      id={props.sheetId}
      statusBarTranslucent={false}
      bounceOnOpen={true}
      drawUnderStatusBar={false}
      bounciness={4}
      gestureEnabled={true}
      containerStyle={{
        padding: 12,
      }}
      defaultOverlayOpacity={0.3}>
      <Text
        style={{
          marginBottom: 10,
        }}>
        Pressing yes or no will return the result back to the caller.
      </Text>
      <Button
        title="No"
        onPress={() => {
          SheetManager.hide(props.sheetId, false);
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
          SheetManager.hide(props.sheetId, true);
        }}
      />
      <View
        style={{
          height: 10,
        }}
      />
    </ActionSheet>
  );
}

export default ConfirmSheet;
