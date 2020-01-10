# react-native-actions-sheet
A Cross Platform(Android &amp; iOS) ActionSheet with a flexible api, native performance and zero dependency code for react native. Create anything you want inside the ActionSheet.
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

## ActionSheet Props
|Name|Description|Default Value|
|--|--|--|
|children|Your custom component to render inside ActionSheet|`<View/>`
|customStyles|Any custom styles you want to add to the container|
|animated | Enable or disable animation of Modal|`true`
|animationType| Animation type for Modal|`fade`
|gestureEnabled| Enable gestures to control ActionSheet|`true`
|initialOffsetFromBottom|Use if you want to show the ActionSheet Partially on Opening. **Requires `gestureEnabled=true`**|`0.6`
|closeOnPressBack| Enable gestures to control ActionSheet|`true`
|elevation| Elevation of ActionSheet|`5`
|indicatorColor| Color of gestureEnabled indicator|`gray`
|overlayColor| Color of background Overlay. **Must be a rgba(r,g,b,a)** value|`rgba(0,0,0,0.3)`
|onClose| Function Called on Close
|onOpen| Function Called on Open

## ActionSheet Methods
ActionSheet can be made visible using its own method only.

    ActionSheet._setModalVisible()



#

### MIT Licensed
