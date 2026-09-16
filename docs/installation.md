# Installation

Install the ActionSheet with your favorite package manager:

::: code-group

```bash [npm]
npm install react-native-actions-sheet
```

```bash [yarn]
yarn add react-native-actions-sheet
```

```bash [pnpm]
pnpm add react-native-actions-sheet
```

```bash [bun]
bun add react-native-actions-sheet
```

:::

The library depends on `react-native-reanimated`, `react-native-gesture-handler` and `react-native-safe-area-context`, so make sure these are installed too.

::: code-group

```bash [npm]
npm install react-native-reanimated react-native-gesture-handler react-native-safe-area-context
```

```bash [yarn]
yarn add react-native-reanimated react-native-gesture-handler react-native-safe-area-context
```

```bash [pnpm]
pnpm add react-native-reanimated react-native-gesture-handler react-native-safe-area-context
```

```bash [bun]
bun add react-native-reanimated react-native-gesture-handler react-native-safe-area-context
```

:::

::: tip
Follow the Reanimated and Gesture Handler installation guides to add their Babel plugin and wrap your app in `GestureHandlerRootView`. Reanimated's worklets power the sheet's UI-thread gestures.
:::

You are all set to use the ActionSheet in your project! 🎉
