/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
  flexsearch: {
    codeblocks: false
  },
  defaultShowCopyCode: true,
  codeHighlight: true
  // optional: add `unstable_staticImage: true` to enable Nextra's auto image import
});
module.exports = withNextra(nextConfig);
