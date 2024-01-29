import React from 'react';
import {Text} from 'react-native';
import ActionSheet, { useSheetPayload } from 'react-native-actions-sheet';

function Payload() {
  const payload = useSheetPayload("payload");
  return (
    <ActionSheet
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
          textAlign:'center'
        }}>
        Thanks for the {payload.candy}!
      </Text>
    </ActionSheet>
  );
}

export default Payload;
