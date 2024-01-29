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
    <ActionSheet
      gestureEnabled
      snapPoints={[50, 100]}>
      <View
        style={{
          paddingHorizontal: 12,
          height: 400,
          alignItems: 'center',
          paddingTop: 20,
          gap: 10,
          width: '100%',
        }}>
        <FlatList
          data={vegetableNamesWithEmoji}
          style={{
            width: '100%',
          }}
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
          keyExtractor={(item, index) => item + index}
          renderItem={renderItem}
        />
        <Button
          title="Close"
          onPress={() => {
            ref.current.hide();
          }}
          style={{
            marginTop: 10,
            marginBottom: 10,
          }}
        />
      </View>
    </ActionSheet>
  );
}

export default FlatListSheet;
