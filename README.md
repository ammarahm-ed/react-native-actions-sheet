<div align="center">
<h1>  react-native-actions-sheet</h1>
</div>
<div
align="center"
style="width:100%;"
>
<a
href="https://github.com/ammarahm-ed/react-native-actions-sheet/pulls"
target="_blank"
>
<img  src="https://img.shields.io/badge/PRs-welcome-green"/>
</a>
<a
href="https://www.npmjs.com/package/react-native-actions-sheet"
target="_blank"
>
<img src="https://img.shields.io/npm/v/react-native-actions-sheet?color=green"/>
</a>
<a
href="https://www.npmjs.com/package/react-native-actions-sheet"
target="_blank"
>
<img  src="https://img.shields.io/npm/dt/react-native-actions-sheet?color=green"/>
</a> 
</div>
<p align="center">
A highly customizable cross platform ActionSheet for react native. 
</p>
<p align="center">
<img src="https://raw.githubusercontent.com/ammarahm-ed/react-native-actions-sheet/master/gifs/preview3.png"/>
</p>

<div align="center">
<h2>Screenshots</h2>
</div>

<p
align="center"
>
<img
width='33%'
height:600
src="https://imgur.com/XdsHb6M.gif"
/>
<img
width='30%'
height:500
src="https://imgur.com/g6LLkl4.gif"
/>
</p>
<div align="center">
<h2>Features</h2>
</div>

1. Cross Platform (iOS and Android)
2. Native Animations & Performance
3. Identical Working on Android and iOS
4. Control ActionSheet with **Gestures**
5. **Raw ActionSheet** - You can Add Anything
6. Allow ActionSheet to be partially shown when opened 
7. Support TextInputs
8. Cool **bounce effect** on open.
9. Support for **Tablets and iPads**
10. Support **Horizontal Layout**
11. Support for **Nested Scrolling or Scrollable Content.**
 
<div align="center">
<h2>Run Example</h2>
</div>
To run the example app clone the project

    git clone https://github.com/ammarahm-ed/react-native-actions-sheet.git

      

   then run ` yarn or npm install` in the example folder and finally to run the example app:
       
   
    react-native run-android

<div align="center">
<h2>Installation Guide</h2>
</div>

    npm install react-native-actions-sheet --save
or if you use yarn:

    yarn add react-native-actions-sheet

<div align="center">
<h2>Usage Example</h2>
</div>
For complete usage, see the example project.

```jsx
import ActionSheet from 'react-native-actions-sheet';

const App = () => {
  let actionSheet;

  return (
    <View
      style={{
        justifyContent: 'center',
        flex: 1,
      }}>
      <TouchableOpacity
        onPress={() => {
          actionSheet.setModalVisible();
        }}>
        <Text>Open ActionSheet</Text>
      </TouchableOpacity>

      <ActionSheet ref={ref => (actionSheet = ref)}>
        <View>
          <Text>YOUR CUSTOM COMPONENT INSIDE THE ACTIONSHEET</Text>
        </View>
      </ActionSheet>
    </View>
  );
};

export default App;


```
<div align="center">
<h1>Reference</h1>
</div>

## Props

#### `ref`
Assigns a ref to ActionSheet component to use methods. 

| Type | Required |
| ---- | -------- |
| ref | Yes |

#


#### `initialOffsetFromBottom`

Use if you want to show the ActionSheet Partially on Opening. **Requires `gestureEnabled=true`**

| Type | Required |
| ---- | -------- |
| boolean | no |

Default:`1`

#
#### `extraScroll`

Normally when the ActionSheet is fully opened, a small portion from the bottom is hidden by default. Use this prop if you want the ActionSheet to hover over the bottom of screen and not hide a little behind it.

| Type | Required |
| ---- | -------- |
| number | no |

Default:`0`


#
#### `containerStyle`

Any custom styles for the container. 

| Type | Required |
| ---- | -------- |
| Object | no |



#
#### `CustomHeaderComponent`

Your custom header component. Using this will hide the default indicator.

| Type | Required |
| ---- | -------- |
| React.Component | no |


#
#### `headerAlwaysVisible`

Keep the header always visible even when gestures are disabled.

| Type | Required |
| ---- | -------- |
| boolean | no |

Default: `false`

#
#### `CustomFooterComponent`

A footer component if you want to add some info at the bottom. 

| Type | Required |
| ---- | -------- |
| React.Component | no |

**Note:** Remember to give footer a fixed height and provide ActionSheet the `footerHeight` prop with same value. If you have added margins etc, add those values to `footerHeight` also.

#
#### `footerHeight`

Height of the footer

| Type | Required |
| ---- | -------- |
| number | no |
Default: `80`

#
#### `footerStyle`

Custom Styles for the footer container.

| Type | Required |
| ---- | -------- |
| Object | no |


#### `footerAlwaysVisible`

Keep footer visible. Currently when you overdraw, the footer appears, however you can change this by setting this to `true`.

| Type | Required |
| ---- | -------- |
| boolean | no |

Default: `false`

#
#### `animated`

Keep footer visible. Currently when you overdraw, the footer appears, however you can change this by setting this to `true`.

| Type | Required |
| ---- | -------- |
| boolean | no |

Default: `true`

#
#### `openAnimationSpeed`

Speed of opening animation. Higher means the ActionSheet will open more quickly.

| Type | Required |
| ---- | -------- |
| number | no |

Default: `12`


#
#### `closeAnimationDuration`

Duration of closing animation.

| Type | Required |
| ---- | -------- |
| number | no |

Default: `300`
#
#### `gestureEnabled`

Enables gesture control of ActionSheet

| Type | Required |
| ---- | -------- |
| boolean | no |

Default: `false`


#
#### `closeOnTouchBackdrop`

Control closing ActionSheet by touching on backdrop.

| Type | Required |
| ---- | -------- |
| boolean | no |

Default: `true`


#
#### `bounceOnOpen`

Bounces the ActionSheet on open.

| Type | Required |
| ---- | -------- |
| boolean | no |

Default: `false`


#
#### `bounciness`

How much you want the ActionSheet to bounce when it is opened. 

| Type | Required |
| ---- | -------- |
| number | no |

Default: `8`

#

#### `springOffset`

When touch ends and user has not moved farther from the set springOffset, the ActionSheet will return to previous position.

| Type | Required |
| ---- | -------- |
| number | no |

Default: `50`

#
#### `elevation`

Add elevation to the ActionSheet container. 

| Type | Required |
| ---- | -------- |
| number | no |

Default: `0`

#
#### `indicatorColor`

Color of the gestureEnabled Indicator.

| Type | Required |
| ---- | -------- |
| string | no |

Default: `"#f0f0f0"`

#
#### `overlayColor`

Color of the overlay/backdrop.

| Type | Required |
| ---- | -------- |
| string | no |

Default: `"black"`

#
#### `defaultOverlayOpacity`

Default opacity of the overlay/backdrop.

| Type | Required |
| ---- | -------- |
| number 0 - 1 | no |

Default: `0.3`




#
#### `closeOnPressBack`

Will the ActionSheet close on `hardwareBackPress` event.

| Type | Required |
| ---- | -------- |
| boolean | no |

Default: `true`


#
#### `onClose`

Event called when the ActionSheet closes.

| Type | Required |
| ---- | -------- |
| function | no |


#
#### `onOpen`

An event called when the ActionSheet Opens.

| Type | Required |
| ---- | -------- |
| function | no |



## Methods
Methods require you to set a ref on ActionSheet Component.

#### `setModalVisible`
ActionSheet can be opened or closed using its ref.
```jsx
// First create a ref on your <ActionSheet/> Component.

<ActionSheet
ref={ref => this.actionSheet = ref}
/>

// then later in your function to open the ActionSheet:

this.actionSheet.setModalVisible();
```

#### `setModalVisible(visible)`
It's also possible to explicitly either show or hide modal.

```jsx
// First create a ref on your <ActionSheet/> Component.

<ActionSheet
ref={ref => this.actionSheet = ref}
/>

// then to show modal use
this.actionSheet.setModalVisible(true);

// and later you may want to hide it using
this.actionSheet.setModalVisible(false);
```


#

## Event Listeners
Listen to changes in ActionSheet State. 

#### `addHasReachedTopListener`
Attach a listener to know when ActionSheet is fully opened and has reached top. Use this if you want to use a ScrollView inside the ActionSheet. Check the example for demonstration on how to use nested ScrollViews inside ActionSheet.

```jsx
import ActionSheet, {addHasReachedTopListener, removeHasReachedTopListener} from 'react-native-actions-sheet


// In your Component

  const _onHasReachedTop = () => {
    // handle the event
  }

  useEffect(() => {
    addHasReachedTopListener(_onHasReachedTop)
    return () => {
        removeHasReachedTopListener(_onHasReachedTop)
    }
  },[])


```

#

## Find this library useful? ❤️
Support it by joining stargazers for this repository. ⭐️ and follow me for my next creations!

### MIT Licensed

