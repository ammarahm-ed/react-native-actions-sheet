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
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  GestureResponderEvent,
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
import EventManager, {actionSheetEventManager} from './eventmanager';
import {
  Route,
  RouterContext,
  RouterParamsContext,
  useRouter,
} from './hooks/use-router';
import useSheetManager from './hooks/use-sheet-manager';
import {useKeyboard} from './hooks/useKeyboard';
import {SheetProvider, useProviderContext, useSheetIDContext} from './provider';
import {
  getZIndexFromStack,
  isRenderedOnTop,
  SheetManager,
} from './sheetmanager';
import {styles} from './styles';
import type {ActionSheetProps} from './types';
import {getElevation, SUPPORTED_ORIENTATIONS} from './utils';
export type ActionSheetRef = {
  /**
   * Show the ActionSheet.
   */
  show: () => void;

  /**
   * Hide the ActionSheet.
   */
  hide: (data?: any) => void;
  /**
   * @removed Use `show` or `hide` functions or SheetManager to open/close ActionSheet.
   */
  setModalVisible: (visible?: boolean) => void;

  /**
   * Provide a value between 0 to 100 for the action sheet to snap to.
   */
  snapToOffset: (offset: number) => void;
  /**
   * @removed Use `useScrollHandlers` hook to enable scrolling in ActionSheet.
   */
  /**
   * When multiple snap points aret on the action sheet, use this to snap it to different
   * position.
   */
  snapToIndex: (index: number) => void;
  /**
   * @removed Use `useScrollHandlers` hook to enable scrolling in ActionSheet.
   */
  handleChildScrollEnd: () => void;
  snapToRelativeOffset: (offset: number) => void;

  /**
   * Used internally for scrollable views.
   */
  modifyGesturesForLayout: (
    id: string,
    layout: LayoutRectangle | undefined,
    scrollOffset: number,
  ) => void;

  isGestureEnabled: () => boolean;

  isOpen: () => boolean;
  ev: EventManager;
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
    const safeAreaPaddingTop = useRef<number>(safeAreaInsets?.top || 0);
    const internalEventManager = React.useMemo(() => new EventManager(), []);
    const currentContext = useProviderContext();
    const currentSnapIndex = useRef(initialSnapIndex);
    const minTranslateValue = useRef(0);
    const keyboardWasVisible = useRef(false);
    const prevKeyboardHeight = useRef(0);
    const id = useSheetIDContext();
    const sheetId = props.id || id;
    const lock = useRef(false);
    const panViewRef = useRef<View>();
    const deviceContainerRef = useRef<View>(null);
    const isOrientationChanging = useRef(false);
    const gestureBoundaries = useRef<{
      [name: string]: LayoutRectangle & {
        scrollOffset?: number;
      };
    }>({});
    const hiding = useRef(false);
    const payloadRef = useRef(payload);
    const initialWindowHeight = useRef(Dimensions.get('screen').height);
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
    const {visible, setVisible} = useSheetManager({
      id: sheetId,
      onHide: data => {
        hideSheet(undefined, data, true);
      },
      onBeforeShow: data => {
        routerRef.current?.initialNavigation();
        onBeforeShow?.(data);
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
    const [animations] = useState({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      underlayTranslateY: new Animated.Value(100),
      keyboardTranslate: new Animated.Value(0),
      routeOpacity: new Animated.Value(0),
    });

    const router = useRouter({
      routes: routes,
      getRef: () => getRef(),
      initialRoute: initialRoute,
      onNavigate: props.onNavigate,
      onNavigateBack: props.onNavigateBack,
      routeOpacity: animations.routeOpacity,
    });
    const routerRef = useRef(router);
    payloadRef.current = payload;
    routerRef.current = router;

    const keyboard = useKeyboard(
      keyboardHandlerEnabled && visible && dimensions.height !== 0,
      true,
      () => null,
      () => {
        // Don't run `hideKeyboard` callback if the `showKeyboard` hasn't ran yet.
        // Fix a race condition when you open a action sheet while you have the keyboard opened.
        if (initialValue.current === -1) {
          return;
        }
        keyboardAnimation(false);
      },
    );

    const notifyOffsetChange = (value: number) => {
      internalEventManager.publish('onoffsetchange', value);
    };
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
        Animated.spring(animations.translateY, {
          toValue: initialValue.current,
          useNativeDriver: true,
          ...config,
          velocity: typeof velocity !== 'number' ? undefined : velocity,
        }).start();
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [animated, props.openAnimationConfig],
    );

    const keyboardAnimation = React.useCallback(
      (shown = true) => {
        Animated.spring(animations.keyboardTranslate, {
          toValue: shown ? -keyboard.keyboardHeight : 0,
          useNativeDriver: true,
        }).start();
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [animated, props.openAnimationConfig, keyboard],
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
          toValue: dimensions.height * 1.3,
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
      [
        animated,
        dimensions.height,
        opacityAnimation,
        props.closeAnimationConfig,
      ],
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
      const listener = animations.translateY.addListener(value => {
        const correctedValue =
          value.value > minTranslateValue.current ? value.value : 0;
        props?.onChange?.(correctedValue, actionSheetHeight.current);
        if (drawUnderStatusBar) {
          if (lock.current) return;
          const correctedHeight = keyboard.keyboardShown
            ? dimensions.height - keyboard.keyboardHeight
            : dimensions.height;
          const correctedOffset = keyboard.keyboardShown
            ? value.value - keyboard.keyboardHeight
            : value.value;

          if (actionSheetHeight.current > correctedHeight - 1) {
            if (correctedOffset < 100) {
              animations.underlayTranslateY.setValue(
                Math.max(correctedOffset, 0),
              );
            } else {
              //@ts-ignore
              if (animations.underlayTranslateY._value < 100) {
                animations.underlayTranslateY.setValue(100);
              }
            }
          }
        }
      });
      return () => {
        listener && animations.translateY.removeListener(listener);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      props?.id,
      dimensions.height,
      keyboard.keyboardShown,
      keyboard.keyboardHeight,
    ]);
    const onDeviceLayoutReset = useRef<{
      timer?: any;
      sub?: {unsubscribe: () => void};
    }>({});
    const onDeviceLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        const windowDimensions = Dimensions.get('window');
        const isPortraitMode = windowDimensions.height > windowDimensions.width;
        if (isOrientationChanging.current) return;
        if (keyboard.keyboardShown && !isModal) {
          return;
        }
        // If this is a modal, simply use window dimensions
        // for a more accurate height value for the action sheet.
        let deviceHeight = isModal
          ? windowDimensions.height
          : event.nativeEvent.layout.height;
        let deviceWidth = isModal
          ? windowDimensions.width
          : event.nativeEvent.layout.width;

        onDeviceLayoutReset.current.sub?.unsubscribe();
        onDeviceLayoutReset.current.sub = internalEventManager.subscribe(
          'safeAreaLayout',
          () => {
            onDeviceLayoutReset.current.sub?.unsubscribe();
            const safeMarginFromTop =
              Platform.OS === 'ios'
                ? safeAreaPaddingTop.current || 0
                : StatusBar.currentHeight || 0;

            let height = deviceHeight - safeMarginFromTop;
            let width = deviceWidth;
            if (
              height?.toFixed(0) === dimensions.height?.toFixed(0) &&
              width?.toFixed(0) === dimensions.width.toFixed(0) &&
              dimensions.portrait === isPortraitMode
            ) {
              return;
            }
            setDimensions({
              width: isPortraitMode ? width : height,
              height: isPortraitMode ? height : width,
              portrait: isPortraitMode,
            });
          },
        );
        clearTimeout(onDeviceLayoutReset.current.timer);
        if (safeAreaPaddingTop.current !== undefined || Platform.OS !== 'ios') {
          internalEventManager.publish('safeAreaLayout');
        }
      },
      [
        keyboard.keyboardShown,
        isModal,
        internalEventManager,
        dimensions.width,
        dimensions.portrait,
        dimensions.height,
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
        onBeforeClose?.(data || payloadRef.current || data);
        setTimeout(() => {
          hideAnimation(vy, ({finished}) => {
            if (finished) {
              if (closable) {
                setVisible(false);
                if (props.onClose) {
                  props.onClose?.(data || payloadRef.current || data);
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
              } else {
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
      [closable, hideAnimation, props.onClose, returnAnimation, setVisible],
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
            initialValue.current = dimensions.height * 1.3;
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
        dimensions.height,
        getCurrentPosition,
        getNextPosition,
        hideSheet,
        returnAnimation,
        snapPoints,
      ],
    );

    const handlers = React.useMemo(
      () =>
        !gestureEnabled
          ? {panHandlers: {}}
          : PanResponder.create({
              onMoveShouldSetPanResponder: (event, gesture) => {
                if (sheetId && !isRenderedOnTop(sheetId, currentContext))
                  return false;
                let vy = gesture.vy < 0 ? gesture.vy * -1 : gesture.vy;
                let vx = gesture.vx < 0 ? gesture.vx * -1 : gesture.vx;
                if (vy < 0.05 || vx > 0.05) {
                  return false;
                }
                let gestures = true;
                for (let _id in gestureBoundaries.current) {
                  const gestureBoundary = gestureBoundaries.current[_id];
                  if (getCurrentPosition() > 3 || !gestureBoundary) {
                    gestures = true;
                    break;
                  }
                  const scrollOffset = gestureBoundary?.scrollOffset || 0;
                  if (
                    event.nativeEvent.locationY < gestureBoundary?.y ||
                    (gesture.vy > 0 && scrollOffset <= 0) ||
                    getCurrentPosition() !== 0
                  ) {
                    if (
                      !props.enableGesturesInScrollView &&
                      Platform.OS !== 'web' &&
                      event.nativeEvent.locationY > gestureBoundary?.y
                    ) {
                      return false;
                    } else {
                      gestures = true;
                    }
                  } else {
                    gestures = false;
                    break;
                  }
                }
                if (Platform.OS === 'web') {
                  if (!gestures) {
                    //@ts-ignore
                    panViewRef.current.style.touchAction = 'none';
                  } else {
                    //@ts-ignore
                    panViewRef.current.style.touchAction = 'auto';
                  }
                }
                return gestures;
              },
              onStartShouldSetPanResponder: (event, _gesture) => {
                if (sheetId && !isRenderedOnTop(sheetId, currentContext))
                  return false;
                let gestures = true;
                for (let _id in gestureBoundaries.current) {
                  const gestureBoundary = gestureBoundaries.current[_id];
                  if (getCurrentPosition() > 3 || !gestureBoundary) {
                    gestures = true;
                  }
                  const scrollOffset = gestureBoundary?.scrollOffset || 0;
                  if (
                    event.nativeEvent.locationY < gestureBoundary?.y ||
                    (scrollOffset <= 0 && getCurrentPosition() !== 0)
                  ) {
                    if (Platform.OS !== 'web') {
                      return false;
                    } else {
                      gestures = true;
                    }
                  } else {
                    gestures = false;
                  }
                }
                return gestures;
              },
              onPanResponderMove: (_event, gesture) => {
                const value = initialValue.current + gesture.dy;
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
                animations.translateY.setValue(
                  value <= minTranslateValue.current
                    ? overdrawEnabled
                      ? minTranslateValue.current -
                        correctedValue / overdrawFactor
                      : minTranslateValue.current
                    : value,
                );
              },
              onPanResponderEnd: (_event, gesture) => {
                const isMovingUp = getCurrentPosition() < initialValue.current;
                if (
                  (!isMovingUp &&
                    getCurrentPosition() <
                      initialValue.current + springOffset) ||
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
            }),
      [
        gestureEnabled,
        sheetId,
        currentContext,
        getCurrentPosition,
        props.enableGesturesInScrollView,
        overdrawFactor,
        overdrawSize,
        animations.translateY,
        overdrawEnabled,
        springOffset,
        returnAnimation,
        snapBackward,
        snapForward,
      ],
    );

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

    const onSheetLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        if (isOrientationChanging.current) return;
        const safeMarginFromTop =
          Platform.OS === 'ios'
            ? safeAreaPaddingTop.current || 0
            : StatusBar.currentHeight || 0;
        const windowDimensions = Dimensions.get('window');
        const height = windowDimensions.height - safeMarginFromTop;

        const orientationChanged =
          dimensions.portrait !==
          windowDimensions.width < windowDimensions.height;
        if (orientationChanged) isOrientationChanging.current = true;

        deviceContainerRef.current?.setNativeProps({
          style: {
            height: Dimensions.get('screen').height - safeMarginFromTop,
          },
        });

        setDimensions(dim => {
          return {
            ...dim,
            height: height,
            portrait: windowDimensions.width < windowDimensions.height,
          };
        });
        actionSheetHeight.current =
          event.nativeEvent.layout.height > height
            ? height
            : event.nativeEvent.layout.height;
        minTranslateValue.current = height - actionSheetHeight.current;

        if (initialValue.current < 0) {
          animations.translateY.setValue(height * 1.1);
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

        if (keyboard.keyboardShown) {
          keyboardAnimation();
          keyboardWasVisible.current = true;
          prevKeyboardHeight.current = keyboard.keyboardHeight;
        } else {
          keyboardWasVisible.current = false;
        }
        opacityAnimation(1);
        returnAnimation();

        if (isOrientationChanging.current) {
          setTimeout(() => {
            isOrientationChanging.current = false;
          }, 300);
        }

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
        returnAnimation,
        keyboardAnimation,
        animations.translateY,
        animations.underlayTranslateY,
        dimensions.portrait,
      ],
    );

    const getRef = useCallback(
      (): ActionSheetRef => ({
        show: () => {
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
        isGestureEnabled: () => gestureEnabled,
        isOpen: () => visible,
        ev: internalEventManager,
      }),
      [
        internalEventManager,
        setVisible,
        hideSheet,
        animations.translateY,
        props.openAnimationConfig,
        snapPoints.length,
        getNextPosition,
        gestureEnabled,
        visible,
        onBeforeShow,
      ],
    );

    useImperativeHandle(ref, getRef, [getRef]);

    useEffect(() => {
      if (sheetId) {
        SheetManager.registerRef(sheetId, currentContext, {
          current: getRef(),
        } as RefObject<ActionSheetRef>);
      }
    }, [currentContext, getRef, sheetId]);

    const onRequestClose = React.useCallback(() => {
      if (enableRouterBackNavigation && routerRef.current?.canGoBack()) {
        routerRef.current?.goBack();
        return;
      }
      hideSheet();
    }, [hideSheet, enableRouterBackNavigation]);
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
                height: initialWindowHeight.current,
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
                payload={payloadRef.current}
              />
            </RouterParamsContext.Provider>
          </Animated.View>
        );
      },
      [animations.routeOpacity, router],
    );

    const getPaddingBottom = () => {
      if (!props.useBottomSafeAreaPadding && !props.containerStyle) return 0;

      let topPadding = !props.useBottomSafeAreaPadding
        ? 0
        : Platform.OS === 'android'
        ? StatusBar.currentHeight && StatusBar.currentHeight > 35
          ? 35
          : StatusBar.currentHeight
        : (safeAreaPaddingTop.current || 0) > 30
        ? 30
        : safeAreaPaddingTop.current;

      if (!props.useBottomSafeAreaPadding && props.containerStyle) {
        return (
          props.containerStyle?.paddingBottom ||
          props.containerStyle.padding ||
          0
        );
      }
      if (!props.containerStyle && props?.useBottomSafeAreaPadding) {
        return topPadding;
      }

      if (typeof props.containerStyle?.paddingBottom === 'string')
        return props.containerStyle.paddingBottom;
      if (typeof props.containerStyle?.padding === 'string')
        return props.containerStyle.padding;

      if (props.containerStyle?.paddingBottom) {
        //@ts-ignore
        return topPadding + props.containerStyle.paddingBottom;
      }

      if (props.containerStyle?.padding) {
        //@ts-ignore
        return topPadding + props.containerStyle.padding;
      }
      return topPadding;
    };

    const paddingBottom = getPaddingBottom() || 0;
    return (
      <>
        {Platform.OS === 'ios' && !safeAreaInsets ? (
          <SafeAreaView
            pointerEvents="none"
            collapsable={false}
            onLayout={event => {
              let height = event.nativeEvent.layout.height;
              if (height !== undefined) {
                safeAreaPaddingTop.current = height;
                clearTimeout(onDeviceLayoutReset.current.timer);
                onDeviceLayoutReset.current.timer = setTimeout(() => {
                  internalEventManager.publish('safeAreaLayout');
                }, 64);
              }
            }}
            style={{
              position: 'absolute',
              width: 1,
              left: 0,
              top: 0,
              backgroundColor: 'transparent',
            }}>
            <View />
          </SafeAreaView>
        ) : null}
        {visible ? (
          <Root {...rootProps}>
            <Animated.View
              onLayout={onDeviceLayout}
              ref={deviceContainerRef}
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
                      (safeAreaPaddingTop.current || 0) +
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
                    props.containerStyle?.borderBottomLeftRadius || undefined,
                  borderBottomRightRadius:
                    props.containerStyle?.borderBottomRightRadius || undefined,
                  borderRadius: props.containerStyle?.borderRadius || undefined,
                  width: props.containerStyle?.width || '100%',
                  ...getElevation(
                    typeof elevation === 'number' ? elevation : 5,
                  ),
                  flex: undefined,
                  height: dimensions.height,
                  maxHeight: dimensions.height,
                  paddingBottom: keyboard.keyboardShown
                    ? keyboard.keyboardHeight || 0
                    : 0,
                  //zIndex: 10,
                  transform: [
                    {
                      translateY: animations.translateY,
                    },
                  ],
                }}>
                {dimensions.height === 0 ? null : (
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
                        paddingBottom:
                          keyboard.keyboardShown &&
                          typeof paddingBottom !== 'string'
                            ? paddingBottom + 2
                            : paddingBottom,
                        maxHeight: keyboard.keyboardShown
                          ? dimensions.height - keyboard.keyboardHeight
                          : dimensions.height,
                      },
                      {
                        overflow: 'hidden',
                      },
                    ]}>
                    {drawUnderStatusBar ? (
                      <Animated.View
                        style={{
                          height: 100,
                          position: 'absolute',
                          top: -50,
                          backgroundColor:
                            props.containerStyle?.backgroundColor || 'white',
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
                          style={[styles.indicator, props.indicatorStyle]}
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
                )}
                {overdrawEnabled ? (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      height: overdrawSize,
                      bottom: -overdrawSize,
                      backgroundColor:
                        props.containerStyle?.backgroundColor || 'white',
                      width: props.containerStyle?.width || dimensions.width,
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
          </Root>
        ) : null}
      </>
    );
  },
);
