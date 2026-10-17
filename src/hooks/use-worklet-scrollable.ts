import {useContext, useEffect, useMemo, useRef} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import {
  runOnJS,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import {
  DraggableNodeOptions,
  nextRegionId,
  PanGestureRefContext,
  useWorkletScrollContext,
} from '../context';
import {useDraggable} from './use-scroll-handlers';

type ScrollEventHandler = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
) => void;

/**
 * Wires a scrollable into the worklet gesture engine.
 *
 * The returned `onScroll` is a Reanimated scroll handler (UI thread). It tracks
 * the content offset in a per-scrollable shared value so the pan gesture worklet
 * can arbitrate drag-vs-scroll without any JS-thread hop — and because every
 * scrollable registers its own region + offset, several scrollables in one sheet
 * are arbitrated correctly at the same time. It also self-locks the list (via the
 * list's own animated ref) whenever the sheet is not fully open, replacing the
 * old per-frame JS `scrollTo` pinning and the Android `scrollEnabled` toggling.
 *
 * Spread the return value onto an Animated version of the scrollable.
 */
export function useSheetScrollable(
  options?: DraggableNodeOptions,
  userOnScroll?: ScrollEventHandler,
) {
  const sheet = useWorkletScrollContext();
  const gestureContext = useContext(PanGestureRefContext);
  const animatedRef = useAnimatedRef<any>();
  const scrollY = useSharedValue(0);
  const lockedOffsetY = useSharedValue(0);
  const idRef = useRef<number>(0);
  if (idRef.current === 0) idRef.current = nextRegionId();

  const enabled = !!sheet?.enabled;
  const register = sheet?.register;
  const hasRefreshControl = !!options?.hasRefreshControl;
  const refreshControlBoundary = options?.refreshControlBoundary;

  useEffect(() => {
    if (!enabled || !register) return undefined;
    return register({
      id: idRef.current,
      kind: 'scroll',
      animatedRef,
      scrollY,
      hasRefreshControl,
      refreshControlBoundary,
    });
  }, [
    enabled,
    register,
    animatedRef,
    scrollY,
    hasRefreshControl,
    refreshControlBoundary,
  ]);

  // Capture only shared values in the worklet — never the context object itself.
  const sheetTranslateY = sheet?.translateY;
  const sheetMinTranslate = sheet?.minTranslateValue;
  const sheetIsRefreshing = sheet?.isRefreshing;

  const forwardScroll = (
    y: number,
    contentHeight: number,
    layoutHeight: number,
  ) => {
    userOnScroll?.({
      nativeEvent: {
        contentOffset: {x: 0, y},
        contentSize: {height: contentHeight, width: 0},
        layoutMeasurement: {height: layoutHeight, width: 0},
      },
    } as NativeSyntheticEvent<NativeScrollEvent>);
  };

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      lockedOffsetY.value = scrollY.value;
    },
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
      // When the sheet is mid-drag (not fully open) the list must stay put at the
      // offset it had when the sheet started moving; while the sheet is fully
      // open the list scrolls freely and we keep that frozen offset up to date.
      if (
        sheetTranslateY &&
        sheetMinTranslate &&
        sheetTranslateY.value > sheetMinTranslate.value + 5 &&
        !sheetIsRefreshing?.value
      ) {
        scrollTo(animatedRef, 0, lockedOffsetY.value, false);
      } else {
        lockedOffsetY.value = event.contentOffset.y;
      }
      if (userOnScroll) {
        runOnJS(forwardScroll)(
          event.contentOffset.y,
          event.contentSize.height,
          event.layoutMeasurement.height,
        );
      }
    },
  });

  return {
    enabled,
    ref: animatedRef,
    onScroll,
    simultaneousHandlers: [gestureContext.ref],
    scrollEventThrottle: 16,
  };
}

/**
 * Marks a region of the sheet as gesture-blocking: drag gestures that begin
 * inside the returned ref's bounds will not move the sheet. Attach the `ref` to
 * an `Animated.View` (or use the `SheetGestureBlocker` component).
 *
 * Useful for sliders, color pickers, maps, drawing canvases and other controls
 * that need vertical drags without the sheet reacting.
 *
 * On web the sheet runs the legacy PanResponder engine, which has no notion of
 * worklet regions, so the same box is registered as a legacy draggable node
 * flagged `blocksGesture`. The sheet then refuses to become the pan responder
 * for touches that begin inside it, measuring the box live from the DOM.
 */
export function useSheetGestureRegion() {
  const sheet = useWorkletScrollContext();
  const animatedRef = useAnimatedRef<any>();
  const idRef = useRef<number>(0);
  if (idRef.current === 0) idRef.current = nextRegionId();

  const enabled = !!sheet?.enabled;
  const register = sheet?.register;

  // Web without the worklet engine has to go through the legacy node registry,
  // which is what the PanResponder path consults. Registration only.
  const legacyWeb = !enabled && Platform.OS === 'web';
  const legacyOptions = useMemo<DraggableNodeOptions>(
    () => ({refreshControlBoundary: 0, blocksGesture: true}),
    [],
  );
  const legacy = useDraggable<any>(legacyOptions, legacyWeb);

  useEffect(() => {
    if (!enabled || !register) return undefined;
    return register({
      id: idRef.current,
      kind: 'ignore',
      animatedRef,
    });
  }, [enabled, register, animatedRef]);

  if (legacyWeb) {
    // A plain ref: on web the legacy engine resolves the underlying DOM node.
    return {enabled: false, ref: legacy.nodeRef};
  }

  return {enabled, ref: animatedRef};
}
