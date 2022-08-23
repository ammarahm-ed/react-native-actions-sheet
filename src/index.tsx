/* eslint-disable curly */
import React, {
  forwardRef,
  RefObject,
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
import {actionSheetEventManager} from './eventmanager';
import useSheetManager from './hooks/use-sheet-manager';
import {useKeyboard} from './hooks/useKeyboard';
import {SheetManager} from './sheetmanager';
import {styles} from './styles';
import type {ActionSheetProps} from './types';
import {getDeviceHeight, getElevation, SUPPORTED_ORIENTATIONS} from './utils';
export type ActionSheetRef = {
  /**
   * Show the ActionSheet.
   */
  show: () => void;

  /**
   * Hide the ActionSheet.
   */
  hide: (data: any) => void;
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
      statusBarTranslucent = true,
      gestureEnabled = false,
      isModal = true,
      snapPoints = [100],
      initialSnapIndex = 0,
      overdrawEnabled = true,
      overdrawFactor = 15,
      overdrawSize = 100,
      zIndex = 9999,
      keyboardHandlerEnabled = true,
      ...props
    },
    ref,
  ) {
    snapPoints =
      snapPoints[snapPoints.length - 1] !== 100
        ? [...snapPoints, 100]
        : snapPoints;
    const initialValue = useRef(0);
    const actionSheetHeight = useRef(0);
    const keyboard = useKeyboard(keyboardHandlerEnabled);
    const safeAreaPaddingTop = useRef(0);
    const contextRef = useRef('global');
    const currentSnapIndex = useRef(initialSnapIndex);
    const gestureBoundaries = useRef<{
      [name: string]: LayoutRectangle & {
        scrollOffset?: number;
      };
    }>({});
    const [dimensions, setDimensions] = useState({
      width: Dimensions.get('window').width,
      height: CALCULATED_DEVICE_HEIGHT || getDeviceHeight(statusBarTranslucent),
      portrait: true,
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
    });
    const returnAnimation = React.useCallback(
      (velocity?: number) => {
        if (!animated) {
          animations.translateY.setValue(initialValue.current);
          return;
        }
        const config = props.openAnimationConfig;
        Animated.spring(animations.translateY, {
          toValue: initialValue.current,
          useNativeDriver: true,
          ...config,
          velocity: velocity,
        }).start();
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
        Animated.spring(animations.translateY, {
          velocity: vy,
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
      return animations.translateY._value < 0
        ? 0
        : //@ts-ignore
          (animations.translateY._value as number);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getNextPosition = React.useCallback(
      (snapIndex: number) => {
        return (
          actionSheetHeight.current -
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
        props?.onChange?.(value.value, actionSheetHeight.current);
        actionSheetEventManager.publish('onoffsetchange', value.value);
        if (drawUnderStatusBar) {
          if (actionSheetHeight.current > dimensions.height - 1) {
            const offsetTop = value.value;
            if (offsetTop < 100) {
              animations.underlayTranslateY.setValue(offsetTop);
            }
          }
        }
      });
      return () => {
        listener && animations.translateY.removeListener(listener);
        props.id && SheetManager.remove(props.id, contextRef.current);
        hardwareBackPressEvent.current?.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props?.id, dimensions.height]);

    const onRequestClose = () => {};

    const onDeviceLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        const safeMarginFromTop =
          Platform.OS === 'ios'
            ? safeAreaPaddingTop.current || 0
            : StatusBar.currentHeight || 0;
        let height = event.nativeEvent.layout.height - safeMarginFromTop;
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
      [dimensions.width],
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
              if (props.id) {
                actionSheetEventManager.publish(
                  `onclose_${props.id}`,
                  data || props.payload || data,
                );
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
      [
        closable,
        hideAnimation,
        props.id,
        props.payload,
        returnAnimation,
        setVisible,
      ],
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
                if (gesture.dy < 3 && gesture.dy > -3) return false;

                let gestures = true;
                for (let id in gestureBoundaries.current) {
                  const gestureBoundary = gestureBoundaries.current[id];
                  if (getCurrentPosition() > 3 || !gestureBoundary) {
                    gestures = true;
                  }

                  const scrollOffset = gestureBoundary?.scrollOffset || 0;
                  if (
                    gestureBoundary.y === undefined ||
                    event.nativeEvent.pageY < gestureBoundary?.y ||
                    (event.nativeEvent.pageY > gestureBoundary?.y &&
                      gesture.vy > 0 &&
                      scrollOffset <= 0)
                  ) {
                    gestures = true;
                  } else {
                    gestures = false;
                  }
                }
                return gestures;
              },
              onStartShouldSetPanResponder: (event, gesture) => {
                if (Platform.OS === 'web') {
                  let gestures = true;
                  for (let id in gestureBoundaries.current) {
                    const gestureBoundary = gestureBoundaries.current[id];
                    if (getCurrentPosition() > 3 || !gestureBoundary) {
                      gestures = true;
                    }

                    const scrollOffset = gestureBoundary?.scrollOffset || 0;
                    if (
                      gestureBoundary.y === undefined ||
                      event.nativeEvent.pageY < gestureBoundary?.y ||
                      (event.nativeEvent.pageY > gestureBoundary?.y &&
                        gesture.vy > 0 &&
                        scrollOffset <= 0)
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
                if (
                  //@ts-ignore
                  animations.translateY._value <= -overdrawSize / 2 &&
                  gesture.dy <= 0
                ) {
                  return;
                }

                const value = initialValue.current + gesture.dy;
                animations.translateY.setValue(
                  value <= 0
                    ? overdrawEnabled
                      ? value / overdrawFactor
                      : 0
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
        getCurrentPosition,
        animations.translateY,
        overdrawSize,
        overdrawEnabled,
        overdrawFactor,
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
        if (!initialValue.current) {
          animations.translateY.setValue(actionSheetHeight.current * 1.3);
        }
        initialValue.current =
          actionSheetHeight.current -
          (actionSheetHeight.current * snapPoints[currentSnapIndex.current]) /
            100;
        opacityAnimation(1);
        returnAnimation();
        if (Platform.OS === 'web') {
          document.body.style.overflowY = 'hidden';
          document.documentElement.style.overflowY = 'hidden';
        }
      },
      [animations.translateY, opacityAnimation, returnAnimation, snapPoints],
    );

    const getRef = (): ActionSheetRef => ({
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
          actionSheetHeight.current -
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
    });

    useImperativeHandle(ref, getRef, [
      animations.translateY,
      gestureEnabled,
      getNextPosition,
      hideSheet,
      props.openAnimationConfig,
      setVisible,
      snapPoints.length,
      visible,
    ]);

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
              statusBarTranslucent: statusBarTranslucent,
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
                zIndex: zIndex,
                width: '100%',
                height: '100%',
              },
              pointerEvents: props?.backgroundInteractionEnabled
                ? 'box-none'
                : 'auto',
            },
      [isModal, onHardwareBackPress, props, statusBarTranslucent, zIndex],
    );

    const getPaddingBottom = () => {
      const topPadding =
        Platform.OS === 'android'
          ? StatusBar.currentHeight && StatusBar.currentHeight > 35
            ? 35
            : StatusBar.currentHeight
          : safeAreaPaddingTop.current;
      if (!props.useBottomSafeAreaPadding && props.containerStyle) {
        return (
          props.containerStyle?.paddingBottom || props.containerStyle.padding
        );
      }
      if (!props.containerStyle && props?.useBottomSafeAreaPadding) {
        return topPadding;
      }

      if (props.containerStyle?.paddingBottom === 'string')
        return props.containerStyle.paddingBottom;
      if (props.containerStyle?.padding === 'string')
        return props.containerStyle.padding;

      if (props.containerStyle?.paddingBottom) {
        //@ts-ignore
        return topPadding + props.containerStyle.paddingBottom;
      }

      if (props.containerStyle?.padding) {
        //@ts-ignore
        return topPadding + props.containerStyle.padding;
      }

      return 0;
    };

    return (
      <>
        {Platform.OS === 'ios' ? (
          <SafeAreaView
            pointerEvents="none"
            onLayout={event => {
              let height = event.nativeEvent.layout.height;
              if (height) {
                safeAreaPaddingTop.current = event.nativeEvent.layout.height;
              }
            }}
            style={{
              position: 'absolute',
              width: 1,
              left: 0,
              top: 0,
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
                  paddingBottom: keyboard.keyboardShown
                    ? keyboard.keyboardHeight
                    : 0,
                },
              ]}>
              {!props?.backgroundInteractionEnabled ? (
                <TouchableOpacity
                  onPress={onTouch}
                  activeOpacity={defaultOverlayOpacity}
                  testID={props.testIDs?.backdrop}
                  style={{
                    height:
                      Dimensions.get('window').height + 100 ||
                      dimensions.height + safeAreaPaddingTop.current + 100,
                    width: '100%',
                    position: 'absolute',
                    zIndex: 2,
                    backgroundColor: overlayColor,
                    opacity: defaultOverlayOpacity,
                  }}
                />
              ) : null}

              <Animated.View
                {...handlers.panHandlers}
                onLayout={onSheetLayout}
                testID={props.testIDs?.sheet}
                style={[
                  styles.container,
                  {
                    borderTopRightRadius: 10,
                    borderTopLeftRadius: 10,
                    ...getElevation(
                      typeof elevation === 'number' ? elevation : 5,
                    ),
                  },
                  props.containerStyle,
                  {
                    zIndex: 10,
                    maxHeight: dimensions.height,
                    transform: [
                      {
                        translateY: animations.translateY,
                      },
                    ],
                    paddingBottom: getPaddingBottom(),
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
                      borderRadius: props.containerStyle?.borderRadius || 10,
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

                {overdrawEnabled ? (
                  <Animated.View
                    style={{
                      height: overdrawSize,
                      position: 'absolute',
                      bottom: -overdrawSize,
                      backgroundColor:
                        props.containerStyle?.backgroundColor || 'white',
                      width: dimensions.width,
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
