import React from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

function AnimatedPositionSheet() {
  const animatedPosition = useSharedValue(0);

  const fabPositionStyle = useAnimatedStyle(() => {
    return {
      top: animatedPosition.value - 80,
    };
  });

  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: 16,
            elevation: 24,
          },
          fabPositionStyle,
        ]}>
        <TouchableOpacity
          style={{
            width: 64,
            height: 64,
            borderRadius: 9999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            shadowOffset: {
              width: 4.5,
              height: 3,
            },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 24,
          }}>
          <Text style={{fontSize: 32}}>B</Text>
        </TouchableOpacity>
      </Animated.View>
      <ActionSheet
        gestureEnabled
        backgroundInteractionEnabled
        snapPoints={[40, 100]}
        initialSnapIndex={0}
        animatedPosition={animatedPosition}
        containerStyle={{
          height: '100%',
        }}>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingInline: 36,
          }}>
          <Text
            style={{
              color: 'black',
              fontSize: 30,
              textAlign: 'center',
            }}>
            I render a FAB based on the animated position property
          </Text>
        </View>
      </ActionSheet>
    </>
  );
}

export default AnimatedPositionSheet;
