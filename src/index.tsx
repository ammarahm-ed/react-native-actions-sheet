import React, {
  forwardRef,
  RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
  StatusBar,
  View,
} from "react-native";
import { actionSheetEventManager } from "./eventmanager";
import { SheetManager } from "./sheetmanager";
import { styles } from "./styles";
import type { ActionSheetProps } from "./types";
import { getDeviceHeight, getElevation, SUPPORTED_ORIENTATIONS } from "./utils";
import useSheetManager from "./hooks/use-sheet-manager";
export type ActionSheetRef = {
  show: () => void;
  hide: (data: any) => void;
  /**
   * @deprecated Use `show` or `hide` functions or SheetManager to open/close ActionSheet.
   */
  setModalVisible: (visible?: boolean) => void;
  snapToOffset: (offset: number) => void;
  /**
   * @removed Use `useScrollHandlers` hook to enable scrolling in ActionSheet.
   */
  handleChildScrollEnd: () => void;
  modifyGesturesForLayout: (
    id: string,
    layout: LayoutRectangle | undefined,
    scrollOffset: number
  ) => void;
};

const CALCULATED_DEVICE_HEIGHT = 0;

export default forwardRef<ActionSheetRef, ActionSheetProps>(
  function ActionSheet(
    {
      animated = true,
      closeOnPressBack = true,
      bounciness = 8,
      extraScroll = 0,
      closeAnimationDuration = 300,
      delayActionSheetDrawTime = 0,
      openAnimationSpeed = 8,
      springOffset = 50,
      elevation = 5,
      initialOffsetFromBottom = 1,
      indicatorColor = "#f0f0f0",
      defaultOverlayOpacity = 0.3,
      overlayColor = "black",
      closable = true,
      bottomOffset = 0,
      closeOnTouchBackdrop = true,
      drawUnderStatusBar = false,
      statusBarTranslucent = true,
      gestureEnabled = false,
      keyboardDismissMode = "none",
      keyboardHandlerEnabled = true,
      isModal = true,
      ...props
    },
    ref
  ) {
    const initialValue = useRef(0);
    const actionSheetHeight = useRef(0);
    const gestureBoundaries = useRef<{
      [name: string]: LayoutRectangle & {
        scrollOffset?: number;
      };
    }>({});
    const [dimensions, setDimensions] = useState({
      width: Dimensions.get("window").width,
      height: CALCULATED_DEVICE_HEIGHT || getDeviceHeight(statusBarTranslucent),
      portrait: true,
    });
    const { visible, setVisible } = useSheetManager({
      id: props.id,
      onHide: (data) => {
        console.log(data);
        hideSheet(data);
      },
      onBeforeShow: props.onBeforeShow,
    });
    const [animations] = useState({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      underlayTranslateY: new Animated.Value(100),
    });

    const returnAnimation = (velocity?: number) => {
      Animated.spring(animations.translateY, {
        toValue: initialValue.current,
        useNativeDriver: true,
        velocity: velocity,
      }).start();
    };
    const hideAnimation = (
      callback?: ({ finished }: { finished: boolean }) => void
    ) => {
      Animated.timing(animations.translateY, {
        duration: 150,
        easing: Easing.in(Easing.ease),
        toValue: dimensions.height * 1.3,
        useNativeDriver: true,
      }).start(callback);
    };

    const opacityAnimation = (opacity: number) => {
      Animated.timing(animations.opacity, {
        duration: 150,
        easing: Easing.in(Easing.ease),
        toValue: opacity,
        useNativeDriver: true,
      }).start();
    };

    const hardwareBackPressEvent = useRef<NativeEventSubscription>();
    const Root: React.ElementType =
      isModal && !props?.backgroundInteractionEnabled ? Modal : Animated.View;

    useImperativeHandle(
      ref,
      () => ({
        show: () => {
          setVisible(true);
        },
        hide: (data: any) => {
          hideSheet(data);
        },
        setModalVisible: (visible?: boolean) => {
          if (visible) {
            setVisible(true);
          } else {
            hideSheet();
          }
        },
        snapToOffset: (offset: number) => {
          Animated.spring(animations.translateY, {
            toValue: actionSheetHeight.current - offset,
            useNativeDriver: true,
          }).start();
        },
        handleChildScrollEnd: () => {
          console.warn(
            "handleChildScrollEnd has been removed. Please use `useScrollHandlers` hook to enable scrolling in ActionSheet"
          );
        },
        modifyGesturesForLayout: (id, layout, scrollOffset) => {
          //@ts-ignore
          gestureBoundary.current[id] = {
            ...layout,
            scrollOffset: scrollOffset,
          };
        },
      }),
      []
    );

    useEffect(() => {
      if (props.id) {
        SheetManager.add(props.id);
        SheetManager.registerRef(props.id, ref as RefObject<ActionSheetRef>);
      }
      const listener = animations.translateY.addListener((value) => {
        actionSheetEventManager.publish("onoffsetchange", value.value);
        if (drawUnderStatusBar) {
          if (actionSheetHeight.current === dimensions.height) {
            const offsetTop = value.value;
            if (offsetTop < 100) {
              animations.underlayTranslateY.setValue(offsetTop);
            }
          }
        }
      });
      return () => {
        listener && animations.translateY.removeListener(listener);
        props.id && SheetManager.remove(props.id);
        hardwareBackPressEvent.current?.remove();
      };
    }, [props?.id, dimensions.height]);

    const onHardwareBackPress = () => {
      return false;
    };

    const onRequestClose = () => {};

    const rootProps = isModal
      ? {
          visible: true,
          animationType: "none",
          testID: props.testID,
          supportedOrientations: SUPPORTED_ORIENTATIONS,
          onShow: props.onOpen,
          onRequestClose: onRequestClose,
          transparent: true,
          statusBarTranslucent: statusBarTranslucent,
        }
      : {
          testID: props.testID,
          onLayout: () => {
            hardwareBackPressEvent.current = BackHandler.addEventListener(
              "hardwareBackPress",
              onHardwareBackPress
            );
            props?.onOpen?.();
          },
          style: {
            position: "absolute",
            zIndex: 9999,
            width: "100%",
            height: "100%",
          },
          pointerEvents: props?.backgroundInteractionEnabled
            ? "box-none"
            : "auto",
        };

    const onDeviceLayout = React.useCallback((event: LayoutChangeEvent) => {
      const safeMarginFromTop = StatusBar.currentHeight || 0;
      let height = event.nativeEvent.layout.height - safeMarginFromTop;
      let width = Dimensions.get("window").width;
      if (
        height?.toFixed(0) === CALCULATED_DEVICE_HEIGHT?.toFixed(0) &&
        width?.toFixed(0) === dimensions.width.toFixed(0)
      )
        return;
      initialValue.current =
        actionSheetHeight.current -
        actionSheetHeight.current * initialOffsetFromBottom;
      animations.translateY.setValue(actionSheetHeight.current * 1.3);
      setDimensions({
        width,
        height,
        portrait: height > width,
      });
      opacityAnimation(1);
      returnAnimation();
    }, []);

    const hideSheet = (data?: any) => {
      hideAnimation(({ finished }) => {
        if (closable) opacityAnimation(0);
        if (finished) {
          if (closable) {
            setVisible(false);
            if (props.id) {
              actionSheetEventManager.publish(
                `onclose_${props.id}`,
                data || props.payload
              );
            }
          } else {
            returnAnimation();
          }
        }
      });
    };

    const handlers = React.useMemo(
      () =>
        !gestureEnabled
          ? { panHandlers: {} }
          : PanResponder.create({
              onMoveShouldSetPanResponderCapture: (event, gesture) => {
                let lock = false;
                for (let key in gestureBoundaries.current) {
                  const gestureBoundary = gestureBoundaries.current[key];
                  if (
                    //@ts-ignore
                    animations.translateY._value > 3 ||
                    !gestureBoundary
                  )
                    lock = false;

                  const scrollOffset = gestureBoundary?.scrollOffset || 0;

                  if (
                    event.nativeEvent.pageY > gestureBoundary?.y &&
                    gesture.vy > 0 &&
                    scrollOffset <= 0
                  ) {
                    lock = true;
                  } else {
                    lock = false;
                  }
                }

                return !lock;
              },
              onStartShouldSetPanResponder: () => true,
              onPanResponderMove: (_event, gesture) => {
                //@ts-ignore
                if (animations.translateY._value <= -30 && gesture.dy <= 0)
                  return;
                animations.translateY.setValue(
                  //@ts-ignore
                  animations.translateY._value < 0
                    ? 0 + gesture.dy / 15
                    : initialValue.current + gesture.dy
                );
              },
              onPanResponderEnd: (_event, gesture) => {
                if (
                  //@ts-ignore
                  animations.translateY._value <
                  initialValue.current - springOffset
                ) {
                  Animated.spring(animations.translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    velocity: gesture.vy,
                  }).start();

                  initialValue.current = 0;
                  return;
                }
                if (gesture.dy > springOffset) {
                  if (bottomOffset) {
                    initialValue.current = bottomOffset;
                    returnAnimation(gesture.vy);
                    return;
                  }
                  initialValue.current = dimensions.height * 1.3;
                  hideSheet();
                  return;
                }
                returnAnimation(gesture.vy);
              },
            }),
      [hideSheet, gestureEnabled, bottomOffset, closable]
    );

    const onTouch = () => {
      if (closeOnTouchBackdrop) {
        hideSheet();
      }
    };

    const onSheetLayout = (event: LayoutChangeEvent) => {
      actionSheetHeight.current = event.nativeEvent.layout.height;
    };

    if (!visible) return null;
    return (
      <Root {...rootProps}>
        <Animated.View
          onLayout={onDeviceLayout}
          pointerEvents={
            props?.backgroundInteractionEnabled ? "box-none" : "auto"
          }
          style={[
            styles.parentContainer,
            {
              opacity: animations.opacity,
              width: "100%",
              justifyContent: "flex-end",
            },
          ]}
        >
          {!props?.backgroundInteractionEnabled ? (
            <View
              onTouchEnd={onTouch}
              onTouchMove={onTouch}
              onTouchStart={onTouch}
              testID={props.testIDs?.backdrop}
              style={{
                height: "100%",
                width: "100%",
                position: "absolute",
                zIndex: 1,
                backgroundColor: overlayColor,
                opacity: defaultOverlayOpacity,
              }}
            />
          ) : null}

          <Animated.View
            {...handlers.panHandlers}
            onLayout={onSheetLayout}
            style={[
              styles.container,
              {
                borderTopRightRadius: 10,
                borderTopLeftRadius: 10,
                ...getElevation(elevation || 5),
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
              },
            ]}
          >
            {drawUnderStatusBar ? (
              <Animated.View
                style={{
                  height: 100,
                  position: "absolute",
                  top: -50,
                  backgroundColor:
                    props.containerStyle?.backgroundColor || "white",
                  width: "100%",
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
                  style={[
                    styles.indicator,
                    { backgroundColor: indicatorColor },
                    props.indicatorStyle,
                  ]}
                />
              )
            ) : null}

            {props?.children}

            <Animated.View
              style={{
                height: 100,
                position: "absolute",
                bottom: -100,
                backgroundColor:
                  props.containerStyle?.backgroundColor || "white",
                width: dimensions.width,
              }}
            />
          </Animated.View>
        </Animated.View>
      </Root>
    );
  }
);
