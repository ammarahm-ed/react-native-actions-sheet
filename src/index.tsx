/* eslint-disable curly */
import React, {
  forwardRef,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  GestureResponderEvent,
  Keyboard,
  LayoutChangeEvent,
  LayoutRectangle,
  Modal,
  NativeEventSubscription,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  GestureType,
} from 'react-native-gesture-handler';
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
import {debug, getElevation, SUPPORTED_ORIENTATIONS} from './utils';

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
    const panGestureRef = useRef<GestureType>(undefined);
    const closing = useRef(false);
    const draggableNodes = useRef<NodesRef>([]);
    const sheetLayoutRef = useRef<LayoutRectangle>(null);
    const dimensions = useWindowDimensions();
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

    const hardwareBackPressEvent = useRef<NativeEventSubscription>(null);
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
                (keyboard.keyboardHeight + insets.bottom + insets.top)
              : dimensionsRef.current.height - (insets.bottom + insets.top);
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
        if (closing.current) return;
        const rootViewHeight = dimensionsRef.current?.height;

        actionSheetHeight.current =
          event.nativeEvent.layout.height > dimensionsRef.current.height
            ? dimensionsRef.current.height
            : event.nativeEvent.layout.height;
        minTranslateValue.current =
          rootViewHeight -
          (actionSheetHeight.current + insets.bottom + insets.top);

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
            (keyboard.keyboardHeight + insets.bottom + insets.bottom);

          keyboardWasVisible.current = true;
          prevKeyboardHeight.current = keyboard.keyboardHeight;
        } else {
          keyboardWasVisible.current = false;
        }
        opacityAnimation(1);
        returnAnimation();

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

    const hideSheet = React.useCallback(
      (vy?: number, data?: any, isSheetManagerOrRef?: boolean) => {
        if (hiding.current) return;
        if (!closable && !isSheetManagerOrRef) {
          returnAnimation(vy);
          return;
        }
        hiding.current = true;
        onBeforeClose?.((data || payloadRef.current || data) as never);
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
              keyboard.reset();
            } else {
              animations.opacity.setValue(1);
              returnAnimation();
            }
          }
        });
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
          returnAnimation(vy);
          return;
        }
        console.log('snap backk...', nextSnapIndex);
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

    function scrollable(value: boolean) {
      if (Platform.OS === 'ios') return;
      for (let i = 0; i < draggableNodes.current.length; i++) {
        const node = draggableNodes.current[i];
        const scrollRef = resolveScrollRef(node.ref);
        scrollRef?.setNativeProps({
          scrollEnabled: value,
          pointerEvents: value ? 'auto' : 'none',
        });
      }
    }

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
      return Gesture.Pan()
        .withRef(panGestureRef)
        .onChange(event => {
          if (!gestureEnabled) return;
          let blockPan = false;
          let deltaY = event.translationY;
          let isSwipingDown = prevDeltaY < deltaY;

          debug('is swiping down', {isSwipingDown, prevDeltaY, deltaY});

          prevDeltaY = deltaY;

          if (!start) {
            start = {
              x: event.absoluteX,
              y: event.absoluteY,
            };
          }

          const isFullOpen = getCurrentPosition() === 0;

          const activeDraggableNodes = getActiveDraggableNodes(
            start.x,
            start.y,
            !isFullOpen || (isFullOpen && !isSwipingDown),
          );

          debug('swipe direction', isSwipingDown ? 'down' : 'up');
          debug('active nodes', activeDraggableNodes.length);
          //@ts-ignore
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
              debug('not full open, swiping up, scroll', false);
              blockPan = false;
            }

            // 2. Sheet fully open, swiping up, scrolling: true, panning: false
            if (isFullOpen && !isSwipingDown) {
              scrollable(true);
              debug('full open, swiping up, scroll', true);
              blockPan = true;
            }
            //  3. Sheet not fully open, swiping down, scrolling: false, panning: true
            if (!isFullOpen && isSwipingDown) {
              if (nodeIsScrolling) {
                scrollable(true);
                blockPan = true;
                debug(
                  'not full open, swiping down, scroll on active node',
                  true,
                );
              } else {
                scrollable(false);
                debug('not full open, swiping down, scroll', false);
                blockPan = false;
              }
            }

            // 4. Sheet fully open, scroll offset > 0, scrolling: true, panning: false will transition into scrolling: false, panning: true, once scroll reaches offset=0
            if (isFullOpen && isSwipingDown) {
              if (nodeIsScrolling) {
                scrollable(true);
                debug('full open, swiping down, scroll on active node', true);
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
                      if (event.absoluteY < refreshControlBounds) {
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

          debug('value', {
            initialValue: initialValue.current,
            deltaY,
            value,
          });

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
            animations.translateY.setValue(
              translateYValue >= minSnapPoint ? minSnapPoint : translateYValue,
            );
          } else {
            animations.translateY.setValue(translateYValue);
          }
        })
        .onEnd(() => {
          if (!gestureEnabled) return;
          deltaYOnGestureStart = 0;
          const isMovingUp = getCurrentPosition() < initialValue.current;

          if (
            (!isMovingUp &&
              getCurrentPosition() < initialValue.current + springOffset) ||
            (isMovingUp &&
              getCurrentPosition() > initialValue.current - springOffset)
          ) {
            returnAnimation(1);
            velocity = 0;
            debug('return animation....', 'returning');
            return;
          }

          if (!isMovingUp) {
            console.log('snap back...');
            snapBackward(velocity);
          } else {
            snapForward(velocity);
          }
          velocity = 0;
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
      ref: panGestureRef,
      eventManager: internalEventManager,
    };

    console.log(insets);

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
                        height: dimensions.height,
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
                          containerStyle?.borderBottomRightRadius || undefined,
                        borderRadius: containerStyle?.borderRadius || undefined,
                        width: containerStyle?.width || '100%',
                        ...getElevation(
                          typeof elevation === 'number' ? elevation : 5,
                        ),
                        flex: undefined,
                        height: dimensions.height - insets.top,
                        maxHeight: dimensions.height - insets.top,
                        paddingBottom: keyboard.keyboardShown
                          ? keyboard.keyboardHeight || 0
                          : useBottomSafeAreaPadding
                            ? insets.bottom
                            : 0,
                        transform: [
                          {
                            translateY: animations.translateY,
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
                                  containerStyle?.backgroundColor || 'white',
                                width: '100%',
                                borderTopRightRadius:
                                  containerStyle?.borderRadius || 10,
                                borderTopLeftRadius:
                                  containerStyle?.borderRadius || 10,
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
                                style={[styles.indicator, props.indicatorStyle]}
                              />
                            )
                          ) : null}

                          <View
                            style={{
                              flexShrink: 1,
                              borderWidth: 3,
                              borderColor: 'red',
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
