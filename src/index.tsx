/* eslint-disable curly */
import React, {
  forwardRef,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  GestureResponderEvent,
  Keyboard,
  LayoutChangeEvent,
  LayoutRectangle,
  Modal,
  NativeEventSubscription,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  GestureType,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  runOnUI,
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
  SheetProvider,
  useProviderContext,
  useSheetIDContext,
  useSheetPayload,
  useSheetRef,
} from './provider';
import {getZIndexFromStack, SheetManager} from './sheetmanager';
import {styles} from './styles';
import type {ActionSheetProps, ActionSheetRef} from './types';
import {getElevation, SUPPORTED_ORIENTATIONS} from './utils';

export default forwardRef<ActionSheetRef, ActionSheetProps>(
  function ActionSheet(
    {
      animated = true,
      closeOnPressBack = true,
      springOffset = 50,
      elevation = 5,
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
      payload,
      routes,
      initialRoute,
      onBeforeShow,
      enableRouterBackNavigation,
      onBeforeClose,
      enableGesturesInScrollView = true,
      disableDragBeyondMinimumSnapPoint,
      useBottomSafeAreaPadding = true,
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
    const sheetRef = useSheetRef();
    const minTranslateValue = useRef(0);
    const keyboardWasVisible = useRef(false);
    const animationListenerId = 266786;
    const id = useSheetIDContext();
    const sheetId = props.id || id;
    const panViewRef = useRef<View>(null);
    const rootViewContainerRef = useRef<View>(null);
    const gestureBoundaries = useRef<{
      [name: string]: LayoutRectangle & {
        scrollOffset?: number;
      };
    }>({});
    const hiding = useRef(false);
    const payloadRef = useRef(payload);
    const sheetPayload = useSheetPayload();
    const panGestureRef = useRef<GestureType>(undefined);
    const closing = useRef(false);
    const draggableNodes = useRef<NodesRef>([]);
    const [dimensions, setDimensions] = useState({
      width: -1,
      height: -1,
    });
    const dimensionsRef = useRef(dimensions);
    dimensionsRef.current = dimensions;
    const containerStyle = StyleSheet.flatten(props.containerStyle);

    const {visible, setVisible} = useSheetManager({
      id: sheetId,
      onHide: data => {
        hideSheet(undefined, data, true);
      },
      onBeforeShow: data => {
        routerRef.current?.initialNavigation();
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
    const translateY = useSharedValue(0);
    const underlayTranslateY = useSharedValue(130);
    const keyboardTranslate = useSharedValue(0);
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
    payloadRef.current = payload;
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
      (velocity?: number, value?: number, min?: number) => {
        let initial = value || initialValue.current;
        let minTranslate = min || minTranslateValue.current;
        if (!animated) {
          translateY.value = initial;
          return;
        }

        const config = props.openAnimationConfig;
        const correctedValue = initial > minTranslate ? initial : 0;

        notifyOffsetChange(correctedValue as number);
        translateY.value = withSpring(
          initial,
          config || {
            velocity: typeof velocity !== 'number' ? undefined : velocity,
            damping: 150,
          },
        );

        notifySnapIndexChanged();
      },
      [animated, props.openAnimationConfig],
    );

    const animationSheetOpacity = React.useCallback((value: number) => {
      opacity.value = withTiming(value, {
        duration: 150,
        easing: Easing.in(Easing.ease),
      });
    }, []);

    const hideSheetWithAnimation = React.useCallback(
      (vy?: number, callback?: () => void) => {
        if (!animated) {
          callback?.();
          return;
        }
        const config = props.closeAnimationConfig;
        animationSheetOpacity(0);
        translateY.value = withTiming(
          dimensionsRef.current.height * 1.3,
          config || {
            velocity: typeof vy !== 'number' ? 3.0 : vy + 1,
            duration: 200,
          },
        );
        setTimeout(callback, 150);
      },
      [animated, animationSheetOpacity, props.closeAnimationConfig],
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
      async (event: LayoutChangeEvent) => {
        const sheetHeight = event.nativeEvent.layout.height;
        if (dimensionsRef.current.height === -1) {
          return;
        }
        // await waitAsync(10);
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
          translateY.value = rootViewHeight * 1.1;
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

        animationSheetOpacity(1);
        moveSheetWithAnimation(undefined, initial, minTranslate);

        if (initial > 130) {
          underlayTranslateY.value = 130;
        }
        if (Platform.OS === 'web') {
          document.body.style.overflowY = 'hidden';
          document.documentElement.style.overflowY = 'hidden';
        }
      },
      [
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
      (vy?: number, data?: any, isSheetManagerOrRef?: boolean) => {
        if (hiding.current) return;
        if (!closable && !isSheetManagerOrRef) {
          moveSheetWithAnimation(vy);
          return;
        }
        hiding.current = true;
        onBeforeClose?.((data || payloadRef.current || data) as never);
        if (closable) {
          closing.current = true;
          Keyboard.dismiss();
          // translateY.removeListener(245);
        }
        hideSheetWithAnimation(vy, () => {
          if (closable || isSheetManagerOrRef) {
            setVisible(false);
            if (props.onClose) {
              props.onClose?.((data || payloadRef.current || data) as never);
              hiding.current = false;
            }
            hardwareBackPressEvent.current?.remove();
            if (sheetId) {
              SheetManager.remove(sheetId, currentContext);
              hiding.current = false;
              actionSheetEventManager.publish(
                `onclose_${sheetId}`,
                data || payloadRef.current || data,
                currentContext,
              );
            } else {
              hiding.current = false;
            }
            currentSnapIndex.current = initialSnapIndex;
            closing.current = false;
            initialValue.current = -1;
            keyboard.reset();
          } else {
            opacity.value = 1;
            moveSheetWithAnimation();
          }
        });
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
        setVisible,
        keyboard,
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
      if (visible && closable && closeOnPressBack) {
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
      (vy: number) => {
        if (currentSnapIndex.current === snapPoints.length - 1) {
          const next = getNextPosition(currentSnapIndex.current);
          moveSheetWithAnimation(vy, next);
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
          moveSheetWithAnimation(vy);
          return;
        }
        currentSnapIndex.current = nextSnapIndex;
        const next = getNextPosition(currentSnapIndex.current);
        initialValue.current = next;
        moveSheetWithAnimation(vy, next);
      },
      [getCurrentPosition, getNextPosition, moveSheetWithAnimation, snapPoints],
    );
    /**
     * Snap towards the bottom
     */
    const snapBackward = React.useCallback(
      (vy: number) => {
        if (currentSnapIndex.current === 0) {
          if (closable) {
            initialValue.current = dimensionsRef.current.height * 1.3;
            setTimeout(() => hideSheet(vy));
          } else {
            const next = getNextPosition(currentSnapIndex.current);
            moveSheetWithAnimation(vy, next);
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
              hideSheet(vy);
              return;
            }
          }
        }

        if (nextSnapPoint < 0) {
          console.warn('Snap points should range between 0 to 100.');
          moveSheetWithAnimation(vy);
          return;
        }
        currentSnapIndex.current = nextSnapIndex;
        const next = getNextPosition(currentSnapIndex.current);
        initialValue.current = next;
        moveSheetWithAnimation(vy);
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
          if (Platform.OS === 'ios') {
            if (!value) {
              if (!offsets[i] || node.offset.current?.y === 0) {
                offsets[i] = node.offset.current?.y || 0;
              }
              scrollRef.scrollTo({
                x: 0,
                y: offsets[i],
                animated: false,
              });
            } else {
              offsets[i] = node.offset.current?.y || 0;
            }
          } else {
            scrollRef?.setNativeProps({
              scrollEnabled: value,
              pointerEvents: value ? 'auto' : 'none',
            });
          }
        }
      }

      let blockPan = false;

      const onChangeJs = (translationY, absoluteX, absoluteY) => {
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

        if (activeDraggableNodes.length > 0 && !isRefreshing) {
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
            if (blockPan) {
              deltaYOnGestureStart = prevDeltaY;
            }
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
              if (blockPan) {
                deltaYOnGestureStart = prevDeltaY;
              }
              blockPan = false;
            }
          }

          // 4. Sheet fully open, scroll offset > 0, scrolling: true, panning: false will transition into scrolling: false, panning: true, once scroll reaches offset=0
          if (isFullOpen && isSwipingDown) {
            if (nodeIsScrolling) {
              scrollable(true);
              blockPan = true;
            } else {
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
                if (blockPan) {
                  deltaYOnGestureStart = prevDeltaY;
                }
                blockPan = false;
              }
            }
          }
        } else {
          blockPan = false;
        }

        if (isRefreshing) {
          blockPan = true;
          scrollable(true);
        }

        let value = oldValue;
        if (!deltaYOnGestureStart) {
          deltaYOnGestureStart = deltaY;
        }
        deltaY = deltaY - deltaYOnGestureStart;
        if (!blockPan) {
          value = initialValue.current + deltaY;
          oldValue = value;
        }

        console.log(deltaY, 'deltaY');

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
      const onEndJs = () => {
        if (!gestureEnabled) return;
        deltaYOnGestureStart = 0;
        const isMovingUp = getCurrentPosition() < initialValue.current;

        if (
          (!isMovingUp &&
            getCurrentPosition() < initialValue.current + springOffset) ||
          (isMovingUp &&
            getCurrentPosition() > initialValue.current - springOffset)
        ) {
          moveSheetWithAnimation(1);
          velocity = 0;
          return;
        }

        if (!isMovingUp) {
          snapBackward(velocity);
        } else {
          snapForward(velocity);
        }
        velocity = 0;
      };

      return Gesture.Pan()
        .withRef(panGestureRef)
        .onChange(event => {
          const {absoluteX, absoluteY, translationY} = event;
          runOnJS(onChangeJs)(translationY, absoluteX, absoluteY);
        })
        .onEnd(() => {
          runOnJS(onEndJs)();
        });
    }, [gestureEnabled]);

    const onTouch = (event: GestureResponderEvent) => {
      onTouchBackdrop?.(event);
      if (enableRouterBackNavigation && router.canGoBack()) {
        router.goBack();
        return;
      }
      if (closeOnTouchBackdrop && closable) {
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
            props.openAnimationConfig || {damping: 150},
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
            props.openAnimationConfig || {damping: 150},
          );
        },
        snapToIndex: (index: number) => {
          if (index > snapPoints.length || index < 0) return;
          currentSnapIndex.current = index;
          initialValue.current = getNextPosition(index);
          translateY.value = withSpring(
            initialValue.current,
            props.openAnimationConfig || {damping: 150},
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
        isOpen: () => visible,
        keyboardHandler: (enabled?: boolean) => {
          keyboard.pauseKeyboardHandler.current = enabled;
        },
        ev: internalEventManager,
      }),
      [
        internalEventManager,
        onBeforeShow,
        setVisible,
        hideSheet,
        translateY,
        props.openAnimationConfig,
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

    const onRequestClose = React.useCallback(() => {
      if (enableRouterBackNavigation && routerRef.current?.canGoBack()) {
        routerRef.current?.goBack();
        return;
      }
      if (visible && closeOnPressBack) {
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
              onRequestClose: onRequestClose,
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
        onRequestClose,
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
                        opacity: opacity,
                        width: '100%',
                        justifyContent: 'flex-end',
                        transform: [
                          {
                            translateY: keyboardTranslate,
                          },
                        ],
                      },
                    ]}>
                    <>
                      {!props?.backgroundInteractionEnabled ? (
                        <TouchableOpacity
                          onPress={onTouch}
                          activeOpacity={defaultOverlayOpacity}
                          testID={props.testIDs?.backdrop}
                          style={{
                            height: dimensions.height + insets.top + 100,
                            width: '100%',
                            position: 'absolute',
                            backgroundColor: overlayColor,
                            opacity: defaultOverlayOpacity,
                          }}
                          {...(props.backdropProps ? props.backdropProps : {})}
                        />
                      ) : null}

                      <Animated.View
                        pointerEvents="box-none"
                        style={{
                          borderTopRightRadius:
                            containerStyle?.borderTopRightRadius || 10,
                          borderTopLeftRadius:
                            containerStyle?.borderTopLeftRadius || 10,
                          backgroundColor:
                            containerStyle?.backgroundColor || 'white',
                          borderBottomLeftRadius:
                            containerStyle?.borderBottomLeftRadius || undefined,
                          borderBottomRightRadius:
                            containerStyle?.borderBottomRightRadius ||
                            undefined,
                          borderRadius:
                            containerStyle?.borderRadius || undefined,
                          width: containerStyle?.width || '100%',
                          ...getElevation(
                            typeof elevation === 'number' ? elevation : 5,
                          ),
                          flex: undefined,
                          height: dimensions.height,
                          maxHeight: dimensions.height,
                          opacity: !dimensions.height ? 0 : 1,
                          transform: [
                            {
                              translateY: translateY,
                            },
                          ],
                        }}>
                        <GestureDetector gesture={panGesture}>
                          <Animated.View
                            onLayout={onSheetLayout}
                            ref={panViewRef}
                            testID={props.testIDs?.sheet}
                            style={[
                              styles.container,
                              {
                                borderTopRightRadius: 10,
                                borderTopLeftRadius: 10,
                                paddingBottom: useBottomSafeAreaPadding
                                  ? insets.bottom
                                  : 0,
                              },
                              props.containerStyle,
                              {
                                maxHeight: keyboard.keyboardShown
                                  ? dimensions.height -
                                    insets.top -
                                    keyboard.keyboardHeight
                                  : dimensions.height - insets.top,
                                marginTop: keyboard.keyboardShown ? 0.5 : 0,
                              },
                            ]}>
                            {drawUnderStatusBar ? (
                              <Animated.View
                                style={{
                                  height: 130,
                                  position: 'absolute',
                                  top: -80,
                                  backgroundColor:
                                    containerStyle?.backgroundColor || 'white',
                                  width: '100%',
                                  borderTopRightRadius:
                                    containerStyle?.borderRadius || 10,
                                  borderTopLeftRadius:
                                    containerStyle?.borderRadius || 10,
                                  transform: [
                                    {
                                      translateY: underlayTranslateY,
                                    },
                                  ],
                                }}
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

                            <View
                              style={{
                                flexShrink: 1,
                              }}>
                              {router?.hasRoutes() ? (
                                <RouterContext.Provider value={router}>
                                  {router?.stack.map(renderRoute)}
                                </RouterContext.Provider>
                              ) : (
                                props?.children
                              )}
                            </View>
                          </Animated.View>
                        </GestureDetector>

                        {overdrawEnabled ? (
                          <Animated.View
                            style={{
                              position: 'absolute',
                              height: overdrawSize,
                              bottom: -overdrawSize,
                              backgroundColor:
                                containerStyle?.backgroundColor || 'white',
                              width: containerStyle?.width || dimensions.width,
                            }}
                          />
                        ) : null}
                      </Animated.View>

                      {ExtraOverlayComponent}
                      {props.withNestedSheetProvider}
                      {sheetId ? (
                        <SheetProvider
                          context={`$$-auto-${sheetId}-${currentContext}-provider`}
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
