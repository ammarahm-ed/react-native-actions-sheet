import React, {useRef} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ActionSheet, {SheetManager} from 'react-native-actions-sheet';

const Sheets = {
  testSheet: 'test_sheet_id',
};

const colors = ['#4a4e4d', '#0e9aa7', '#3da4ab', '#f6cd61', '#fe8a71'];
const App = () => {
  const actionSheetRef = useRef<ActionSheet>(null);

  return (
    <>
      <SafeAreaView style={styles.safeareview}>
        <TouchableOpacity
          onPress={() => {
            SheetManager.show(Sheets.testSheet, {text: 'Hello World'});
          }}
          style={styles.btn}>
          <Text style={styles.btnTitle}>Open ActionSheet</Text>
        </TouchableOpacity>

        <ActionSheet
          initialOffsetFromBottom={0.4}
          onBeforeShow={data => console.log(data)}
          id={Sheets.testSheet}
          ref={actionSheetRef}
          statusBarTranslucent
          bounceOnOpen={true}
          drawUnderStatusBar={true}
          bounciness={4}
          gestureEnabled={true}
          defaultOverlayOpacity={0.3}>
          <View
            style={{
              paddingHorizontal: 12,
            }}>
            <View style={styles.container}>
              {colors.map(color => (
                <TouchableOpacity
                  onPress={() => {
                    actionSheetRef.current?.snapToOffset(500);
                  }}
                  key={color}
                  style={[
                    styles.circle,
                    {
                      backgroundColor: color,
                    },
                  ]}
                />
              ))}
            </View>

            <ScrollView
              nestedScrollEnabled
              onMomentumScrollEnd={() => {
                actionSheetRef.current?.handleChildScrollEnd();
              }}
              style={styles.scrollview}>
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
                      SheetManager.hide(Sheets.testSheet, null);
                    }}
                    style={styles.listItem}>
                    <View
                      style={[
                        styles.placeholder,
                        {
                          width: item,
                        },
                      ]}
                    />

                    <View style={styles.btnLeft} />
                  </TouchableOpacity>
                ))}
              </View>

              {/*  Add a Small Footer at Bottom */}
              <View style={styles.footer} />
            </ScrollView>
          </View>
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
  placeholder: {
    height: 15,
    backgroundColor: '#f0f0f0',
    marginVertical: 15,
    borderRadius: 5,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 100,
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
