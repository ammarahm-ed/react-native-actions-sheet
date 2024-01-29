import React from 'react';
import { Text, View } from 'react-native';
import ActionSheet, { useSheetRef } from 'react-native-actions-sheet';
import { Button } from '../components/button';

const  SnapMe = () => {
  const ref = useSheetRef<"snap-me">();

  return (
    <ActionSheet gestureEnabled snapPoints={[70, 100]}>
      <View
        style={{
          paddingHorizontal: 12,
          height: 400,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}>
        <Text
          style={{
            color: 'black',
            fontSize: 30,
          }}>
          Swipe me up!
        </Text>

        <Text
          style={{
            color: 'black',
          }}>
          OR
        </Text>

        <Button
          title="Snap with a tap!"
          onPress={() => {
            if (!ref.current) return;
            ref.current.snapToIndex(
              ref.current?.currentSnapIndex() === 0 ? 1 : 0,
            );
          }}
          style={{
            width: 250,
          }}
        />
      </View>
    </ActionSheet>
  );
}

export default SnapMe;
