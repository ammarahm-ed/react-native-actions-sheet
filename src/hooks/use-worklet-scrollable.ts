import {useContext, useEffect, useRef} from 'react';
import {NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
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
 * Marks a region of the sheet as gesture-blocking: while the worklet gesture
 * engine is enabled, drag gestures that begin inside the returned ref's bounds
 * will not move the sheet. Attach the `ref` to an `Animated.View` (or use the
 * `SheetGestureBlocker` component).
 *
 * Useful for sliders, color pickers, maps, drawing canvases and other controls
 * that need vertical drags without the sheet reacting.
 */
export function useSheetGestureRegion() {
  const sheet = useWorkletScrollContext();
  const animatedRef = useAnimatedRef<any>();
  const idRef = useRef<number>(0);
  if (idRef.current === 0) idRef.current = nextRegionId();

  const enabled = !!sheet?.enabled;
  const register = sheet?.register;

  useEffect(() => {
    if (!enabled || !register) return undefined;
    return register({
      id: idRef.current,
      kind: 'ignore',
      animatedRef,
    });
  }, [enabled, register, animatedRef]);

  return {enabled, ref: animatedRef};
}
