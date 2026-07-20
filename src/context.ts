import {createContext, createRef, RefObject, useContext} from 'react';
import type {SharedValue} from 'react-native-reanimated';
import {actionSheetEventManager} from './eventmanager';

export type ContentSize = {w: number; h: number};
export type LayoutRect = {
  w: number;
  h: number;
  x: number;
  y: number;
  px: number;
  py: number;
};

export const PanGestureRefContext = createContext({
  ref: createRef<any>(),
  eventManager: actionSheetEventManager,
});

export type DraggableNodeOptions = {
  hasRefreshControl?: boolean;
  refreshControlBoundary: number;
};

export const usePanGestureContext = () => useContext(PanGestureRefContext);

export type NodesRef = {
  offset: RefObject<{x: number; y: number}>;
  ref: RefObject<any>;
  rect: RefObject<LayoutRect>;
  handlerConfig: DraggableNodeOptions;
}[];

export type DraggableNodes = {
  nodes: RefObject<NodesRef>;
};

export const DraggableNodesContext = createContext<DraggableNodes>({
  nodes: createRef<NodesRef>(),
});

export const useDraggableNodesContext = () => useContext(DraggableNodesContext);

/**
 * Sheet-level shared values shared with scrollables when the experimental
 * worklet gesture engine is enabled. Everything here is either a plain value or
 * a shared value so it can be read/written from worklets without a JS-thread
 * hop. Scrollables feed `scrollY`/`scrollableActive` and self-lock using their
 * own animated ref based on `translateY`/`minTranslateValue`.
 */
export type WorkletScrollContextType = {
  /** Whether the worklet gesture engine is active for this sheet. */
  enabled: boolean;
  gestureEnabled: boolean;
  enableGesturesInScrollView: boolean;
  /** Live sheet position. */
  translateY: SharedValue<number>;
  /** Fully-open target position. */
  minTranslateValue: SharedValue<number>;
  /** True while a pull-to-refresh interaction is in progress. */
  isRefreshing: SharedValue<boolean>;
  /** Current content offset of the active scrollable. */
  scrollY: SharedValue<number>;
  /** True while the finger is on a registered scrollable. */
  scrollableActive: SharedValue<boolean>;
  /** Whether the active scrollable has a RefreshControl. */
  activeHasRefresh: SharedValue<boolean>;
  /** Absolute Y below which a downward pull triggers pull-to-refresh. */
  activeRefreshBoundaryY: SharedValue<number>;
};

export const WorkletScrollContext =
  createContext<WorkletScrollContextType | null>(null);

export const useWorkletScrollContext = () => useContext(WorkletScrollContext);
