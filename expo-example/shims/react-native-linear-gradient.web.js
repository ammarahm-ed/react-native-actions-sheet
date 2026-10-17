/**
 * Web shim for `react-native-linear-gradient`.
 *
 * `react-native-linear-gradient` has no web build: its `index.js` picks the
 * `index.windows.js` implementation on web, which calls
 * `requireNativeComponent` — removed from `react-native-web` in 0.21 — so it
 * throws as soon as it is imported.
 *
 * `expo-linear-gradient` covers the same API and ships a real web
 * implementation, but only exports `LinearGradient` as a *named* export, while
 * the shared demo screens use a default import. This re-exports it as the
 * default so both platforms can keep the same call site.
 */
export {LinearGradient as default, LinearGradient} from 'expo-linear-gradient';
