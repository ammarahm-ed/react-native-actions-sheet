# Testing

The sheet renders through a native `Modal` and animates with Reanimated worklets, so it cannot run in a Jest environment as-is. The package ships a mock that covers what tests assert on:

```js
jest.mock('react-native-actions-sheet', () =>
  require('react-native-actions-sheet/jest/mock'),
);
```

## Rendering a sheet

`<ActionSheet>` renders nothing until it is shown — exactly like the real component — so show it through a ref (or `SheetManager`) before asserting on its content:

```tsx
import {createRef} from 'react';
import {render, act} from '@testing-library/react-native';
import ActionSheet, {ActionSheetRef} from 'react-native-actions-sheet';

it('renders the sheet body once shown', () => {
  const ref = createRef<ActionSheetRef>();
  const screen = render(
    <ActionSheet ref={ref}>
      <Text>Sheet body</Text>
    </ActionSheet>,
  );

  expect(screen.queryByText('Sheet body')).toBeNull();

  act(() => ref.current?.show());

  expect(screen.getByText('Sheet body')).toBeTruthy();
});
```

Every method of the ref API (`show`, `hide`, `snapToIndex`, `isOpen`, …) is a `jest.fn()`, so you can assert on the calls:

```ts
expect(ref.current?.show).toHaveBeenCalledWith(1);
```

## SheetManager

`SheetManager.show` and `SheetManager.hide` return promises that resolve, so awaiting them keeps working in tests:

```ts
await SheetManager.show('my-sheet');
await SheetManager.hide('my-sheet');
```

## `resetMocks`

The mock keeps its behaviour under `resetMocks: true` (or `jest.resetAllMocks()`): `SheetManager.show`/`hide` still return promises, and the ref API still works. Call assertions keep working too.

```js
// jest.config.js
module.exports = {resetMocks: true};
```

## What the mock provides

| Provided | Not provided |
| --- | --- |
| `ActionSheet` rendering its `children` while shown, with a spy ref API | layout, measurement, `onLayout` |
| `SheetManager.show` / `hide` promises | sheet animations, gestures, snap points |
| `ScrollView` / `FlatList`, re-exported from React Native | `useSheetPosition` values that actually change |
| Inert stand-ins for the hooks, so components using them render | native `Modal` behaviour |

For behaviour the mock cannot cover — dragging, snapping, scroll handoff, keyboard handling — run the example app on a [simulator or device](https://github.com/ammarahm-ed/react-native-actions-sheet/tree/master/example).
