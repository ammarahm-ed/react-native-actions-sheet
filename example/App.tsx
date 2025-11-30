import React from 'react';
import { SheetProvider } from 'react-native-actions-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainScreen from '../app/examples';
import { AppSheets } from '../app/sheets';

const App = () => {
  // To match the style of action sheet navigation bar, we use react-native-navigation-bar-color on android and the app.
  // You also need to adjust the android default navigation bar color `android:navigationBarColor` in styles.xml, see:
  // /Volumes/DataDrive/Projects/react-native/react-native-actions-sheet/example/android/app/src/main/res/values/styles.xml
  changeNavigationBarColor('#ffffff');

  return (
    <>
      <SafeAreaProvider>
        <AppSheets />
        <GestureHandlerRootView
          style={{
            flex: 1,
          }}
        >
          <SheetProvider context="global">
            <MainScreen />
          </SheetProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </>
  );
};

export default App;
