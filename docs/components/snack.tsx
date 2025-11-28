import React, {useState} from 'react';
import {useLayoutEffect} from 'react';
import Script from 'next/script';
import {useTheme} from 'nextra-theme-docs';

export default function Snack() {
  const [ready, setReady] = useState(false);
  const {theme, systemTheme} = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  useLayoutEffect(() => {
    setReady(true);
  }, []);

  return !ready ? null : (
    <>
      <Script src="https://snack.expo.dev/embed.js" async />

   
      <div
        data-snack-id="@ammarahmed/github.com-ammarahm-ed-react-native-actions-sheet:expo-example@develop"
        data-snack-platform="web"
        data-snack-preview="true"
        data-snack-theme={currentTheme}
        style={{
          overflow: 'hidden',
          backgroundColor:
            currentTheme === 'dark'
              ? 'rgb(243 244 246/var(--tw-text-opacity))'
              : '#F9F9F9',
          border: `1px solid ${
            currentTheme === 'dark' ? '#2b2b2b' : '#f0f0f0'
          }`,
          borderRadius: 10,
          marginTop: 20,
          height: 600,
          width: '100%',
          touchAction: 'none',
        }}
      />
    </>
  );
}
