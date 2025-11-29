import {
  RouteDefinition,
  SheetDefinition,
  registerSheet,
  SheetRegister,
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
import FloatingSheet from './examples/floating-sheet';
import LegendListExample from './examples/legend-list';
import CustomScrollHandlers from './examples/custom-scroll-handlers';

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
    'floating-sheet': SheetDefinition;
    'return-data': SheetDefinition<{
      returnValue: boolean;
    }>;
    'legend-list': SheetDefinition;
    'custom-scroll-handlers': SheetDefinition;
  }
}

export const Sheets = () => {
  return (
    <SheetRegister
      sheets={{
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
      }}
    />
  );
};
