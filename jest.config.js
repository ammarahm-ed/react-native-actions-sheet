const path = require('path');

/**
 * Test config for the library's own smoke/regression tests.
 *
 * These run against `dist/` (the code that actually ships) and are deliberately
 * small: they cover the Jest mock's contract and the SheetManager registry, not
 * the whole component tree. Run with `npm test`.
 */
module.exports = {
  rootDir: __dirname,
  preset: 'react-native',
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  // The presets ship untranspiled TS/ESM; the RN preset only covers react-native
  // itself, so the gesture-handler / reanimated / safe-area packages need this.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-gesture-handler|react-native-reanimated|react-native-worklets|react-native-safe-area-context)/)',
  ],
  transform: {
    '^.+\\.jsx?$': [
      'babel-jest',
      {configFile: path.join(__dirname, 'babel.test.config.js')},
    ],
  },
};
