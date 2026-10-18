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

::: warning v11 requires the New Architecture
The sheet's gestures and animations run as worklets through Reanimated 4, which requires React Native's New Architecture (Fabric). If your app is still on the legacy architecture, stay on `react-native-actions-sheet@10`.
:::

The library depends on `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler` and `react-native-safe-area-context`, so make sure these are installed too.

::: code-group

```bash [npm]
npm install react-native-reanimated react-native-worklets react-native-gesture-handler react-native-safe-area-context
```

```bash [yarn]
yarn add react-native-reanimated react-native-worklets react-native-gesture-handler react-native-safe-area-context
```

```bash [pnpm]
pnpm add react-native-reanimated react-native-worklets react-native-gesture-handler react-native-safe-area-context
```

```bash [bun]
bun add react-native-reanimated react-native-worklets react-native-gesture-handler react-native-safe-area-context
```

:::

`react-native-worklets` is a peer dependency, not a dependency: the library uses whichever version your app (or your Expo SDK) provides, so it can never pin a worklets version that mismatches the native one.

::: tip
Follow the Reanimated, Worklets and Gesture Handler installation guides to add their Babel plugin and wrap your app in `GestureHandlerRootView`. Reanimated's worklets power the sheet's UI-thread gestures.
:::

You are all set to use the ActionSheet in your project! 🎉
