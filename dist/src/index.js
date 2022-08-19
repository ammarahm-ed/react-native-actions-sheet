var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, } from "react";
import { Animated, BackHandler, Dimensions, Easing, KeyboardAvoidingView, Modal, PanResponder, Platform, SafeAreaView, StatusBar, TouchableOpacity, View, } from "react-native";
import { actionSheetEventManager } from "./eventmanager";
import useSheetManager from "./hooks/use-sheet-manager";
import { SheetManager } from "./sheetmanager";
import { styles } from "./styles";
import { getDeviceHeight, getElevation, SUPPORTED_ORIENTATIONS } from "./utils";
var CALCULATED_DEVICE_HEIGHT = 0;
export default forwardRef(function ActionSheet(_a, ref) {
    var _b, _c, _d, _e, _f, _g, _h;
    var _j = _a.animated, animated = _j === void 0 ? true : _j, _k = _a.closeOnPressBack, closeOnPressBack = _k === void 0 ? true : _k, _l = _a.springOffset, springOffset = _l === void 0 ? 50 : _l, _m = _a.elevation, elevation = _m === void 0 ? 5 : _m, _o = _a.defaultOverlayOpacity, defaultOverlayOpacity = _o === void 0 ? 0.3 : _o, _p = _a.overlayColor, overlayColor = _p === void 0 ? "black" : _p, _q = _a.closable, closable = _q === void 0 ? true : _q, _r = _a.closeOnTouchBackdrop, closeOnTouchBackdrop = _r === void 0 ? true : _r, _s = _a.drawUnderStatusBar, drawUnderStatusBar = _s === void 0 ? false : _s, _t = _a.statusBarTranslucent, statusBarTranslucent = _t === void 0 ? true : _t, _u = _a.gestureEnabled, gestureEnabled = _u === void 0 ? false : _u, _v = _a.isModal, isModal = _v === void 0 ? true : _v, _w = _a.snapPoints, snapPoints = _w === void 0 ? [100] : _w, _x = _a.initialSnapIndex, initialSnapIndex = _x === void 0 ? 0 : _x, _y = _a.overdrawEnabled, overdrawEnabled = _y === void 0 ? true : _y, _z = _a.overdrawFactor, overdrawFactor = _z === void 0 ? 15 : _z, _0 = _a.overdrawSize, overdrawSize = _0 === void 0 ? 100 : _0, _1 = _a.zIndex, zIndex = _1 === void 0 ? 9999 : _1, props = __rest(_a, ["animated", "closeOnPressBack", "springOffset", "elevation", "defaultOverlayOpacity", "overlayColor", "closable", "closeOnTouchBackdrop", "drawUnderStatusBar", "statusBarTranslucent", "gestureEnabled", "isModal", "snapPoints", "initialSnapIndex", "overdrawEnabled", "overdrawFactor", "overdrawSize", "zIndex"]);
    snapPoints =
        snapPoints[snapPoints.length - 1] !== 100
            ? __spreadArray(__spreadArray([], snapPoints, true), [100], false) : snapPoints;
    var initialValue = useRef(0);
    var actionSheetHeight = useRef(0);
    var safeAreaPaddingTop = useRef(0);
    var contextRef = useRef("global");
    var currentSnapIndex = useRef(initialSnapIndex);
    var gestureBoundaries = useRef({});
    var _2 = useState({
        width: Dimensions.get("window").width,
        height: CALCULATED_DEVICE_HEIGHT || getDeviceHeight(statusBarTranslucent),
        portrait: true
    }), dimensions = _2[0], setDimensions = _2[1];
    var _3 = useSheetManager({
        id: props.id,
        onHide: function (data) {
            hideSheet(data);
        },
        onBeforeShow: props.onBeforeShow,
        onContextUpdate: function (context) {
            if (props.id) {
                contextRef.current = context || "global";
                SheetManager.add(props.id, contextRef.current);
                SheetManager.registerRef(props.id, contextRef.current, {
                    current: getRef()
                });
            }
        }
    }), visible = _3.visible, setVisible = _3.setVisible;
    var animations = useState({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
        underlayTranslateY: new Animated.Value(100)
    })[0];
    var returnAnimation = function (velocity) {
        if (!animated) {
            animations.translateY.setValue(initialValue.current);
            return;
        }
        var config = props.openAnimationConfig;
        Animated.spring(animations.translateY, __assign(__assign({ toValue: initialValue.current, useNativeDriver: true }, config), { velocity: velocity })).start();
    };
    var hideAnimation = function (vy, callback) {
        if (!animated) {
            callback === null || callback === void 0 ? void 0 : callback({ finished: true });
            return;
        }
        var config = props.closeAnimationConfig;
        opacityAnimation(0);
        Animated.spring(animations.translateY, __assign({ velocity: vy, toValue: dimensions.height * 1.3, useNativeDriver: true }, config)).start(Platform.OS !== "web" ? callback : undefined);
        if (Platform.OS === "web") {
            setTimeout(function () {
                callback === null || callback === void 0 ? void 0 : callback({ finished: true });
            }, 300);
        }
    };
    var getCurrentPosition = function () {
        //@ts-ignore
        return animations.translateY._value < 0
            ? 0
            : //@ts-ignore
                animations.translateY._value;
    };
    var getNextPosition = function (snapIndex) {
        return (actionSheetHeight.current -
            (actionSheetHeight.current * snapPoints[snapIndex]) / 100);
    };
    var opacityAnimation = function (opacity) {
        Animated.timing(animations.opacity, {
            duration: 150,
            easing: Easing["in"](Easing.ease),
            toValue: opacity,
            useNativeDriver: true
        }).start();
    };
    var hardwareBackPressEvent = useRef();
    var Root = isModal && !(props === null || props === void 0 ? void 0 : props.backgroundInteractionEnabled) ? Modal : Animated.View;
    var getRef = function () { return ({
        show: function () {
            setTimeout(function () {
                setVisible(true);
            }, 1);
        },
        hide: function (data) {
            hideSheet(data);
        },
        setModalVisible: function (visible) {
            if (visible) {
                setTimeout(function () {
                    setVisible(true);
                }, 1);
            }
            else {
                hideSheet();
            }
        },
        snapToOffset: function (offset) {
            initialValue.current =
                actionSheetHeight.current -
                    (actionSheetHeight.current * offset) / 100;
            Animated.spring(animations.translateY, __assign({ toValue: initialValue.current, useNativeDriver: true }, props.openAnimationConfig)).start();
        },
        snapToIndex: function (index) {
            if (index > snapPoints.length || index < 0)
                return;
            currentSnapIndex.current = index;
            initialValue.current = getNextPosition(index);
            Animated.spring(animations.translateY, __assign({ toValue: initialValue.current, useNativeDriver: true }, props.openAnimationConfig)).start();
        },
        handleChildScrollEnd: function () {
            console.warn("handleChildScrollEnd has been removed. Please use `useScrollHandlers` hook to enable scrolling in ActionSheet");
        },
        modifyGesturesForLayout: function (id, layout, scrollOffset) {
            //@ts-ignore
            gestureBoundaries.current[id] = __assign(__assign({}, layout), { scrollOffset: scrollOffset });
        },
        isGestureEnabled: function () { return gestureEnabled; },
        isOpen: function () { return visible; }
    }); };
    useImperativeHandle(ref, getRef, []);
    useEffect(function () {
        var listener = animations.translateY.addListener(function (value) {
            var _a;
            (_a = props === null || props === void 0 ? void 0 : props.onChange) === null || _a === void 0 ? void 0 : _a.call(props, value.value);
            actionSheetEventManager.publish("onoffsetchange", value.value);
            if (drawUnderStatusBar) {
                if (actionSheetHeight.current === dimensions.height) {
                    var offsetTop = value.value;
                    if (offsetTop < 100) {
                        animations.underlayTranslateY.setValue(offsetTop);
                    }
                }
            }
        });
        return function () {
            var _a;
            listener && animations.translateY.removeListener(listener);
            props.id && SheetManager.remove(props.id, contextRef.current);
            (_a = hardwareBackPressEvent.current) === null || _a === void 0 ? void 0 : _a.remove();
        };
    }, [props === null || props === void 0 ? void 0 : props.id, dimensions.height]);
    var onHardwareBackPress = function () {
        if (visible && closable && closeOnPressBack) {
            hideSheet();
            return true;
        }
        return false;
    };
    var onRequestClose = function () { };
    var rootProps = isModal
        ? {
            visible: true,
            animationType: "none",
            testID: ((_b = props.testIDs) === null || _b === void 0 ? void 0 : _b.modal) || props.testID,
            supportedOrientations: SUPPORTED_ORIENTATIONS,
            onShow: props.onOpen,
            onRequestClose: onRequestClose,
            transparent: true,
            statusBarTranslucent: statusBarTranslucent
        }
        : {
            testID: ((_c = props.testIDs) === null || _c === void 0 ? void 0 : _c.root) || props.testID,
            onLayout: function () {
                var _a;
                hardwareBackPressEvent.current = BackHandler.addEventListener("hardwareBackPress", onHardwareBackPress);
                (_a = props === null || props === void 0 ? void 0 : props.onOpen) === null || _a === void 0 ? void 0 : _a.call(props);
            },
            style: {
                position: "absolute",
                zIndex: zIndex,
                width: "100%",
                height: "100%"
            },
            pointerEvents: (props === null || props === void 0 ? void 0 : props.backgroundInteractionEnabled)
                ? "box-none"
                : "auto"
        };
    var onDeviceLayout = React.useCallback(function (event) {
        var safeMarginFromTop = Platform.OS === "ios"
            ? safeAreaPaddingTop.current || 0
            : StatusBar.currentHeight || 0;
        var height = event.nativeEvent.layout.height - safeMarginFromTop;
        var width = Dimensions.get("window").width;
        if ((height === null || height === void 0 ? void 0 : height.toFixed(0)) === (CALCULATED_DEVICE_HEIGHT === null || CALCULATED_DEVICE_HEIGHT === void 0 ? void 0 : CALCULATED_DEVICE_HEIGHT.toFixed(0)) &&
            (width === null || width === void 0 ? void 0 : width.toFixed(0)) === dimensions.width.toFixed(0))
            return;
        setDimensions({
            width: width,
            height: height,
            portrait: height > width
        });
    }, []);
    var hideSheet = function (vy, data) {
        if (!closable) {
            returnAnimation(vy);
            return;
        }
        hideAnimation(vy, function (_a) {
            var finished = _a.finished;
            if (finished) {
                if (closable) {
                    setVisible(false);
                    if (props.id) {
                        actionSheetEventManager.publish("onclose_".concat(props.id), data || props.payload || data);
                    }
                }
                else {
                    returnAnimation();
                }
            }
        });
    };
    var handlers = React.useMemo(function () {
        return !gestureEnabled
            ? { panHandlers: {} }
            : PanResponder.create({
                onMoveShouldSetPanResponderCapture: function (event, gesture) {
                    var gestures = true;
                    for (var id in gestureBoundaries.current) {
                        var gestureBoundary = gestureBoundaries.current[id];
                        console.log(gestureBoundaries.current);
                        if (getCurrentPosition() > 3 || !gestureBoundary)
                            gestures = true;
                        var scrollOffset = (gestureBoundary === null || gestureBoundary === void 0 ? void 0 : gestureBoundary.scrollOffset) || 0;
                        if (gestureBoundary.y === undefined ||
                            event.nativeEvent.pageY < (gestureBoundary === null || gestureBoundary === void 0 ? void 0 : gestureBoundary.y) ||
                            (event.nativeEvent.pageY > (gestureBoundary === null || gestureBoundary === void 0 ? void 0 : gestureBoundary.y) &&
                                gesture.vy > 0 &&
                                scrollOffset <= 0)) {
                            gestures = true;
                        }
                        else {
                            gestures = false;
                        }
                    }
                    return gestures;
                },
                onStartShouldSetPanResponder: function (event, gesture) {
                    if (Platform.OS === "web") {
                        var gestures = true;
                        for (var id in gestureBoundaries.current) {
                            var gestureBoundary = gestureBoundaries.current[id];
                            if (getCurrentPosition() > 3 || !gestureBoundary)
                                gestures = true;
                            var scrollOffset = (gestureBoundary === null || gestureBoundary === void 0 ? void 0 : gestureBoundary.scrollOffset) || 0;
                            if (gestureBoundary.y === undefined ||
                                event.nativeEvent.pageY < (gestureBoundary === null || gestureBoundary === void 0 ? void 0 : gestureBoundary.y) ||
                                (event.nativeEvent.pageY > (gestureBoundary === null || gestureBoundary === void 0 ? void 0 : gestureBoundary.y) &&
                                    gesture.vy > 0 &&
                                    scrollOffset <= 0)) {
                                gestures = true;
                            }
                            else {
                                gestures = false;
                            }
                        }
                        return gestures;
                    }
                    return true;
                },
                onPanResponderMove: function (_event, gesture) {
                    if (
                    //@ts-ignore
                    animations.translateY._value <= -overdrawSize / 2 &&
                        gesture.dy <= 0)
                        return;
                    var value = initialValue.current + gesture.dy;
                    animations.translateY.setValue(value <= 0
                        ? overdrawEnabled
                            ? value / overdrawFactor
                            : 0
                        : value);
                },
                onPanResponderEnd: function (_event, gesture) {
                    var isMovingUp = getCurrentPosition() < initialValue.current;
                    if ((!isMovingUp &&
                        getCurrentPosition() <
                            initialValue.current + springOffset) ||
                        (isMovingUp &&
                            getCurrentPosition() > initialValue.current - springOffset)) {
                        returnAnimation(gesture.vy);
                        return;
                    }
                    if (!isMovingUp) {
                        snapBackward(gesture.vy);
                    }
                    else {
                        snapForward(gesture.vy);
                    }
                }
            });
    }, [hideSheet, gestureEnabled, closable]);
    /**
     * Snap towards the top
     */
    var snapForward = function (vy) {
        if (currentSnapIndex.current === snapPoints.length - 1) {
            returnAnimation(vy);
            return;
        }
        var nextSnapPoint = 0;
        var nextSnapIndex = 0;
        if (getCurrentPosition() === 0) {
            nextSnapPoint = snapPoints[(nextSnapIndex = snapPoints.length - 1)];
        }
        else {
            for (var i = currentSnapIndex.current; i < snapPoints.length; i++) {
                if (getNextPosition(i) < getCurrentPosition()) {
                    nextSnapPoint = snapPoints[(nextSnapIndex = i)];
                    break;
                }
            }
        }
        if (nextSnapPoint > 100) {
            console.warn("Snap points should range between 0 to 100.");
            returnAnimation(vy);
            return;
        }
        currentSnapIndex.current = nextSnapIndex;
        initialValue.current = getNextPosition(currentSnapIndex.current);
        returnAnimation(vy);
    };
    /**
     * Snap towards the bottom
     */
    var snapBackward = function (vy) {
        if (currentSnapIndex.current === 0) {
            if (closable) {
                initialValue.current = dimensions.height * 1.3;
                hideSheet(vy);
            }
            else {
                returnAnimation(vy);
            }
            return;
        }
        var nextSnapPoint = 0;
        var nextSnapIndex = 0;
        for (var i = currentSnapIndex.current; i > -1; i--) {
            if (getNextPosition(i) > getCurrentPosition()) {
                nextSnapPoint = snapPoints[(nextSnapIndex = i)];
                break;
            }
        }
        if (nextSnapPoint < 0) {
            console.warn("Snap points should range between 0 to 100.");
            returnAnimation(vy);
            return;
        }
        currentSnapIndex.current = nextSnapIndex;
        initialValue.current = getNextPosition(currentSnapIndex.current);
        returnAnimation(vy);
    };
    var onTouch = function () {
        if (closeOnTouchBackdrop && closable) {
            hideSheet();
        }
    };
    var onSheetLayout = function (event) {
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
    };
    return (<>
        {Platform.OS === "ios" ? (<SafeAreaView pointerEvents="none" onLayout={function (event) {
                var height = event.nativeEvent.layout.height;
                if (height) {
                    safeAreaPaddingTop.current = event.nativeEvent.layout.height;
                }
            }} style={{
                position: "absolute",
                width: 1,
                left: 0,
                top: 0
            }}>
            <View />
          </SafeAreaView>) : null}
        {visible ? (<Root {...rootProps}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{
                height: "100%",
                width: "100%"
            }} {...props.keyboardAvoidingViewProps}>
              <Animated.View onLayout={onDeviceLayout} pointerEvents={(props === null || props === void 0 ? void 0 : props.backgroundInteractionEnabled) ? "box-none" : "auto"} style={[
                styles.parentContainer,
                {
                    opacity: animations.opacity,
                    width: "100%",
                    justifyContent: "flex-end"
                },
            ]}>
                {!(props === null || props === void 0 ? void 0 : props.backgroundInteractionEnabled) ? (<TouchableOpacity onPress={onTouch} activeOpacity={defaultOverlayOpacity} testID={(_d = props.testIDs) === null || _d === void 0 ? void 0 : _d.backdrop} style={{
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                    zIndex: 2,
                    backgroundColor: overlayColor,
                    opacity: defaultOverlayOpacity
                }}/>) : null}

                <Animated.View {...handlers.panHandlers} onLayout={onSheetLayout} testID={(_e = props.testIDs) === null || _e === void 0 ? void 0 : _e.sheet} style={[
                styles.container,
                __assign({ borderTopRightRadius: 10, borderTopLeftRadius: 10 }, getElevation(typeof elevation === "number" ? elevation : 5)),
                props.containerStyle,
                {
                    zIndex: 10,
                    maxHeight: dimensions.height,
                    transform: [
                        {
                            translateY: animations.translateY
                        },
                    ]
                },
            ]}>
                  {drawUnderStatusBar ? (<Animated.View style={{
                    height: 100,
                    position: "absolute",
                    top: -50,
                    backgroundColor: ((_f = props.containerStyle) === null || _f === void 0 ? void 0 : _f.backgroundColor) || "white",
                    width: "100%",
                    borderRadius: ((_g = props.containerStyle) === null || _g === void 0 ? void 0 : _g.borderRadius) || 10,
                    transform: [
                        {
                            translateY: animations.underlayTranslateY
                        },
                    ]
                }}/>) : null}
                  {gestureEnabled || props.headerAlwaysVisible ? (props.CustomHeaderComponent ? (props.CustomHeaderComponent) : (<Animated.View style={[styles.indicator, props.indicatorStyle]}/>)) : null}

                  {props === null || props === void 0 ? void 0 : props.children}

                  {overdrawEnabled ? (<Animated.View style={{
                    height: overdrawSize,
                    position: "absolute",
                    bottom: -overdrawSize,
                    backgroundColor: ((_h = props.containerStyle) === null || _h === void 0 ? void 0 : _h.backgroundColor) || "white",
                    width: dimensions.width
                }}/>) : null}
                </Animated.View>
              </Animated.View>
            </KeyboardAvoidingView>
          </Root>) : null}
      </>);
});
