import React from 'react';
import {SheetProvider} from 'react-native-actions-sheet';
import ExampleScreen from './src/screen';
import './src/sheets';
const App = () => {
  return (
    <>
      <SheetProvider />
      <ExampleScreen />
    </>
  );
};

export default App;
