const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const moduleRoot = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [moduleRoot,  path.join(__dirname, '../app'),],
  resolver: {
    extraNodeModules: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
      'react-native-actions-sheet': path.resolve(__dirname, '../'),
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
    blockList: exclusionList([
      new RegExp(`${moduleRoot}/node_modules/react/.*`),
      new RegExp(`${moduleRoot}/node_modules/react-native/.*`),
      new RegExp(`${moduleRoot}/node_modules/react-native-gesture-handler`),
      new RegExp(`${moduleRoot}/node_modules/@shopify/flash-list`),
      new RegExp(`${moduleRoot}/node_modules/react-native-safe-area-context`),
    ]),
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

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
