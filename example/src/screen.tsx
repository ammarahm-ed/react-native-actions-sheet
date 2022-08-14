/* eslint-disable curly */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SheetManager} from 'react-native-actions-sheet';

const ExampleScreen = () => {
  const initialValue = useRef(250);
  const [value] = useState(() => new Animated.Value(250));
  const returnAnimation = useMemo(
    () =>
      Animated.spring(value, {
        toValue: 250,
        useNativeDriver: true,
      }),
    [value],
  );
  const hideAnimation = useMemo(
    () =>
      Animated.timing(value, {
        duration: 150,
        easing: Easing.in(Easing.ease),
        toValue: 1000,
        useNativeDriver: true,
      }),
    [value],
  );
  const [handlers] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        //@ts-ignore
        if (value._value <= 0 && gesture.dy <= 0) return;
        value.setValue(initialValue.current + gesture.dy);
      },
      onPanResponderEnd: (e, g) => {
        //@ts-ignore
        if (value._value < 100) {
          Animated.spring(value, {
            toValue: 0,
            useNativeDriver: true,
          }).start();

          initialValue.current = 0;
          return;
        }
        if (g.dy > 150) {
          initialValue.current = -1000;
          hideAnimation.start();
        } else {
          initialValue.current = 250;
          returnAnimation.start();
        }
      },
    }),
  );

  useEffect(() => {
    returnAnimation.start();
  }, []);
  return (
    <>
      <SafeAreaView style={styles.safeareview}>
        <Text
          style={{
            color: 'black',
            fontWeight: '100',
            fontSize: 30,
            marginBottom: 25,
          }}>
          ActionSheet Demo
        </Text>
        <TouchableOpacity
          onPress={() => {
            SheetManager.show('example-sheet', {data: 'hello world'});
          }}
          style={styles.btn}>
          <Text style={styles.btnTitle}>Open ActionSheet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            let confirmed = await SheetManager.show('confirm-sheet');
            console.log('confirmation status:', confirmed);
          }}
          style={[
            styles.btn,
            {
              marginTop: 10,
            },
          ]}>
          <Text style={styles.btnTitle}>Open Confirm Sheet</Text>
        </TouchableOpacity>

        {/* <Animated.View
          {...handlers.panHandlers}
          style={{
            height: 500,
            width: '100%',
            backgroundColor: 'red',
            position: 'absolute',
            bottom: 0,
            borderRadius: 15,
            transform: [
              {
                translateY: value,
              },
            ],
          }}
        /> */}
      </SafeAreaView>
    </>
  );
};

export default ExampleScreen;

const styles = StyleSheet.create({
  btn: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fe8a71',
    paddingHorizontal: 10,
    borderRadius: 100,
    elevation: 5,
    shadowColor: 'black',
    shadowOffset: {width: 0.3 * 4, height: 0.5 * 4},
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * 4,
    width: '100%',
  },
  safeareview: {
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    alignItems: 'center',
  },
  btnTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
});
