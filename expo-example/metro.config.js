const {getDefaultConfig} = require('expo/metro-config');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');
const path = require('path');

const moduleRoot = path.resolve(__dirname, '..');
const projectRoot = __dirname;

/**
 * Metro configuration
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(projectRoot);

// The demo app lives outside this folder: the library (`..`) and the screens
// shared with the bare example (`../app`) both need to be watched.
config.watchFolders = [moduleRoot, path.join(moduleRoot, 'app')];

// `../app` is outside `projectRoot`, so Metro's default hierarchical lookup
// walks up to the library's own `node_modules` instead of this project's.
// Listing this project's `node_modules` here makes those lookups land on the
// SDK 57 copies (and lets packages that only expose subpath exports, e.g.
// `@legendapp/list/react-native`, resolve through their `exports` map).
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native-web': path.resolve(projectRoot, 'node_modules/react-native-web'),
  'react-native-actions-sheet': path.resolve(moduleRoot),
  'react-native-reanimated': path.resolve(
    projectRoot,
    'node_modules/react-native-reanimated',
  ),
  'react-native-worklets': path.resolve(
    projectRoot,
    'node_modules/react-native-worklets',
  ),
  '@legendapp/list': path.resolve(projectRoot, 'node_modules/@legendapp/list'),
  '@shopify/flash-list': path.resolve(
    projectRoot,
    'node_modules/@shopify/flash-list',
  ),
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // `@legendapp/list` v3 dropped its root entry point and now only exposes
  // subpath exports; the shared demo screens import the v2-style root specifier
  // because the bare RN example still runs v2. Point it at the v3 entry here.
  if (moduleName === '@legendapp/list') {
    return context.resolveRequest(context, '@legendapp/list/react-native', platform);
  }

  // react-native-web 0.21 removed `requireNativeComponent`, which
  // `react-native-linear-gradient` calls on import, so it cannot run on web.
  // Point the shared demo screens at Expo's web-compatible gradient instead.
  // Native still uses the packages each example installs for itself.
  if (platform === 'web' && moduleName === 'react-native-linear-gradient') {
    return {
      filePath: path.join(projectRoot, 'shims/react-native-linear-gradient.web.js'),
      type: 'sourceFile',
    };
  }

  // Resolve these from source so the example picks up the same copies of React
  // Native as the rest of the bundle.
  if (moduleName === 'react-native-safe-area-context') {
    return {
      filePath: path.join(
        projectRoot,
        'node_modules/react-native-safe-area-context/src/index.tsx',
      ),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'react-native-gesture-handler') {
    return {
      filePath: path.join(
        projectRoot,
        'node_modules/react-native-gesture-handler/src/index.ts',
      ),
      type: 'sourceFile',
    };
  }

  return (defaultResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform,
  );
};

// Never resolve the library's own (older) copies of React Native and the
// native modules it depends on — everything must come from this project.
// Expo's own defaults are kept, they exclude `.expo` build artifacts.
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList]),
  new RegExp(`${moduleRoot}/node_modules/react/.*`),
  new RegExp(`${moduleRoot}/node_modules/react-native/.*`),
  new RegExp(`${moduleRoot}/node_modules/react-native-gesture-handler`),
  new RegExp(`${moduleRoot}/node_modules/react-native-reanimated`),
  new RegExp(`${moduleRoot}/node_modules/react-native-worklets`),
  new RegExp(`${moduleRoot}/node_modules/@shopify/flash-list`),
];

module.exports = wrapWithReanimatedMetroConfig(config);
