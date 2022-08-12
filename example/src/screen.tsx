import React from 'react';
import {SafeAreaView, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {SheetManager} from 'react-native-actions-sheet';

const ExampleScreen = () => {
  return (
    <>
      <SafeAreaView style={styles.safeareview}>
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
    backgroundColor: 'transparent',
  },
  btnTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
});
