<img src="https://imgur.com/V2fXDFk.png"/>

#

<div
align="center"
style="width:100%;">

<a href="https://github.com/ammarahm-ed/react-native-actions-sheet/pulls"
target="_blank">
<img  src="https://img.shields.io/badge/PRs-welcome-green?color=blue&style=flat-square"/>
</a><a href="https://www.npmjs.com/package/react-native-actions-sheet"
target="_blank">
<img src="https://img.shields.io/npm/v/react-native-actions-sheet?color=orange&style=flat-square"/>
</a><a href="https://www.npmjs.com/package/react-native-actions-sheet" target="_blank">
<img  src="https://img.shields.io/npm/dt/react-native-actions-sheet?color=darkgreen&style=flat-square"/>
</a>

</div>

<div align="center">
<h1>Quick Preview</h1>
</div>

<div align="center" >

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

</div>

<div align="center">
<h2>Installation Guide</h2>
</div>

<div align="center">
<pre>npm install react-native-actions-sheet --save</pre>
<p>OR</p>
<pre>yarn add react-native-actions-sheet</pre>
</div>

# How to use

Create your ActionSheet component and register it with a unique id. Remember that you do not need to render the ActionSheet in any components.
```jsx
import React from "react";
import ActionSheet, { SheetManager,SheetProps,registerSheet } from "react-native-actions-sheet";

function MySheet(props:SheetProps) {

return <ActionSheet id={props.sheetId}>
  <View>
    <Text>Hello World</Text>
  </View>
</ActionSheet>;
}

// Register your Sheet component.
registerSheet('mysheet', MySheet);

export default MySheet;
```
Create a `sheets.tsx` or `sheets.js` file.

```tsx
// Import all the sheets here as follows
import "mysheet.tsx"
export {};
```
In `App.js` import `sheets.tsx` and wrap your app in `SheetProvider`.
```tsx
import { SheetProvider } from "react-native-actions-sheet";
import "sheets.tsx"; // here

function App() {

  return <SheetProvider>
    {
      // your app components
    }
  </SheetProvider>;
}
```
Now you can open the ActionSheet from anywhere in the app.

```jsx
SheetManager.show("mysheet");
```

Want to pass some data on opening the sheet or update the state?

```jsx
SheetManager.show("mysheet",{value:"data"});

<ActionSheet
onBeforeShow={(data) => {
  setData(data);
}}
id="helloworld_sheet">
```
Hiding the sheet is easy. Enable gestures or do the following.
```jsx
await SheetManager.hide("mysheet");
```
Close all opened ActionSheets
```jsx
SheetManager.hideAll();
```

### Showing ActionSheet without `SheetProvider`
You can also show the sheet without SheetProvider.
```js
<ActionSheet id="mysheet">
  <View>
    <Text>Hello World</Text>
  </View>
</ActionSheet>;
```
And then show it;
```js
SheetManager.show("mysheet");
```


# Features

1.  Cross Platform (iOS and Android)
2.  Native Animations & Performance
3.  Identical Working on Android and iOS
4.  Control ActionSheet with **Gestures**
5.  **Raw ActionSheet** - You can Add Anything
6.  Allow ActionSheet to be partially shown when opened
7.  Support TextInputs
8.  Cool **bounce effect** on open.
9.  **Tablets and iPads**
10. **Horizontal Layout**
11. **Nested Scrolling or Scrollable Content.**
12. Virtualization Support
13. Global Sheet Manager
14. Proper resizing on Android & iOS on Keyboard show/hide.

## Consider supporting with a ⭐️ [star on GitHub](https://github.com/ammarahm-ed/react-native-mmkv-storage/)

If you are using the library in one of your projects, consider supporting with a star. It takes a lot of time and effort to keep this maintained and address issues and bugs. Thank you.

<div align="center">
<h1>Reference</h1>
</div>

## Props

#### `id`

A unique id for the ActionSheet. You must set this if you are using `SheetManager`.

| Type | Required |
|------|----------|
| id   | false    |

#

#### `ref`

Assigns a ref to ActionSheet component to use methods.

| Type | Required |
|------|----------|
| ref  | false    |

#

#### `testID`

Test ID for unit testing

| Type   | Required |
|--------|----------|
| string | no       |

#

#### `isModal`

Set this to false to use a simple View instead of a Modal to show the ActionSheet.

| Type    | Required |
|---------|----------|
| boolean | no       |

default:`true`
#

#### `initialOffsetFromBottom`

Use if you want to show the ActionSheet Partially on Opening. **Requires `gestureEnabled=true` **

| Type   | Required |
|--------|----------|
| number | no       |

Default: `1`

#

#### `extraScroll`

Normally when the ActionSheet is fully opened, a small portion from the bottom is hidden by default. Use this prop if you want the ActionSheet to hover over the bottom of screen and not hide a little behind it.

| Type   | Required |
|--------|----------|
| number | no       |

Default: `0`

#

#### `indicatorStyle`

Style the top indicator bar in ActionSheet.

| Type        | Required |
|-------------|----------|
| `ViewStyle` | no       |

#

#### `containerStyle`

Any custom styles for the container.

| Type   | Required |
|--------|----------|
| Object | no       |

#

#### `delayActionSheetDraw`

Delay draw of ActionSheet on open for android.

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `false`

#

#### `delayActionSheetDrawTime`

Delay draw of ActionSheet on open for android time.

| Type        | Required |
|-------------|----------|
| number (ms) | no       |

Default: `50`

#

#### `CustomHeaderComponent`

Your custom header component. Using this will hide the default indicator.

| Type             | Required |
|------------------|----------|
| React. ReactNode | no       |

#

#### `ExtraOverlayComponent`

Render a component over the ActionSheet. Useful for rendering Toast components with which user can interact.

| Type             | Required |
|------------------|----------|
| React. ReactNode | no       |

#

#### `headerAlwaysVisible`

Keep the header always visible even when gestures are disabled.

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `false`

#

#### `animated`

Animate the opening and closing of ActionSheet.

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `true`

#

#### `openAnimationSpeed`

Speed of opening animation. Higher means the ActionSheet will open more quickly. Use it in combination with `bounciness` prop to have optimize the bounce/spring effect on ActionSheet open.

| Type   | Required |
|--------|----------|
| number | no       |

Default: `12`

#

#### `closeAnimationDuration`

Duration of closing animation.

| Type   | Required |
|--------|----------|
| number | no       |

Default: `300`

#

#### `gestureEnabled`

Enables gesture control of ActionSheet

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `false`

#

#### `closeOnTouchBackdrop`

Control closing ActionSheet by touching on backdrop.

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `true`

#

#### `bounceOnOpen`

Bounces the ActionSheet on open.

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `false`

#

#### `bounciness`

How much you want the ActionSheet to bounce when it is opened.

| Type   | Required |
|--------|----------|
| number | no       |

Default: `8`

#

#### `springOffset`

When touch ends and user has not moved farther from the set springOffset, the ActionSheet will return to previous position.

| Type   | Required |
|--------|----------|
| number | no       |

Default: `50`

#

#### `elevation`

Add elevation to the ActionSheet container.

| Type   | Required |
|--------|----------|
| number | no       |

Default: `0`

#

#### `indicatorColor`

Color of the gestureEnabled Indicator.

| Type   | Required |
|--------|----------|
| string | no       |

Default: `"#f0f0f0"`

#

#### `overlayColor`

Color of the overlay/backdrop.

| Type   | Required |
|--------|----------|
| string | no       |

Default: `"black"`

#

#### `defaultOverlayOpacity`

Default opacity of the overlay/backdrop.

| Type         | Required |
|--------------|----------|
| number 0 - 1 | no       |

Default: `0.3`

#

#### `closable`

Prevent ActionSheet from closing on gesture or tapping on backdrop. Instead snap it to `bottomOffset` location

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `true`

#

#### `bottomOffset`

Snap ActionSheet to this location if `closable` is set to false. By default it will snap to the location on first open.

| Type   | Required |
|--------|----------|
| number | no       |

Default: `0`

#

#### `keyboardShouldPersistTaps`

Setting the keyboard persistence of the `ScrollView` component. Should be one of "never", "always" or "handled"

| Type   | Required |
|--------|----------|
| string | no       |

Default: `never`

#

#### `keyboardHandlerEnabled`

Allow to choose will content change position when keyboard is visible.
This is enabled by default.

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `true`

#

#### `keyboardDismissMode`

Set how keyboard should behave on tapping the ActionSheet.

| Type                                 | Required |
|--------------------------------------|----------|
| `"on-drag"` `"none"` `"interactive"` | no       |

Default : `"none"`

#

#### `statusBarTranslucent`

Determine whether the modal should go under the system statusbar.

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `true`

#

#### `closeOnPressBack`

Will the ActionSheet close on `hardwareBackPress` event.

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `true`

#

#### `drawUnderStatusBar`

Allow ActionSheet to draw under the StatusBar. This is enabled by default.

| Type    | Required |
|---------|----------|
| boolean | no       |

Default: `false`

#

#### `onPositionChanged(onReachedTop:boolean)`

Event called when position of ActionSheet changes.

| Type     | Required |
|----------|----------|
| function | no       |

#

#### `onClose`

Event called when the ActionSheet closes.

| Type     | Required |
|----------|----------|
| function | no       |

#

#### `onOpen`

An event called when the ActionSheet Opens.

| Type     | Required |
|----------|----------|
| function | no       |

## Methods

Methods require you to set a ref on ActionSheet Component.

#### `handleChildScrollEnd()`

If your component includes any child ScrollView/FlatList you must attach this method to all scroll end callbacks.

```jsx

<ScrollView
            ref={scrollViewRef}
            nestedScrollEnabled={true}
            onMomentumScrollEnd={() =>
              actionSheetRef.current?.handleChildScrollEnd()
            }
.....

```

#### `show()`

Opens the ActionSheet.

```jsx
import ActionSheet from "react-native-actions-sheet";
import React, { createRef } from "react";

const actionSheetRef = createRef();

// First create a ref on your <ActionSheet/> Component.
<ActionSheet ref={actionSheetRef} />;

// then later in your function to open the ActionSheet:

actionSheetRef.current?.show();
```

#### `hide()`

Closes the ActionSheet.

```jsx
import ActionSheet from "react-native-actions-sheet";
import React, { createRef } from "react";

const actionSheetRef = createRef();

// First create a ref on your <ActionSheet/> Component.
<ActionSheet ref={actionSheetRef} />;

// then later in your function to open the ActionSheet:

actionSheetRef.current?.hide();
```

#### `setModalVisible`

ActionSheet can be opened or closed using its ref.

```jsx
import ActionSheet from "react-native-actions-sheet";
import React, { createRef } from "react";

const actionSheetRef = createRef();

// First create a ref on your <ActionSheet/> Component.
<ActionSheet ref={actionSheetRef} />;

// then later in your function to open the ActionSheet:

actionSheetRef.current?.setModalVisible();
```

#### `setModalVisible(visible)`

It's also possible to explicitly either show or hide modal.

```jsx
import ActionSheet from "react-native-actions-sheet";
import React, { createRef } from "react";

const actionSheetRef = createRef();
// First create a ref on your <ActionSheet/> Component.
<ActionSheet ref={actionSheetRef} />;

// then to show modal use
actionSheetRef.current?.setModalVisible(true);

// and later you may want to hide it using
actionSheetRef.current?.setModalVisible(false);
```

#

#### `snapToOffset(offset:number)`

When the ActionSheet is open, you can progammatically snap it to different offsets.

```jsx
import ActionSheet from "react-native-actions-sheet";
import React, { createRef } from "react";

const actionSheetRef = createRef();
// First create a ref on your <ActionSheet/> Component.
<ActionSheet ref={actionSheetRef} />;

// snap to this location on screen
actionSheetRef.current?.snapToOffset(200);

actionSheetRef.current?.snapToOffset(150);

actionSheetRef.current?.snapToOffset(300);
```

#

## Nested scrolling on android

Nested scrolling on android is disabled by default. You can enable it as done below.

```jsx
import ActionSheet from "react-native-actions-sheet";

const App = () => {
  const actionSheetRef = useRef();

  return (
    <ActionSheet ref={actionSheetRef}>
      <ScrollView
        nestedScrollEnabled={true}
        onMomentumScrollEnd={() =>
          actionSheetRef.current?.handleChildScrollEnd()
        }
      />
    </ActionSheet>
  );
};
```

#

## Find this library useful? ❤️

[Support it by donating](https://ko-fi.com/ammarahmed) or joining stargazers for this repository. ⭐️ and follow me for my next creations!

### MIT Licensed

#

<a href="https://notesnook.com" target="_blank">
<img style="align:center; " src="https://i.imgur.com/EMIqXNc.jpg" href="https://notesnook.com" alt="Notesnook Logo" width="50%" />
</a>
