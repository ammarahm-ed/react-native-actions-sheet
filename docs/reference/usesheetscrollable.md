# `useSheetScrollable`

Wires a **custom** Animated scrollable into the worklet gesture engine so drag ↔ scroll arbitration runs on the UI thread. The shipped [`ScrollView`/`FlatList`](/guides/scrolling) already use this internally — reach for the hook only when you need to scroll a component that isn't one of those (an `Animated.SectionList`, a third-party Animated list, etc.).

Because every scrollable registers its own region and offset, several scrollables in the same sheet are arbitrated correctly **at the same time**.

```tsx
import Animated from 'react-native-reanimated';
import {useSheetScrollable} from 'react-native-actions-sheet';

function MyList() {
  const {ref, onScroll, scrollEventThrottle, simultaneousHandlers} =
    useSheetScrollable();

  return (
    <Animated.FlatList
      ref={ref}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      simultaneousHandlers={simultaneousHandlers}
      /* ...your props */
    />
  );
}
```

Spread the return value onto an **Animated** version of the scrollable (`Animated.FlatList`, `Animated.ScrollView`, or `Animated.createAnimatedComponent(...)`). A non-animated component will not receive the worklet scroll handler.

## Parameters

```ts
useSheetScrollable(options?, userOnScroll?)
```

| Parameter      | Type                                       | Description                                                                                                    |
| -------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `options`      | `{ hasRefreshControl?, refreshControlBoundary? }` | Set `hasRefreshControl: true` and (optionally) a `refreshControlBoundary` (0–1) when the list has a `RefreshControl`, so pull-to-refresh isn't captured as a sheet drag. |
| `userOnScroll` | `(event) => void`                          | Optional JS `onScroll` callback, forwarded from the UI thread via `runOnJS`.                                    |

## Return value

| Property              | Type                     | Description                                                     |
| --------------------- | ------------------------ | --------------------------------------------------------------- |
| `enabled`             | `boolean`                | `true` when the worklet engine is active.                       |
| `ref`                 | `AnimatedRef`            | Attach to the scrollable so it can be measured & pinned.        |
| `onScroll`            | Reanimated scroll handler | Runs on the UI thread. Spread onto the scrollable.             |
| `simultaneousHandlers`| `Ref[]`                  | Lets the scroll and the sheet pan gesture recognize together.   |
| `scrollEventThrottle` | `number`                 | `16`. Spread onto the scrollable.                               |

## See also

- [Scrolling guide](/guides/scrolling)
- [`SheetGestureBlocker`](/reference/sheetgestureblocker) — stop the sheet from dragging inside a region.
