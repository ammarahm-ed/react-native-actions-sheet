import React from 'react';
import {Text} from 'react-native';
import ActionSheet, { SheetManager, useProviderContext } from 'react-native-actions-sheet';

function Hello() {
  return (
    <ActionSheet
      containerStyle={{
        height: '40%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        onPress={() => {
          SheetManager.show("hello_two");
        }}
        style={{
          color: 'black',
          fontSize: 30,
        }}>
        Hello!
      </Text>
    </ActionSheet>
  );
}

export function Hello_Two() {
  const context = useProviderContext();

  console.log(context);
  return (
    <ActionSheet
      containerStyle={{
        height: '40%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        onPress={() => {
          SheetManager.hide("hello_two");
          // setTimeout(() => {
          //   SheetManager.hide("hello");
          // }, 2000);
        }}
        style={{
          color: 'black',
          fontSize: 30,
        }}>
        Hello World!
      </Text>
    </ActionSheet>
  );
}

export default Hello;
