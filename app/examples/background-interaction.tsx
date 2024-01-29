import React from 'react';
import {Text, View} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';

function BackgroundInteraction() {
  return (
    <ActionSheet
      isModal={false}
      backgroundInteractionEnabled={true}
      snapPoints={[30, 100]}
      gestureEnabled
      containerStyle={{
        borderWidth: 1,
        borderColor: '#f0f0f0',
      }}>
      <View
        style={{
          paddingHorizontal: 12,
          height: 400,
          alignItems: 'center',
          paddingVertical: 20,
        }}>
        <Text
          style={{
            color: 'black',
            fontSize: 20,
            textAlign: 'center',
          }}>
          Interact with the views and buttons in background too?! 😲
        </Text>
      </View>
    </ActionSheet>
  );
}

export default BackgroundInteraction;
