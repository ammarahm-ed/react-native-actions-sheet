import React from 'react';
import {Text, View} from 'react-native';
import ActionSheet, {useSheetRef} from 'react-native-actions-sheet';
import {TextInput} from 'react-native-gesture-handler';

function Input() {
  return (
    <ActionSheet gestureEnabled>
      <View
        style={{
          paddingHorizontal: 12,
          height: 400,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}>
        <TextInput
          style={{
            color: 'black',
            fontSize: 30,
          }}
          placeholderTextColor="#a9a9a9"
          placeholder="Type something..."
        />
      </View>
    </ActionSheet>
  );
}

export default Input;
