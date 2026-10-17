import {defineConfig} from 'vitepress';

const GITHUB = 'https://github.com/ammarahm-ed/react-native-actions-sheet';

export default defineConfig({
  title: 'React Native ActionSheet',
  description:
    'A cross-platform (Android, iOS & Web) ActionSheet with a robust and flexible API, native performance and UI-thread gestures for React Native.',
  lang: 'en-US',
  outDir: '../docs-dist',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {hostname: 'https://rnas.vercel.app'},

  head: [
    ['link', {rel: 'icon', type: 'image/x-icon', href: '/favicon/favicon.ico'}],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon/favicon-32x32.png',
      },
    ],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/favicon/apple-touch-icon.png',
      },
    ],
    ['link', {rel: 'manifest', href: '/favicon/site.webmanifest'}],
    ['meta', {name: 'theme-color', content: '#EC2B2B'}],
    ['meta', {name: 'author', content: 'Ammar Ahmed'}],
    [
      'meta',
      {
        name: 'keywords',
        content:
          'react native, actionsheet, bottom sheet, action sheet, react native bottom sheet, modal, drawer, ios, android, gesture, animation, reanimated, worklet',
      },
    ],
    ['meta', {property: 'og:type', content: 'website'}],
    ['meta', {property: 'og:url', content: 'https://rnas.vercel.app/'}],
    ['meta', {property: 'og:title', content: 'React Native ActionSheet'}],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'A cross-platform ActionSheet with a robust and flexible API and native UI-thread performance for React Native.',
      },
    ],
    [
      'meta',
      {property: 'og:image', content: 'https://rnas.vercel.app/og-image.png'},
    ],
    ['meta', {name: 'twitter:card', content: 'summary_large_image'}],
    ['meta', {name: 'twitter:creator', content: '@ammarahm_ed'}],
    [
      'meta',
      {
        name: 'twitter:image',
        content: 'https://rnas.vercel.app/og-image.png',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'ActionSheet',

    nav: [
      {text: 'Guide', link: '/installation', activeMatch: '^/(installation|usage|guides)'},
      {
        text: 'Reference',
        link: '/reference/actionsheet',
        activeMatch: '^/reference/',
      },
      {
        text: 'Playground',
        link: 'https://snack.expo.dev/@ammarahmed/github.com-ammarahm-ed-react-native-actions-sheet:expo-example@develop',
      },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          {text: 'Introduction', link: '/introduction'},
          {text: 'Installation', link: '/installation'},
          {text: 'Basic usage', link: '/usage'},
        ],
      },
      {
        text: 'Guides',
        collapsed: false,
        items: [
          {text: 'Usage with SheetManager', link: '/guides/sheetmanager'},
          {text: 'Passing data to ActionSheet', link: '/guides/passingdata'},
          {text: 'Using ActionSheet Router', link: '/guides/sheetrouter'},
          {text: 'Awaiting result from ActionSheet', link: '/guides/getdata'},
          {text: 'Ref access from anywhere', link: '/guides/refaccess'},
          {text: 'Scrolling', link: '/guides/scrolling'},
          {text: 'FlashList', link: '/guides/flashlist'},
          {text: 'LegendList', link: '/guides/legendlist'},
          {text: 'Background Interaction', link: '/guides/background'},
          {text: 'Position tracking', link: '/guides/position'},
          {text: 'Handling SafeArea', link: '/guides/safearea'},
          {text: 'Navigation bar colors', link: '/guides/navigationbar'},
          {text: 'Testing', link: '/guides/testing'},
          {text: 'Migrating Guide', link: '/guides/migrate'},
        ],
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          {text: 'ActionSheet props', link: '/reference/actionsheet'},
          {text: 'ActionSheetRef', link: '/reference/actionsheetref'},
          {text: 'SheetManager', link: '/reference/sheetmanager'},
          {text: 'SheetProps', link: '/reference/sheetprops'},
          {text: 'SheetProvider', link: '/reference/sheetprovider'},
          {text: 'SheetRegister', link: '/reference/sheetregister'},
          {text: 'registerSheet', link: '/reference/registersheet'},
          {text: 'ShowOptions', link: '/reference/showoptions'},
          {text: 'HideOptions', link: '/reference/hideoptions'},
          {text: 'UpdateOptions', link: '/reference/updateoptions'},
          {text: 'useSheetRouter', link: '/reference/userouter'},
          {text: 'useSheetScrollable', link: '/reference/usesheetscrollable'},
          {text: 'useSheetPosition', link: '/reference/usesheetposition'},
          {text: 'SheetGestureBlocker', link: '/reference/sheetgestureblocker'},
          {text: 'useScrollHandlers', link: '/reference/usescrollhandlers'},
          {text: 'useSheetRouteParams', link: '/reference/usesheetrouteparams'},
          {text: 'useSheetIDContext', link: '/reference/usesheetidcontext'},
          {text: 'useProviderContext', link: '/reference/useprovidercontext'},
          {text: 'useSheetRef', link: '/reference/usesheetref'},
          {text: 'useSheetPayload', link: '/reference/usesheetpayload'},
          {text: 'Route', link: '/reference/route'},
          {text: 'DraggableNodeOptions', link: '/reference/draggablenodeoptions'},
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [{icon: 'github', link: GITHUB}],

    editLink: {
      pattern: `${GITHUB}/blob/master/docs/:path`,
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: `Copyright © ${new Date().getFullYear()} Ammar Ahmed`,
    },
  },
});
