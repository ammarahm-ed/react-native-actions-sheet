import React, {useCallback} from 'react';
import {Text, View} from 'react-native';
import ActionSheet, {FlatList, useSheetRef} from 'react-native-actions-sheet';
import {Button} from '../components/button';

function FlatListSheet() {
  const ref = useSheetRef();
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
    <ActionSheet gestureEnabled>
      <View
        style={{
          paddingHorizontal: 12,
          gap: 10,
          maxHeight: '100%'
        }}>
        <FlatList
          data={vegetableNamesWithEmoji}
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
          keyExtractor={(item, index) => `${item} + ${index}`}
          renderItem={renderItem}
        />
        <Button
          title="Close"
          onPress={() => {
            ref.current.hide();
          }}
        />
      </View>
    </ActionSheet>
  );
}

export default FlatListSheet;
