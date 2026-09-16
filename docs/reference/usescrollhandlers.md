# useScrollHandlers

::: warning
  **Deprecated.** This is the pre-v11 JS gesture integration, kept working only
  while [`legacyGestures`](/reference/actionsheet#legacygestures) is supported and
  removed in v11. With the default worklet gesture engine use the bundled
  [`ScrollView`/`FlatList`](/guides/scrolling), or
  [`useSheetScrollable`](/reference/usesheetscrollable) for a custom Animated
  scrollable.
:::

Create a custom scrollable view inside the action sheet. The scrollable view must implement `onScroll`, and `onLayout` props.

Parameters:

`options`

A unique id for the `ScrollView` or `FlatList`. This id has to be unique per action sheet component.

| Type                                           | Required |
| ---------------------------------------------- | -------- |
| [DraggableNodeOptions](./draggablenodeoptions) | false    |

```tsx
import {ScrollView} from 'react-native';
import ActionSheet, {useScrollHandlers} from 'react-native-actions-sheet';
import {NativeViewGestureHandler} from 'react-native-gesture-handler';

const ExampleSheet = () => {
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

::: tip
  Internally the hook simply provides information about the ScrollView layout &
  it's current position based on which the action sheet decides whether
  scrolling should be enabled or not.
:::
