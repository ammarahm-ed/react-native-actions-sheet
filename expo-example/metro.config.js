const {getDefaultConfig} = require('expo/metro-config');
const {mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const moduleRoot = path.resolve(__dirname, '..');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [moduleRoot, path.join(__dirname, '../app')],
  resolver: {
    extraNodeModules: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
      'react-native-web': path.resolve(
        __dirname,
        'node_modules/react-native-web',
      ),
      'react-native-actions-sheet': path.resolve(__dirname, '../'),
       'react-native-reanimated': path.resolve(__dirname, 'node_modules/react-native-reanimated'),
       '@legendapp/list': path.resolve(__dirname, 'node_modules/@legendapp/list')
    },
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react-native-safe-area-context') {
        return {
          filePath: path.resolve(
            path.join(
              __dirname,
              'node_modules/react-native-safe-area-context/src/index.tsx',
            ),
          ),
          type: 'sourceFile',
        };
      }

      if (moduleName === 'react-native-gesture-handler') {
        return {
          filePath: path.resolve(
            path.join(
              __dirname,
              'node_modules/react-native-gesture-handler/src/index.ts',
            ),
          ),
          type: 'sourceFile',
        };
      }

      return context.resolveRequest(context, moduleName, platform);
    },
    blockList: [
      new RegExp(`${moduleRoot}/node_modules/react/.*`),
      new RegExp(`${moduleRoot}/node_modules/react-native/.*`),
      new RegExp(`${moduleRoot}/node_modules/react-native-gesture-handler`),
      new RegExp(`${moduleRoot}/node_modules/react-native-reanimated`),
    ],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = wrapWithReanimatedMetroConfig(mergeConfig(getDefaultConfig(__dirname), config));
