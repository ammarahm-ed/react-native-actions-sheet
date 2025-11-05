import React from 'react';
import {Text} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';

function Hello() {
  return (
    <ActionSheet
      containerStyle={{
        height: '40%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: 'black',
          fontSize: 30,
        }}>
        Hello!
      </Text>
    </ActionSheet>
  );
}

export default Hello;
