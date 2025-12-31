import React, {
  forwardRef,
  Fragment,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  Dimensions,
  GestureResponderEvent,
  Keyboard,
  LayoutRectangle,
  Modal,
  NativeEventSubscription,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  GestureType,
  PanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  DraggableNodes,
  DraggableNodesContext,
  LayoutRect,
  NodesRef,
  PanGestureRefContext,
} from './context';
import EventManager, {actionSheetEventManager} from './eventmanager';
import {useAccessibility} from './hooks/use-accessibility';
import {
  Route,
  RouterContext,
  RouterParamsContext,
  useRouter,
} from './hooks/use-router';
import {resolveScrollRef} from './hooks/use-scroll-handlers';
import useSheetManager from './hooks/use-sheet-manager';
import {useKeyboard} from './hooks/useKeyboard';
import {
  providerRegistryStack,
  SheetProvider,
  useProviderContext,
  useSheetIDContext,
  useSheetPayload,
  useSheetRef,
} from './provider';
import {getZIndexFromStack, SheetManager} from './sheetmanager';
import {styles} from './styles';
import {ActionSheetProps, ActionSheetRef, CloseRequestType} from './types';
import {getElevation, SUPPORTED_ORIENTATIONS} from './utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export default forwardRef<ActionSheetRef, ActionSheetProps>(
  function ActionSheet(
    {
      animated = true,
      closeOnPressBack = true,
      springOffset = 50,
      elevation = 5,
      disableElevation = false,
      defaultOverlayOpacity = 0.3,
      overlayColor = 'black',
      closable = true,
      closeOnTouchBackdrop = true,
      onTouchBackdrop,
      drawUnderStatusBar = false,
      gestureEnabled = false,
      isModal = true,
      snapPoints = [100],
      initialSnapIndex = 0,
      overdrawEnabled = true,
      overdrawFactor = 15,
      overdrawSize = 100,
      zIndex = 999,
      keyboardHandlerEnabled = true,
      ExtraOverlayComponent,
      returnValue,
      routes,
      initialRoute,
      onBeforeShow,
      enableRouterBackNavigation,
      onBeforeClose,
      enableGesturesInScrollView = true,
      disableDragBeyondMinimumSnapPoint,
      useBottomSafeAreaPadding = true,
      initialTranslateFactor = 1.1,
      openAnimationConfig = {
        damping: 110,
        mass: 4,
        stiffness: 900,
        overshootClamping: true,
      },
      onRequestClose,
      ...props
    },
    ref,
  ) {
    snapPoints =
      snapPoints[snapPoints.length - 1] !== 100
        ? [...snapPoints, 100]
        : snapPoints;
    const initialValue = useRef(-1);
    const actionSheetHeight = useRef(0);
    const insets = useSafeAreaInsets();
    const internalEventManager = React.useMemo(() => new EventManager(), []);
    const currentContext = useProviderContext();
    const currentSnapIndex = useRef(initialSnapIndex);
    const accessibilityInfo = useAccessibility();
    const sheetRef = useSheetRef();
    const sheetHeightRef = useRef(0);
    const minTranslateValue = useRef(0);
    const keyboardWasVisible = useRef(false);
    const animationListenerId = 266786;
    const id = useSheetIDContext();
    const sheetId = props.id || id;
    const panViewRef = useRef<View>(null);
    const rootViewContainerRef = useRef<View>(null);
    const payload = useSheetPayload();
    const payloadRef = useRef<any>(undefined);
    payloadRef.current = payload;
    const gestureBoundaries = useRef<{
      [name: string]: LayoutRectangle & {
        scrollOffset?: number;
      };
    }>({});
    const hiding = useRef(false);
    const returnValueRef = useRef(returnValue);
    const sheetPayload = useSheetPayload();
    const panGestureRef = useRef<GestureType>(undefined);
    const closing = useRef(false);
    const draggableNodes = useRef<NodesRef>([]);
    const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [dimensions, setDimensions] = useState({
      width: -1,
      height: -1,
    });
    const dimensionsRef = useRef(dimensions);
    dimensionsRef.current = dimensions;
    const containerStyle = StyleSheet.flatten(props.containerStyle);
    const providerId = useRef(`$$-auto-${sheetId}-${currentContext}-provider`);
    providerId.current = `$$-auto-${sheetId}-${currentContext}-provider`;

    const {visible, setVisible, visibleRef} = useSheetManager({
      id: sheetId,
      onHide: data => {
        hideSheet(undefined, data, true);
      },
      onBeforeShow: (data, snapIndex) => {
        routerRef.current?.initialNavigation();
        if (snapIndex !== undefined) {
          currentSnapIndex.current = snapIndex;
        }
        onBeforeShow?.(data as never);
      },
      onContextUpdate: () => {
        if (sheetId) {
          SheetManager.add(sheetId, currentContext);
          SheetManager.registerRef(sheetId, currentContext, {
            current: getRef(),
          } as RefObject<ActionSheetRef>);
        }
      },
    });

    const opacity = useSharedValue(0);
    const actionSheetOpacity = useSharedValue(0);
    const translateY = useSharedValue(Dimensions.get('window').height * 2);
    const underlayTranslateY = useSharedValue(130);
    const routeOpacity = useSharedValue(0);
    const router = useRouter({
      routes: routes,
      getRef: () => getRef(),
      initialRoute: initialRoute as string,
      onNavigate: props.onNavigate,
      onNavigateBack: props.onNavigateBack,
      routeOpacity: routeOpacity,
    });
    const routerRef = useRef(router);
    returnValueRef.current = returnValue;
    routerRef.current = router;
    const keyboard = useKeyboard(keyboardHandlerEnabled);
    const prevSnapIndex = useRef<number>(initialSnapIndex);
    const draggableNodesContext: DraggableNodes = React.useMemo(
      () => ({
        nodes: draggableNodes,
      }),
      [],
    );
    const notifyOffsetChange = (value: number) => {
      internalEventManager.publish('onoffsetchange', value);
    };

    const notifySnapIndexChanged = React.useCallback(() => {
      if (prevSnapIndex.current !== currentSnapIndex.current) {
        prevSnapIndex.current = currentSnapIndex.current;
        props.onSnapIndexChange?.(currentSnapIndex.current);
      }
    }, [props.onSnapIndexChange]);

    const moveSheetWithAnimation = React.useCallback(
      (
        velocity?: number,
        value?: number,
        min?: number,
        gestureEnd?: boolean,
      ) => {
        let initial = value || initialValue.current;
        let minTranslate = min || minTranslateValue.current;
        if (!animated) {
          actionSheetOpacity.value = 1;
          translateY.value = initial;
          return;
        }

        const config = openAnimationConfig;
        const correctedValue = initial > minTranslate ? initial : 0;

        notifyOffsetChange(correctedValue as number);
        if (
          accessibilityInfo.current.prefersCrossFadeTransitions &&
          !gestureEnd
        ) {
          actionSheetOpacity.value = 0;
          translateY.value = initial;
          actionSheetOpacity.value = withTiming(1, {
            duration: 150,
            easing: Easing.in(Easing.ease),
          });
        } else {
          actionSheetOpacity.value = 1;
          translateY.value = withSpring(initial, {
            ...config,
            velocity: typeof velocity !== 'number' ? undefined : velocity,
          });
        }

        notifySnapIndexChanged();
      },
      [animated, openAnimationConfig],
    );

    const animationSheetOpacity = React.useCallback((value: number) => {
      opacity.value = withTiming(value, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });
    }, []);

    const hideSheetWithAnimation = React.useCallback(
      (vy?: number, callback?: () => void, gestureEnd?: boolean) => {
        if (!animated) {
          callback?.();
          return;
        }
        const config = props.closeAnimationConfig;
        animationSheetOpacity(0);
        const endTranslateValue = dimensionsRef.current.height * 1.3;
        if (
          accessibilityInfo.current.prefersCrossFadeTransitions &&
          !gestureEnd
        ) {
          actionSheetOpacity.value = withTiming(
            0,
            {
              duration: 200,
              easing: Easing.in(Easing.ease),
            },
            finished => {
              if (finished) {
                translateY.value = endTranslateValue;
              }
            },
          );
        } else {
          translateY.value = withTiming(
            endTranslateValue,
            config || {
              velocity: typeof vy !== 'number' ? 3.0 : vy + 1,
              duration: 200,
            },
          );
        }

        /**
         * Using setTimeout to ensure onClose is triggered when sheet is off screen
         * or is close to reaching off screen.
         */
        setTimeout(() => callback(), config?.duration || 200);
      },
      [animated, animationSheetOpacity, props.closeAnimationConfig, setVisible],
    );

    const getCurrentPosition = React.useCallback(() => {
      return translateY.value <= minTranslateValue.current + 5
        ? 0
        : (translateY.value as number);
    }, []);

    const getNextPosition = React.useCallback(
      (snapIndex: number) => {
        return (
          actionSheetHeight.current +
          minTranslateValue.current -
          (actionSheetHeight.current * snapPoints[snapIndex]) / 100
        );
      },
      [snapPoints],
    );

    const hardwareBackPressEvent = useRef<NativeEventSubscription>(null);
    const Root: React.ElementType =
      isModal && !props?.backgroundInteractionEnabled ? Modal : Animated.View;

    useEffect(() => {
      if (drawUnderStatusBar || props.onChange) {
        let prevPercentage = 0;
        const onValueChange = (value: number) => {
          const correctedValue =
            value > minTranslateValue.current
              ? value - minTranslateValue.current
              : 0;

          const percentage =
            ((actionSheetHeight.current - correctedValue) /
              actionSheetHeight.current) *
            100;

          const rounded = Math.round(percentage);
          if (rounded !== prevPercentage && rounded > -1) {
            prevPercentage = rounded;
            props.onChange?.(Math.round(percentage));
          }

          const percentScreenCovered =
            (actionSheetHeight.current /
              (dimensionsRef.current.height - insets.top)) *
            100;
          if (drawUnderStatusBar) {
            if (percentage > 85 && percentScreenCovered > 99) {
              var distanceFromTop = 100 - percentage;
              underlayTranslateY.value = Math.max(
                (actionSheetHeight.current / 100) * distanceFromTop,
              );
            } else {
              underlayTranslateY.value = 130;
            }
          } else {
            underlayTranslateY.value = 130;
          }
        };
        runOnUI(() => {
          translateY.addListener(animationListenerId, value => {
            runOnJS(onValueChange)(value);
          });
        })();
      }
      return () => {
        runOnUI((animationListener: number) => {
          translateY.removeListener(animationListener);
        })(animationListenerId);
      };
    }, [
      props?.id,
      keyboard.keyboardShown,
      keyboard.keyboardHeight,
      dimensions,
    ]);

    const onSheetLayout = React.useCallback(
      async (height: number) => {
        const processLayout = () => {
          const sheetHeight = height;
          sheetHeightRef.current = sheetHeight;
          if (dimensionsRef.current.height === -1) {
            return;
          }
          if (closing.current) return;
          const rootViewHeight = dimensionsRef.current?.height;

          actionSheetHeight.current =
            sheetHeight > dimensionsRef.current.height
              ? dimensionsRef.current.height
              : sheetHeight;

          let minTranslate = 0;
          let initial = initialValue.current;

          minTranslate = rootViewHeight - actionSheetHeight.current;

          if (initial === -1) {
            translateY.value = rootViewHeight * initialTranslateFactor;
          }

          const nextInitialValue =
            actionSheetHeight.current +
            minTranslate -
            (actionSheetHeight.current * snapPoints[currentSnapIndex.current]) /
              100;

          initial =
            (keyboard.keyboardShown || keyboardWasVisible.current) &&
            initial <= nextInitialValue &&
            initial >= minTranslate
              ? initial
              : nextInitialValue;

          const sheetBottomEdgePosition =
            initial +
            (actionSheetHeight.current * snapPoints[currentSnapIndex.current]) /
              100;

          const sheetPositionWithKeyboard =
            sheetBottomEdgePosition -
            (dimensionsRef.current?.height - keyboard.keyboardHeight);

          initial = keyboard.keyboardShown
            ? initial - sheetPositionWithKeyboard
            : initial;

          if (keyboard.keyboardShown) {
            minTranslate = minTranslate - keyboard.keyboardHeight;
          }

          minTranslateValue.current = minTranslate;
          initialValue.current = initial;

          animationSheetOpacity(defaultOverlayOpacity);
          moveSheetWithAnimation(undefined, initial, minTranslate);

          if (initial > 130) {
            underlayTranslateY.value = 130;
          }
          if (Platform.OS === 'web') {
            document.body.style.overflowY = 'hidden';
            document.documentElement.style.overflowY = 'hidden';
          }
        };

        // Debounce layout updates to prevent jumps
        if (Platform.OS === 'android' && !animated) {
          if (layoutTimeoutRef.current) {
            clearTimeout(layoutTimeoutRef.current);
          }
          layoutTimeoutRef.current = setTimeout(() => {
            processLayout();
            layoutTimeoutRef.current = null;
          }, 32);
          return;
        }

        processLayout();
      },
      [
        animated,
        snapPoints,
        keyboard.keyboardShown,
        keyboard.keyboardHeight,
        animationSheetOpacity,
        translateY,
        underlayTranslateY,
        moveSheetWithAnimation,
      ],
    );

    const hideSheet = React.useCallback(
      (
        vy?: number,
        data?: any,
        isSheetManagerOrRef?: boolean,
        gestureEnd?: boolean,
      ) => {
        if (hiding.current) return;

        let closeRequestResult = true;
        if (gestureEnd) {
          if (onRequestClose) {
            closeRequestResult = onRequestClose?.(CloseRequestType.SWIPE);
          }
        }

        if ((!closable || !closeRequestResult) && !isSheetManagerOrRef) {
          const next = getNextPosition(currentSnapIndex.current);
          moveSheetWithAnimation(vy, next, undefined, gestureEnd);
          initialValue.current = next;
          return;
        }

        hiding.current = true;
        onBeforeClose?.((data || returnValueRef.current || data) as never);
        if (closable) {
          closing.current = true;
          Keyboard.dismiss();
          runOnUI((animationListener: number) => {
            translateY.removeListener(animationListener);
          })(animationListenerId);
        }
        const onCompleteAnimation = () => {
          if (closable || isSheetManagerOrRef) {
            const providerIndex = providerRegistryStack.indexOf(providerId.current);
            if (providerIndex > -1) {
              providerRegistryStack.splice(providerIndex, 1);
            }
            setVisible(false);
            visibleRef.current.value = false;
            if (props.onClose) {
              props.onClose?.(
                (data || returnValueRef.current || data) as never,
              );
              hiding.current = false;
            }
            hardwareBackPressEvent.current?.remove();
            if (sheetId) {
              SheetManager.remove(sheetId, currentContext);
              hiding.current = false;
              actionSheetEventManager.publish(
                `onclose_${sheetId}`,
                data || returnValueRef.current || data,
                currentContext || 'global',
              );
            } else {
              hiding.current = false;
            }
            currentSnapIndex.current = initialSnapIndex;
            closing.current = false;
            initialValue.current = -1;
            actionSheetOpacity.value = 0;
            translateY.value = Dimensions.get('window').height * 2;
            keyboard.reset();
          } else {
            opacity.value = 1;
            moveSheetWithAnimation(1, undefined, undefined, gestureEnd);
          }
        };
        hideSheetWithAnimation(vy, onCompleteAnimation, gestureEnd);
        if (Platform.OS === 'web') {
          document.body.style.overflowY = 'auto';
          document.documentElement.style.overflowY = 'auto';
        }
      },
      [
        closable,
        hideSheetWithAnimation,
        props.onClose,
        moveSheetWithAnimation,
        keyboard,
        setVisible,
      ],
    );

    const onHardwareBackPress = React.useCallback(() => {
      if (
        visible &&
        enableRouterBackNavigation &&
        routerRef.current?.canGoBack()
      ) {
        routerRef.current?.goBack();
        return true;
      }

      let closeRequestResult = true;
      if (onRequestClose) {
        closeRequestResult = onRequestClose?.(CloseRequestType.BACK_PRESS);
      }

      if (visible && closable && closeOnPressBack && closeRequestResult) {
        hideSheet();
        return true;
      }
      return false;
    }, [
      closable,
      closeOnPressBack,
      hideSheet,
      enableRouterBackNavigation,
      visible,
    ]);

    /**
     * Snap towards the top
     */
    const snapForward = React.useCallback(
      (vy: number, gestureEnd?: boolean) => {
        if (currentSnapIndex.current === snapPoints.length - 1) {
          const next = getNextPosition(currentSnapIndex.current);
          moveSheetWithAnimation(vy, next, undefined, gestureEnd);
          initialValue.current = next;
          return;
        }
        let nextSnapPoint = 0;
        let nextSnapIndex = 0;
        if (getCurrentPosition() === 0) {
          nextSnapPoint = snapPoints[(nextSnapIndex = snapPoints.length - 1)];
        } else {
          for (let i = currentSnapIndex.current; i < snapPoints.length; i++) {
            if (getNextPosition(i) < getCurrentPosition()) {
              nextSnapPoint = snapPoints[(nextSnapIndex = i)];
              break;
            }
          }
        }

        if (nextSnapPoint > 100) {
          console.warn('Snap points should range between 0 to 100.');
          moveSheetWithAnimation(vy, undefined, undefined, gestureEnd);
          return;
        }
        currentSnapIndex.current = nextSnapIndex;
        const next = getNextPosition(currentSnapIndex.current);
        initialValue.current = next;
        moveSheetWithAnimation(vy, next, undefined, gestureEnd);
      },
      [getCurrentPosition, getNextPosition, moveSheetWithAnimation, snapPoints],
    );
    /**
     * Snap towards the bottom
     */
    const snapBackward = React.useCallback(
      (vy: number, gestureEnd?: boolean) => {
        if (currentSnapIndex.current === 0) {
          if (closable) {
            initialValue.current = dimensionsRef.current.height * 1.3;
            hideSheet(vy, undefined, false, gestureEnd);
          } else {
            const next = getNextPosition(currentSnapIndex.current);
            moveSheetWithAnimation(vy, next, undefined, gestureEnd);
            initialValue.current = next;
          }
          return;
        }

        let nextSnapPoint = 0;
        let nextSnapIndex = 0;
        for (let i = currentSnapIndex.current; i > -1; i--) {
          if (getNextPosition(i) > getCurrentPosition()) {
            nextSnapPoint = snapPoints[(nextSnapIndex = i)];
            break;
          }

          if (i === 0 && getCurrentPosition() > getNextPosition(i)) {
            if (closable) {
              initialValue.current = dimensionsRef.current.height * 1.3;
              hideSheet(vy, undefined, undefined, gestureEnd);
              return;
            }
          }
        }

        if (nextSnapPoint < 0) {
          console.warn('Snap points should range between 0 to 100.');
          moveSheetWithAnimation(vy, undefined, undefined, gestureEnd);
          return;
        }
        currentSnapIndex.current = nextSnapIndex;
        const next = getNextPosition(currentSnapIndex.current);
        initialValue.current = next;
        moveSheetWithAnimation(vy, next, undefined, gestureEnd);
      },
      [
        closable,
        getCurrentPosition,
        getNextPosition,
        hideSheet,
        moveSheetWithAnimation,
        snapPoints,
      ],
    );

    function getRectBoundary(rect?: LayoutRect | null) {
      if (rect) {
        const {w, h, px, py} = rect;
        return {...rect, boundryX: px + w, boundryY: py + h};
      }
      return {w: 0, h: 0, px: 0, py: 0, x: 0, y: 0, boundryX: 0, boundryY: 0};
    }

    const getActiveDraggableNodes = React.useCallback(
      (absoluteX: number, absoluteY: number, returnAllNodes?: boolean) => {
        if (draggableNodes.current?.length === 0) return [];
        const activeNodes: {
          rectWithBoundary: LayoutRect;
          node: NodesRef['0'];
        }[] = [];
        for (let node of draggableNodes.current) {
          const rect = getRectBoundary(node.rect.current);
          if (rect.boundryX === 0 && rect.boundryY === 0) continue;
          if (returnAllNodes) {
            activeNodes.push({
              rectWithBoundary: rect,
              node: node,
            });
          } else if (
            absoluteX > rect.px &&
            absoluteY > rect.py &&
            absoluteX < rect.boundryX &&
            absoluteY < rect.boundryY
          ) {
            activeNodes.push({
              rectWithBoundary: rect,
              node: node,
            });
          }
        }
        return activeNodes;
      },
      [],
    );

    const panGesture = React.useMemo(() => {
      let prevDeltaY = 0;
      let deltaYOnGestureStart = 0;
      let velocity = 0;
      let start: {
        x: number;
        y: number;
      };
      let oldValue = 0;
      let isRefreshing = false;
      const offsets: number[] = [];

      function scrollable(value: boolean) {
        for (let i = 0; i < draggableNodes.current.length; i++) {
          const node = draggableNodes.current[i];
          const scrollRef = resolveScrollRef(node.ref);
          if (Platform.OS === 'ios' || Platform.OS === 'web') {
            if (!value) {
              if (!offsets[i] || node.offset.current?.y === 0) {
                offsets[i] = node.offset.current?.y || 0;
              }
              if (Platform.OS === 'web') {
                (scrollRef as HTMLDivElement).scrollTop = offsets[i];
              } else {
                scrollRef.scrollTo({
                  x: 0,
                  y: offsets[i],
                  animated: false,
                });
              }
            } else {
              offsets[i] = node.offset.current?.y || 0;
            }
          } else if (Platform.OS === 'android') {
            scrollRef?.setNativeProps({
              scrollEnabled: value,
            });
          }
        }
      }

      let blockPan = false;

      const onChange = (
        absoluteX: number,
        absoluteY: number,
        translationY: number,
      ) => {
        if (!gestureEnabled) return;
        let deltaY = translationY;
        let isSwipingDown = prevDeltaY < deltaY;

        prevDeltaY = deltaY;

        if (!start) {
          start = {
            x: absoluteX,
            y: absoluteY,
          };
        }

        const isFullOpen = getCurrentPosition() === 0;

        const activeDraggableNodes = getActiveDraggableNodes(
          start.x,
          start.y,
          !isFullOpen || (isFullOpen && !isSwipingDown),
        );

        if (
          enableGesturesInScrollView &&
          activeDraggableNodes.length > 0 &&
          !isRefreshing
        ) {
          const nodeIsScrolling = activeDraggableNodes.some(
            node => node.node.offset.current.y !== 0,
          );

          /**
           * Draggable nodes handling cases:
           *
           * 1. Sheet not fully open, swiping up, scrolling: false panning: true (will transition to scrolling once sheet reaches top position)
           * 2. Sheet fully open, swiping up, scrolling: true, panning: false
           * 3. Sheet not fully open, swiping down, scrolling: false, panning: true
           * 4. Sheet fully open, scroll offset > 0, scrolling: true, panning: false will transition into scrolling: false, panning: true, once scroll reaches offset=0
           * 5. Add support for pull to refresh
           */

          // 1. Sheet not fully open, swiping up, scrolling: false panning: true (will transition to scrolling once sheet reaches top position)
          if (!isFullOpen && !isSwipingDown) {
            scrollable(false);
            blockPan = false;
          }

          // 2. Sheet fully open, swiping up, scrolling: true, panning: false
          if (isFullOpen && !isSwipingDown) {
            scrollable(true);
            blockPan = true;
          }
          //  3. Sheet not fully open, swiping down, scrolling: false, panning: true
          if (!isFullOpen && isSwipingDown) {
            if (nodeIsScrolling) {
              scrollable(true);
              blockPan = true;
            } else {
              scrollable(false);
              blockPan = false;
            }
          }

          // 4. Sheet fully open, scroll offset > 0, scrolling: true, panning: false will transition into scrolling: false, panning: true, once scroll reaches offset=0
          if (isFullOpen && isSwipingDown) {
            if (nodeIsScrolling) {
              scrollable(true);
              blockPan = true;
            } else {
              if (!deltaYOnGestureStart && deltaY > 0) {
                deltaYOnGestureStart = deltaY;
              }
              const hasRefreshControl = activeDraggableNodes.some(
                node => node.node.handlerConfig.hasRefreshControl,
              );
              if (hasRefreshControl) {
                for (const node of activeDraggableNodes) {
                  if (node.node.handlerConfig.hasRefreshControl) {
                    // Refresh Control will work in to 15% area of the DraggableNode.
                    const refreshControlBounds =
                      node.rectWithBoundary.py +
                      node.rectWithBoundary.h *
                        node.node.handlerConfig.refreshControlBoundary;

                    if (!refreshControlBounds) continue;
                    if (absoluteY < refreshControlBounds) {
                      scrollable(true);
                      blockPan = true;
                      isRefreshing = true;
                    }
                  }
                }
              } else {
                scrollable(false);
                blockPan = false;
              }
            }
          }
        } else if (
          !enableGesturesInScrollView &&
          activeDraggableNodes.length > 0
        ) {
          blockPan = true;
        } else {
          blockPan = false;
        }

        if (isRefreshing) {
          blockPan = true;
          scrollable(true);
        }

        let value = oldValue;

        deltaY = deltaY - deltaYOnGestureStart;
        if (!blockPan) {
          value = initialValue.current + deltaY;
          oldValue = value;
        }

        if (blockPan) return;

        velocity = 1;
        const correctedValue =
          value <= minTranslateValue.current
            ? minTranslateValue.current - value
            : value;

        if (correctedValue / overdrawFactor >= overdrawSize && deltaY <= 0) {
          return;
        }

        const minSnapPoint = getNextPosition(0);
        const translateYValue =
          value <= minTranslateValue.current
            ? overdrawEnabled
              ? minTranslateValue.current - correctedValue / overdrawFactor
              : minTranslateValue.current
            : value;

        if (!closable && disableDragBeyondMinimumSnapPoint) {
          translateY.value =
            translateYValue >= minSnapPoint ? minSnapPoint : translateYValue;
        } else {
          translateY.value = translateYValue;
        }
      };

      const onEnd = () => {
        if (!gestureEnabled) return;
        deltaYOnGestureStart = 0;
        const isMovingUp = getCurrentPosition() < initialValue.current;

        scrollable(true);

        if (
          (!isMovingUp &&
            getCurrentPosition() < initialValue.current + springOffset) ||
          (isMovingUp &&
            getCurrentPosition() > initialValue.current - springOffset)
        ) {
          moveSheetWithAnimation(1, undefined, undefined, true);
          velocity = 0;
          return;
        }

        if (!isMovingUp) {
          snapBackward(velocity, true);
        } else {
          snapForward(velocity, true);
        }
        velocity = 0;
      };

      return Platform.OS === 'web'
        ? PanResponder.create({
            onMoveShouldSetPanResponder: (_event, gesture) => {
              let vy = gesture.vy < 0 ? gesture.vy * -1 : gesture.vy;
              let vx = gesture.vx < 0 ? gesture.vx * -1 : gesture.vx;
              if (vy < 0.05 || vx > 0.05) {
                return false;
              }

              const activeDraggableNodes = getActiveDraggableNodes(
                _event.nativeEvent.pageX,
                _event.nativeEvent.pageY,
              );
              for (let node of activeDraggableNodes) {
                const scrollRef = resolveScrollRef(node.node.ref);
                offsets.push((scrollRef as HTMLDivElement).scrollTop);
              }
              return true;
            },
            onStartShouldSetPanResponder: (_event, _gesture) => {
              const activeDraggableNodes = getActiveDraggableNodes(
                _event.nativeEvent.pageX,
                _event.nativeEvent.pageY,
              );
              for (let node of activeDraggableNodes) {
                const scrollRef = resolveScrollRef(node.node.ref);
                offsets.push((scrollRef as HTMLDivElement).scrollTop);
              }
              return true;
            },
            onPanResponderMove: (_event, gesture) => {
              onChange(
                _event.nativeEvent.pageX,
                _event.nativeEvent.pageY,
                gesture.dy,
              );
            },
            onPanResponderEnd: onEnd,
          })
        : Gesture.Pan()
            .withRef(panGestureRef)
            .onChange(event =>
              onChange(event.absoluteX, event.absoluteY, event.translationY),
            )
            .runOnJS(true)
            .activeOffsetY([-5, 5])
            .failOffsetX([-5, 5])
            .onEnd(onEnd);
    }, [gestureEnabled]);

    const onTouch = (event: GestureResponderEvent) => {
      onTouchBackdrop?.(event);
      if (enableRouterBackNavigation && router.canGoBack()) {
        router.goBack();
        return;
      }

      let closeRequestResult = true;
      if (onRequestClose) {
        closeRequestResult = onRequestClose?.(CloseRequestType.TOUCH_BACKDROP);
      }

      if (closeOnTouchBackdrop && closable && closeRequestResult) {
        hideSheet();
      }
    };

    const getRef = useCallback(
      (): ActionSheetRef => ({
        show: (snapIndex?: number) => {
          if (typeof snapIndex === 'number') {
            currentSnapIndex.current = snapIndex;
          }
          onBeforeShow?.();
          routerRef.current?.initialNavigation();
          setVisible(true);
        },
        hide: (data: any) => {
          hideSheet(undefined, data, true);
        },
        setModalVisible: (_visible?: boolean) => {
          if (_visible) {
            setVisible(true);
          } else {
            hideSheet();
          }
        },
        snapToOffset: (offset: number) => {
          initialValue.current =
            actionSheetHeight.current +
            minTranslateValue.current -
            (actionSheetHeight.current * offset) / 100;
          translateY.value = withSpring(
            initialValue.current,
            openAnimationConfig,
          );
        },
        snapToRelativeOffset: (offset: number) => {
          if (offset === 0) {
            getRef().snapToIndex(currentSnapIndex.current);
            return;
          }
          const availableHeight =
            actionSheetHeight.current + minTranslateValue.current;
          initialValue.current =
            initialValue.current + initialValue.current * (offset / 100);
          if (initialValue.current > availableHeight) {
            getRef().snapToOffset(100);
            return;
          }
          translateY.value = withSpring(
            initialValue.current,
            openAnimationConfig,
          );
        },
        snapToIndex: (index: number) => {
          if (index > snapPoints.length || index < 0) return;
          if (!visibleRef.current.value) {
            getRef().show(index);
            return;
          }
          currentSnapIndex.current = index;
          initialValue.current = getNextPosition(index);
          translateY.value = withSpring(
            initialValue.current,
            openAnimationConfig,
          );
          notifySnapIndexChanged();
        },
        handleChildScrollEnd: () => {
          console.warn(
            'handleChildScrollEnd has been removed. Please use `useScrollHandlers` hook to enable scrolling in ActionSheet',
          );
        },
        modifyGesturesForLayout: (_id, layout, scrollOffset) => {
          gestureBoundaries.current[_id] = {
            ...layout,
            scrollOffset: scrollOffset,
          };
        },
        currentSnapIndex: () => currentSnapIndex.current,
        isGestureEnabled: () => gestureEnabled,
        isOpen: () => visibleRef.current.value,
        keyboardHandler: (enabled?: boolean) => {
          keyboard.pauseKeyboardHandler.current = enabled;
        },
        ev: internalEventManager,
        currentPayload: () => payloadRef.current as never,
      }),
      [
        internalEventManager,
        onBeforeShow,
        setVisible,
        hideSheet,
        translateY,
        openAnimationConfig,
        snapPoints.length,
        getNextPosition,
        notifySnapIndexChanged,
        gestureEnabled,
        visible,
        keyboard.pauseKeyboardHandler,
      ],
    );

    useImperativeHandle(ref, getRef, [getRef]);

    useEffect(() => {
      if (sheetId) {
        SheetManager.registerRef(sheetId, currentContext, {
          current: getRef(),
        } as RefObject<ActionSheetRef>);
      }
      sheetRef.current = getRef();
    }, [currentContext, getRef, sheetId, sheetRef]);

    const onModalRequestClose = React.useCallback(() => {
      if (enableRouterBackNavigation && routerRef.current?.canGoBack()) {
        routerRef.current?.goBack();
        return;
      }

      let closeRequestResult = true;
      if (onRequestClose) {
        closeRequestResult = onRequestClose?.(CloseRequestType.BACK_PRESS);
      }

      if (visible && closable && closeOnPressBack && closeRequestResult) {
        hideSheet();
      }
    }, [hideSheet, enableRouterBackNavigation, closeOnPressBack, visible]);
    const rootProps = React.useMemo(
      () =>
        isModal && !props.backgroundInteractionEnabled
          ? {
              visible: true,
              animationType: 'none',
              testID: props.testIDs?.modal || props.testID,
              supportedOrientations: SUPPORTED_ORIENTATIONS,
              onShow: props.onOpen,
              onRequestClose: onModalRequestClose,
              transparent: true,
              /**
               * Always true, it causes issue with keyboard handling.
               */
              statusBarTranslucent: true,
            }
          : {
              testID: props.testIDs?.root || props.testID,
              onLayout: () => {
                hardwareBackPressEvent.current = BackHandler.addEventListener(
                  'hardwareBackPress',
                  onHardwareBackPress,
                );
                props?.onOpen?.();
              },
              style: {
                position: 'absolute',
                zIndex: zIndex
                  ? zIndex
                  : sheetId
                    ? getZIndexFromStack(sheetId, currentContext)
                    : 999,
                width: '100%',
                height: '100%',
              },
              pointerEvents: props?.backgroundInteractionEnabled
                ? 'box-none'
                : 'auto',
            },
      [
        currentContext,
        isModal,
        onHardwareBackPress,
        onModalRequestClose,
        props,
        zIndex,
        sheetId,
      ],
    );

    const renderRoute = useCallback(
      (route: Route) => {
        const RouteComponent = route.component as any;
        return (
          <Animated.View
            key={route.name}
            style={{
              display:
                route.name !== router.currentRoute?.name ? 'none' : 'flex',
              opacity: routeOpacity,
            }}>
            <RouterParamsContext.Provider value={route?.params}>
              <RouteComponent
                router={router}
                params={route?.params}
                payload={sheetPayload}
              />
            </RouterParamsContext.Provider>
          </Animated.View>
        );
      },
      [routeOpacity, router, sheetPayload],
    );

    const context = {
      ref: panGestureRef,
      eventManager: internalEventManager,
    };

    const animatedOpacityStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
      };
    }, [opacity]);

    const animatedActionSheetStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: translateY.value,
          },
        ],
        opacity: actionSheetOpacity.value,
      };
    }, [translateY]);

    const animatedUnderlayTranslateStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: underlayTranslateY.value,
          },
        ],
      };
    }, [underlayTranslateY]);

    const GestureMobileOnly =
      Platform.OS === 'web' ? Fragment : GestureDetector;

    return (
      <>
        {visible ? (
          <Root {...rootProps}>
            <GestureHandlerRoot
              isModal={isModal}
              style={styles.parentContainer}
              pointerEvents={
                props?.backgroundInteractionEnabled ? 'box-none' : 'auto'
              }>
              <PanGestureRefContext.Provider value={context}>
                <DraggableNodesContext.Provider value={draggableNodesContext}>
                  <Animated.View
                    onLayout={event => {
                      if (event.nativeEvent.layout.height < 10) return;
                      setDimensions({
                        width: event.nativeEvent.layout.width,
                        height: event.nativeEvent.layout.height,
                      });
                    }}
                    ref={rootViewContainerRef}
                    pointerEvents={
                      props?.backgroundInteractionEnabled ? 'box-none' : 'auto'
                    }
                    style={[
                      styles.parentContainer,
                      {
                        width: '100%',
                        justifyContent: 'flex-end',
                      },
                    ]}>
                    <>
                      {!props?.backgroundInteractionEnabled ? (
                        <AnimatedPressable
                          onPress={onTouch}
                          testID={props.testIDs?.backdrop}
                          style={[
                            {
                              height: dimensions.height + insets.top + 100,
                              width: '100%',
                              position: 'absolute',
                              backgroundColor: overlayColor,
                            },
                            animatedOpacityStyle,
                          ]}
                          {...(props.backdropProps ? props.backdropProps : {})}
                        />
                      ) : null}

                      {dimensions.height === -1 &&
                      Platform.OS === 'web' ? null : (
                        <Animated.View
                          pointerEvents="box-none"
                          style={[
                            {
                              borderTopRightRadius:
                                containerStyle?.borderTopRightRadius || 10,
                              borderTopLeftRadius:
                                containerStyle?.borderTopLeftRadius || 10,
                              backgroundColor:
                                containerStyle?.backgroundColor || 'white',
                              borderBottomLeftRadius:
                                containerStyle?.borderBottomLeftRadius ||
                                undefined,
                              borderBottomRightRadius:
                                containerStyle?.borderBottomRightRadius ||
                                undefined,
                              borderRadius:
                                containerStyle?.borderRadius || undefined,
                              width: containerStyle?.width || '100%',
                              maxWidth: containerStyle?.maxWidth,
                              ...(!disableElevation
                                ? getElevation(
                                    typeof elevation === 'number'
                                      ? elevation
                                      : 5,
                                  )
                                : {}),
                              height: dimensions.height,
                              maxHeight: dimensions.height,
                            },
                            animatedActionSheetStyle,
                          ]}>
                          <GestureMobileOnly
                            {...(Platform.OS === 'web'
                              ? ({} as any)
                              : {
                                  gesture: panGesture as PanGesture,
                                })}>
                            <Animated.View
                              {...((panGesture as any)?.panHandlers || {})}
                              onLayout={event =>
                                onSheetLayout(event.nativeEvent.layout.height)
                              }
                              ref={panViewRef}
                              testID={props.testIDs?.sheet}
                              style={[
                                styles.container,
                                {
                                  borderTopRightRadius: 10,
                                  borderTopLeftRadius: 10,
                                },
                                props.containerStyle,
                                {
                                  maxHeight: keyboard.keyboardShown
                                    ? dimensions.height -
                                      insets.top -
                                      keyboard.keyboardHeight
                                    : dimensions.height - insets.top,
                                  // Using this to trigger layout when keyboard is shown
                                  marginTop: keyboard.keyboardShown ? 0.5 : 0,
                                  paddingBottom:
                                    (Platform.OS === 'ios' &&
                                      keyboard.keyboardShown) ||
                                    !useBottomSafeAreaPadding
                                      ? 0
                                      : insets.bottom,
                                },
                              ]}>
                              {drawUnderStatusBar ? (
                                <Animated.View
                                  style={[
                                    {
                                      height: 130,
                                      position: 'absolute',
                                      top: -80,
                                      backgroundColor:
                                        containerStyle?.backgroundColor ||
                                        'white',
                                      width: '100%',
                                      borderTopRightRadius:
                                        containerStyle?.borderRadius || 10,
                                      borderTopLeftRadius:
                                        containerStyle?.borderRadius || 10,
                                    },
                                    animatedUnderlayTranslateStyle,
                                  ]}
                                />
                              ) : null}
                              {gestureEnabled || props.headerAlwaysVisible ? (
                                props.CustomHeaderComponent ? (
                                  props.CustomHeaderComponent
                                ) : (
                                  <Animated.View
                                    style={[
                                      styles.indicator,
                                      props.indicatorStyle,
                                    ]}
                                  />
                                )
                              ) : null}

                              {router?.hasRoutes() ? (
                                <RouterContext.Provider value={router}>
                                  {router?.stack.map(renderRoute)}
                                </RouterContext.Provider>
                              ) : (
                                props?.children
                              )}
                            </Animated.View>
                          </GestureMobileOnly>

                          {overdrawEnabled ? (
                            <Animated.View
                              style={{
                                position: 'absolute',
                                height: overdrawSize,
                                bottom: -overdrawSize,
                                backgroundColor:
                                  containerStyle?.backgroundColor || 'white',
                                width:
                                  containerStyle?.width || dimensions.width,
                              }}
                            />
                          ) : null}
                        </Animated.View>
                      )}

                      {ExtraOverlayComponent}
                      {props.withNestedSheetProvider}
                      {sheetId ? (
                        <SheetProvider
                          context={providerId.current}
                        />
                      ) : null}
                    </>
                  </Animated.View>
                </DraggableNodesContext.Provider>
              </PanGestureRefContext.Provider>
            </GestureHandlerRoot>
          </Root>
        ) : null}
      </>
    );
  },
);

const GestureHandlerRoot = (props: any) => {
  return props.isModal ? (
    <GestureHandlerRootView
      style={props.style}
      pointerEvents={props.pointerEvents}>
      {props.children}
    </GestureHandlerRootView>
  ) : (
    <>{props.children}</>
  );
};
