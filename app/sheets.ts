import {
  RouteDefinition,
  SheetDefinition,
  registerSheet,
} from 'react-native-actions-sheet';
import Hello from './examples/hello';
import Gestures from './examples/gestures';
import SnapMe from './examples/snap-me';
import Input from './examples/input';
import Payload from './examples/payload';
import BackgroundInteraction from './examples/background-interaction';
import AlwaysOpen from './examples/always-open';
import ScrollViewSheet from './examples/scrollview';
import FlatListSheet from './examples/flatlist';
import FlashListSheet from './examples/flashlist';
import ResizeSheet from './examples/scrollview-resize';
import NestedSheet from './examples/nested';
import RouterSheet from './examples/router';
import DrawUnderStatusBar from './examples/draw-under-statusbar';
import ReturnData from './examples/return-data';

// Register your Sheet component.
/**
 * Registering the sheets here because otherwise sheet closes on
 * hot reload during development.
 */
registerSheet('hello', Hello);
registerSheet('gestures', Gestures);
registerSheet('snap-me', SnapMe);
registerSheet('input', Input);
registerSheet('payload', Payload);
registerSheet('background-interaction', BackgroundInteraction);
registerSheet('always-open', AlwaysOpen);
registerSheet('scrollview', ScrollViewSheet);
registerSheet('flatlist', FlatListSheet);
registerSheet('flashlist', FlashListSheet);
registerSheet('scrollview-resize', ResizeSheet);
registerSheet('nested-sheets', NestedSheet);
registerSheet('sheet-router', RouterSheet);
registerSheet('draw-under-statusbar', DrawUnderStatusBar);
registerSheet('return-data', ReturnData);

/**
 * We extend some of the types here to give us great intellisense
 * across the app for all registered sheets.
 */
declare module 'react-native-actions-sheet' {
  export interface Sheets {
    /**
     * A simple sheet example
     */
    hello: SheetDefinition;
    gestures: SheetDefinition;
    'snap-me': SheetDefinition;
    input: SheetDefinition;
    payload: SheetDefinition<{
      payload: {
        candy: string;
      };
    }>;
    'background-interaction': SheetDefinition;
    'always-open': SheetDefinition;
    scrollview: SheetDefinition;
    flatlist: SheetDefinition;
    flashlist: SheetDefinition;
    'scrollview-resize': SheetDefinition;
    'sheet-router': SheetDefinition<{
      routes: {
        'route-a': RouteDefinition;
        'route-b': RouteDefinition<{
          value: string;
        }>;
      };
    }>;
    'nested-sheets': SheetDefinition;
    'draw-under-statusbar': SheetDefinition;
    'return-data': SheetDefinition<{
      returnValue: boolean;
    }>;
  }
}

export {};

/**
 * Since we are not importing our Sheets in any component or file, we want to make sure
 * they are bundled by the JS bundler. Hence we will import this file in App.js.
 */
