import React, {useRef} from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ActionSheet, {
  registerSheet,
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';

const colors = ['#4a4e4d', '#0e9aa7', '#3da4ab', '#f6cd61', '#fe8a71'];
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

function ExampleSheet({sheetId}: SheetProps) {
  const actionSheetRef = useRef<ActionSheet>(null);
  return (
    <ActionSheet
      initialOffsetFromBottom={0.4}
      onBeforeShow={data => console.log(data)}
      id={sheetId}
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
                  SheetManager.hide(sheetId, null);
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
  );
}

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
});

export default ExampleSheet;

registerSheet('example-sheet', ExampleSheet);
