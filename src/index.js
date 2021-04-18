import PropTypes from "prop-types";
import React, { Component, createRef } from "react";
import {
  View,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
  Animated,
  DeviceEventEmitter,
  ViewPropTypes,
  FlatList,
  Keyboard,
  TextInput,
  UIManager,
  StatusBar,
  findNodeHandle,
  SafeAreaView,
} from "react-native";
import { styles } from "./styles";
import {
  getDeviceHeight,
  SUPPORTED_ORIENTATIONS,
  getElevation,
  waitAsync,
} from "./utils";

let safeAreaInnerHeight = 0;
let calculatedDeviceHeight = Dimensions.get("window").height;
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);
export default class ActionSheet extends Component {
  constructor(props) {
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
    };

    this.actionSheetHeight;
    this.prevScroll;
    this.scrollAnimationEndValue;
    this.hasBounced;
    this.scrollViewRef = createRef();
    this.layoutHasCalled = false;
    this.isClosing = false;
    this.isRecoiling = false;
    this.targetId = null;
    this.offsetY = 0;

    this.transformValue = new Animated.Value(0);
    this.opacityValue = new Animated.Value(0);
    this.borderRadius = new Animated.Value(10);
    this.currentOffsetFromBottom = this.props.initialOffsetFromBottom;
    this.underlayTranslateY = new Animated.Value(100);
    this.underlayScale = new Animated.Value(1);
    this.indicatorTranslateY = new Animated.Value(
      Platform.OS === "ios"
        ? this.actionSheetHeight - safeAreaInnerHeight > 30
          ? 10
          : -5
        : -StatusBar.currentHeight
    );
  }

  getSafeAreaPadding() {
    return this.actionSheetHeight - safeAreaInnerHeight > 30
      ? this.state.deviceHeight - safeAreaInnerHeight
      : 5;
  }

  /**
   * Snap ActionSheet to Offset
   */

  snapToOffset = (offset) => {
    this._scrollTo(offset);
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
  setModalVisible = (visible) => {
    let modalVisible = this.state.modalVisible;
    if (visible !== undefined) {
      if (modalVisible === visible) {
        return;
      }
      modalVisible = !visible;
    }
    if (!modalVisible) {
      this.setState({
        modalVisible: true,
        scrollable: this.props.gestureEnabled,
      });
    } else {
      this._hideModal();
    }
  };

  _hideAnimation() {
    let {
      animated,
      closeAnimationDuration,
      onClose,
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
      let scrollOffset = closable
        ? 0
        : this.actionSheetHeight * initialOffsetFromBottom +
          this.state.deviceHeight * 0.1 +
          extraScroll -
          bottomOffset;

      this._scrollTo(scrollOffset, !closable);
      this.currentOffsetFromBottom = initialOffsetFromBottom;
      this.setState(
        {
          modalVisible: !closable,
        },
        () => {
          this.isClosing = false;
          DeviceEventEmitter.emit("hasReachedTop", false);
          this.props.onPositionChanged && this.props.onPositionChanged(false)

          this.indicatorTranslateY.setValue(
            Platform.OS === "ios"
              ? this.actionSheetHeight - safeAreaInnerHeight > 30
                ? 10
                : -5
              : -StatusBar.currentHeight
          );
          if (closable) {
            this.layoutHasCalled = false;
            if (typeof onClose === "function") onClose();
          }
        }
      );
    });
  }

  _hideModal = () => {
    if (this.isClosing) return;
    this.isClosing = true;
    this._hideAnimation();
  };

  _showModal = async (event) => {
    let {
      gestureEnabled,
      delayActionSheetDraw,
      delayActionSheetDrawTime,
    } = this.props;
    if (!event?.nativeEvent) return;
    let height = event.nativeEvent.layout.height;

    if (this.layoutHasCalled) {
      this._returnToPrevScrollPosition(height);
      this.actionSheetHeight = height;
      return;
    } else {
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
        DeviceEventEmitter.emit("hasReachedTop");
        this.props.onPositionChanged && this.props.onPositionChanged(true)
      }
      this.layoutHasCalled = true;
      this.updateActionSheetPosition(scrollOffset);
    }
  };

  _openAnimation = (scrollOffset) => {
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

  _onScrollBegin = async (event) => {};
  _onScrollBeginDrag = async (event) => {
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

  _onScrollEnd = async (event) => {
    let { springOffset, extraScroll } = this.props;
    let verticalOffset = event.nativeEvent.contentOffset.y;

    let correction = this.state.deviceHeight * 0.1;
    if (this.isRecoiling) return;

    if (this.prevScroll < verticalOffset) {
      if (verticalOffset - this.prevScroll > springOffset * 0.75) {
        this.isRecoiling = true;

        this._applyHeightLimiter();
        let scrollOffset = this.actionSheetHeight + correction + extraScroll;

        this._scrollTo(scrollOffset);
        await waitAsync(300);
        this.isRecoiling = false;
        this.currentOffsetFromBottom = 1;

        this.updateActionSheetPosition(scrollOffset);
        DeviceEventEmitter.emit("hasReachedTop", true);
        this.props.onPositionChanged && this.props.onPositionChanged(true)
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

  updateActionSheetPosition(scrollPosition) {
    if (scrollPosition > this.state.deviceHeight) {
      this.indicatorTranslateY.setValue(
        Platform.OS === "ios" ? this.getSafeAreaPadding() : 0
      );
    } else {
      this.indicatorTranslateY.setValue(
        Platform.OS === "ios"
          ? this.actionSheetHeight - safeAreaInnerHeight > 30
            ? 10
            : -5
          : -StatusBar.currentHeight
      );
    }
  }

  _returnToPrevScrollPosition(height) {
    let scrollOffset =
      height * this.currentOffsetFromBottom +
      this.state.deviceHeight * 0.1 +
      this.props.extraScroll;
    this.updateActionSheetPosition(scrollOffset);
    this._scrollTo(scrollOffset);
  }

  _scrollTo = (y, animated = true) => {
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
    if (this.props.gestureEnabled) {
      this.setState({
        scrollable: true,
      });
    }
  };

  _onScroll = (event) => {
    this.targetId = event.nativeEvent.target;
    this.offsetY = event.nativeEvent.contentOffset.y;

    let correction = this.state.deviceHeight * 0.1;
    let distanceFromTop = this.actionSheetHeight + correction - this.offsetY;

    if (this.actionSheetHeight >= this.state.deviceHeight) {
      if (
        distanceFromTop < StatusBar.currentHeight &&
        Platform.OS === "android" &&
        this.props.statusBarTranslucent
      ) {
        this.indicatorTranslateY.setValue(-distanceFromTop);
      }

      if (
        distanceFromTop < this.getSafeAreaPadding() &&
        Platform.OS === "ios"
      ) {
        this.indicatorTranslateY.setValue(
          this.getSafeAreaPadding() - distanceFromTop
        );
      } else if (Platform.OS === "ios") {
        this.indicatorTranslateY.setValue(
          this.actionSheetHeight - safeAreaInnerHeight > 30 ? 10 : -5
        );
      }
    }

    if (distanceFromTop < 50) {
      DeviceEventEmitter.emit("hasReachedTop", true);
      this.props.onPositionChanged && this.props.onPositionChanged(true)
    } else {
      DeviceEventEmitter.emit("hasReachedTop", false);
      this.props.onPositionChanged && this.props.onPositionChanged(false)
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

  _onKeyboardShow = (e) => {
    this.setState({
      keyboard: true,
    });
    const ReactNativeVersion = require("react-native/Libraries/Core/ReactNativeVersion");

    let v = ReactNativeVersion.version.major + ReactNativeVersion.version.minor;
    v = parseInt(v);

    if (v >= 63 || Platform.OS === "ios") {
      let keyboardHeight = e.endCoordinates.height;
      const { height: windowHeight } = Dimensions.get("window");

      const currentlyFocusedField = TextInput.State.currentlyFocusedInput
        ? findNodeHandle(TextInput.State.currentlyFocusedInput())
        : TextInput.State.currentlyFocusedField();

      if (!currentlyFocusedField) {
        return;
      }

      UIManager.measure(
        currentlyFocusedField,
        (originX, originY, width, height, pageX, pageY) => {
          const fieldHeight = height;
          const fieldTop = pageY;
          const gap = windowHeight - keyboardHeight - (fieldTop + fieldHeight);
          if (gap >= 0) {
            return;
          }
          Animated.timing(this.transformValue, {
            toValue: gap - 10,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      );
    } else {
      Animated.timing(this.transformValue, {
        toValue: -10,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
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
      if (this.props.isOverlay && this.offsetY > scrollOffset - 100) {
        this.isRecoiling = true;
        this._scrollTo(scrollOffset);
        this.currentOffsetFromBottom = this.props.initialOffsetFromBottom;
        this.prevScroll = scrollOffset;
      } else {
        this._hideModal();
      }
    } else {
      this.isRecoiling = true;
      this._scrollTo(this.prevScroll, true);
    }
  };

  _onKeyboardHide = () => {
    this.setState({
      keyboard: false,
    });
    this.opacityValue.setValue(1);
    Animated.timing(this.transformValue, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
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

  _onDeviceLayout = (_event) => {
    let event = { ..._event };
    let height = event.nativeEvent.layout.height;
    let width = event.nativeEvent.layout.width;

    if (
      height?.toFixed(0) === calculatedDeviceHeight?.toFixed(0) &&
      width?.toFixed(0) === this.state.deviceWidth?.toFixed(0)
    )
      return;
    calculatedDeviceHeight = height;
    this.setState({
      deviceHeight: height,
      deviceWidth: width,
      portrait: height > width,
    });
  };

  getInitialScrollPosition() {
    this._applyHeightLimiter();
    let correction = this.state.deviceHeight * 0.1;
    let scrollPosition = this.props.gestureEnabled
      ? this.actionSheetHeight * this.props.initialOffsetFromBottom +
        correction +
        this.props.extraScroll
      : this.actionSheetHeight + correction + this.props.extraScroll;
    this.currentOffsetFromBottom = this.props.initialOffsetFromBottom;
    this.updateActionSheetPosition(scrollPosition);
    return scrollPosition;
  }

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
              width: "100%",
            },
          ]}
        >
          <FlatList
            bounces={false}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            ref={this.scrollViewRef}
            scrollEventThrottle={5}
            showsVerticalScrollIndicator={false}
            onMomentumScrollBegin={this._onScrollBegin}
            onMomentumScrollEnd={this._onScrollEnd}
            scrollEnabled={scrollable && !keyboard}
            onScrollBeginDrag={this._onScrollBeginDrag}
            onScrollEndDrag={this._onScrollEnd}
            onTouchEnd={this._onTouchEnd}
            onScroll={this._onScroll}
            style={[
              styles.scrollView,
              {
                width: this.state.deviceWidth,
              },
            ]}
            contentContainerStyle={{
              width: this.state.deviceWidth,
            }}
            data={["dummy"]}
            keyExtractor={(item) => item}
            renderItem={({ item, index }) => (
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
                    height: this.state.deviceHeight * 1.1,
                    width: "100%",
                    zIndex: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={this._onTouchBackdrop}
                    onLongPress={this._onTouchBackdrop}
                    style={{
                      height: this.state.deviceHeight * 1.1,
                      width: "100%",
                    }}
                  />
                </View>

                <AnimatedSafeAreaView
                  onLayout={this._showModal}
                  style={[
                    styles.container,
                    {
                      borderRadius: 10,
                      paddingTop: 5,
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
                    },
                  ]}
                >
                  {statusBarTranslucent && Platform.OS === "android" && (
                    <View
                      style={{
                        height: StatusBar.currentHeight,
                      }}
                    ></View>
                  )}
                  <Animated.View
                    onLayout={(event) => {
                      safeAreaInnerHeight = event.nativeEvent.layout.height;
                    }}
                    style={{
                      maxHeight: "100%",
                      transform: [
                        {
                          translateY:
                            (statusBarTranslucent &&
                              Platform.OS === "android") ||
                            Platform.OS === "ios"
                              ? this.indicatorTranslateY
                              : 0,
                        },
                      ],
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
                </AnimatedSafeAreaView>
              </View>
            )}
          />
        </Animated.View>
      </Modal>
    );
  }
}

ActionSheet.defaultProps = {
  testID: "actionSheetTest",
  children: <View />,
  CustomHeaderComponent: null,
  headerAlwaysVisible: false,
  containerStyle: {},
  animated: true,
  closeOnPressBack: true,
  gestureEnabled: false,
  bounceOnOpen: false,
  bounciness: 8,
  extraScroll: 0,
  hideUnderlay: false,
  closeAnimationDuration: 300,
  delayActionSheetDraw: false,
  delayActionSheetDrawTime: 50,
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
  onClose: () => {},
  onOpen: () => {},
  onPositionChanged: () => {},
  keyboardShouldPersistTaps: "never",
  statusBarTranslucent: true,
};
ActionSheet.propTypes = {
  testID: PropTypes.string,
  children: PropTypes.node,
  CustomHeaderComponent: PropTypes.node,
  extraScroll: PropTypes.number,
  headerAlwaysVisible: PropTypes.bool,
  containerStyle: ViewPropTypes.style,
  animated: PropTypes.bool,
  hideUnderlay: PropTypes.bool,
  closeOnPressBack: PropTypes.bool,
  delayActionSheetDraw: PropTypes.bool,
  delayActionSheetDrawTime: PropTypes.number,
  gestureEnabled: PropTypes.bool,
  closeOnTouchBackdrop: PropTypes.bool,
  bounceOnOpen: PropTypes.bool,
  bounciness: PropTypes.number,
  springOffset: PropTypes.number,
  defaultOverlayOpacity: PropTypes.number,
  closeAnimationDuration: PropTypes.number,
  openAnimationSpeed: PropTypes.number,
  elevation: PropTypes.number,
  initialOffsetFromBottom: PropTypes.number,
  indicatorColor: PropTypes.string,
  closable: PropTypes.bool,
  bottomOffset: PropTypes.number,
  overlayColor: PropTypes.string,
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
  onPositionChanged: PropTypes.func,
  keyboardShouldPersistTaps: PropTypes.oneOf(["always", "handled", "never"]),
  statusBarTranslucent: PropTypes.bool,
};
