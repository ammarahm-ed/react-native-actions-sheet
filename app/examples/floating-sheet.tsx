import React from 'react';
import {Text, View} from 'react-native';
import ActionSheet, { SheetProps } from 'react-native-actions-sheet';

function FloatingSheet(props: SheetProps<"floating-sheet">) {
  return (
    <ActionSheet
      disableElevation={true}
      gestureEnabled
      indicatorStyle={{
        display: 'none',
      }}
      containerStyle={{
        paddingHorizontal: 12,
        height: '40%',
        backgroundColor: 'transparent',
        paddingBottom: 30,
      }}
      {...props.overrideProps}
      >
      <View
        style={{
          borderRadius: 20,
          backgroundColor: 'white',
          alignItems: 'center',
          height: '100%',
        }}>
        <View
          style={{
            width: 120,
            height: 6,
            backgroundColor: '#f0f0f0',
            borderRadius: 10,
            marginTop: 5,
          }}
        />
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}>
          <Text
            style={{
              color: 'black',
              fontSize: 30,
            }}>
            Floating Sheet Example
          </Text>
        </View>
      </View>
    </ActionSheet>
  );
}

export default FloatingSheet;
