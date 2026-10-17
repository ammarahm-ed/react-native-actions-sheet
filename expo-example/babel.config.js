module.exports = function (api) {
  api.cache(true);
  return {
    // Note: `babel-preset-expo` already injects `react-native-worklets/plugin`
    // (used by Reanimated 4) when it is installed, so it must not be listed here.
    presets: ['babel-preset-expo'],
  };
};
