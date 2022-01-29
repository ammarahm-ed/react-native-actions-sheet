import React, { Component, createRef } from "react";
import {
  Animated,
  DeviceEventEmitter,
  Dimensions,
  EmitterSubscription,
  FlatList,
  Keyboard,
  KeyboardEvent,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import { SheetManager } from "./sheetmanager";
import { styles } from "./styles";
import type { ActionSheetProps } from "./types";
import {
  getDeviceHeight,
  getElevation,
  SUPPORTED_ORIENTATIONS,
  waitAsync,
} from "./utils";

let safeAreaInnerHeight = 0;
const dummyData = ["dummy"];
let safeAreaPaddingTop =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
let calculatedDeviceHeight = Dimensions.get("window").height;

type State = {
  modalVisible: boolean;
  scrollable: boolean;
  layoutHasCalled: boolean;
  keyboard: boolean;
  deviceHeight: number;
  deviceWidth: number;
  portrait: boolean;
  safeAreaInnerHeight: number;
  paddingTop: number;
  keyboardPadding: number;
};

const defaultProps = {
  animated: true,
  closeOnPressBack: true,
  bounciness: 8,
  extraScroll: 0,
  closeAnimationDuration: 300,
  delayActionSheetDrawTime: 0,
  openAnimationSpeed: 8,
  springOffset: 100,
  elevation: 5,
  initialOffsetFromBottom: 1,
  indicatorColor: "#f0f0f0",
  defaultOverlayOpacity: 0.3,
  overlayColor: "black",
  closable: true,
  bottomOffset: 0,
  closeOnTouchBackdrop: true,
  drawUnderStatusBar: false,
  statusBarTranslucent: true,
  gestureEnabled: false,
  keyboardDismissMode: "none",
  keyboardHandlerEnabled: true,
};

type Props = Partial<typeof defaultProps> & ActionSheetProps;

export default class ActionSheet extends Component<Props, State, any> {
  static defaultProps = defaultProps;

  actionSheetHeight: number = 0;
  prevScroll: number = 0;
  timeout: any = null;
  offsetY: number = 0;
  currentOffsetFromBottom: number = 0;
  scrollAnimationEndValue: number = 0;

  hasBounced: boolean = false;
  layoutHasCalled: boolean = false;
  isClosing: boolean = false;
  isRecoiling: boolean = false;
  isReachedTop: boolean = false;
  deviceLayoutCalled: boolean = false;

  scrollViewRef: React.RefObject<any>;
  safeAreaViewRef: React.RefObject<any>;

  transformValue: Animated.Value = new Animated.Value(0);
  opacityValue: Animated.Value = new Animated.Value(0);
  borderRadius: Animated.Value = new Animated.Value(10);
  underlayTranslateY: Animated.Value = new Animated.Value(100);
  underlayScale: Animated.Value = new Animated.Value(1);
  indicatorTranslateY: Animated.Value;
  initialScrolling: boolean = false;
  sheetManagerHideEvent: EmitterSubscription | null = null;
  sheetManagerShowEvent: EmitterSubscription | null = null;

  keyboardShowSubscription: EmitterSubscription | null = null;
  KeyboardHideSubscription: EmitterSubscription | null = null;

  constructor(props: ActionSheetProps) {
    super(props);
    this.state = {
      modalVisible: false,
      scrollable: false,
      layoutHasCalled: false,
      keyboard: false,
      deviceHeight:
        calculatedDeviceHeight ||
        getDeviceHeight(this.props.statusBarTranslucent),
      deviceWidth: Dimensions.get("window").width,
      portrait: true,
      safeAreaInnerHeight,
      paddingTop: safeAreaPaddingTop,
      keyboardPadding: 0,
    };

    this.scrollViewRef = createRef();
    this.safeAreaViewRef = createRef();

    this.currentOffsetFromBottom = this.props.initialOffsetFromBottom ?? 1;
    this.indicatorTranslateY = new Animated.Value(-this.state.paddingTop | 0);
  }

  /**
   * Snap ActionSheet to given offset.
   */
  snapToOffset = (offset: number) => {
    let correction = this.state.deviceHeight * 0.15;
    let extraScroll = this.props.extraScroll || 0;
    let scrollOffset = this.props.gestureEnabled
      ? offset + correction + extraScroll
      : offset + correction + extraScroll;
    this.currentOffsetFromBottom = scrollOffset / this.actionSheetHeight;
    this.currentOffsetFromBottom = this.currentOffsetFromBottom - 0.15;
    setTimeout(() => {
      this._scrollTo(scrollOffset);
      this.updateActionSheetPosition(scrollOffset);
    }, 500);
  };

  /**
   * Show the ActionSheet
   */
  show = () => {
    this.setModalVisible(true);
  };

  /**
   * Hide the ActionSheet
   */
  hide = () => {
    this.setModalVisible(false);
  };

  /**
   * Open/Close the ActionSheet
   */
  setModalVisible = (visible?: boolean) => {
    let modalVisible = this.state.modalVisible;
    this.initialScrolling = false;
    if (visible !== undefined) {
      if (modalVisible === visible) {
        return;
      }
      modalVisible = !visible;
    }

    if (!modalVisible) {
      this.setState({
        modalVisible: true,
        scrollable: this.props.gestureEnabled || false,
      });
    } else {
      this._hideModal(null);
    }
  };

  _hideAnimation(data: unknown) {
    let {
      animated,
      closeAnimationDuration,
      bottomOffset,
      initialOffsetFromBottom,
      extraScroll,
      closable,
    } = this.props;
    Animated.parallel([
      Animated.timing(this.opacityValue, {
        toValue: closable ? 0 : 1,
        duration: animated ? closeAnimationDuration : 1,
        useNativeDriver: true,
      }),
      Animated.timing(this.transformValue, {
        toValue: closable ? this.actionSheetHeight * 2 : 0,
        duration: animated ? closeAnimationDuration : 1,
        useNativeDriver: true,
      }),
    ]).start();

    waitAsync((closeAnimationDuration ?? 300) / 1.5).then(() => {
      if (!closable) {
        if (bottomOffset && bottomOffset > 0) {
          this.snapToOffset(bottomOffset);
        } else {
          this._scrollTo(
            this.actionSheetHeight * (initialOffsetFromBottom ?? 1) +
              this.state.deviceHeight * 0.1 +
              (extraScroll ?? 0),
            true
          );
          this.currentOffsetFromBottom = initialOffsetFromBottom ?? 1;
        }

        this.isClosing = false;
      } else {
        this._scrollTo(0, false);
        this.currentOffsetFromBottom = initialOffsetFromBottom ?? 1;
        this.setState(
          {
            modalVisible: !closable,
          },
          () => {
            this.isClosing = false;
            this.isReachedTop = false;
            this.props.onPositionChanged && this.props.onPositionChanged(false);
            this.indicatorTranslateY.setValue(-this.state.paddingTop);
            this.layoutHasCalled = false;
            this.deviceLayoutCalled = false;
            this.props.onClose && this.props.onClose(data);
            if (this.props.id) {
              DeviceEventEmitter.emit(`onclose_${this.props.id}`, data);
            }
          }
        );
      }
    });
  }

  _hideModal = (data?: unknown) => {
    if (this.isClosing) return;
    this.isClosing = true;
    this._hideAnimation(data);
  };

  measure = async (): Promise<number> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!this.safeAreaViewRef.current) {
          safeAreaPaddingTop = 25;
          resolve(safeAreaPaddingTop);
          return;
        }
        this.safeAreaViewRef.current?.measure(
          (_x: number, _y: number, _width: number, height: number) => {
            safeAreaPaddingTop = height === 0 ? 25 : height;
            safeAreaPaddingTop =
              !this.props.drawUnderStatusBar && safeAreaPaddingTop > 30
                ? safeAreaPaddingTop - 12
                : safeAreaPaddingTop;
            resolve(safeAreaPaddingTop);
          }
        );
      }, 50);
    });
  };

  _showModal = async (event: LayoutChangeEvent) => {
    let { gestureEnabled, delayActionSheetDraw, delayActionSheetDrawTime } =
      this.props;

    if (!event?.nativeEvent) return;
    let height = event.nativeEvent.layout.height;
    if (this.layoutHasCalled) {
      this.actionSheetHeight = height;
      this._returnToPrevScrollPosition(height);
      return;
    } else {
      this.initialScrolling = true;
      this.layoutHasCalled = true;
      this.actionSheetHeight = height;
      let scrollOffset = this.getInitialScrollPosition();
      this.isRecoiling = false;
      if (Platform.OS === "ios") {
        await waitAsync(delayActionSheetDrawTime ?? 0);
      } else {
        if (delayActionSheetDraw) {
          await waitAsync(delayActionSheetDrawTime ?? 0);
        }
      }
      this._scrollTo(scrollOffset, false);

      this.prevScroll = scrollOffset;
      if (Platform.OS === "ios") {
        await waitAsync(delayActionSheetDrawTime ?? 0 / 2);
      } else {
        if (delayActionSheetDraw) {
          await waitAsync((delayActionSheetDrawTime ?? 0) / 2);
        }
      }
      this._openAnimation(scrollOffset);
      this.underlayScale.setValue(1);
      this.underlayTranslateY.setValue(100);
      if (!gestureEnabled) {
        this.props.onPositionChanged && this.props.onPositionChanged(true);
      }
      this.updateActionSheetPosition(scrollOffset);
    }
  };

  _openAnimation = (scrollOffset: number) => {
    let { bounciness, bounceOnOpen, animated, openAnimationSpeed } = this.props;

    if (animated) {
      this.transformValue.setValue(scrollOffset);
      Animated.parallel([
        Animated.spring(this.transformValue, {
          toValue: 0,
          bounciness: bounceOnOpen ? bounciness : 1,
          speed: openAnimationSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(this.opacityValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      this.opacityValue.setValue(1);
    }
  };

  _onScrollBegin = async (
    _event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {};
  _onScrollBeginDrag = async (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    let verticalOffset = event.nativeEvent.contentOffset.y;
    this.prevScroll = verticalOffset;
  };

  _applyHeightLimiter() {
    if (this.actionSheetHeight > this.state.deviceHeight) {
      this.actionSheetHeight =
        (this.actionSheetHeight -
          (this.actionSheetHeight - this.state.deviceHeight)) *
        1;
    }
  }

  _onScrollEnd = async (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    let { springOffset, extraScroll } = this.props;
    let verticalOffset = event.nativeEvent.contentOffset.y;
    let correction = this.state.deviceHeight * 0.15;
    if (this.isRecoiling) return;

    if (this.prevScroll < verticalOffset || this.initialScrolling) {
      if (
        verticalOffset - this.prevScroll > (springOffset ?? 100) * 0.75 ||
        this.initialScrolling
      ) {
        this.isRecoiling = true;
        this._applyHeightLimiter();
        this.currentOffsetFromBottom =
          this.currentOffsetFromBottom <
          (this.props.initialOffsetFromBottom ?? 1)
            ? this.props.initialOffsetFromBottom ?? 1
            : 1;
        let scrollOffset =
          this.actionSheetHeight * this.currentOffsetFromBottom +
          correction +
          (extraScroll ?? 100);

        if (this.initialScrolling) {
          this.initialScrolling = false;
          scrollOffset = this.prevScroll;
        }

        this._scrollTo(scrollOffset);
        await waitAsync(300);
        this.isRecoiling = false;
        this.props.onPositionChanged && this.props.onPositionChanged(true);
      } else {
        this._returnToPrevScrollPosition(this.actionSheetHeight);
      }
    } else {
      if (this.prevScroll - verticalOffset > (springOffset ?? 100)) {
        this._hideModal(null);
      } else {
        if (this.isRecoiling) {
          return;
        }
        this.isRecoiling = true;
        this._returnToPrevScrollPosition(this.actionSheetHeight);
        await waitAsync(300);
        this.isRecoiling = false;
      }
    }
  };

  updateActionSheetPosition(scrollPosition: number) {
    if (this.actionSheetHeight >= this.state.deviceHeight - 1) {
      let correction = this.state.deviceHeight * 0.15;
      let distanceFromTop =
        this.actionSheetHeight + correction - scrollPosition;
      if (distanceFromTop < safeAreaPaddingTop) {
        if (!this.props.drawUnderStatusBar) return;
        this.indicatorTranslateY.setValue(0);
      } else {
        this.indicatorTranslateY.setValue(-safeAreaPaddingTop);
      }
    }
  }

  _returnToPrevScrollPosition(height: number) {
    let correction = this.state.deviceHeight * 0.15;
    let scrollOffset =
      height * this.currentOffsetFromBottom +
      correction +
      (this.props.extraScroll ?? 0);

    this.updateActionSheetPosition(scrollOffset);
    this._scrollTo(scrollOffset);
  }

  _scrollTo = (y: number, animated = true) => {
    this.scrollAnimationEndValue = y;
    this.prevScroll = y;
    this.scrollViewRef.current?._listRef._scrollRef.scrollTo({
      x: 0,
      y: this.scrollAnimationEndValue,
      animated: animated,
    });
    if (this.initialScrolling) {
      setTimeout(() => {
        this.initialScrolling = false;
      }, 500);
    }
  };

  _onTouchMove = () => {
    if (this.props.closeOnTouchBackdrop) {
      this._hideModal();
    }
    this.setState({
      scrollable: false,
    });
  };

  _onTouchStart = () => {
    if (this.props.closeOnTouchBackdrop) {
      this._hideModal();
    }
    this.setState({
      scrollable: false,
    });
  };

  _onTouchEnd = () => {
    this._returnToPrevScrollPosition(this.actionSheetHeight);
    if (this.props.gestureEnabled) {
      this.setState({
        scrollable: true,
      });
    }
  };

  _onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.offsetY = event.nativeEvent.contentOffset.y;

    let correction = this.state.deviceHeight * 0.15;
    let distanceFromTop = this.actionSheetHeight + correction - this.offsetY;

    if (this.actionSheetHeight < this.offsetY) {
      if (!this.isReachedTop) {
        this.isReachedTop = true;
        this.props.onPositionChanged && this.props.onPositionChanged(true);
      }
    } else {
      if (this.isReachedTop) {
        this.isReachedTop = false;
        this.props.onPositionChanged && this.props.onPositionChanged(false);
      }
    }

    if (this.actionSheetHeight >= this.state.deviceHeight - 1) {
      if (distanceFromTop < this.state.paddingTop) {
        if (!this.props.drawUnderStatusBar) return;

        this.indicatorTranslateY.setValue(
          -this.state.paddingTop + (this.state.paddingTop - distanceFromTop)
        );
      } else {
        this.indicatorTranslateY.setValue(-this.state.paddingTop);
      }
    }
  };

  _onRequestClose = () => {
    if (this.props.closeOnPressBack) this._hideModal();
  };

  _onTouchBackdrop = () => {
    if (this.props.closeOnTouchBackdrop) {
      this._hideModal();
    }
  };

  onSheetManagerShow = (data?: unknown) => {
    if (this.props.onBeforeShow) {
      this.props.onBeforeShow(data);
    }
    this.setModalVisible(true);
  };

  onSheetMangerHide = (data?: unknown) => {
    this._hideModal(data);
  };

  componentDidMount() {
    this.props.id && SheetManager.add(this.props.id);

    this.keyboardShowSubscription = Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow",
      this._onKeyboardShow
    );

    this.KeyboardHideSubscription = Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide",
      this._onKeyboardHide
    );
    if (this.props.id) {
      this.sheetManagerShowEvent = DeviceEventEmitter.addListener(
        `show_${this.props.id}`,
        this.onSheetManagerShow
      );
      this.sheetManagerHideEvent = DeviceEventEmitter.addListener(
        `hide_${this.props.id}`,
        this.onSheetMangerHide
      );
    }
  }

  componentWillUnmount() {
    this.props.id && SheetManager.remove(this.props.id);
    this.keyboardShowSubscription?.remove();
    this.KeyboardHideSubscription?.remove();
    this.sheetManagerHideEvent?.remove();
    this.sheetManagerShowEvent?.remove();
  }

  _onKeyboardShow = (event: KeyboardEvent) => {
    if (this.props.keyboardHandlerEnabled) {
      this.isRecoiling = true;
      let correction = Platform.OS === "android" ? 20 : 5;
      this.setState({
        keyboard: true,
        keyboardPadding: event.endCoordinates.height + correction,
      });
      waitAsync(300).then(() => {
        this.isRecoiling = false;
      });
    }
  };

  _onKeyboardHide = () => {
    this.setState({
      keyboard: false,
      keyboardPadding: 0,
    });

    Animated.parallel([
      Animated.spring(this.transformValue, {
        toValue: 0,
        bounciness: this.props.bounceOnOpen ? this.props.bounciness : 1,
        speed: this.props.openAnimationSpeed,
        useNativeDriver: true,
      }),
      Animated.timing(this.opacityValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Attach this to any child ScrollView Component's onScrollEndDrag,
   * onMomentumScrollEnd,onScrollAnimationEnd callbacks to handle the ActionSheet
   * closing and bouncing back properly.
   */

  handleChildScrollEnd = async () => {
    if (this.offsetY > this.prevScroll) return;
    if (this.prevScroll - (this.props.springOffset ?? 100) > this.offsetY) {
      let scrollOffset = this.getInitialScrollPosition();
      if (this.offsetY > scrollOffset - 100) {
        this.isRecoiling = true;
        this._scrollTo(scrollOffset);
        this.currentOffsetFromBottom = this.props.initialOffsetFromBottom ?? 1;
        this.prevScroll = scrollOffset;
        setTimeout(() => {
          this.isRecoiling = false;
        }, 500);
      } else {
        this._hideModal();
      }
    } else {
      this.isRecoiling = true;
      this._scrollTo(this.prevScroll, true);
      setTimeout(() => {
        this.isRecoiling = false;
      }, 500);
    }
  };

  _onDeviceLayout = async (_event: LayoutChangeEvent) => {
    let event = { ..._event };

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(async () => {
      let safeMarginFromTop = 0;
      let measuredPadding =
        Platform.OS === "ios" ? await this.measure() : StatusBar.currentHeight;

      if (!this.props.drawUnderStatusBar) {
        if (Platform.OS === "android" && !this.props.statusBarTranslucent)
          return;
        safeMarginFromTop = measuredPadding ?? 0;
        if (measuredPadding) {
          this.indicatorTranslateY.setValue(-measuredPadding);
        }
      } else {
        this.updateActionSheetPosition(this.offsetY);
      }
      let height = event.nativeEvent.layout.height - safeMarginFromTop;
      let width = Dimensions.get("window").width;
      if (
        height?.toFixed(0) === calculatedDeviceHeight?.toFixed(0) &&
        width?.toFixed(0) === this.state.deviceWidth?.toFixed(0) &&
        this.deviceLayoutCalled
      )
        return;
      this.deviceLayoutCalled = true;
      calculatedDeviceHeight = height;
      this.setState({
        deviceHeight: height,
        deviceWidth: width,
        portrait: height > width,
        paddingTop: measuredPadding ?? 0,
      });
    }, 1);
  };

  getInitialScrollPosition() {
    this._applyHeightLimiter();
    let correction = this.state.deviceHeight * 0.15;
    let scrollPosition = this.props.gestureEnabled
      ? this.actionSheetHeight * (this.props.initialOffsetFromBottom ?? 1) +
        correction +
        (this.props.extraScroll ?? 0)
      : this.actionSheetHeight + correction + (this.props.extraScroll ?? 0);
    this.currentOffsetFromBottom = this.props.initialOffsetFromBottom ?? 0;
    this.updateActionSheetPosition(scrollPosition);

    return scrollPosition;
  }

  _keyExtractor = (item: string) => item;

  render() {
    let { scrollable, modalVisible } = this.state;
    let {
      testID,
      onOpen,
      overlayColor,
      gestureEnabled,
      elevation,
      indicatorColor,
      defaultOverlayOpacity,
      children,
      containerStyle,
      CustomHeaderComponent,
      headerAlwaysVisible,
      keyboardShouldPersistTaps,
      statusBarTranslucent,
      keyboardDismissMode,
    } = this.props;

    return (
      <>
        <Modal
          visible={modalVisible}
          animationType="none"
          // @ts-ignore
          testID={testID}
          supportedOrientations={SUPPORTED_ORIENTATIONS}
          onShow={onOpen}
          onRequestClose={this._onRequestClose}
          transparent={true}
          statusBarTranslucent={statusBarTranslucent}
        >
          <SafeAreaView
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 0,
            }}
            ref={this.safeAreaViewRef}
          >
            <View />
          </SafeAreaView>
          <Animated.View
            onLayout={this._onDeviceLayout}
            style={[
              styles.parentContainer,
              {
                opacity: this.opacityValue,
                width: "100%",
              },
            ]}
          >
            {this.props.ExtraOverlayComponent}

            <FlatList
              bounces={false}
              keyboardShouldPersistTaps={keyboardShouldPersistTaps}
              keyboardDismissMode={keyboardDismissMode}
              ref={this.scrollViewRef}
              scrollEventThrottle={5}
              overScrollMode="never"
              showsVerticalScrollIndicator={false}
              onMomentumScrollBegin={this._onScrollBegin}
              onMomentumScrollEnd={this._onScrollEnd}
              scrollEnabled={scrollable}
              onScrollBeginDrag={this._onScrollBeginDrag}
              onTouchEnd={this._onTouchEnd}
              onScroll={this._onScroll}
              scrollsToTop={false}
              style={[
                styles.scrollView,
                {
                  width: this.state.deviceWidth,
                },
              ]}
              contentContainerStyle={{
                width: this.state.deviceWidth,
              }}
              data={dummyData}
              keyExtractor={this._keyExtractor}
              renderItem={() => (
                <View
                  style={{
                    width: "100%",
                  }}
                >
                  <Animated.View
                    onTouchStart={this._onTouchBackdrop}
                    onTouchMove={this._onTouchBackdrop}
                    onTouchEnd={this._onTouchBackdrop}
                    style={{
                      height: "100%",
                      width: "100%",
                      position: "absolute",
                      zIndex: 1,
                      backgroundColor: overlayColor,
                      opacity: defaultOverlayOpacity,
                    }}
                  />
                  <View
                    onTouchMove={this._onTouchMove}
                    onTouchStart={this._onTouchStart}
                    onTouchEnd={this._onTouchEnd}
                    style={{
                      height: this.state.deviceHeight * 1.15,
                      width: "100%",
                      zIndex: 10,
                    }}
                  >
                    <TouchableOpacity
                      onPress={this._onTouchBackdrop}
                      onLongPress={this._onTouchBackdrop}
                      style={{
                        height: this.state.deviceHeight * 1.15,
                        width: "100%",
                      }}
                    />
                  </View>

                  <Animated.View
                    onLayout={this._showModal}
                    style={[
                      styles.container,
                      {
                        borderRadius: 10,
                      },
                      containerStyle,
                      {
                        ...getElevation(elevation ?? 5),
                        zIndex: 11,
                        opacity: this.opacityValue,
                        transform: [
                          {
                            translateY: this.transformValue,
                          },
                        ],
                        maxHeight: this.state.deviceHeight,
                        paddingBottom: this.state.keyboardPadding,
                      },
                    ]}
                  >
                    <Animated.View
                      style={{
                        maxHeight: this.state.deviceHeight,
                        transform: [
                          {
                            translateY: this.indicatorTranslateY,
                          },
                        ],
                        marginTop: this.state.paddingTop,
                        marginBottom: -this.state.paddingTop,
                      }}
                    >
                      {gestureEnabled || headerAlwaysVisible ? (
                        CustomHeaderComponent ? (
                          CustomHeaderComponent
                        ) : (
                          <Animated.View
                            style={[
                              styles.indicator,
                              { backgroundColor: indicatorColor },
                              this.props.indicatorStyle,
                            ]}
                          />
                        )
                      ) : null}

                      {children}
                    </Animated.View>

                    <View
                      style={{
                        height: 200,
                        backgroundColor:
                          containerStyle?.backgroundColor || "#ffffff",
                        position: "absolute",
                        bottom: -195,
                        width: containerStyle?.width || "100%",
                      }}
                    />
                  </Animated.View>
                </View>
              )}
            />
          </Animated.View>
        </Modal>
      </>
    );
  }
}
