# `useSheetPosition`

A hook that exposes the live position of the action sheet as Reanimated shared values. Use it inside the sheet's content to drive companion animations — parallax headers, collapsing titles, synced backgrounds — entirely on the UI thread.

```tsx
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {useSheetPosition} from 'react-native-actions-sheet';

function Header() {
  const {y, height, progress} = useSheetPosition();

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return <Animated.View style={style}>{/* ... */}</Animated.View>;
}
```

## Return value

| Property   | Type                  | Description                                              |
| ---------- | --------------------- | ------------------------------------------------------- |
| `y`        | `SharedValue<number>` | The raw `translateY` of the sheet.                      |
| `height`   | `SharedValue<number>` | The measured height of the sheet.                       |
| `progress` | `SharedValue<number>` | `0` when the sheet is closed → `1` when fully open.     |

> Must be called from a component rendered **inside** an `ActionSheet`. It throws if used outside a sheet.
