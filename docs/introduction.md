# Introduction

**react-native-actions-sheet** is a cross-platform (Android, iOS & Web) ActionSheet with a robust and flexible API and native performance for React Native. Create anything you want inside an ActionSheet.

The drag gesture and scroll ↔ drag arbitration run on the **UI thread** by default (powered by Reanimated worklets), so a busy JS thread never stutters the sheet and scroll handoff stays reliable.

## Features

- ⚡️ UI-thread gestures & animations — never blocked by JS
- 📜 Reliable scrolling with drop-in `ScrollView` & `FlatList`
- 🧲 Percentage snap points with velocity-projected flick-to-snap
- 🎛️ Simultaneous multi-scroll & gesture-blocking regions
- 🌐 Cross-platform (iOS, Android & Web) — works on tablets and iPads
- 🧭 Global `SheetManager` and in-sheet Router
- ⌨️ TextInput & keyboard handling
- 🖐️ Background interaction
- ♿️ Accessibility (modal semantics, adjustable grabber)
- 🪶 Raw ActionSheet — add anything you want inside

## Try it out

<Snack />

## Next steps

- [Installation](/installation) — add the library and its peer dependencies.
- [Basic usage](/usage) — render your first sheet.
- [Usage with SheetManager](/guides/sheetmanager) — the recommended, scalable pattern.
