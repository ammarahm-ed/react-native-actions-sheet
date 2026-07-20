import React, {useCallback} from 'react';
import {ScrollView as RNScrollView, Text, View} from 'react-native';
import ActionSheet, {
  FlatList,
  SheetGestureBlocker,
  useSheetRef,
} from 'react-native-actions-sheet';
import {Button} from '../components/button';

const fruits = [
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
  '🥑 Avocado',
  '🍆 Eggplant',
  '🥝 Kiwi',
  '🍓 Strawberry',
  '🍒 Cherries',
  '🍑 Peach',
  '🍍 Pineapple',
  '🥭 Mango',
  '🍉 Watermelon',
  '🍌 Banana',
];

const numbers = Array.from({length: 30}, (_, i) => `Row #${i + 1}`);

function Column({data, label}: {data: string[]; label: string}) {
  const renderItem = useCallback(
    ({item}: {item: string}) => (
      <Text
        style={{
          color: 'black',
          fontSize: 16,
          height: 40,
          verticalAlign: 'middle',
        }}>
        {item}
      </Text>
    ),
    [],
  );
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 8,
      }}>
      <Text style={{fontWeight: 'bold', color: 'black', paddingVertical: 6}}>
        {label}
      </Text>
      <FlatList
        data={data}
        style={{height: 220}}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderItem}
      />
    </View>
  );
}

function MultiScrollSheet() {
  const ref = useSheetRef();
  return (
    <ActionSheet gestureEnabled snapPoints={[60, 100]} initialSnapIndex={1}>
      <View style={{paddingHorizontal: 12, gap: 12, paddingBottom: 16}}>
        <Text style={{color: 'black', fontSize: 24, paddingTop: 4}}>
          Multi-scroll & gesture blocking
        </Text>
        <Text style={{color: '#666'}}>
          Each list below scrolls independently. Drag from the title/handle to
          move the sheet.
        </Text>

        {/* Two independent scrollables, arbitrated at the same time */}
        <View style={{flexDirection: 'row', gap: 10}}>
          <Column data={fruits} label="Produce" />
          <Column data={numbers} label="Numbers" />
        </View>

        {/* A region the sheet ignores: dragging here won't move the sheet */}
        <SheetGestureBlocker
          style={{
            backgroundColor: '#f2f0ff',
            borderRadius: 12,
            padding: 12,
          }}>
          <Text style={{fontWeight: 'bold', color: '#5b3df5'}}>
            🔒 Gesture-blocking region
          </Text>
          <Text style={{color: '#666', marginBottom: 8}}>
            Swipe up/down inside this box — the sheet stays put. The inner list
            still scrolls.
          </Text>
          <RNScrollView
            nestedScrollEnabled
            style={{height: 120}}
            contentContainerStyle={{gap: 6}}>
            {Array.from({length: 20}, (_, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 8,
                  padding: 10,
                }}>
                <Text style={{color: 'black'}}>Independent item {i + 1}</Text>
              </View>
            ))}
          </RNScrollView>
        </SheetGestureBlocker>

        <Button title="Close" onPress={() => ref.current?.hide()} />
      </View>
    </ActionSheet>
  );
}

export default MultiScrollSheet;
