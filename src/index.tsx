import React, { Component, createRef } from "react";
import {
  Animated, Dimensions, FlatList,
  Keyboard, KeyboardEvent, LayoutChangeEvent, Modal, NativeScrollEvent,
  NativeSyntheticEvent, Platform, SafeAreaView, StatusBar, TouchableOpacity, UIManager, View
} from "react-native";
import { styles } from "./styles";
import type { ActionSheetProps } from "./types";
import {
  getDeviceHeight, getElevation, SUPPORTED_ORIENTATIONS, waitAsync
} from "./utils";

let safeAreaInnerHeight = 0;
const dummyData = ["dummy"];
let safeAreaPaddingTop =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
let calculatedDeviceHeight = Dimensions.get("window").height;

type State = {
  modalVisible: boolean
  scrollable: boolean
  layoutHasCalled: boolean
  keyboard: boolean
  deviceHeight: number
  deviceWidth: number
  portrait: boolean
  safeAreaInnerHeight: number
  paddingTop: number
  keyboardPadding:number
}



const defaultProps = {
  animated: true,
  closeOnPressBack: true,
  bounciness: 8,
  extraScroll: 0,
  closeAnimationDuration: 300,
  delayActionSheetDrawTime: 0,
  openAnimationSpeed: 12,
  springOffset: 100,
  elevation: 5,
  initialOffsetFromBottom: 1,
  indicatorColor: "#f0f0f0",
  defaultOverlayOpacity: 0.3,
  overlayColor: "black",
  closable: true,
  bottomOffset: 0,
  closeOnTouchBackdrop: true,
  drawUnderStatusBar: true,
  statusBarTranslucent: true,
  gestureEnabled: false
}

type Props = Partial<typeof defaultProps> & ActionSheetProps;

export default class ActionSheet extends Component<Props, State, any> {

  static defaultProps = defaultProps;


  actionSheetHeight: number = 0;
  prevScroll: number = 0;
  timeout: any = null;
  offsetY: number = 0;
  currentOffsetFromBottom: number = 0
  scrollAnimationEndValue: number = 0;

  hasBounced: boolean = false;
  layoutHasCalled: boolean = false;
  isClosing: boolean = false;
  isRecoiling: boolean = false;
  isReachedTop: boolean = false;
  deviceLayoutCalled: boolean = false;

  scrollViewRef: React.RefObject<any>
  safeAreaViewRef: React.RefObject<any>

  transformValue: Animated.Value
  opacityValue: Animated.Value
  borderRadius: Animated.Value
  underlayTranslateY: Animated.Value
  underlayScale: Animated.Value
  indicatorTranslateY: Animated.Value
  initialScrolling: boolean = false;

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
      keyboardPadding:0
    };

    this.actionSheetHeight = 0;
    this.prevScroll = 0;
    this.scrollAnimationEndValue = 0;
    this.hasBounced = false;
    this.scrollViewRef = createRef();
    this.layoutHasCalled = false;
    this.isClosing = false;
    this.isRecoiling = false;
    this.offsetY = 0;
    this.safeAreaViewRef = createRef();
    this.transformValue = new Animated.Value(0);
    this.opacityValue = new Animated.Value(0);
    this.borderRadius = new Animated.Value(10);
    this.currentOffsetFromBottom = this.props.initialOffsetFromBottom;
    this.underlayTranslateY = new Animated.Value(100);
    this.underlayScale = new Animated.Value(1);
    this.indicatorTranslateY = new Animated.Value(-this.state.paddingTop | 0);
    this.isReachedTop = false;
    this.deviceLayoutCalled = false;
    this.timeout = null;
    this.initialScrolling = false;

  }


  /**
   * Snap ActionSheet to Offset
   */

  snapToOffset = (offset: number) => {
    let correction = this.state.deviceHeight * 0.15;
    let extraScroll = this.props.extraScroll || 0;
    let scrollOffset = this.props.gestureEnabled
      ? offset + correction + extraScroll
      : offset + correction + extraScroll;
    this.currentOffsetFromBottom = offset / this.actionSheetHeight;
    this._scrollTo(scrollOffset);
    this.updateActionSheetPosition(scrollOffset);
  };
  // Open the ActionSheet
  show = () => {
    this.setModalVisible(true);
  };

  // Close the ActionSheet
  hide = () => {
    this.setModalVisible(false);
  };

  /**
   * Open/Close the ActionSheet
   */
  setModalVisible = (visible: boolean) => {
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

      this._hideModal();
    }
  };

  _hideAnimation() {
  
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

    waitAsync(closeAnimationDuration / 1.5).then(() => {
      if (!closable) {
        if (bottomOffset > 0) {
          this.snapToOffset(bottomOffset);
        } else {
          this._scrollTo(
            this.actionSheetHeight * initialOffsetFromBottom +
            this.state.deviceHeight * 0.1 +
            extraScroll,
            true
          );
          this.currentOffsetFromBottom = initialOffsetFromBottom;
        }

        this.isClosing = false;
      } else {
        this._scrollTo(0, false);
        this.currentOffsetFromBottom = initialOffsetFromBottom;
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
            this.props.onClose && this.props.onClose();
          }
        );
      }
    });
  }

  _hideModal = () => {
    if (this.isClosing) return;
    this.isClosing = true;
    this._hideAnimation();
  };

  measure = async (): Promise<number> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        UIManager.measureInWindow(
          this.safeAreaViewRef.current._nativeTag,
          (x, y, width, height) => {
            safeAreaPaddingTop = height === 0 ? 20 : height;
            resolve(safeAreaPaddingTop);
          }
        );
      }, 100);
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
        await waitAsync(delayActionSheetDrawTime);
      } else {
        if (delayActionSheetDraw) {
          await waitAsync(delayActionSheetDrawTime);
        }
      }
      this._scrollTo(scrollOffset, false);

      this.prevScroll = scrollOffset;
      if (Platform.OS === "ios") {
        await waitAsync(delayActionSheetDrawTime / 2);
      } else {
        if (delayActionSheetDraw) {
          await waitAsync(delayActionSheetDrawTime / 2);
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

  _onScrollBegin = async (event: NativeSyntheticEvent<NativeScrollEvent>) => { };
  _onScrollBeginDrag = async (event: NativeSyntheticEvent<NativeScrollEvent>) => {
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
      if (verticalOffset - this.prevScroll > springOffset * 0.75 || this.initialScrolling) {
        this.isRecoiling = true;
        this._applyHeightLimiter();
        this.currentOffsetFromBottom =
          this.currentOffsetFromBottom < this.props.initialOffsetFromBottom
            ? this.props.initialOffsetFromBottom
            : 1;
        let scrollOffset =
          this.actionSheetHeight * this.currentOffsetFromBottom +
          correction +
          extraScroll;

        if (this.initialScrolling) {
            this.initialScrolling = false;
            console.log(scrollOffset,this.prevScroll)
            scrollOffset = this.prevScroll;
            return;
        }  

        this._scrollTo(scrollOffset);
        await waitAsync(300);
        this.isRecoiling = false;
        this.props.onPositionChanged && this.props.onPositionChanged(true);
      } else {
        this._returnToPrevScrollPosition(this.actionSheetHeight);
      }
    } else {
      if (this.prevScroll - verticalOffset > springOffset) {
        this._hideModal();
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
      if (distanceFromTop < this.state.paddingTop) {
        if (!this.props.drawUnderStatusBar) return;
        this.indicatorTranslateY.setValue(0);
      } else {
        this.indicatorTranslateY.setValue(-this.state.paddingTop);
      }
    }
  }

  _returnToPrevScrollPosition(height: number) {
    let correction = this.state.deviceHeight * 0.15;
    let scrollOffset =
      height * this.currentOffsetFromBottom +
      correction +
      this.props.extraScroll;

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
    console.log('close request recieved');
    if (this.props.closeOnPressBack) this._hideModal();
  };

  _onTouchBackdrop = () => {
    if (this.props.closeOnTouchBackdrop) {
      this._hideModal();
    }
  };

  componentDidMount() {
    Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow",
      this._onKeyboardShow
    );

    Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide",
      this._onKeyboardHide
    );
  }

  _onKeyboardShow = (event: KeyboardEvent) => {
    this.isRecoiling = true;
    this.setState({
      keyboard: true,
      keyboardPadding:event.endCoordinates.height + 5
    });
    waitAsync(300).then(() => {
      this.isRecoiling = false;
    });
  };

  _onKeyboardHide = () => {
    this.setState({
      keyboard: false,
      keyboardPadding:0
    });
    this.opacityValue.setValue(1);
  };

  /**
   * Attach this to any child ScrollView Component's onScrollEndDrag,
   * onMomentumScrollEnd,onScrollAnimationEnd callbacks to handle the ActionSheet
   * closing and bouncing back properly.
   */

  handleChildScrollEnd = async () => {
    if (this.offsetY > this.prevScroll) return;
    if (this.prevScroll - this.props.springOffset > this.offsetY) {
      let scrollOffset = this.getInitialScrollPosition();
      if (this.offsetY > scrollOffset - 100) {
        this.isRecoiling = true;
        this._scrollTo(scrollOffset);
        this.currentOffsetFromBottom = this.props.initialOffsetFromBottom;
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

  componentWillUnmount() {
    Keyboard.removeListener(
      Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow",
      this._onKeyboardShow
    );

    Keyboard.removeListener(
      Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide",
      this._onKeyboardHide
    );
  }

  _onDeviceLayout = async (_event) => {
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
        safeMarginFromTop = measuredPadding;
        this.indicatorTranslateY.setValue(-measuredPadding);
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
        paddingTop: measuredPadding,
      });
    }, 1);
  };

  getInitialScrollPosition() {
    this._applyHeightLimiter();
    let correction = this.state.deviceHeight * 0.15;
    let scrollPosition = this.props.gestureEnabled
      ? this.actionSheetHeight * this.props.initialOffsetFromBottom +
      correction +
      this.props.extraScroll
      : this.actionSheetHeight + correction + this.props.extraScroll;
    this.currentOffsetFromBottom = this.props.initialOffsetFromBottom;
    this.updateActionSheetPosition(scrollPosition);

    return scrollPosition;
  }

  _keyExtractor = (item) => item;

  render() {
    let { scrollable, modalVisible, keyboard } = this.state;
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
    } = this.props;

    return (
      <Modal
        visible={modalVisible}
        animationType="none"
        testID={testID}
        supportedOrientations={SUPPORTED_ORIENTATIONS}
        onShow={onOpen}
        onRequestClose={this._onRequestClose}
        transparent={true}
        statusBarTranslucent={statusBarTranslucent}
      >
        <Animated.View
          onLayout={this._onDeviceLayout}
          style={[
            styles.parentContainer,
            {
              opacity: this.opacityValue,
              width: this.state.deviceWidth,
            },
          ]}
        >
          <SafeAreaView ref={this.safeAreaViewRef} style={styles.safearea}>
            <View />
          </SafeAreaView>
          {
            //@ts-ignore
            this.props.premium
          }
          <FlatList
            bounces={false}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            ref={this.scrollViewRef}
            scrollEventThrottle={5}
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
                      ...getElevation(elevation),
                      zIndex: 11,
                      opacity: this.opacityValue,
                      transform: [
                        {
                          translateY: this.transformValue,
                        },
                      ],
                      maxHeight: this.state.deviceHeight,
                      paddingBottom:this.state.keyboardPadding
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
                          ]}
                        />
                      )
                    ) : null}

                    {children}
                  </Animated.View>
                </Animated.View>
              </View>
            )}
          />
        </Animated.View>
      </Modal>
    );
  }
}
