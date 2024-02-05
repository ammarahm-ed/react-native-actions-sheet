import React from 'react';
import { View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { TextInput } from 'react-native-gesture-handler';

function Input() {

  return (
    <ActionSheet gestureEnabled>
      <View
        style={{
          paddingHorizontal: 12,
          height: 200,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}>
        <TextInput
          style={{
            color: 'black',
            fontSize: 30,
          }}
          autoFocus
          placeholderTextColor="#a9a9a9"
          placeholder="Type something..."
        />
      </View>
    </ActionSheet>
  );
}

export default Input;
