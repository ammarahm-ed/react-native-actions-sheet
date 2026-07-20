import {useContext} from 'react';
import {
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
export function useSheetScrollable(_options?: DraggableNodeOptions) {
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
    },
  });

  const onTouchStart = () => {
    if (!sheet?.enabled) return;
    sheet.scrollableActive.value = true;
    // Publish the current offset immediately so the first drag frame arbitrates
    // correctly even before a scroll event fires.
    sheet.scrollY.value = localScrollY.value;
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
