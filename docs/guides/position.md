# Position tracking

Sometimes you need to track the position of the action sheet on the Screen & show/hide some UI in the background or inside the action sheet.This can be done using the `onChange` prop.

```tsx
<ActionSheet
  onChange={(position) => {
    const hasReachedTop = position === 100;
    if (hasReachedTop) {
      // Do something
    }
  }}
/>
```

## Driving animations on the UI thread

`onChange` runs on the JS thread. To animate something **in sync** with the sheet without a JS-thread hop, use one of the following instead.

### `onChangeWorklet`

A worklet version of `onChange`, called on the UI thread on every integer percentage change. Ideal for backdrop blur, header collapse, or any companion animation. The function must be a worklet.

```tsx
const shared = useSharedValue(0);

<ActionSheet
  onChangeWorklet={(position) => {
    'worklet';
    shared.value = position;
  }}
/>;
```

### `useSheetPosition`

From **inside** the sheet's content, read the live position as shared values with [`useSheetPosition`](/reference/usesheetposition):

```tsx
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {useSheetPosition} from 'react-native-actions-sheet';

function Header() {
  const {progress} = useSheetPosition(); // 0 (closed) → 1 (fully open)
  const style = useAnimatedStyle(() => ({opacity: progress.value}));
  return <Animated.View style={style}>{/* ... */}</Animated.View>;
}
```
