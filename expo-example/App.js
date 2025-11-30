import React from 'react';
import {AppSheets} from '../app/sheets';
import {SheetProvider} from 'react-native-actions-sheet';
import MainScreen from '../app/examples';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

const App = () => {
  return (
    <>
      <SafeAreaProvider>
        <AppSheets />
        <GestureHandlerRootView
          style={{
            flex: 1,
          }}>
          <SheetProvider context="global">
            <MainScreen />
          </SheetProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </>
  );
};

export default App;
