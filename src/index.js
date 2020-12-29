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

let safeareaHeight;
let innerViewHeight;
let calculatedDeviceHeight;

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
    };
    this.transformValue = new Animated.Value(0);
    this.opacityValue = new Animated.Value(0);
    this.customComponentHeight;
    this.prevScroll;
    this.scrollAnimationEndValue;
    this.hasBounced;
    this.scrollViewRef = createRef();
    this.layoutHasCalled = false;
    this.isClosing = false;
    this.isRecoiling = false;
    this.targetId = null;
    this.offsetY = 0;
    this.borderRadius = new Animated.Value(10);
    this.currentOffsetFromBottom = this.props.initialOffsetFromBottom;
    this.underlayTranslateY = new Animated.Value(100);
    this.underlayScale = new Animated.Value(1);
    safeareaHeight =
      safeareaHeight || getDeviceHeight(this.props.statusBarTranslucent);
    innerViewHeight =
      innerViewHeight || getDeviceHeight(this.props.statusBarTranslucent);
    this.layoutTime = null;
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
        toValue: closable ? this.customComponentHeight * 2 : 0,
        duration: animated ? closeAnimationDuration : 1,
        useNativeDriver: true,
      }),
    ]).start();

    waitAsync(closeAnimationDuration / 1.5).then(() => {
      let scrollOffset = closable
        ? 0
        : this.customComponentHeight * initialOffsetFromBottom +
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
      initialOffsetFromBottom,
      extraScroll,
      delayActionSheetDraw,
      delayActionSheetDrawTime,
    } = this.props;

    let height = event.nativeEvent.layout.height;

    if (this.layoutHasCalled) {
      this._returnToPrevScrollPosition(height);
      this.customComponentHeight = height;

      return;
    } else {
      this.customComponentHeight = height;
      this._applyHeightLimiter();
      let correction = this.state.deviceHeight * 0.1;

      let scrollOffset = gestureEnabled
        ? this.customComponentHeight * initialOffsetFromBottom +
          correction +
          extraScroll
        : this.customComponentHeight + correction + extraScroll;

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
      }
      this.layoutHasCalled = true;
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
    if (this.customComponentHeight > this.state.deviceHeight) {
      this.customComponentHeight =
        (this.customComponentHeight -
          (this.customComponentHeight - this.state.deviceHeight)) *
        1;
    }
  }

  _onScrollEnd = async (event) => {
    let { springOffset, extraScroll } = this.props;
    let verticalOffset = event.nativeEvent.contentOffset.y;

    let correction = this.state.deviceHeight * 0.1;
    let distanceFromTop =
      this.customComponentHeight + correction - this.offsetY;
    this._showHideTopUnderlay(distanceFromTop);

    if (this.isRecoiling) return;

    if (this.prevScroll < verticalOffset) {
      if (verticalOffset - this.prevScroll > springOffset * 0.75) {
        this.isRecoiling = true;

        this._applyHeightLimiter();
        let correction = this.state.deviceHeight * 0.1;
        let scrollValue = this.customComponentHeight + correction + extraScroll;

        this._scrollTo(scrollValue);
        await waitAsync(300);
        this.isRecoiling = false;
        this.currentOffsetFromBottom = 1;
        DeviceEventEmitter.emit("hasReachedTop", true);
      } else {
        this._returnToPrevScrollPosition(this.customComponentHeight);
      }
    } else {
      if (this.prevScroll - verticalOffset > springOffset) {
        this._hideModal();
      } else {
        if (this.isRecoiling) {
          return;
        }
        this.isRecoiling = true;
        this._returnToPrevScrollPosition(this.customComponentHeight);
        await waitAsync(300);
        this.isRecoiling = false;
      }
    }
  };

  _returnToPrevScrollPosition(height) {
    let offset =
      height * this.currentOffsetFromBottom +
      this.state.deviceHeight * 0.1 +
      this.props.extraScroll;
    this._scrollTo(offset);
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

  getTarget = () => {
    return this.targetId;
  };

  _showHideTopUnderlay(distanceFromTop) {
    if (this.props.hideUnderlay) return;
    let diff =
      this.customComponentHeight > this.state.deviceHeight
        ? this.customComponentHeight - this.state.deviceHeight
        : this.state.deviceHeight - this.customComponentHeight;
    if (diff < 1) {
      this.underlayTranslateY.setValue(-(100 - distanceFromTop));
      this.underlayScale.setValue(1 + (100 - distanceFromTop) / 100);
    }
  }

  _onScroll = (event) => {
    this.targetId = event.nativeEvent.target;
    this.offsetY = event.nativeEvent.contentOffset.y;

    let correction = this.state.deviceHeight * 0.1;
    let distanceFromTop =
      this.customComponentHeight + correction - this.offsetY;

    if (distanceFromTop < 50) {
      this._showHideTopUnderlay(distanceFromTop);
      DeviceEventEmitter.emit("hasReachedTop", true);
    } else {
      if (distanceFromTop < 300) {
        this._showHideTopUnderlay(distanceFromTop);
      }

      DeviceEventEmitter.emit("hasReachedTop", false);
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

  handleChildScrollEnd = () => {
    if (this.offsetY > this.prevScroll) return;
    if (this.prevScroll - this.props.springOffset > this.offsetY) {
      this._hideModal();
    } else {
      this.isRecoiling = true;
      this._scrollTo(this.prevScroll, true);
      setTimeout(() => {
        this.isRecoiling = false;
      }, 150);
    }
  };

  _onKeyboardHide = () => {
    this.setState({
      keyboard: false,
    });
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

  _onDeviceLayout = (event) => {
    if (this.layoutTime) {
      clearTimeout(this.layoutTime);
      this.layoutTime = null;
    }
    this.layoutTime = setTimeout(() => {
      let topSafeAreaPadding = (safeareaHeight - innerViewHeight) / 2;
      let height =
        Platform.OS === "ios"
          ? event.nativeEvent.layout.height - topSafeAreaPadding
          : event.nativeEvent.layout.height + StatusBar.currentHeight;
      if (this.props.statusBarTranslucent && Platform.OS === "android") {
        height = height - StatusBar.currentHeight;
      }
      let width = event.nativeEvent.layout.width;

      this._showHideTopUnderlay(
        this.customComponentHeight * this.currentOffsetFromBottom
      );

      // Do not update state if the device height is same as before.
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
    }, 20);
  };

  _getSafeAreaHeight = (event) => {
    safeareaHeight = event.nativeEvent.layout.height;

    this._getSafeAreaChildHeight({
      nativeEvent: {
        layout: {
          height: innerViewHeight,
          width: event.nativeEvent.layout.width,
          init: true,
        },
      },
    });
  };

  _getSafeAreaChildHeight = (event) => {
    innerViewHeight = event.nativeEvent.layout.height;
    event.nativeEvent.layout.height = safeareaHeight;
    if (!event.nativeEvent.layout.init) return;
    this._onDeviceLayout(event);
  };

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
      hideUnderlay,
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
          onLayout={this._getSafeAreaHeight}
          style={[
            styles.parentContainer,
            {
              opacity: this.opacityValue,
              width: "100%",
            },
          ]}
        >
          <SafeAreaView
            onLayout={this._getSafeAreaHeight}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              backgroundColor: "transparent",
            }}
          >
            <View
              onLayout={this._getSafeAreaChildHeight}
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </SafeAreaView>
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
                    },
                  ]}
                >
                  {!hideUnderlay && (
                    <Animated.View
                      style={{
                        position: "absolute",
                        top: 0,
                        width: "100%",
                        height: this.state.deviceHeight / 1.5,
                        backgroundColor:
                          containerStyle?.backgroundColor || "white",
                        borderRadius: containerStyle?.borderRadius || 10,
                        borderTopLeftRadius:
                          containerStyle?.borderTopLeftRadius || 10,
                        borderTopRightRadius:
                          containerStyle?.borderTopRightRadius || 10,
                        transform: [
                          {
                            translateY: this.underlayTranslateY,
                          },
                          {
                            scaleX: this.underlayScale,
                          },
                        ],
                      }}
                    />
                  )}
                  {gestureEnabled || headerAlwaysVisible ? (
                    CustomHeaderComponent ? (
                      CustomHeaderComponent
                    ) : (
                      <View
                        style={[
                          styles.indicator,
                          { backgroundColor: indicatorColor },
                        ]}
                      />
                    )
                  ) : null}

                  {children}
                </Animated.View>
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
  keyboardShouldPersistTaps: PropTypes.oneOf(["always", "default", "never"]),
  statusBarTranslucent: PropTypes.bool,
};
