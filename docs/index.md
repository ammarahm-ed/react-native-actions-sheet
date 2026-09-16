---
layout: home

hero:
  name: React Native ActionSheet
  text: Bottom sheets that feel native.
  tagline: A cross-platform (Android, iOS & Web) ActionSheet with a robust, flexible API and UI-thread gestures — so a busy JS thread never stutters your sheet.
  actions:
    - theme: brand
      text: Go to Docs
      link: /installation
    - theme: alt
      text: Introduction
      link: /introduction
    - theme: alt
      text: GitHub
      link: https://github.com/ammarahm-ed/react-native-actions-sheet

features:
  - icon: ⚡️
    title: UI-thread gestures & animations
    details: Drag and scroll↔drag arbitration run entirely on the UI thread with Reanimated worklets. A blocked JS thread no longer freezes the sheet.
  - icon: 📜
    title: Reliable scrolling
    details: Drop-in ScrollView & FlatList cooperate with the drag gesture out of the box — with simultaneous multi-scroll and pull-to-refresh handoff.
  - icon: 🧲
    title: Snap points & velocity flicks
    details: Percentage-based snap points with velocity-projected snapping, so a quick flick carries to the next detent or dismisses.
  - icon: 🎛️
    title: Gesture-blocking regions
    details: Wrap sliders, maps or canvases in SheetGestureBlocker so their drags never move the sheet.
  - icon: 🌐
    title: Truly cross-platform
    details: One API for Android, iOS and Web. Works great on tablets and iPads.
  - icon: 🧭
    title: Global SheetManager & Router
    details: Show any sheet from anywhere, await its result, pass data, and navigate between routes inside a single sheet.
  - icon: ♿️
    title: Accessible by default
    details: Modal semantics for screen readers, an adjustable grabber, and an accessible backdrop button.
  - icon: 🪶
    title: Raw & flexible
    details: It's just a sheet — render anything inside it. Keyboard & TextInput handling, safe-area padding and background interaction included.
---
