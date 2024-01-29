import React from 'react';
import {Text, View} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function DrawUnderStatusBar() {
  const insets = useSafeAreaInsets();
  return (
    <ActionSheet
      indicatorStyle={{
        width: 150,
      }}
      gestureEnabled
      safeAreaInsets={insets}
      drawUnderStatusBar
      containerStyle={{
        height: '100%',
      }}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}>
        <Text
          style={{
            color: 'black',
            fontSize: 30,
          }}>
          I draw under status bar!
        </Text>
      </View>
    </ActionSheet>
  );
}

export default DrawUnderStatusBar;
