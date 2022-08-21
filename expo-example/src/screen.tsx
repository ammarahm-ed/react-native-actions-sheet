/* eslint-disable curly */
import React from 'react';
import {SafeAreaView, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {SheetManager} from 'react-native-actions-sheet';

const ExampleScreen = () => {
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
            SheetManager.show('example-sheet', {
              payload: {data: 'hello world'},
            });
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
    marginHorizontal: 12,
  },
  btnTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
});
