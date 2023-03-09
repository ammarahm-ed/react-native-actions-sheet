/* eslint-disable curly */
import React, {RefObject, useEffect, useRef} from 'react';
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import {EventHandlerSubscription} from '../eventmanager';
import {ActionSheetRef} from '../index';

/**
 * If you are using a `ScrollView` or `FlatList` in ActionSheet. You must attach `scrollHandlers`
 * with it to enable vertical scrolling. For horizontal ScrollViews, you should not use this hook.
 * @param id Id for the handler. Could be any string value.
 * @param ref ref of the ActionSheet in which the ScrollView is present.
 * @param minGesutureBoundary The minimum area of scrollView from top, where swipe gestures are allowed always.
 * @returns
 */
export function useScrollHandlers<T>(
  id: string,
  ref: RefObject<ActionSheetRef>,
  minGesutureBoundary: number = 50,
) {
  const scrollRef = useRef<T>(null);
  const scrollLayout = useRef<LayoutRectangle>();
  const scrollOffset = useRef(0);
  const prevState = useRef(false);
  const subscription = useRef<EventHandlerSubscription>();
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
    ref.current?.modifyGesturesForLayout(
      id,
      scrollLayout.current,
      scrollOffset.current,
    );
  };

  const disableScrolling = React.useCallback(() => {
    if (Platform.OS === 'web') {
      //@ts-ignore
      scrollRef.current.style.touchAction = 'none';
      //@ts-ignore
      scrollRef.current.style.overflowY = 'hidden';
    }
  }, [scrollRef]);

  const enableScrolling = React.useCallback(() => {
    if (Platform.OS === 'web') {
      //@ts-ignore
      scrollRef.current.style.overflowY = 'scroll';
      //@ts-ignore
      scrollRef.current.style.touchAction = 'auto';
    }
  }, [scrollRef]);

  useEffect(() => {
    return () => {
      subscription.current?.unsubscribe();
    };
  }, [id, ref, disableScrolling, enableScrolling]);

  const onLayout = (event: LayoutChangeEvent) => {
    scrollLayout.current = {
      ...event.nativeEvent.layout,
      y: event.nativeEvent.layout.y || minGesutureBoundary,
    };
    subscription.current = ref.current?.ev.subscribe(
      'onoffsetchange',
      (offset: number) => {
        ref.current?.modifyGesturesForLayout(
          id,
          scrollLayout.current,
          scrollOffset.current,
        );
        if (offset < 3) {
          if (prevState.current) return;
          prevState.current = true;
          enableScrolling();
        } else {
          if (!prevState.current) return;
          prevState.current = false;
          disableScrolling();
        }
      },
    );
    ref.current?.modifyGesturesForLayout(
      id,
      {
        ...scrollLayout.current,
        y: scrollLayout.current.y || minGesutureBoundary,
      },
      scrollOffset.current,
    );
  };

  return {
    scrollEnabled: true,
    onScroll,
    ref: scrollRef,
    onLayout: onLayout,
    scrollEventThrottle: 50,
  };
}
