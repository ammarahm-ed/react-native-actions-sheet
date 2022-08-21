import {RefObject, useEffect, useRef} from 'react';
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import {actionSheetEventManager} from '../eventmanager';
import {ActionSheetRef} from '../index';

/**
 * If you are using a `ScrollView` or `FlatList` in ActionSheet. You must attach `scrollHandlers`
 * with it to enable scrolling.
 * @param id Id for the handler. Could be any string value.
 * @param ref ref of the ActionSheet in which the ScrollView is present.
 * @returns
 */
function useScrollHandlers<T>(id: string, ref: RefObject<ActionSheetRef>) {
  //const [enabled,setEnabled] = useState(false);
  const scrollRef = useRef<T>(null);
  const scrollLayout = useRef<LayoutRectangle>();
  const scrollOffset = useRef(0);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
    ref.current?.modifyGesturesForLayout(
      id,
      scrollLayout.current,
      scrollOffset.current,
    );
  };

  useEffect(() => {
    const subscription = actionSheetEventManager.subscribe(
      'onoffsetchange',
      (offset: number) => {
        if (offset < 3) {
          //@ts-ignore
          scrollRef.current?.setNativeProps?.({
            scrollEnabled: true,
          });
          if (Platform.OS === 'web') {
            //@ts-ignore
            scrollRef.current.style.overflowY = 'scroll';
            //@ts-ignore
            scrollRef.current.style.touchAction = 'auto';
          }
          ref.current?.modifyGesturesForLayout(
            id,
            scrollLayout.current,
            scrollOffset.current,
          );
        } else {
          //@ts-ignore
          scrollRef.current?.setNativeProps?.({
            scrollEnabled: false,
          });
          if (Platform.OS === 'web') {
            //@ts-ignore
            scrollRef.current.style.touchAction = 'none';
            //@ts-ignore
            scrollRef.current.style.overflowY = 'hidden';
          }
          ref.current?.modifyGesturesForLayout(id, undefined, 0);
        }
      },
    );
    return () => {
      subscription?.unsubscribe();
    };
  }, [id, ref]);

  const onLayout = (event: LayoutChangeEvent) => {
    scrollLayout.current = event.nativeEvent.layout;
    ref.current?.modifyGesturesForLayout(id, undefined, 0);
  };

  return {
    scrollEnabled: false,
    onScroll,
    ref: scrollRef,
    onLayout: onLayout,
    scrollEventThrottle: 200,
  };
}

export default useScrollHandlers;
