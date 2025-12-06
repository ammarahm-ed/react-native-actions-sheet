/* eslint-disable import/no-anonymous-default-export */

export default {
  projectLink: 'https://github.com/ammarahm-ed/react-native-actions-sheet', // GitHub link in the navbar
  docsRepositoryBase:
    'https://github.com/ammarahm-ed/react-native-actions-sheet/blob/master/docs/pages', // base URL for the docs repository
  nextLinks: true,
  prevLinks: true,
  search: true,
  customSearch: null, // customizable, you can use algolia for example
  darkMode: true,
  footer: true,
  footerText: `MIT ${new Date().getFullYear()} © Ammar Ahmed.`,
  footerEditLink: `Edit this page on GitHub`,
  logo: (
    <>
      <img
        src="/logo.svg"
        width="20"
        alt="ActionSheet for React Native"
        style={{marginRight: '10px'}}
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
      <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <link rel="manifest" href="/favicon/site.webmanifest" />
    </>
  ),
};
