# New APIs & behavior

Reference for the props, hooks and components added alongside the worklet gesture
engine. All existing APIs continue to work unchanged.

## Gesture engine

The drag gesture and scroll↔drag arbitration now run on the UI thread by default,
so a busy JS thread no longer stutters the sheet.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `experimentalWorkletGestures` | `boolean` | `true` | The worklet engine. Set `false` to use the legacy JS engine. |
| `legacyGestures` | `boolean` | `false` | Escape hatch — forces the pre-v11 PanResponder/JS engine. |

Scrollable content inside the sheet must use this package's `ScrollView` /
`FlatList` (or `useSheetScrollable`) for the arbitration to work.

## Snapping & feel

- **Velocity-projected snapping** — a flick now carries to the next detent (or
  dismisses) based on release velocity, not just drag distance. No API; automatic.
- **`dimBackdropOnDrag?: boolean`** (default `true`) — the backdrop fades out as
  the sheet is dragged below its lowest snap toward dismissal; fully opaque at
  every snap point. Set `false` for a constant backdrop.

## `onChangeWorklet`

A worklet version of `onChange`, called on the UI thread on every integer
percentage change — for driving companion animations with zero JS hop.

```tsx
<ActionSheet
  onChangeWorklet={(percent) => {
    'worklet';
    myShared.value = percent;
  }}
/>
```

## `useSheetPosition()`

Live animated position of the sheet as shared values, for parallax headers,
collapsing titles, synced backgrounds, etc. Use inside sheet content.

```tsx
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {useSheetPosition} from 'react-native-actions-sheet';

function Header() {
  const {y, height, progress} = useSheetPosition(); // all SharedValue<number>
  const style = useAnimatedStyle(() => ({opacity: progress.value}));
  return <Animated.View style={style}>{/* ... */}</Animated.View>;
}
```

`y` = raw translateY, `height` = measured sheet height, `progress` = 0 (closed) → 1 (fully open).

## Scrollables

The shipped `ScrollView` / `FlatList` cooperate with the drag gesture out of the
box. For a custom Animated scrollable, use `useSheetScrollable`:

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
      /* ... */
    />
  );
}
```

Multiple scrollables in one sheet are arbitrated independently at the same time.

## Gesture-blocking regions

Stop the sheet from dragging when the user interacts inside a specific view
(sliders, color pickers, maps, drawing canvases). Any drag beginning inside the
region leaves the sheet where it is.

```tsx
import {SheetGestureBlocker} from 'react-native-actions-sheet';

<SheetGestureBlocker style={{padding: 12}}>
  <MySlider />
</SheetGestureBlocker>;
```

Or the hook, to attach to any `Animated.View`:

```tsx
import Animated from 'react-native-reanimated';
import {useSheetGestureRegion} from 'react-native-actions-sheet';

const {ref} = useSheetGestureRegion();
<Animated.View ref={ref}>{/* ... */}</Animated.View>;
```

If the inner content has its *own* RNGH drag gesture, compose it with the sheet's
pan (`simultaneousWithExternalGesture`) so both recognize.

## Accessibility

- The sheet is treated as modal for screen readers and dismisses on the
  VoiceOver/TalkBack escape gesture.
- The backdrop is an accessible "Close" button when tapping it closes the sheet.
- With multiple snap points the grabber is an **adjustable** element — swipe up/
  down with a screen reader to change the sheet's position.

```tsx
<ActionSheet
  accessibilityLabels={{backdrop: 'Close', grabber: 'Sheet position'}}
/>
```

## `drawUnderStatusBar`

Unchanged prop; redesigned behavior. As the sheet reaches full screen the top
corners flatten to square and the surface fills flush behind the status bar,
reversing smoothly on the way down.
