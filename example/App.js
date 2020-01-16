/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  View,
  TextInput
} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';

const App = () => {
  let actionSheet;

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
          gestureEnabled={true}
          defaultOverlayOpacity={0.3}
          
          children={
            <View
              style={{
                width: '100%',
                padding: 12,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom:15
                }}>
                {['#4a4e4d','#0e9aa7', '#3da4ab', '#f6cd61', '#fe8a71'].map(color => 
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
                    }}/>
                )}
              </View>

              <TextInput
              style={{
                width:'100%',
                height:50,
                borderRadius:5,
                borderWidth:1,
                borderColor:'#f0f0f0',
                marginBottom:15,
                paddingHorizontal:10
              }}
              placeholder="Write your text here"
             
              >

              </TextInput>

               <View
               style={{
                 
               }}
               >
              {[
                100,
                60,150,200,170,80,40
              ].map((item) => <TouchableOpacity
              onPress={() => {
                actionSheet.setModalVisible();
              }}
              style={{
                flexDirection:"row",
                justifyContent:"space-between",
                alignItems:'center'
              }}
              >
                <View
                style={{
                  width:item,
                  height:15,
                  backgroundColor:'#f0f0f0',
                  marginVertical:15,
                  borderRadius:5
                }}
                >

                </View>

                <View
                  style={{
                    width:30,
                    height:30,
                    backgroundColor:'#f0f0f0',
                    borderRadius:100
                  }}
                />
              </TouchableOpacity>)}   
              </View> 
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
};

export default App;
