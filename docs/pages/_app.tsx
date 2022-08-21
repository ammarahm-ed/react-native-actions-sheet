import { NextPage } from "next";
import { AppProps } from "next/app";
import "nextra-theme-docs/style.css";
import "../styles/globals.css";
import { ReactElement, ReactNode } from "react";

// https://nextjs.org/docs/basic-features/layouts#with-typescript

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function Nextra({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return getLayout(<Component {...pageProps} />);
}
