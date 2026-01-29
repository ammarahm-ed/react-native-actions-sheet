import React from 'react';
import {Text, View} from 'react-native';
import ActionSheet, {SheetManager} from 'react-native-actions-sheet';
import LinearGradient from 'react-native-linear-gradient';

export function CustomBackground() {
  return (
    <ActionSheet
      CustomHeaderComponent={<></>}
      gestureEnabled
      containerStyle={{
        height: '40%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      }}>
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={{
          width: '100%',
          height: 400,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View
          style={{
            width: 100,
            height: 6,
            backgroundColor: '#f0f0f0',
            borderRadius: 10,
            opacity: 0.3,
            position: 'absolute',
            top: 10,
          }}
        />

        <Text
          onPress={() => {
            SheetManager.show('hello_two');
          }}
          style={{
            color: 'white',
            fontSize: 30,
          }}>
          Hello!
        </Text>
      </LinearGradient>
    </ActionSheet>
  );
}
