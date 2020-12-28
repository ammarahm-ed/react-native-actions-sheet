import React, {useEffect, useState, createRef, useRef} from 'react';
import {
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  View,
  TextInput,
  ScrollView,
} from 'react-native';
import ActionSheet, {
  addHasReachedTopListener,
  removeHasReachedTopListener,
} from 'react-native-actions-sheet';

const actionSheetRef = createRef();
const App = () => {
  const scrollViewRef = useRef();
  const onHasReachedTop = hasReachedTop => {
    if (hasReachedTop)
      scrollViewRef.current?.setNativeProps({
        scrollEnabled: hasReachedTop,
      });
  };

  useEffect(() => {
    addHasReachedTopListener(onHasReachedTop);
    return () => {
      removeHasReachedTopListener(onHasReachedTop);
    };
  }, []);

  const _onClose = () => {
    scrollViewRef.current?.setNativeProps({
      scrollEnabled: false,
    });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        style={{
          justifyContent: 'center',
          flex: 1,
        }}>
        <TouchableOpacity
          onPress={() => {
            actionSheetRef.current?.setModalVisible();
          }}
          style={{
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',
            backgroundColor: '#fe8a71',
            paddingHorizontal: 10,
            borderRadius: 5,
            elevation: 5,
            shadowColor: 'black',
            shadowOffset: {width: 0.3 * 4, height: 0.5 * 4},
            shadowOpacity: 0.2,
            shadowRadius: 0.7 * 4,
          }}>
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
            }}>
            Open ActionSheet
          </Text>
        </TouchableOpacity>

        <ActionSheet
          initialOffsetFromBottom={0.6}
          ref={actionSheetRef}
          onOpen={() => {
            scrollViewRef.current?.setNativeProps({
              scrollEnabled: false,
            });
          }}
          statusBarTranslucent
          bounceOnOpen={true}
          bounciness={4}
          gestureEnabled={true}
          onClose={_onClose}
          defaultOverlayOpacity={0.3}>
          <ScrollView
            ref={scrollViewRef}
            nestedScrollEnabled={true}
            onScrollEndDrag={() =>
              actionSheetRef.current?.handleChildScrollEnd()
            }
            onScrollAnimationEnd={() =>
              actionSheetRef.current?.handleChildScrollEnd()
            }
            onMomentumScrollEnd={() =>
              actionSheetRef.current?.handleChildScrollEnd()
            }
            style={{
              width: '100%',
              padding: 12,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
              }}>
              {['#4a4e4d', '#0e9aa7', '#3da4ab', '#f6cd61', '#fe8a71'].map(
                color => (
                  <TouchableOpacity
                    onPress={() => {
                      actionSheetRef.current?.setModalVisible();
                    }}
                    key={color}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 100,
                      backgroundColor: color,
                    }}
                  />
                ),
              )}
            </View>

            <TextInput
              style={{
                width: '100%',
                minHeight: 50,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#f0f0f0',
                marginBottom: 15,
                paddingHorizontal: 10,
              }}
              multiline={true}
              placeholder="Write your text here"
            />

            <View style={{}}>
              {[
                100,
                60,
                150,
                200,
                170,
                80,
                41,
                101,
                61,
                151,
                202,
                172,
                82,
                43,
                103,
                64,
                155,
                205,
                176,
                86,
                46,
                106,
                66,
                152,
                203,
                173,
                81,
                42,
              ].map(item => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    actionSheetRef.current?.setModalVisible();
                  }}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <View
                    style={{
                      width: item,
                      height: 15,
                      backgroundColor: '#f0f0f0',
                      marginVertical: 15,
                      borderRadius: 5,
                    }}
                  />

                  <View
                    style={{
                      width: 30,
                      height: 30,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 100,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </ActionSheet>
      </SafeAreaView>
    </>
  );
};

export default App;
