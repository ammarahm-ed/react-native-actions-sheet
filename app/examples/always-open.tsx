import React from 'react';
import {Text, View} from 'react-native';
import ActionSheet, {useSheetRef} from 'react-native-actions-sheet';
import {Button} from '../components/button';

function AlwaysOpen() {
  const ref = useSheetRef();
  return (
    <ActionSheet
      isModal={false}
      backgroundInteractionEnabled
      snapPoints={[30, 100]}
      gestureEnabled
      closable={false}
      disableDragBeyondMinimumSnapPoint
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
          gap: 10
        }}>
        <Text
          style={{
            color: 'black',
            fontSize: 20,
            textAlign: 'center',
          }}>
          I always stay at the bottom
        </Text>

        <Button
          title="Until you close me..."
          onPress={() => {
            ref.current.hide();
          }}
        />
      </View>
    </ActionSheet>
  );
}

export default AlwaysOpen;
