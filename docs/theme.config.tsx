import type { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  project: {
    link: 'https://github.com/ammarahm-ed/react-native-actions-sheet', // GitHub link in the navbar
  },
  docsRepositoryBase:
    'https://github.com/ammarahm-ed/react-native-actions-sheet', // base URL for the docs repository
  darkMode: true,
  footer: {
    text: `MIT ${new Date().getFullYear()} © Ammar Ahmed.`
  },
  editLink: {
    text: `Edit this page on GitHub`
  },
  logo: (
    <>
      <img
        src="/logo.svg"
        width="20"
        alt="ActionSheet for React Native"
        style={{ marginRight: '10px' }}
      />
      <span>ActionSheet for React Native</span>
    </>
  ),
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="A Cross Platform(Android & iOS) ActionSheet with a robust and flexible api, native performance and zero dependency code for react native. Create anything you want inside ActionSheet."
      />
      <meta name="og:title" content="ActionSheet for React Native" />
    </>
  ),
};

export default config;