import {useContext} from 'react';
import {NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import {
  measure,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import {
  DraggableNodeOptions,
  PanGestureRefContext,
  useWorkletScrollContext,
} from '../context';

type ScrollEventHandler = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
) => void;

/**
 * Wires a scrollable into the experimental worklet gesture engine.
 *
 * The returned `onScroll` is a Reanimated scroll handler (UI thread). It mirrors
 * the content offset into the sheet-level `scrollY` shared value so the pan
 * gesture worklet can arbitrate drag-vs-scroll without any JS-thread hop, and it
 * self-locks the list (via the list's own animated ref) whenever the sheet is
 * not fully open — replacing the old per-frame JS `scrollTo` pinning and the
 * Android `scrollEnabled` toggling.
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
  const localScrollY = useSharedValue(0);
  const lockedOffsetY = useSharedValue(0);

  // Capture only shared values in the worklet — never the context object itself.
  const sheetTranslateY = sheet?.translateY;
  const sheetMinTranslate = sheet?.minTranslateValue;
  const sheetIsRefreshing = sheet?.isRefreshing;
  const sheetScrollY = sheet?.scrollY;
  const sheetScrollableActive = sheet?.scrollableActive;

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
      lockedOffsetY.value = localScrollY.value;
      // Fallback in case the JS onTouchStart was swallowed by the native list:
      // any real scroll means the finger is on this scrollable.
      if (sheetScrollableActive) sheetScrollableActive.value = true;
    },
    onScroll: event => {
      const y = event.contentOffset.y;
      localScrollY.value = y;
      if (sheetScrollY) sheetScrollY.value = y;
      // When the sheet is mid-drag (not fully open) the list must stay put.
      if (
        sheetTranslateY &&
        sheetMinTranslate &&
        sheetTranslateY.value > sheetMinTranslate.value + 5 &&
        !sheetIsRefreshing?.value
      ) {
        scrollTo(animatedRef, 0, lockedOffsetY.value, false);
      }
      if (userOnScroll) {
        runOnJS(forwardScroll)(
          y,
          event.contentSize.height,
          event.layoutMeasurement.height,
        );
      }
    },
  });

  const onTouchStart = () => {
    if (!sheet?.enabled) return;
    sheet.scrollableActive.value = true;
    // Publish the current offset immediately so the first drag frame arbitrates
    // correctly even before a scroll event fires.
    sheet.scrollY.value = localScrollY.value;

    const hasRefresh = !!options?.hasRefreshControl;
    sheet.activeHasRefresh.value = hasRefresh;
    if (hasRefresh) {
      const boundaryFraction = options?.refreshControlBoundary ?? 0.15;
      const boundarySV = sheet.activeRefreshBoundaryY;
      runOnUI(() => {
        const m = measure(animatedRef);
        if (m) {
          boundarySV.value = m.pageY + m.height * boundaryFraction;
        }
      })();
    }
  };

  return {
    enabled: !!sheet?.enabled,
    ref: animatedRef,
    onScroll,
    onTouchStart,
    simultaneousHandlers: [gestureContext.ref],
    scrollEventThrottle: 16,
  };
}
