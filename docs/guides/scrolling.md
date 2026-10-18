# `Scrolling`

Using `ScrollView` or `FlatList` inside a action sheet can become tricky because you have to handle gestures along with scrolling at the same time. You can import `ScrollView` and `FlatList` from the library to have scrolling and gestures work nicely together.

```tsx
import ActionSheet, {ScrollView, FlatList} from 'react-native-actions-sheet';

const ExampleSheet = () => {
  return (
    <ActionSheet>
      <ScrollView />
    </ActionSheet>
  );
};
```

Both cooperate with the sheet's drag gesture out of the box — no extra wiring.

## The worklet gesture engine

By default the drag gesture and the scroll ↔ drag arbitration run entirely on the **UI thread** (see [`experimentalWorkletGestures`](/reference/actionsheet#experimentalworkletgestures)). This means a busy JS thread no longer stutters the sheet, and handing a scroll off to a drag (and back) is more reliable. The bundled `ScrollView`/`FlatList` are built on this engine.

You can put **multiple** scrollables in a single sheet — each is arbitrated independently and at the same time.

## Custom Animated scrollables

For a scrollable the library doesn't ship (an `Animated.SectionList`, a third-party Animated list, etc.), use the [`useSheetScrollable`](/reference/usesheetscrollable) hook and spread its return value onto an **Animated** component:

```tsx
import Animated from 'react-native-reanimated';
import ActionSheet, {useSheetScrollable} from 'react-native-actions-sheet';

const Sheet = () => {
  const {ref, onScroll, scrollEventThrottle, simultaneousHandlers} =
    useSheetScrollable();
  return (
    <ActionSheet>
      <Animated.FlatList
        ref={ref}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        simultaneousHandlers={simultaneousHandlers}
        /* ...your props */
      />
    </ActionSheet>
  );
};
```

## Blocking gestures in a region

If part of your content needs its own vertical drags (a slider, color picker, map, drawing canvas) and should **not** move the sheet, wrap it in [`SheetGestureBlocker`](/reference/sheetgestureblocker):

```tsx
import {SheetGestureBlocker} from 'react-native-actions-sheet';

<SheetGestureBlocker>
  <MySlider />
</SheetGestureBlocker>;
```

## Legacy: `useScrollHandlers`

> **Deprecated.** This is the pre-v11 JS gesture integration, kept working only while [`legacyGestures`](/reference/actionsheet#legacygestures) is supported. Prefer the bundled `ScrollView`/`FlatList` or [`useSheetScrollable`](/reference/usesheetscrollable) above.

If you have a scrollable component such as a WebView or a DatePicker and you are on the legacy gesture path, you can use the `useScrollHandlers` hook and `NativeViewGestureHandler` to enable scrolling inside the View.

```tsx
import {ScrollView} from 'react-native';
import ActionSheet, {useScrollHandlers} from 'react-native-actions-sheet';
import {NativeViewGestureHandler} from 'react-native-gesture-handler';

const Sheet = () => {
  const handlers = useScrollHandlers();
  return (
    <ActionSheet>
      <NativeViewGestureHandler
        simultaneousHandlers={handlers.simultaneousHandlers}>
        <ScrollView {...handlers}></ScrollView>
      </NativeViewGestureHandler>
    </ActionSheet>
  );
};
```
