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
  /**
   * Marks the node as a gesture-blocking region rather than a scrollable: the
   * sheet must not drag when a gesture starts inside it, and it must never be
   * scrolled or pinned. Set by `useSheetGestureRegion` on the legacy (web) path.
   * @internal
   */
  blocksGesture?: boolean;
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

/**
 * Live animated position of the sheet, exposed to descendants so they can drive
 * their own UI-thread animations (parallax headers, collapsing titles, synced
 * backgrounds) off the sheet's motion.
 */
export type SheetPosition = {
  /** Raw translateY of the sheet in px (top of its container == 0). */
  y: SharedValue<number>;
  /** Measured sheet height in px. */
  height: SharedValue<number>;
  /** 0 = fully closed / off-screen, 1 = fully open. */
  progress: SharedValue<number>;
};

export const SheetPositionContext = createContext<SheetPosition | null>(null);

/**
 * Returns the sheet's live animated position as shared values. Use inside the
 * content of an ActionSheet to animate companion UI in sync with the sheet.
 */
export function useSheetPosition(): SheetPosition {
  const context = useContext(SheetPositionContext);
  if (!context) {
    throw new Error('useSheetPosition must be used inside an ActionSheet.');
  }
  return context;
}
