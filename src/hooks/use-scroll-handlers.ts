import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  NativeMethods,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import {
  DraggableNodeOptions,
  LayoutRect,
  useDraggableNodesContext,
  usePanGestureContext,
} from '../context';
import {EventHandlerSubscription} from '../eventmanager';

export const ScrollState = {
  END: -1,
};

const InitialLayoutRect = {
  w: 0,
  h: 0,
  x: 0,
  y: 0,
  px: 0,
  py: 0,
};

/**
 * @deprecated Only used by the legacy gesture path. The worklet gesture engine
 * (default) resolves scrollables through Reanimated animated refs instead. This
 * helper will be removed in v11.
 */
export function resolveScrollRef(ref: any) {
  // FlatList
  if (ref.current?._listRef) {
    return ref.current._listRef?._scrollRef;
  }
  // FlashList
  if (ref.current?.rlvRef) {
    return ref.current?.rlvRef?._scrollComponent?._scrollViewRef;
  }
  // ScrollView
  return ref.current;
}

export function useDraggable<T>(
  options?: DraggableNodeOptions,
  active: boolean = true,
) {
  const gestureContext = usePanGestureContext();
  const draggableNodes = useDraggableNodesContext();
  const nodeRef = useRef<T>(null);
  const offset = useRef({x: 0, y: 0});
  const layout = useRef<LayoutRect>(InitialLayoutRect);
  useEffect(() => {
    // Skip registering with the legacy JS gesture engine when the worklet engine
    // is driving this scrollable.
    if (!active) return undefined;
    const pushNode = () => {
      const index = draggableNodes.nodes.current?.findIndex(
        node => node.ref === nodeRef,
      );
      if (index === undefined || index === -1) {
        draggableNodes.nodes.current?.push({
          ref: nodeRef,
          offset: offset,
          rect: layout,
          handlerConfig: options || {} as DraggableNodeOptions,
        });
      }
    };

    const popNode = () => {
      const index = draggableNodes.nodes.current?.findIndex(
        node => node.ref === nodeRef,
      );

      if (index === undefined || index > -1) {
        draggableNodes.nodes.current?.splice(index as number, 1);
      }
    };
    pushNode();
    return () => {
      popNode();
    };
  }, [draggableNodes.nodes, options, active]);

  return {
    nodeRef,
    offset,
    draggableNodes,
    layout,
    gestureContext,
  };
}

/**
 * @deprecated Legacy (pre-v11) scroll integration for the JS gesture path. With
 * the worklet gesture engine (now the default) use the shipped `ScrollView`/
 * `FlatList`, or `useSheetScrollable` for a custom Animated scrollable. Kept
 * working while `legacyGestures` is supported; removed in v11.
 *
 * Create a custom scrollable view inside the action sheet.
 * The scrollable view must implement `onScroll`, and `onLayout` props.
 * @example
 * ```tsx
  const handlers = useScrollHandlers<RNScrollView>();
  return <NativeViewGestureHandler
    simultaneousHandlers={handlers.simultaneousHandlers}
  >
  <ScrollableView
    {...handlers}
  >
  </ScrollableView>
  
  </NativeViewGestureHandler>
 * ```
 */
export function useScrollHandlers<T>(
  options?: DraggableNodeOptions,
  active: boolean = true,
) {
  const [_render, _setRender] = useState(false);
  const {nodeRef, gestureContext, offset, layout} = useDraggable<T>(
    options,
    active,
  );
  const timer = useRef<NodeJS.Timeout>(null);
  const subscription = useRef<EventHandlerSubscription>(null);
  const onMeasure = useCallback(
    (x: number, y: number, w: number, h: number, px: number, py: number) => {
      layout.current = {
        x,
        y,
        w,
        h: h + 10,
        px,
        py,
      };
    },
    [],
  );

  const measureAndLayout = React.useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const ref = resolveScrollRef(nodeRef);
      if (Platform.OS == 'web') {
        if (!ref) return;
        const rect = (ref as HTMLDivElement).getBoundingClientRect();
        (ref as HTMLDivElement).style.overflow = 'auto';
        onMeasure(rect.x, rect.y, rect.width, rect.height, rect.left, rect.top);
      } else {
        (ref as NativeMethods)?.measure?.(onMeasure);
      }
    }, 100);
  }, [nodeRef, onMeasure]);

  const onLayout = React.useCallback(() => {
    measureAndLayout();
    subscription.current?.unsubscribe();
    subscription.current = gestureContext.eventManager.subscribe(
      'onoffsetchange',
      () => {
        measureAndLayout();
      },
    );
  }, []);

  const onScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {x, y} = event.nativeEvent.contentOffset;
      const maxOffsetX = event.nativeEvent.contentSize.width - layout.current.w;
      const maxOffsetY =
        event.nativeEvent.contentSize.height - layout.current.h;

      offset.current = {
        x: x === maxOffsetX || x > maxOffsetX - 5 ? ScrollState.END : x,
        y: y === maxOffsetY || y > maxOffsetY - 5 ? ScrollState.END : y,
      };
    },
    [],
  );

  return {
    ref: nodeRef,
    simultaneousHandlers: [gestureContext.ref],
    onScroll,
    scrollEventThrottle: 1,
    onLayout,
  };
}
