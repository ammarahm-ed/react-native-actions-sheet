import React, {useCallback} from 'react';
import {Text, View} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import {FlashList} from 'react-native-actions-sheet/dist/src/views/FlashList';

function FlashListSheet() {
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
    '🍋 Lemon',
    '🍊 Orange',
    '🍎 Red Apple',
    '🍏 Green Apple',
    '🍐 Pear',
    '🍇 Grapes',
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
    '🍋 Lemon',
    '🍊 Orange',
    '🍎 Red Apple',
    '🍏 Green Apple',
    '🍐 Pear',
    '🍇 Grapes',
    '🍉 Watermelon',
    '🍌 Banana',
    '🍋 Lemon',
    '🍎 Red Apple',
    '🍏 Green Apple',
    '🍐 Pear',
    '🍇 Grapes',
    '🍉 Watermelon',
    '🍌 Banana',
    '🍋 Lemon',
    '🍊 Orange',
    '🍎 Red Apple',
    '🍏 Green Apple',
  ];

  const renderItem = useCallback(
    ({item}) => (
      <Text
        style={{
          color: 'black',
          fontSize: 20,
          height: 40,
          verticalAlign: 'middle',
          width: '100%',
        }}>
        {item}
      </Text>
    ),
    [],
  );
  return (
    <ActionSheet
      gestureEnabled
      >
      <View
        style={{
          paddingHorizontal: 12,
          height: 400,
          paddingTop: 20,
          gap: 10,
          width: '100%',
        }}>
        <FlashList
          data={vegetableNamesWithEmoji}
          estimatedItemSize={40}
          ListHeaderComponent={
            <Text
              style={{
                color: 'black',
                fontSize: 30,
                width: '100%',
                paddingBottom: 10,
              }}>
              Vegetables
            </Text>
          }
          renderItem={renderItem}
        />
      </View>
    </ActionSheet>
  );
}

export default FlashListSheet;
