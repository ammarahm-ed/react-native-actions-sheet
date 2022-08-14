import { RefObject, useEffect, useRef } from "react";
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from "react-native";
import { actionSheetEventManager } from "../eventmanager";
import { ActionSheetRef } from "../index";

/**
 * If you are using a `ScrollView` or `FlatList` in ActionSheet. You must attach `scrollHandlers`
 * with it to enable scrolling.
 * @param id Id for the handler. Could be any string value.
 * @param ref ref of the ActionSheet in which the ScrollView is present.
 * @returns
 */
const useScrollHandlers = (id: string, ref: RefObject<ActionSheetRef>) => {
  //const [enabled,setEnabled] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollLayout = useRef<LayoutRectangle>();
  const scrollOffset = useRef(0);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
    ref.current?.modifyGesturesForLayout(
      id,
      scrollLayout.current,
      scrollOffset.current
    );
  };

  // const onMomentumScrollEnd = (
  //   event: NativeSyntheticEvent<NativeScrollEvent>
  // ) => {};

  useEffect(() => {
    const subscription = actionSheetEventManager.subscribe(
      "onoffsetchange",
      (offset: number) => {
        if (offset < 3) {
          scrollRef.current?.setNativeProps({
            scrollEnabled: true,
          });
          ref.current?.modifyGesturesForLayout(
            id,
            scrollLayout.current,
            scrollOffset.current
          );
        } else {
          scrollRef.current?.setNativeProps({
            scrollEnabled: false,
          });
          ref.current?.modifyGesturesForLayout(id, undefined, 0);
        }
      }
    );
    return () => {
      subscription?.unsubscribe();
    };
  });

  // const onTouchStart = () => {};

  const onLayout = (event: LayoutChangeEvent) => {
    scrollLayout.current = event.nativeEvent.layout;
  };

  return {
    scrollEnabled: false,
    onScroll,
    ref: scrollRef,
    onLayout: onLayout,
  };
};

export default useScrollHandlers;
