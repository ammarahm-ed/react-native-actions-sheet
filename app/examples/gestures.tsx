import React from 'react';
import {Text, View} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';

function Gestures() {
  return (
    <ActionSheet
      gestureEnabled={true}
      indicatorStyle={{
        width: 100,
      }}>
      <View
        style={{
          paddingHorizontal: 12,
          height: 200,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          style={{
            color: 'black',
            fontSize: 30,
            textAlign: 'center',
          }}>
          Hello, swipe me up and down!
        </Text>
      </View>
    </ActionSheet>
  );
}

export default Gestures;
