import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  View,
  TextInput,
  ScrollView,
} from 'react-native';
import ActionSheet, {addHasReachedTopListener, removeHasReachedTopListener} from 'react-native-actions-sheet';


const App = () => {
  const [nestedScrollEnabled, setNestedScrollEnabled] = useState(false);

  let actionSheet;

  const _onHasReachedTop = () => {
    setNestedScrollEnabled(true);
  }

  useEffect(() => {
    addHasReachedTopListener(_onHasReachedTop)
    return () => {
        removeHasReachedTopListener(_onHasReachedTop)
    }
  },[])

  const _onClose = () => {
    setNestedScrollEnabled(false);
  }

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
            actionSheet.setModalVisible();
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
          initialOffsetFromBottom={0.5}
          ref={ref => (actionSheet = ref)}
          bounceOnOpen={true}
          bounciness={8}
          gestureEnabled={true}
          onClose={_onClose}
          defaultOverlayOpacity={0.3}>
          <ScrollView
            nestedScrollEnabled={nestedScrollEnabled}
            style={{
              width: '100%',
              padding: 12,
              maxHeight:500
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
                      actionSheet.setModalVisible();
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
                height: 50,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#f0f0f0',
                marginBottom: 15,
                paddingHorizontal: 10,
              }}
              placeholder="Write your text here"></TextInput>

            <View style={{}}>
              {[100, 60, 150, 200, 170, 80, 41,101, 61, 151, 202, 172, 82, 43,103, 64, 155, 205, 176, 86, 46,106, 66, 152, 203, 173, 81, 42].map(item => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    actionSheet.setModalVisible();
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
                    }}></View>

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
