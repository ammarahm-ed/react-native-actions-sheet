import React, {useEffect, useRef} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ActionSheet, {
  addHasReachedTopListener,
  removeHasReachedTopListener,
} from 'react-native-actions-sheet';

const App = () => {
  const actionSheetRef = useRef();
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

  const onClose = () => {
    scrollViewRef.current?.setNativeProps({
      scrollEnabled: false,
    });
  };

  const onOpen = () => {
    scrollViewRef.current?.setNativeProps({
      scrollEnabled: false,
    });
  };

  return (
    <>
      <SafeAreaView style={styles.safeareview}>
        <TouchableOpacity
          onPress={() => {
            actionSheetRef.current?.show();
          }}
          style={styles.btn}>
          <Text style={styles.btnTitle}>Open ActionSheet</Text>
        </TouchableOpacity>

        <ActionSheet
          initialOffsetFromBottom={0.6}
          ref={actionSheetRef}
          onOpen={onOpen}
          statusBarTranslucent
          bounceOnOpen={true}
          bounciness={4}
          gestureEnabled={true}
          onClose={onClose}
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
            style={styles.scrollview}>
            <View style={styles.container}>
              {['#4a4e4d', '#0e9aa7', '#3da4ab', '#f6cd61', '#fe8a71'].map(
                color => (
                  <TouchableOpacity
                    onPress={() => {
                      actionSheetRef.current?.hide();
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
              style={styles.input}
              multiline={true}
              placeholder="Write your text here"
            />

            <View>
              {items.map(item => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    actionSheetRef.current?.hide();
                  }}
                  style={styles.listItem}>
                  <View
                    style={{
                      width: item,
                      height: 15,
                      backgroundColor: '#f0f0f0',
                      marginVertical: 15,
                      borderRadius: 5,
                    }}
                  />

                  <View style={styles.btnLeft} />
                </TouchableOpacity>
              ))}
            </View>

            {/*  Add a Small Footer at Bottom */}
            <View style={styles.footer} />
          </ScrollView>
        </ActionSheet>
      </SafeAreaView>
    </>
  );
};

export default App;

const items = [
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
];

const styles = StyleSheet.create({
  footer: {
    height: 100,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnLeft: {
    width: 30,
    height: 30,
    backgroundColor: '#f0f0f0',
    borderRadius: 100,
  },
  input: {
    width: '100%',
    minHeight: 50,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scrollview: {
    width: '100%',
    padding: 12,
  },
  btn: {
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
  },
  safeareview: {
    justifyContent: 'center',
    flex: 1,
  },
  btnTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
});
