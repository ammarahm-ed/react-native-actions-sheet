import {createContext, createRef, RefObject, useContext} from 'react';
import type {AnimatedRef, SharedValue} from 'react-native-reanimated';
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
 * A region inside the sheet that participates in gesture arbitration when the
 * worklet gesture engine is enabled. The pan gesture measures each region's
 * `animatedRef` at gesture start (on the UI thread) to find which one is under
 * the finger, so multiple scrollables — and gesture-blocking regions — can be
 * arbitrated correctly at the same time.
 *
 * - `kind: 'scroll'` — a scrollable. Feeds its own `scrollY` and self-locks via
 *   its `animatedRef`. `hasRefreshControl`/`refreshControlBoundary` enable the
 *   pull-to-refresh handoff.
 * - `kind: 'ignore'` — a region that swallows the sheet's drag: gestures inside
 *   its bounds never move the sheet.
 */
export type GestureRegionKind = 'scroll' | 'ignore';

export type GestureRegion = {
  id: number;
  kind: GestureRegionKind;
  animatedRef: AnimatedRef<any>;
  scrollY?: SharedValue<number>;
  hasRefreshControl?: boolean;
  refreshControlBoundary?: number;
};

/**
 * Sheet-level context shared with scrollables and gesture-blocking regions when
 * the worklet gesture engine is enabled. The shared values let a scrollable
 * self-lock on the UI thread; `register` adds a region to the sheet's gesture
 * arbitration registry and returns a cleanup function.
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
  /** Register a gesture region; returns an unregister cleanup. */
  register: (region: GestureRegion) => () => void;
};

export const WorkletScrollContext =
  createContext<WorkletScrollContextType | null>(null);

export const useWorkletScrollContext = () => useContext(WorkletScrollContext);

let regionIdCounter = 0;
export const nextRegionId = () => ++regionIdCounter;
