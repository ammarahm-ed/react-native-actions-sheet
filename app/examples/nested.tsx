import React from 'react';
import {Text} from 'react-native';
import ActionSheet, {SheetManager} from 'react-native-actions-sheet';
import {Button} from '../components/button';

function NestedSheet() {
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
          textAlign:'center',
          marginBottom: 10
        }}>
        Hello!
      </Text>

      <Button
        title="Open a nested sheet"
        onPress={() => {
          SheetManager.show('snap-me');
        }}
      />
    </ActionSheet>
  );
}

export default NestedSheet;
