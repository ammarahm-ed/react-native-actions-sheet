<img src="https://raw.githubusercontent.com/ammarahm-ed/react-native-actions-sheet/master/assets/graphic.png"/>

<div
style="width:100%;margin-top:30px;">

<a href="https://github.com/ammarahm-ed/react-native-actions-sheet/pulls"
target="_blank">
<img  src="https://img.shields.io/badge/PRs-welcome-green?color=blue&style=flat-square"/>
</a><a href="https://www.npmjs.com/package/react-native-actions-sheet"
target="_blank">
<img src="https://img.shields.io/npm/v/react-native-actions-sheet?color=orange&style=flat-square"/>
</a><a href="https://www.npmjs.com/package/react-native-actions-sheet" target="_blank">
<img  src="https://img.shields.io/npm/dt/react-native-actions-sheet?color=darkgreen&style=flat-square"/>
</a>

</div>

## Installation

```bash
npm install react-native-actions-sheet
```

The library depends on `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler` and `react-native-safe-area-context`, so make sure these are installed too:

```bash
npm install react-native-reanimated react-native-worklets react-native-gesture-handler react-native-safe-area-context
```

> [!IMPORTANT]
> v11 requires React Native's **New Architecture**. If your app is still on the legacy architecture, stay on `react-native-actions-sheet@10`.

Check out the [installation](https://rnas.vercel.app/installation) section of our docs for the detailed installation instructions.

## Documentation

Check out our dedicated documentation page for info about this library, it's features, API reference and more: [https://rnas.vercel.app](https://rnas.vercel.app)

## What's new in v11

- Gestures, scroll handling and animations now run on the **UI thread**, so a busy JS thread no longer stutters the sheet.
- Flick to snap: the sheet carries to the next snap point (or dismisses) based on release velocity.
- Multiple scrollables in one sheet, and [`useSheetScrollable`](https://rnas.vercel.app/reference/usesheetscrollable) for custom Animated lists.
- [`SheetGestureBlocker`](https://rnas.vercel.app/reference/sheetgestureblocker) to keep the sheet still while interacting with sliders, maps, WebViews and other gesture-heavy views.
- [`useSheetPosition`](https://rnas.vercel.app/reference/usesheetposition) and `onChangeWorklet` to drive animations from the sheet's live position.
- The backdrop dims as you drag the sheet down (`dimBackdropOnDrag`).
- Accessibility improvements: modal semantics for screen readers, escape gesture support and an adjustable grabber.
- An official Jest mock, see [Testing](https://rnas.vercel.app/guides/testing).

## Migrating from v10

v11 requires the New Architecture and makes `react-native-worklets` a peer dependency. For most apps nothing else changes. Please read through the [migration guide](https://rnas.vercel.app/guides/migrate) and take the necessary steps.

## Examples

The source code for the example (showcase) app is under the example/ directory. If you want to play with the ActionSheet but don't feel like trying it on a real app, you can run the [example snack](https://snack.expo.dev/@ammarahmed/github.com-ammarahm-ed-react-native-actions-sheet:expo-example).

## Consider supporting with a ⭐️ [star on GitHub](https://github.com/ammarahm-ed/react-native-actions-sheet/)

If you are using the library in one of your projects, consider supporting with a star. It takes a lot of time and effort to keep this maintained and address issues and bugs. Thank you.

### MIT Licensed

#

<a href="https://notesnook.com" target="_blank">
<img style="align:center; " src="https://i.imgur.com/EMIqXNc.jpg" href="https://notesnook.com" alt="Notesnook Logo" width="50%" />
</a>
