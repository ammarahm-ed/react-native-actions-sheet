/* eslint-disable curly */
import React, {
  forwardRef,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  GestureResponderEvent,
  Keyboard,
  LayoutChangeEvent,
  LayoutRectangle,
  Modal,
  NativeEventSubscription,
  PanResponder,
  Platform,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerProps,
} from 'react-native-gesture-handler';
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
import {resolveScrollRef, ScrollState} from './hooks/use-scroll-handlers';
import useSheetManager from './hooks/use-sheet-manager';
import {useKeyboard} from './hooks/useKeyboard';
import {
  SheetProvider,
  useProviderContext,
  useSheetIDContext,
  useSheetPayload,
  useSheetRef,
} from './provider';
import {
  getZIndexFromStack,
  isRenderedOnTop,
  SheetManager,
} from './sheetmanager';
import {styles} from './styles';
import type {ActionSheetProps, ActionSheetRef} from './types';
import {getElevation, SUPPORTED_ORIENTATIONS} from './utils';

const EVENTS_INTERNAL = {
  safeAreaLayout: 'safeAreaLayout',
};

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
      safeAreaInsets,
      routes,
      initialRoute,
      onBeforeShow,
      enableRouterBackNavigation,
      onBeforeClose,
      enableGesturesInScrollView = true,
      disableDragBeyondMinimumSnapPoint,
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
    const safeAreaPaddings = useRef<{
      top: number;
      left: number;
      right: number;
      bottom: number;
    }>(
      safeAreaInsets || {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      },
    );

    const internalEventManager = React.useMemo(() => new EventManager(), []);
    const currentContext = useProviderContext();
    const currentSnapIndex = useRef(initialSnapIndex);
    const sheetRef = useSheetRef();
    const dimensionsRef = useRef<{
      width: number;
      height: number;
      portrait: boolean;
      paddingBottom?: number;
    }>({
      width: 0,
      height: 0,
      portrait: true,
    });
    const minTranslateValue = useRef(0);
    const keyboardWasVisible = useRef(false);
    const prevKeyboardHeight = useRef(0);
    const id = useSheetIDContext();
    const sheetId = props.id || id;
    const lock = useRef(false);
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
    const panHandlerRef = useRef();
    const closing = useRef(false);
    const draggableNodes = useRef<NodesRef>([]);
    const sheetLayoutRef = useRef<LayoutRectangle>();
    const [dimensions, setDimensions] = useState<{
      width: number;
      height: number;
      portrait: boolean;
      paddingBottom?: number;
    }>({
      width: Dimensions.get('window').width,
      height: 0,
      portrait: true,
      paddingBottom: props?.useBottomSafeAreaPadding ? 25 : 0,
    });
    const rootViewLayoutEventValues = useRef<{
      timer?: NodeJS.Timeout;
      sub?: {unsubscribe: () => void};
      firstEventFired?: boolean;
      layouTimer?: NodeJS.Timeout;
      resizing?: boolean;
    }>({});

    if (safeAreaInsets) {
      safeAreaPaddings.current = safeAreaInsets;
    }

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
    const animations = useMemo(
      () => ({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
        underlayTranslateY: new Animated.Value(100),
        keyboardTranslate: new Animated.Value(0),
        routeOpacity: new Animated.Value(0),
      }),
      [],
    );
    const animationListeners = useRef<{
      translateY?: string;
    }>({});

    const router = useRouter({
      routes: routes,
      getRef: () => getRef(),
      initialRoute: initialRoute as string,
      onNavigate: props.onNavigate,
      onNavigateBack: props.onNavigateBack,
      routeOpacity: animations.routeOpacity,
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.onSnapIndexChange]);

    const returnAnimation = React.useCallback(
      (velocity?: number) => {
        if (!animated) {
          animations.translateY.setValue(initialValue.current);
          return;
        }
        const config = props.openAnimationConfig;

        const correctedValue =
          initialValue.current > minTranslateValue.current
            ? initialValue.current
            : 0;

        notifyOffsetChange(correctedValue as number);

        if (!config) {
          Animated.spring(animations.translateY, {
            toValue: initialValue.current,
            useNativeDriver: true,
            friction: 8,
            ...config,
            velocity: typeof velocity !== 'number' ? undefined : velocity,
          }).start();
        } else {
          Animated.spring(animations.translateY, {
            toValue: initialValue.current,
            useNativeDriver: true,
            ...config,
            velocity: typeof velocity !== 'number' ? undefined : velocity,
          }).start();
        }

        notifySnapIndexChanged();
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [animated, props.openAnimationConfig],
    );

    const opacityAnimation = React.useCallback(
      (opacity: number) => {
        Animated.timing(animations.opacity, {
          duration: 150,
          easing: Easing.in(Easing.ease),
          toValue: opacity,
          useNativeDriver: true,
        }).start();
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    const hideAnimation = React.useCallback(
      (vy?: number, callback?: ({finished}: {finished: boolean}) => void) => {
        if (!animated) {
          callback?.({finished: true});
          return;
        }
        const config = props.closeAnimationConfig;
        opacityAnimation(0);
        const animation = Animated.spring(animations.translateY, {
          velocity: typeof vy !== 'number' ? 3.0 : vy + 1,
          toValue: dimensionsRef.current.height * 1.3,
          useNativeDriver: true,
          ...config,
        });
        animation.start();
        setTimeout(() => {
          animation.stop();
          callback?.({finished: true});
        }, 150);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [animated, opacityAnimation, props.closeAnimationConfig],
    );

    const getCurrentPosition = React.useCallback(() => {
      //@ts-ignore
      return animations.translateY._value <= minTranslateValue.current + 5
        ? 0
        : //@ts-ignore
          (animations.translateY._value as number);
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const hardwareBackPressEvent = useRef<NativeEventSubscription>();
    const Root: React.ElementType =
      isModal && !props?.backgroundInteractionEnabled ? Modal : Animated.View;

    useEffect(() => {
      let animationListener;
      if (drawUnderStatusBar || props.onChange) {
        animationListener = animations.translateY.addListener(value => {
          const correctedValue =
            value.value > minTranslateValue.current
              ? value.value - minTranslateValue.current
              : 0;
          props?.onChange?.(correctedValue, actionSheetHeight.current);
          if (drawUnderStatusBar) {
            if (lock.current) return;
            const correctedHeight = keyboard.keyboardShown
              ? dimensionsRef.current.height -
                (keyboard.keyboardHeight + safeAreaPaddings.current.bottom)
              : dimensionsRef.current.height - safeAreaPaddings.current.bottom;

            if (actionSheetHeight.current >= correctedHeight - 1) {
              if (value.value < 100) {
                animations.underlayTranslateY.setValue(
                  Math.max(value.value - 20, -20),
                );
              } else {
                //@ts-ignore
                if (animations.underlayTranslateY._value !== 100) {
                  animations.underlayTranslateY.setValue(100);
                }
              }
            } else {
              //@ts-ignore
              if (animations.underlayTranslateY._value !== 100) {
                animations.underlayTranslateY.setValue(100);
              }
            }
          }
        });
      }
      animationListeners.current.translateY = animationListener;
      return () => {
        animationListener &&
          animations.translateY.removeListener(animationListener);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props?.id, keyboard.keyboardShown, keyboard.keyboardHeight]);

    const onSheetLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        sheetLayoutRef.current = {...event.nativeEvent.layout};
        if (rootViewLayoutEventValues.current.resizing) return;
        if (closing.current) return;
        const rootViewHeight = dimensionsRef.current?.height;

        actionSheetHeight.current =
          event.nativeEvent.layout.height > dimensionsRef.current.height
            ? dimensionsRef.current.height
            : event.nativeEvent.layout.height;
        minTranslateValue.current =
          rootViewHeight -
          (actionSheetHeight.current + safeAreaPaddings.current.bottom);

        if (initialValue.current < 0) {
          animations.translateY.setValue(rootViewHeight * 1.1);
        }
        const nextInitialValue =
          actionSheetHeight.current +
          minTranslateValue.current -
          (actionSheetHeight.current * snapPoints[currentSnapIndex.current]) /
            100;

        initialValue.current =
          (keyboard.keyboardShown || keyboardWasVisible.current) &&
          initialValue.current <= nextInitialValue &&
          initialValue.current >= minTranslateValue.current
            ? initialValue.current
            : nextInitialValue;

        const sheetBottomEdgePosition =
          initialValue.current +
          (actionSheetHeight.current * snapPoints[currentSnapIndex.current]) /
            100;

        const sheetPositionWithKeyboard =
          sheetBottomEdgePosition -
          (dimensionsRef.current?.height - keyboard.keyboardHeight);

        initialValue.current =
          sheetPositionWithKeyboard > 0
            ? initialValue.current - sheetPositionWithKeyboard
            : initialValue.current;

        if (keyboard.keyboardShown) {
          minTranslateValue.current =
            minTranslateValue.current -
            (keyboard.keyboardHeight + safeAreaPaddings.current.bottom);

          keyboardWasVisible.current = true;
          prevKeyboardHeight.current = keyboard.keyboardHeight;
        } else {
          keyboardWasVisible.current = false;
        }
        opacityAnimation(1);
        setTimeout(() => {
          returnAnimation();
        }, 1);

        if (initialValue.current > 100) {
          if (lock.current) return;
          animations.underlayTranslateY.setValue(100);
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
        opacityAnimation,
        animations.translateY,
        animations.underlayTranslateY,
        returnAnimation,
      ],
    );

    const onRootViewLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        if (keyboard.keyboardShown && !isModal) {
          return;
        }

        rootViewLayoutEventValues.current.resizing = true;

        let rootViewHeight = event.nativeEvent.layout.height;
        let rootViewWidth = event.nativeEvent.layout.width;

        rootViewLayoutEventValues.current.sub?.unsubscribe();
        rootViewLayoutEventValues.current.sub = internalEventManager.subscribe(
          EVENTS_INTERNAL.safeAreaLayout,
          () => {
            rootViewLayoutEventValues.current.sub?.unsubscribe();
            const safeMarginFromTop =
              Platform.OS === 'ios'
                ? safeAreaPaddings.current.top < 20
                  ? 20
                  : safeAreaPaddings.current.top
                : StatusBar.currentHeight || 0;

            let height = rootViewHeight - safeMarginFromTop;
            let width = rootViewWidth;

            dimensionsRef.current = {
              width: width,
              height: height,
              portrait: width < height,
            };

            setDimensions({...dimensionsRef.current});
            rootViewLayoutEventValues.current.resizing = false;

            if (sheetLayoutRef.current) {
              onSheetLayout({
                nativeEvent: {
                  layout: sheetLayoutRef.current,
                },
              } as any);
            }
          },
        );

        clearTimeout(rootViewLayoutEventValues.current.timer);
        clearTimeout(rootViewLayoutEventValues.current.layouTimer);

        if (
          safeAreaPaddings.current.top !== undefined ||
          Platform.OS !== 'ios'
        ) {
          rootViewLayoutEventValues.current.layouTimer = setTimeout(
            () => {
              internalEventManager.publish(EVENTS_INTERNAL.safeAreaLayout);
            },
            Platform.OS === 'ios' ||
              rootViewLayoutEventValues.current.firstEventFired
              ? 0
              : 300,
          );
        }

        if (!rootViewLayoutEventValues.current?.firstEventFired) {
          rootViewLayoutEventValues.current.firstEventFired = true;
        }
      },
      [keyboard.keyboardShown, isModal, internalEventManager, onSheetLayout],
    );

    const hideSheet = React.useCallback(
      (vy?: number, data?: any, isSheetManagerOrRef?: boolean) => {
        if (hiding.current) return;
        if (!closable && !isSheetManagerOrRef) {
          returnAnimation(vy);
          return;
        }
        hiding.current = true;
        onBeforeClose?.((data || payloadRef.current || data) as never);
        setTimeout(() => {
          if (closable) {
            closing.current = true;
            Keyboard.dismiss();
            animationListeners.current.translateY &&
              animations.translateY.removeListener(
                animationListeners.current.translateY,
              );
            animationListeners.current.translateY = undefined;
          }
          hideAnimation(vy, ({finished}) => {
            if (finished) {
              if (closable || isSheetManagerOrRef) {
                setVisible(false);
                if (props.onClose) {
                  props.onClose?.(
                    (data || payloadRef.current || data) as never,
                  );
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
                setTimeout(() => {
                  keyboard.reset();
                });
              } else {
                animations.opacity.setValue(1);
                returnAnimation();
              }
            }
          });
        }, 1);
        if (Platform.OS === 'web') {
          document.body.style.overflowY = 'auto';
          document.documentElement.style.overflowY = 'auto';
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        closable,
        hideAnimation,
        props.onClose,
        returnAnimation,
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
          initialValue.current = getNextPosition(currentSnapIndex.current);
          returnAnimation(vy);
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
          returnAnimation(vy);
          return;
        }
        currentSnapIndex.current = nextSnapIndex;
        initialValue.current = getNextPosition(currentSnapIndex.current);

        returnAnimation(vy);
      },
      [getCurrentPosition, getNextPosition, returnAnimation, snapPoints],
    );
    /**
     * Snap towards the bottom
     */
    const snapBackward = React.useCallback(
      (vy: number) => {
        if (currentSnapIndex.current === 0) {
          if (closable) {
            initialValue.current = dimensionsRef.current.height * 1.3;
            hideSheet(vy);
          } else {
            initialValue.current = getNextPosition(currentSnapIndex.current);
            returnAnimation(vy);
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
        }

        if (nextSnapPoint < 0) {
          console.warn('Snap points should range between 0 to 100.');
          returnAnimation(vy);
          return;
        }
        currentSnapIndex.current = nextSnapIndex;
        initialValue.current = getNextPosition(currentSnapIndex.current);
        returnAnimation(vy);
      },
      [
        closable,
        getCurrentPosition,
        getNextPosition,
        hideSheet,
        returnAnimation,
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
      (absoluteX: number, absoluteY: number) => {
        if (draggableNodes.current?.length === 0) return [];
        const activeNodes = [];
        for (let node of draggableNodes.current) {
          const rect = getRectBoundary(node.rect.current);
          if (rect.boundryX === 0 && rect.boundryY === 0) continue;
          if (
            absoluteX > rect.px &&
            absoluteY > rect.py &&
            absoluteX < rect.boundryX &&
            absoluteY < rect.boundryY
          ) {
            activeNodes.push({
              rectWithBoundry: rect,
              node: node,
            });
          }
        }
        return activeNodes;
      },
      [],
    );

    const panHandlers: PanGestureHandlerProps = React.useMemo(() => {
      let velocity = 0;
      let prevDeltaY = 0;
      let offsets: number[] = [];
      let lockGesture = false;
      let gestureEventCounter = 0;
      let isScrollingGesture = false;
      let deltaYOnGestureStart = 0;
      let start: {
        x: number;
        y: number;
      };

      function scrollable(value: boolean) {
        if (Platform.OS === 'ios') return;
        for (let i = 0; i < draggableNodes.current.length; i++) {
          const node = draggableNodes.current[i];
          const scrollRef = resolveScrollRef(node.ref);
          scrollRef?.setNativeProps({
            scrollEnabled: value,
          });
        }
      }

      return Platform.OS === 'web'
        ? {enabled: false}
        : ({
            onBegan: () => {
              if (Platform.OS === 'android') {
                scrollable(false);
              }
            },
            onGestureEvent(event) {
              if (
                sheetId &&
                id === sheetId &&
                !isRenderedOnTop(sheetId, currentContext)
              )
                return;

              const gesture = event.nativeEvent;
              let deltaY = gesture.translationY;
              const swipingDown = prevDeltaY < deltaY;

              prevDeltaY = deltaY;

              if (!start) {
                start = {
                  x: event.nativeEvent.absoluteX,
                  y: event.nativeEvent.absoluteY,
                };
              }
              const activeDraggableNodes = getActiveDraggableNodes(
                start.x,
                start.y,
              );
              const isFullOpen = getCurrentPosition() === 0;
              let blockSwipeGesture = false;

              if (activeDraggableNodes.length > 0) {
                if (isFullOpen) {
                  if (swipingDown) {
                    for (const node of activeDraggableNodes) {
                      if (!node.node.offset.current) continue;
                      const {y} = node.node.offset.current;
                      if (y === ScrollState.END) {
                        blockSwipeGesture = true;
                        continue;
                      }
                      if (y < 1 && node.node.handlerConfig.hasRefreshControl) {
                        // Refresh Control will work in to 15% area of the DraggableNode.
                        const refreshControlBounds =
                          node.rectWithBoundry.py +
                          node.rectWithBoundry.h *
                            node.node.handlerConfig.refreshControlBoundary;
                        if (!refreshControlBounds) continue;
                        if (
                          event.nativeEvent.absoluteY < refreshControlBounds
                        ) {
                          lockGesture = true;
                          blockSwipeGesture = false;
                          continue;
                        } else {
                          blockSwipeGesture = false;
                          continue;
                        }
                      }

                      if (y > 1) {
                        blockSwipeGesture = true;
                        continue;
                      }
                    }
                  } else {
                    for (const node of activeDraggableNodes) {
                      if (!node.node.offset.current) continue;
                      const {y} = node.node.offset.current;

                      // Swiping up
                      // 1. Scroll if the scroll container has not reached end
                      // 2. Don't scroll if sheet has not reached the top
                      if (
                        // Scroll has not reached end
                        y !== ScrollState.END
                      ) {
                        blockSwipeGesture = true;
                        continue;
                      }
                    }
                  }
                }
              }

              gestureEventCounter++;
              if (isFullOpen && (blockSwipeGesture || lockGesture)) {
                isScrollingGesture = true;
                scrollable(true);
                return;
              }

              const startY =
                event.nativeEvent.y - event.nativeEvent.translationY;
              if (!enableGesturesInScrollView && startY > 100) {
                return;
              }

              if (gestureEventCounter < 2) {
                return;
              }

              if (swipingDown || !isFullOpen) {
                if (Platform.OS === 'ios') {
                  for (let i = 0; i < draggableNodes.current.length; i++) {
                    const node = draggableNodes.current[i];
                    const scrollRef = resolveScrollRef(node.ref);
                    if (!offsets[i] || node.offset.current?.y === 0) {
                      offsets[i] = node.offset.current?.y || 0;
                    }
                    scrollRef.scrollTo({
                      x: 0,
                      y: offsets[i],
                      animated: false,
                    });
                  }
                }
              }

              if (!isFullOpen) {
                isScrollingGesture = false;
                blockSwipeGesture = false;
              }

              if (isScrollingGesture && !swipingDown) {
                return scrollable(true);
              } else {
                scrollable(false);
              }

              isScrollingGesture = false;

              if (!deltaYOnGestureStart) {
                deltaYOnGestureStart = deltaY;
              }
              deltaY = deltaY - deltaYOnGestureStart;

              const value = initialValue.current + deltaY;

              velocity = 1;

              const correctedValue =
                //@ts-ignore
                value <= minTranslateValue.current
                  ? //@ts-ignore
                    minTranslateValue.current - value
                  : //@ts-ignore
                    value;

              if (
                //@ts-ignore
                correctedValue / overdrawFactor >= overdrawSize &&
                deltaY <= 0
              ) {
                return;
              }

              const minSnapPoint = getNextPosition(0);
              const translateYValue =
                value <= minTranslateValue.current
                  ? overdrawEnabled
                    ? minTranslateValue.current -
                      correctedValue / overdrawFactor
                    : minTranslateValue.current
                  : value;

              if (!closable && disableDragBeyondMinimumSnapPoint) {
                animations.translateY.setValue(
                  translateYValue >= minSnapPoint
                    ? minSnapPoint
                    : translateYValue,
                );
              } else {
                animations.translateY.setValue(translateYValue);
              }
            },
            failOffsetX: [-20, 20],
            activeOffsetY: [-5, 5],
            onEnded() {
              deltaYOnGestureStart = 0;
              offsets = [];
              start = undefined;
              isScrollingGesture = false;
              gestureEventCounter = 0;
              lockGesture = false;
              const isMovingUp = getCurrentPosition() < initialValue.current;

              // When finger is lifted, we enable scrolling on all
              // scrollable nodes again
              scrollable(true);

              if (
                (!isMovingUp &&
                  getCurrentPosition() < initialValue.current + springOffset) ||
                (isMovingUp &&
                  getCurrentPosition() > initialValue.current - springOffset)
              ) {
                returnAnimation(1);
                velocity = 0;
                return;
              }

              if (!isMovingUp) {
                snapBackward(velocity);
              } else {
                snapForward(velocity);
              }
              velocity = 0;
            },
            enabled: gestureEnabled,
          } as PanGestureHandlerProps);
    }, [
      animations.translateY,
      closable,
      currentContext,
      disableDragBeyondMinimumSnapPoint,
      enableGesturesInScrollView,
      gestureEnabled,
      getActiveDraggableNodes,
      getCurrentPosition,
      getNextPosition,
      overdrawEnabled,
      overdrawFactor,
      overdrawSize,
      returnAnimation,
      sheetId,
      snapBackward,
      snapForward,
      springOffset,
    ]);

    const handlers = React.useMemo(() => {
      let prevDeltaY = 0;
      let lockGesture = false;
      let offsets: number[] = [];
      let start: {x: number; y: number} | undefined;
      let deltaYOnGestureStart = 0;

      return !gestureEnabled || Platform.OS !== 'web'
        ? {panHandlers: {}}
        : PanResponder.create({
            onMoveShouldSetPanResponder: (_event, gesture) => {
              if (
                sheetId &&
                id === sheetId &&
                !isRenderedOnTop(sheetId, currentContext)
              )
                return false;
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
              if (
                sheetId &&
                id === sheetId &&
                !isRenderedOnTop(sheetId, currentContext)
              )
                return false;
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
              let deltaY = gesture.dy;
              const swipingDown = prevDeltaY < deltaY;
              prevDeltaY = deltaY;
              const isFullOpen = getCurrentPosition() === 0;
              let blockSwipeGesture = false;
              if (!start) {
                start = {
                  x: _event.nativeEvent.pageX,
                  y: _event.nativeEvent.pageY,
                };
              }
              const activeDraggableNodes = getActiveDraggableNodes(
                start.x,
                start.y,
              );

              if (activeDraggableNodes.length > 0) {
                if (isFullOpen) {
                  if (swipingDown) {
                    for (let i = 0; i < activeDraggableNodes.length; i++) {
                      const node = activeDraggableNodes[i];
                      if (!node.node.offset.current) continue;
                      const {y} = node.node.offset.current;
                      if (y === ScrollState.END) {
                        blockSwipeGesture = true;
                        const scrollRef = resolveScrollRef(node.node.ref);
                        offsets[i] = (scrollRef as HTMLDivElement).scrollTop;
                        continue;
                      }
                      if (
                        y === 0 &&
                        node.node.handlerConfig.hasRefreshControl
                      ) {
                        // Refresh Control will work in to 15% area of the DraggableNode.
                        const refreshControlBounds =
                          node.rectWithBoundry.py +
                          node.rectWithBoundry.h *
                            node.node.handlerConfig.refreshControlBoundary;
                        if (!refreshControlBounds) continue;
                        if (_event.nativeEvent.pageY < refreshControlBounds) {
                          lockGesture = true;
                          blockSwipeGesture = false;
                          continue;
                        } else {
                          blockSwipeGesture = false;
                          continue;
                        }
                      }
                      if (y > 5) {
                        blockSwipeGesture = true;
                        const scrollRef = resolveScrollRef(node.node.ref);
                        offsets[i] = (scrollRef as HTMLDivElement).scrollTop;

                        continue;
                      }
                    }
                  } else {
                    for (let i = 0; i < activeDraggableNodes.length; i++) {
                      const node = activeDraggableNodes[i];
                      if (!node.node.offset.current) continue;
                      const {y} = node.node.offset.current;
                      if (y > -1) {
                        blockSwipeGesture = true;
                        continue;
                      }
                    }
                  }
                } else {
                  for (let i = 0; i < activeDraggableNodes.length; i++) {
                    const node = activeDraggableNodes[i];
                    const scrollRef = resolveScrollRef(node.node.ref);
                    (scrollRef as HTMLDivElement).scrollTop = offsets[i];
                  }
                }
              }
              if (blockSwipeGesture || lockGesture) {
                return;
              }

              const startY = gesture.moveY - gesture.dy;
              if (!enableGesturesInScrollView && startY > 100) {
                return;
              }

              if (!deltaYOnGestureStart) {
                deltaYOnGestureStart = deltaY;
              }

              deltaY = deltaY - deltaYOnGestureStart;

              const value = initialValue.current + deltaY;
              const correctedValue =
                //@ts-ignore
                value <= minTranslateValue.current
                  ? //@ts-ignore
                    minTranslateValue.current - value
                  : //@ts-ignore
                    value;
              if (
                //@ts-ignore
                correctedValue / overdrawFactor >= overdrawSize &&
                gesture.dy <= 0
              ) {
                return;
              }

              const minSnapPoint = getNextPosition(0);
              const translateYValue =
                value <= minTranslateValue.current
                  ? overdrawEnabled
                    ? minTranslateValue.current -
                      correctedValue / overdrawFactor
                    : minTranslateValue.current
                  : value;

              if (!closable && disableDragBeyondMinimumSnapPoint) {
                animations.translateY.setValue(
                  translateYValue >= minSnapPoint
                    ? minSnapPoint
                    : translateYValue,
                );
              } else {
                animations.translateY.setValue(translateYValue);
              }
            },
            onPanResponderEnd: (_event, gesture) => {
              start = undefined;
              offsets = [];
              prevDeltaY = 0;
              deltaYOnGestureStart = 0;
              const isMovingUp = getCurrentPosition() < initialValue.current;
              if (
                (!isMovingUp &&
                  getCurrentPosition() < initialValue.current + springOffset) ||
                (isMovingUp &&
                  getCurrentPosition() > initialValue.current - springOffset)
              ) {
                returnAnimation(gesture.vy);
                return;
              }

              if (!isMovingUp) {
                snapBackward(gesture.vy);
              } else {
                snapForward(gesture.vy);
              }
            },
          });
    }, [
      gestureEnabled,
      sheetId,
      currentContext,
      getActiveDraggableNodes,
      getCurrentPosition,
      enableGesturesInScrollView,
      overdrawFactor,
      overdrawSize,
      getNextPosition,
      overdrawEnabled,
      closable,
      disableDragBeyondMinimumSnapPoint,
      animations.translateY,
      springOffset,
      returnAnimation,
      snapBackward,
      snapForward,
    ]);

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
          Animated.spring(animations.translateY, {
            toValue: initialValue.current,
            useNativeDriver: true,
            ...props.openAnimationConfig,
          }).start();
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
          Animated.spring(animations.translateY, {
            toValue: initialValue.current,
            useNativeDriver: true,
            ...props.openAnimationConfig,
          }).start();
        },
        snapToIndex: (index: number) => {
          if (index > snapPoints.length || index < 0) return;
          currentSnapIndex.current = index;
          initialValue.current = getNextPosition(index);

          Animated.spring(animations.translateY, {
            toValue: initialValue.current,
            useNativeDriver: true,
            ...props.openAnimationConfig,
          }).start();
          notifySnapIndexChanged();
        },
        handleChildScrollEnd: () => {
          console.warn(
            'handleChildScrollEnd has been removed. Please use `useScrollHandlers` hook to enable scrolling in ActionSheet',
          );
        },
        modifyGesturesForLayout: (_id, layout, scrollOffset) => {
          //@ts-ignore
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
        animations.translateY,
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
              opacity: animations.routeOpacity,
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
      [animations.routeOpacity, router, sheetPayload],
    );

    const context = {
      ref: panHandlerRef,
      eventManager: internalEventManager,
    };

    return (
      <>
        {Platform.OS === 'ios' && !safeAreaInsets ? (
          <SafeAreaView
            pointerEvents="none"
            collapsable={false}
            onLayout={event => {
              let height = event.nativeEvent.layout.height;

              if (height !== undefined) {
                safeAreaPaddings.current.top = height;
                clearTimeout(rootViewLayoutEventValues.current.timer);
                rootViewLayoutEventValues.current.timer = setTimeout(() => {
                  internalEventManager.publish(EVENTS_INTERNAL.safeAreaLayout);
                }, 0);
              }
            }}
            style={{
              position: 'absolute',
              width: 1,
              height: 0,
              top: 0,
              left: 0,
              backgroundColor: 'transparent',
            }}>
            <View />
          </SafeAreaView>
        ) : null}

        {Platform.OS === 'ios' && !safeAreaInsets ? (
          <SafeAreaView
            pointerEvents="none"
            collapsable={false}
            onLayout={event => {
              let height = event.nativeEvent.layout.height;

              if (height !== undefined) {
                safeAreaPaddings.current.bottom = height;
                clearTimeout(rootViewLayoutEventValues.current.timer);
                rootViewLayoutEventValues.current.timer = setTimeout(() => {
                  internalEventManager.publish(EVENTS_INTERNAL.safeAreaLayout);
                }, 0);
              }
            }}
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              bottom: 0,
              left: 0,
              backgroundColor: 'transparent',
            }}>
            <View />
          </SafeAreaView>
        ) : null}

        {visible ? (
          <Root {...rootProps}>
            <GestureHandlerRoot
              isModal={isModal}
              style={styles.parentContainer}>
              <PanGestureRefContext.Provider value={context}>
                <DraggableNodesContext.Provider value={draggableNodesContext}>
                  <Animated.View
                    onLayout={onRootViewLayout}
                    ref={rootViewContainerRef}
                    pointerEvents={
                      props?.backgroundInteractionEnabled ? 'box-none' : 'auto'
                    }
                    style={[
                      styles.parentContainer,
                      {
                        opacity: animations.opacity,
                        width: '100%',
                        justifyContent: 'flex-end',
                        transform: [
                          {
                            translateY: animations.keyboardTranslate,
                          },
                        ],
                      },
                    ]}>
                    {!props?.backgroundInteractionEnabled ? (
                      <TouchableOpacity
                        onPress={onTouch}
                        activeOpacity={defaultOverlayOpacity}
                        testID={props.testIDs?.backdrop}
                        style={{
                          height:
                            dimensions.height +
                            (safeAreaPaddings.current.top || 0) +
                            100,
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
                          props.containerStyle?.borderTopRightRadius || 10,
                        borderTopLeftRadius:
                          props.containerStyle?.borderTopLeftRadius || 10,
                        backgroundColor:
                          props.containerStyle?.backgroundColor || 'white',
                        borderBottomLeftRadius:
                          props.containerStyle?.borderBottomLeftRadius ||
                          undefined,
                        borderBottomRightRadius:
                          props.containerStyle?.borderBottomRightRadius ||
                          undefined,
                        borderRadius:
                          props.containerStyle?.borderRadius || undefined,
                        width: props.containerStyle?.width || '100%',
                        ...getElevation(
                          typeof elevation === 'number' ? elevation : 5,
                        ),
                        flex: undefined,
                        height: dimensions.height,
                        maxHeight: dimensions.height,
                        paddingBottom: keyboard.keyboardShown
                          ? keyboard.keyboardHeight || 0
                          : safeAreaPaddings.current.bottom,
                        //zIndex: 10,
                        transform: [
                          {
                            translateY: animations.translateY,
                          },
                        ],
                      }}>
                      {dimensions.height === 0 ? null : (
                        <PanGestureHandler {...panHandlers} ref={panHandlerRef}>
                          <Animated.View
                            {...handlers.panHandlers}
                            onLayout={onSheetLayout}
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
                                  ? dimensions.height - keyboard.keyboardHeight
                                  : dimensions.height,
                                marginTop: keyboard.keyboardShown ? 0.5 : 0,
                              },
                            ]}>
                            {drawUnderStatusBar ? (
                              <Animated.View
                                style={{
                                  height: 100,
                                  position: 'absolute',
                                  top: -50,
                                  backgroundColor:
                                    props.containerStyle?.backgroundColor ||
                                    'white',
                                  width: '100%',
                                  borderTopRightRadius:
                                    props.containerStyle?.borderRadius || 10,
                                  borderTopLeftRadius:
                                    props.containerStyle?.borderRadius || 10,
                                  transform: [
                                    {
                                      translateY: animations.underlayTranslateY,
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
                        </PanGestureHandler>
                      )}

                      {overdrawEnabled ? (
                        <Animated.View
                          style={{
                            position: 'absolute',
                            height: overdrawSize,
                            bottom: -overdrawSize,
                            backgroundColor:
                              props.containerStyle?.backgroundColor || 'white',
                            width:
                              props.containerStyle?.width || dimensions.width,
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
    <GestureHandlerRootView style={props.style}>
      {props.children}
    </GestureHandlerRootView>
  ) : (
    <>{props.children}</>
  );
};
