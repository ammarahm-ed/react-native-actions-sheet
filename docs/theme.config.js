/* eslint-disable import/no-anonymous-default-export */

export default {
  projectLink: 'https://github.com/ammarahm-ed/react-native-actions-sheet', // GitHub link in the navbar
  docsRepositoryBase:
    'https://github.com/ammarahm-ed/react-native-actions-sheet/blob/master/docs/pages', // base URL for the docs repository
  titleSuffix: ' – React Native ActionSheet',
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
      <meta httpEquiv="Content-Language" content="en" />
      <meta
        name="description"
        content="A Cross Platform(Android & iOS) ActionSheet with a robust and flexible api, native performance and zero dependency code for react native. Create anything you want inside ActionSheet."
      />
      <meta
        name="keywords"
        content="react native, actionsheet, bottom sheet, action sheet, react native bottom sheet, react native actionsheet, modal, drawer, react, native, ios, android, gesture, animation"
      />
      <meta name="author" content="Ammar Ahmed" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://rnas.vercel.app/" />
      <meta property="og:title" content="ActionSheet for React Native" />
      <meta
        property="og:description"
        content="A Cross Platform(Android & iOS) ActionSheet with a robust and flexible api, native performance and zero dependency code for react native."
      />
      <meta property="og:image" content="https://rnas.vercel.app/og-image.png" />
      <meta property="og:site_name" content="React Native ActionSheet" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="https://rnas.vercel.app/" />
      <meta name="twitter:title" content="ActionSheet for React Native" />
      <meta
        name="twitter:description"
        content="A Cross Platform(Android & iOS) ActionSheet with a robust and flexible api, native performance and zero dependency code for react native."
      />
      <meta name="twitter:image" content="https://rnas.vercel.app/og-image.png" />
      <meta name="twitter:creator" content="@ammarahm_ed" />

      {/* Favicons */}
      <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <link rel="manifest" href="/favicon/site.webmanifest" />

      {/* Additional SEO */}
      <meta name="theme-color" content="#ffffff" />
      <link rel="canonical" href="https://rnas.vercel.app/" />
    </>
  ),
  useNextSeoProps() {
    return {
      titleTemplate: '%s – React Native ActionSheet'
    }
  },
};
