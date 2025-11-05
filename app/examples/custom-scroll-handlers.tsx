import React, {useCallback} from 'react';
import {ScrollView, Text, View} from 'react-native';
import ActionSheet, {useScrollHandlers} from 'react-native-actions-sheet';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';

/**
 * This needs to be a separate component for simultaneousHandlers to get populated properly from the PanGestureContext.
 * @returns
 */
function CustomScrollView() {
  const scrollHandlers = useScrollHandlers<ScrollView>();
  const gesture = Gesture.Native().simultaneousWithExternalGesture(
    ...scrollHandlers.simultaneousHandlers,
  );
  const vegetableNamesWithEmoji = [
    '🍅 Tomato',
    '🥕 Carrot',
    '🥦 Broccoli',
    '🥒 Cucumber',
    '🌶️ Hot Pepper',
    '🫑 Bell Pepper',
    '🧄 Garlic',
    '🧅 Onion',
    '🍄 Mushroom',
    '🥔 Potato',
    '🥬 Leafy Green',
    '🥑 Avocado',
    '🍆 Eggplant',
    '🥝 Kiwi Fruit',
    '🍓 Strawberry',
    '🍈 Melon',
    '🍒 Cherries',
    '🍑 Peach',
    '🍍 Pineapple',
    '🥭 Mango',
    '🍉 Watermelon',
    '🍌 Banana',
    '🍋 Lemon',
    '🍊 Orange',
    '🍎 Red Apple',
    '🍏 Green Apple',
    '🍐 Pear',
    '🍇 Grapes',
    '🍉 Watermelon',
    '🍌 Banana',
  ];

  const renderItem = useCallback(
    (item, index) => (
      <Text
        key={item + index}
        style={{
          color: 'black',
          fontSize: 20,
          height: 60,
        }}>
        {item}
      </Text>
    ),
    [],
  );

  return (
    <GestureDetector gesture={gesture}>
      <ScrollView
        ref={scrollHandlers.ref}
        onLayout={scrollHandlers.onLayout}
        onScroll={scrollHandlers.onScroll}
        scrollEventThrottle={scrollHandlers.scrollEventThrottle}
        style={{
          width: '100%',
          flexShrink: 1,
        }}>
        <Text
          style={{
            color: 'black',
            fontSize: 30,
            width: '100%',
            paddingBottom: 10,
          }}>
          Vegetables
        </Text>

        {vegetableNamesWithEmoji.map(renderItem)}
      </ScrollView>
    </GestureDetector>
  );
}

function CustomScrollHandlers() {
  return (
    <ActionSheet
      gestureEnabled
      snapPoints={[50, 100]}
      initialSnapIndex={0}
      containerStyle={{
        maxHeight: '100%',
        height: '100%',
      }}>
      <View
        style={{
          paddingHorizontal: 12,
          alignItems: 'center',
          paddingTop: 20,
          gap: 10,
          width: '100%',
          height: '100%',
        }}>
        <CustomScrollView />
      </View>
    </ActionSheet>
  );
}

export default CustomScrollHandlers;
