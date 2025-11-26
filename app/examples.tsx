/* eslint-disable curly */
import React, {act, useRef} from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ActionSheet, {
  ActionSheetRef,
  SheetManager,
} from 'react-native-actions-sheet';
import {SafeAreaView} from 'react-native-safe-area-context';

const MainScreen = () => {
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const examples: {
    title: string;
    onOpen: () => void;
  }[] = [
    {
      title: 'Simple Sheet',
      onOpen: () => {
        actionSheetRef.current?.show();
      },
    },
    {
      title: 'Hello',
      onOpen: () => {
        SheetManager.show('hello');
      },
    },
    {
      title: 'Floating Sheet',
      onOpen: () => {
        SheetManager.show('floating-sheet', {
          overrideProps: {
            gestureEnabled: false,
          },
        });
      },
    },
    {
      title: 'Draw under status bar',
      onOpen: () => {
        SheetManager.show('draw-under-statusbar');
      },
    },
    {
      title: 'Gestures',
      onOpen: () => {
        SheetManager.show('gestures');
      },
    },
    {
      title: 'I can snap!',
      onOpen: () => {
        SheetManager.show('snap-me');
      },
    },
    {
      title: 'Keyboard handling',
      onOpen: () => {
        SheetManager.show('input');
      },
    },
    {
      title: 'Open with data',
      onOpen: () => {
        const candyNames = [
          'Candy 🍬',
          'Chocolate 🍫',
          'Lollipop 🍭',
          'Cookie 🍪',
          'Cake 🍰',
          'Ice-cream 🍦',
          'Doughnut 🍩',
        ];
        SheetManager.show('payload', {
          payload: {
            candy: candyNames[Math.floor(Math.random() * candyNames.length)],
          },
        });
      },
    },
    {
      title: 'Return data from sheet',
      onOpen: () => {
        SheetManager.show('return-data').then(result => {
          console.log('User will star on github?', result);
          if (result) {
            Linking.openURL(
              'https://github.com/ammarahm-ed/react-native-actions-sheet',
            );
          }
        });
      },
    },
    {
      title: 'Interact with background',
      onOpen: () => {
        SheetManager.show('background-interaction');
      },
    },
    {
      title: 'Always open',
      onOpen: () => {
        SheetManager.show('always-open');
      },
    },
    {
      title: 'ScrollView',
      onOpen: () => {
        SheetManager.show('scrollview');
      },
    },
    {
      title: 'FlatList',
      onOpen: () => {
        SheetManager.show('flatlist');
      },
    },
    {
      title: 'FlashList',
      onOpen: () => {
        SheetManager.show('flashlist');
      },
    },
    {
      title: 'LegendList',
      onOpen: () => {
        SheetManager.show('legend-list');
      },
    },
    {
      title: 'Resize',
      onOpen: () => {
        SheetManager.show('scrollview-resize');
      },
    },
    {
      title: 'Nested sheets',
      onOpen: () => {
        SheetManager.show('nested-sheets');
      },
    },
    {
      title: 'Sheet Router',
      onOpen: () => {
        SheetManager.show('sheet-router');
      },
    },
    {
      title: 'Custom scroll handlers',
      onOpen: () => {
        SheetManager.show('custom-scroll-handlers');
      },
    },
  ];

  return (
    <>
      <SafeAreaView style={[styles.safeareview, {}]}>
        <ActionSheet
          ref={actionSheetRef}
          gestureEnabled
          containerStyle={{
            paddingHorizontal: 12,
            height: '40%',
          }}>
          <Text
            style={{
              color: 'black',
              fontSize: 30,
              textAlign: 'center',
            }}>
            I opened without SheetManager!
          </Text>
        </ActionSheet>

        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />

        <View
          style={{
            paddingHorizontal: 16,
            height: 150,
            width:'100%'
          }}>
          <Image
            style={{
              width: '100%',
              height: 150,
            }}
            resizeMode="contain"
            src="https://raw.githubusercontent.com/ammarahm-ed/react-native-actions-sheet/master/assets/graphic.png"
          />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingBottom: 50,
          }}
          style={{
            width: '100%',
            flex: 1,
            paddingHorizontal: 16,
          }}>
          {examples.map(item => (
            <Pressable
              key={item.title}
              onPress={() => {
                item.onOpen();
              }}
              style={pressed => ({
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'center',
                backgroundColor: pressed.pressed ? '#d9d9d9' : 'white',
                paddingHorizontal: 10,
                borderRadius: 10,
                elevation: 5,
                shadowColor: 'black',
                shadowOffset: {width: 0.3 * 4, height: 0.5 * 4},
                shadowOpacity: 0.2,
                shadowRadius: 0.7 * 4,
                width: '100%',
                marginBottom: 10,
              })}>
              <Text style={styles.btnTitle}>{item.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  safeareview: {
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#d6d6d6',
    alignItems: 'center',
    gap: 10,
    paddingTop: 20,
  },
  btnTitle: {
    color: 'block',
    fontWeight: 'bold',
  },
});
