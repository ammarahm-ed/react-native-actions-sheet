
# react-native-actions-sheet

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green?style=flat-square)](https://github.com/ammarahm-ed/react-native-actions-sheet/pulls)
[![react-native-actions-sheet](https://img.shields.io/npm/v/react-native-actions-sheet?color=green)](https://www.npmjs.com/package/react-native-actions-sheet)
[![react-native-actions-sheet](https://img.shields.io/npm/dt/react-native-actions-sheet?color=green)](https://www.npmjs.com/package/react-native-actions-sheet)

A Cross Platform(Android &amp; iOS) ActionSheet with a flexible api, native performance and zero dependency code for react native. Create anything you want inside the ActionSheet.

<img
width='45%'
height:600
src=https://github.com/ammarahm-ed/react-native-actions-sheet/blob/master/gifs/2020_01_12_14_16_30_trim.gif
/>
<img
width='40%'
height:500
src=https://github.com/ammarahm-ed/react-native-actions-sheet/blob/master/gifs/screen-recording-1.gif
/>

**Features:**

 - Native Animations & Performance
 - Cross Platform (iOS and Android)
 - Identical Working on Android and iOS
 - Zero Dependency Code
 - Gesture Control
 - Raw ActionSheet - You can Add Anything
 - Allow ActionSheet to be partially shown when opened
 - Support TextInputs
 - Cool bounce effect on open.

## Run the Example
To run the example app clone the project

    git clone https://github.com/ammarahm-ed/react-native-actions-sheet.git

      

   then run ` yarn or npm install` in the example folder and finally to run the example app:
       
   
    react-native run-android

## Installation

    npm install react-native-actions-sheet --save
or if you use yarn:

    yarn add react-native-actions-sheet

## Usage
For complete usage, see the example project.

```jsx
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
          
          // YOUR CUSTOM COMPONENT INSIDE THE ACTIONSHEET
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
```

## ActionSheet Props
|Name|Type|Description|Default Value|
|--|--|--|--|
|children|React.Component|Your custom component to render inside ActionSheet|`<View/>`
|customStyles|object|Any custom styles you want to add to the container|
|animated |boolean| Enable or disable animation of Modal|`true`
|openAnimationDuration |number| Duration of opening animation|`200`
|closeAnimationDuration |number| Duration of closing animation|`300`
|gestureEnabled|boolean| Enable gestures to control ActionSheet|`false`
|bounceOnOpen|boolean| Bounce the actionSheet on open|`false`
|bounciness|number| How much you want the view to bounce from the actual position on drag end.|`8`
|springOffset|number| When touch ends and user has not moved farther from the set springOffset, the ActionSheet will return to previous position. |`50`
|initialOffsetFromBottom|number|Use if you want to show the ActionSheet Partially on Opening. **Requires `gestureEnabled=true`**|`1`
|closeOnPressBack|boolean| BackHandler Controls the ActionSheet|`true`
|elevation|number| Elevation of ActionSheet|`0`
|indicatorColor|string| Color of gestureEnabled indicator|`gray`
|overlayColor|rgba string| Color of background Overlay.
|defaultOverlayOpacity| number 0 - 1| Opacity of background Overlay| `0.3`
|onClose|function| Function Called on Close
|onOpen|function| Function Called on Open

## ActionSheet Methods
ActionSheet can be opened or closed using its ref.
```jsx
// First create a ref on your <ActionSheet/> Component.

<ActionSheet
ref={ref => this.actionSheet = ref}
/>

// then later in your function to open the ActionSheet:

this.actionSheet.setModalVisible();



```
#

### MIT Licensed
