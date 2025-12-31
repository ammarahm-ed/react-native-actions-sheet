import React, {useCallback, useEffect} from 'react';
import {Text, View, ScrollView as RNScrollView, TextInput} from 'react-native';
import ActionSheet, {ScrollView} from 'react-native-actions-sheet';
import Animated, {
  DerivedValue,
  runOnUI,
  useAnimatedProps,
  useAnimatedRef,
  useDerivedValue,
  useScrollOffset,
} from 'react-native-reanimated';

function ScrollViewSheet() {
  const scrollRef = useAnimatedRef<RNScrollView>();
  const offset = useScrollOffset(scrollRef);

  const text = useDerivedValue(
    () => `Scroll offset: ${offset.value.toFixed(1)}`,
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
        <AnimatedText text={text} />
        <ScrollView
          ref={scrollRef}
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
      </View>
    </ActionSheet>
  );
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function AnimatedText(props: {text: DerivedValue<string>}) {
  const text = props.text;
  const animatedProps = useAnimatedProps(() => ({
    text: text.value,
    defaultValue: text.value,
  }));
  return (
    <AnimatedTextInput
      {...props}
      editable={false}
      animatedProps={animatedProps}
    />
  );
}

export default ScrollViewSheet;
