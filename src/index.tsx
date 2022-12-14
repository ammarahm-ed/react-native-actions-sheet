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
import useSheetManager from './hooks/use-sheet-manager';
import {useKeyboard} from './hooks/useKeyboard';
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

const CALCULATED_DEVICE_HEIGHT = 0;

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
      drawUnderStatusBar = false,
      gestureEnabled = false,
      isModal = true,
      snapPoints = [100],
      initialSnapIndex = 0,
      overdrawEnabled = true,
      overdrawFactor = 15,
      overdrawSize = 100,
      zIndex = 9999,
      keyboardHandlerEnabled = true,
      ExtraOverlayComponent,
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
    const safeAreaPaddingTop = useRef<number>();
    const internalEventManager = React.useMemo(() => new EventManager(), []);
    const contextRef = useRef('global');
    const currentSnapIndex = useRef(initialSnapIndex);
    const minTranslateValue = useRef(0);
    const keyboardWasVisible = useRef(false);
    const prevKeyboardHeight = useRef(0);
    const lock = useRef(false);
    const panViewRef = useRef<View>();
    const gestureBoundaries = useRef<{
      [name: string]: LayoutRectangle & {
        scrollOffset?: number;
      };
    }>({});
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
      id: props.id,
      onHide: data => {
        hideSheet(undefined, data);
      },
      onBeforeShow: props.onBeforeShow,
      onContextUpdate: context => {
        if (props.id) {
          contextRef.current = context || 'global';
          SheetManager.add(props.id, contextRef.current);
          SheetManager.registerRef(props.id, contextRef.current, {
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
    });

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
        Animated.spring(animations.translateY, {
          velocity: typeof vy !== 'number' ? undefined : vy,
          toValue: dimensions.height * 1.3,
          useNativeDriver: true,
          ...config,
        }).start();
        setTimeout(() => {
          callback?.({finished: true});
        }, 300);
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
      return animations.translateY._value <= minTranslateValue.current
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
        if (keyboard.keyboardShown && !isModal) {
          return;
        }
        let deviceHeight = event.nativeEvent.layout.height;
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
            let width = Dimensions.get('window').width;
            if (
              height?.toFixed(0) === CALCULATED_DEVICE_HEIGHT?.toFixed(0) &&
              width?.toFixed(0) === dimensions.width.toFixed(0)
            ) {
              return;
            }
            setDimensions({
              width,
              height,
              portrait: height > width,
            });
          },
        );
        clearTimeout(onDeviceLayoutReset.current.timer);
        if (safeAreaPaddingTop.current !== undefined || Platform.OS !== 'ios') {
          onDeviceLayoutReset.current.timer = setTimeout(() => {
            internalEventManager.publish('safeAreaLayout');
          }, 64);
        }
      },
      [dimensions.width, isModal, keyboard.keyboardShown, internalEventManager],
    );

    const hideSheet = React.useCallback(
      (vy?: number, data?: any) => {
        if (!closable) {
          returnAnimation(vy);
          return;
        }
        hideAnimation(vy, ({finished}) => {
          if (finished) {
            if (closable) {
              setVisible(false);
              setTimeout(() => {
                props.onClose?.(data || props.payload || data);
              }, 1);
              hardwareBackPressEvent.current?.remove();
              if (props.id) {
                SheetManager.remove(props.id, contextRef.current);
                setTimeout(() => {
                  actionSheetEventManager.publish(
                    `onclose_${props.id}`,
                    data || props.payload || data,
                    contextRef.current,
                  );
                }, 1);
              }
            } else {
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
      [closable, hideAnimation, props.onClose, returnAnimation, setVisible],
    );

    const onHardwareBackPress = React.useCallback(() => {
      if (visible && closable && closeOnPressBack) {
        hideSheet();
        return true;
      }
      return false;
    }, [closable, closeOnPressBack, hideSheet, visible]);

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
                if (props.id && !isRenderedOnTop(props.id, contextRef.current))
                  return false;
                let vy = gesture.vy < 0 ? gesture.vy * -1 : gesture.vy;
                let vx = gesture.vx < 0 ? gesture.vx * -1 : gesture.vx;
                if (vy < 0.05 || vx > 0.05) {
                  return false;
                }
                let gestures = true;
                for (let id in gestureBoundaries.current) {
                  const gestureBoundary = gestureBoundaries.current[id];
                  if (getCurrentPosition() > 0 || !gestureBoundary) {
                    gestures = true;
                    break;
                  }
                  const scrollOffset = gestureBoundary?.scrollOffset || 0;
                  if (
                    event.nativeEvent.pageY < gestureBoundary?.y ||
                    (gesture.vy > 0 && scrollOffset <= 0) ||
                    getCurrentPosition() !== 0
                  ) {
                    gestures = true;
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
                if (props.id && !isRenderedOnTop(props.id, contextRef.current))
                  return false;

                if (Platform.OS === 'web') {
                  let gestures = true;
                  for (let id in gestureBoundaries.current) {
                    const gestureBoundary = gestureBoundaries.current[id];
                    if (getCurrentPosition() > 3 || !gestureBoundary) {
                      gestures = true;
                    }
                    const scrollOffset = gestureBoundary?.scrollOffset || 0;
                    if (
                      event.nativeEvent.pageY < gestureBoundary?.y ||
                      scrollOffset <= 0 ||
                      getCurrentPosition() !== 0
                    ) {
                      gestures = true;
                    } else {
                      gestures = false;
                    }
                  }

                  return gestures;
                }
                return true;
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
        props.id,
        getCurrentPosition,
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

    const onTouch = () => {
      if (closeOnTouchBackdrop && closable) {
        hideSheet();
      }
    };

    const onSheetLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        actionSheetHeight.current = event.nativeEvent.layout.height;
        minTranslateValue.current =
          dimensions.height - actionSheetHeight.current;
        if (initialValue.current < 0) {
          animations.translateY.setValue(dimensions.height * 1.1);
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
        dimensions.height,
        snapPoints,
        keyboard.keyboardShown,
        keyboard.keyboardHeight,
        opacityAnimation,
        returnAnimation,
        keyboardAnimation,
        animations.translateY,
        animations.underlayTranslateY,
      ],
    );

    const getRef = useCallback(
      (): ActionSheetRef => ({
        show: () => {
          setTimeout(() => {
            setVisible(true);
          }, 1);
        },
        hide: (data: any) => {
          hideSheet(data);
        },
        setModalVisible: (_visible?: boolean) => {
          if (_visible) {
            setTimeout(() => {
              setVisible(true);
            }, 1);
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
        modifyGesturesForLayout: (id, layout, scrollOffset) => {
          //@ts-ignore
          gestureBoundaries.current[id] = {
            ...layout,
            scrollOffset: scrollOffset,
          };
        },
        isGestureEnabled: () => gestureEnabled,
        isOpen: () => visible,
        ev: internalEventManager,
      }),
      [
        animations.translateY,
        gestureEnabled,
        getNextPosition,
        hideSheet,
        props.openAnimationConfig,
        setVisible,
        snapPoints.length,
        visible,
        internalEventManager,
      ],
    );

    useImperativeHandle(ref, getRef, [getRef]);

    useEffect(() => {
      if (props.id) {
        SheetManager.registerRef(props.id, contextRef.current, {
          current: getRef(),
        } as RefObject<ActionSheetRef>);
      }
    }, [getRef, props.id]);

    const onRequestClose = React.useCallback(() => {
      hideSheet();
    }, [hideSheet]);
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
                  : props.id
                  ? getZIndexFromStack(props.id, contextRef.current)
                  : 999,
                width: '100%',
                height: initialWindowHeight.current,
              },
              pointerEvents: props?.backgroundInteractionEnabled
                ? 'box-none'
                : 'auto',
            },
      [isModal, onHardwareBackPress, onRequestClose, props, zIndex],
    );

    const getPaddingBottom = () => {
      let topPadding =
        Platform.OS === 'android'
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
        {Platform.OS === 'ios' ? (
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
              {props.withNestedSheetProvider}
              {ExtraOverlayComponent}
              {!props?.backgroundInteractionEnabled ? (
                <TouchableOpacity
                  onPress={onTouch}
                  activeOpacity={defaultOverlayOpacity}
                  testID={props.testIDs?.backdrop}
                  style={{
                    height:
                      Dimensions.get('window').height + 100 ||
                      dimensions.height +
                        (safeAreaPaddingTop.current || 0) +
                        100,
                    width: '100%',
                    position: 'absolute',
                    zIndex: 2,
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
                  zIndex: 10,
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

                    {props?.children}
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
            </Animated.View>
          </Root>
        ) : null}
      </>
    );
  },
);
