import React, {useState} from 'react';
import {Button, Text, View} from 'react-native';
import ActionSheet, {SheetManager, SheetProps, SheetProvider} from '../../';

function ConfirmSheet(props: SheetProps) {
  const [payload, setPayload] = useState();
  return (
    <ActionSheet
      id={props.sheetId}
      statusBarTranslucent={false}
      drawUnderStatusBar={false}
      gestureEnabled={true}
      containerStyle={{
        paddingHorizontal: 12,
      }}
      onClose={data => {
        console.log(data, 'called');
      }}
      payload={payload}
      springOffset={50}
      defaultOverlayOpacity={0.3}>
      <SheetProvider context="local">
        <View>
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
              SheetManager.show('example-sheet', {
                payload: false,
                context: 'local',
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
              setPayload('boom');
              SheetManager.hide(props.sheetId);
            }}
          />
        </View>
      </SheetProvider>
    </ActionSheet>
  );
}

export default ConfirmSheet;
