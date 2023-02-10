import React from 'react';
import {SheetProvider} from '../';
import ExampleScreen from './src/screen';
import './src/sheets';

const App = () => {
  return (
    <>
      <SheetProvider context="global">
        <ExampleScreen />
      </SheetProvider>
    </>
  );
};

export default App;
