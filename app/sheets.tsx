import {
  RouteDefinition,
  SheetDefinition,
  SheetRegister,
  SheetRegisterProps
} from 'react-native-actions-sheet';
import AlwaysOpen from './examples/always-open';
import BackgroundInteraction from './examples/background-interaction';
import CustomScrollHandlers from './examples/custom-scroll-handlers';
import DrawUnderStatusBar from './examples/draw-under-statusbar';
import FlashListSheet from './examples/flashlist';
import FlatListSheet from './examples/flatlist';
import FloatingSheet from './examples/floating-sheet';
import Gestures from './examples/gestures';
import Hello, { Hello_Two } from './examples/hello';
import Input from './examples/input';
import LegendListExample from './examples/legend-list';
import NestedSheet from './examples/nested';
import Payload from './examples/payload';
import ReturnData from './examples/return-data';
import RouterSheet from './examples/router';
import ScrollViewSheet from './examples/scrollview';
import ResizeSheet from './examples/scrollview-resize';
import SnapMe from './examples/snap-me';

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
    hello_two: SheetDefinition;
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
    'floating-sheet': SheetDefinition;
    'return-data': SheetDefinition<{
      returnValue: boolean;
    }>;
    'legend-list': SheetDefinition;
    'custom-scroll-handlers': SheetDefinition;
  }
}

const sheets: SheetRegisterProps['sheets'] = {
  hello: Hello,
  gestures: Gestures,
  'snap-me': SnapMe,
  input: Input,
  payload: Payload,
  'background-interaction': BackgroundInteraction,
  'always-open': AlwaysOpen,
  scrollview: ScrollViewSheet,
  flashlist: FlashListSheet,
  flatlist: FlatListSheet,
  'scrollview-resize': ResizeSheet,
  'nested-sheets': NestedSheet,
  'sheet-router': RouterSheet,
  'draw-under-statusbar': DrawUnderStatusBar,
  'return-data': ReturnData,
  'floating-sheet': FloatingSheet,
  'legend-list': LegendListExample,
  'custom-scroll-handlers': CustomScrollHandlers,
  "hello_two": Hello_Two
};

export const AppSheets = () => {
  return <SheetRegister sheets={sheets} />;
};
