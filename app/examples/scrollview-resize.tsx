import React, {useCallback} from 'react';
import {Text, TextInput, View} from 'react-native';
import ActionSheet, {ScrollView} from 'react-native-actions-sheet';
import {Button} from '../components/button';

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
];

function ResizeSheet() {
  const [vegetables, setVegetables] = React.useState([
    ...vegetableNamesWithEmoji.slice(0, 2),
  ]);

  const renderItem = useCallback(
    (item, index) => (
      <Text
        key={item + index}
        style={{
          color: 'black',
          fontSize: 20,
        }}
        children={item}
      />
    ),
    [],
  );

  return (
    <ActionSheet
      gestureEnabled
      containerStyle={{
        borderWidth: 1,
        borderColor: '#f0f0f0',
      }}>
      <View
        style={{
          paddingHorizontal: 12,
          alignItems: 'center',
          paddingTop: 20,
          gap: 10,
          width: '100%',
        }}>
        <Button
          title="Add vegetable"
          onPress={() => {
            setVegetables([
              ...vegetables,
              vegetableNamesWithEmoji[
                Math.floor(Math.random() * vegetableNamesWithEmoji.length)
              ],
            ]);
          }}
        />

        <Button
          title="Remove vegetable"
          onPress={() => {
            setVegetables([...vegetables.slice(0, vegetables.length - 1)]);
          }}
        />

        <ScrollView
          style={{
            width: '100%',
            flexShrink: 1,
          }}>
          {vegetables.map(renderItem)}
        </ScrollView>
      </View>
    </ActionSheet>
  );
}

export default ResizeSheet;
