# `SheetGestureBlocker`

A view whose bounds are **excluded** from the sheet's drag gesture. Any drag that begins inside it leaves the sheet exactly where it is — useful for sliders, color pickers, maps, drawing canvases and other controls that need their own vertical drags.

```tsx
import {SheetGestureBlocker} from 'react-native-actions-sheet';

<SheetGestureBlocker style={{padding: 12}}>
  <MySlider />
</SheetGestureBlocker>;
```

> Only has an effect with the worklet gesture engine (the default). With [`legacyGestures`](/reference/actionsheet#legacygestures) it renders as a plain view.

## Props

| Prop       | Type                   | Description                        |
| ---------- | ---------------------- | ---------------------------------- |
| `children` | `React.ReactNode`      | The content to protect from drags. |
| `style`    | `StyleProp<ViewStyle>` | Style for the wrapper view.        |

## `useSheetGestureRegion`

The hook behind `SheetGestureBlocker`, for when you want to attach the blocking region to your own `Animated.View`:

```tsx
import Animated from 'react-native-reanimated';
import {useSheetGestureRegion} from 'react-native-actions-sheet';

function Canvas() {
  const {ref} = useSheetGestureRegion();
  return <Animated.View ref={ref}>{/* ... */}</Animated.View>;
}
```

Returns `{ enabled, ref }` — attach `ref` to an **Animated.View** (so it can be measured on the UI thread).

If the inner content has its **own** react-native-gesture-handler drag gesture, compose it with the sheet's pan (`simultaneousWithExternalGesture`) so both recognize.
