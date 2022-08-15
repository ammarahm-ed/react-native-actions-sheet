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
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, } from "react";
import { Animated, BackHandler, Dimensions, Easing, Modal, PanResponder, StatusBar, View, } from "react-native";
import { actionSheetEventManager } from "./eventmanager";
import { SheetManager } from "./sheetmanager";
import { styles } from "./styles";
import { getDeviceHeight, getElevation, SUPPORTED_ORIENTATIONS } from "./utils";
import useSheetManager from "./hooks/use-sheet-manager";
var CALCULATED_DEVICE_HEIGHT = 0;
export default forwardRef(function ActionSheet(_a, ref) {
    var _b, _c, _d, _e;
    var _f = _a.animated, animated = _f === void 0 ? true : _f, _g = _a.closeOnPressBack, closeOnPressBack = _g === void 0 ? true : _g, _h = _a.bounciness, bounciness = _h === void 0 ? 8 : _h, _j = _a.extraScroll, extraScroll = _j === void 0 ? 0 : _j, _k = _a.closeAnimationDuration, closeAnimationDuration = _k === void 0 ? 300 : _k, _l = _a.delayActionSheetDrawTime, delayActionSheetDrawTime = _l === void 0 ? 0 : _l, _m = _a.openAnimationSpeed, openAnimationSpeed = _m === void 0 ? 8 : _m, _o = _a.springOffset, springOffset = _o === void 0 ? 50 : _o, _p = _a.elevation, elevation = _p === void 0 ? 5 : _p, _q = _a.initialOffsetFromBottom, initialOffsetFromBottom = _q === void 0 ? 1 : _q, _r = _a.indicatorColor, indicatorColor = _r === void 0 ? "#f0f0f0" : _r, _s = _a.defaultOverlayOpacity, defaultOverlayOpacity = _s === void 0 ? 0.3 : _s, _t = _a.overlayColor, overlayColor = _t === void 0 ? "black" : _t, _u = _a.closable, closable = _u === void 0 ? true : _u, _v = _a.bottomOffset, bottomOffset = _v === void 0 ? 0 : _v, _w = _a.closeOnTouchBackdrop, closeOnTouchBackdrop = _w === void 0 ? true : _w, _x = _a.drawUnderStatusBar, drawUnderStatusBar = _x === void 0 ? false : _x, _y = _a.statusBarTranslucent, statusBarTranslucent = _y === void 0 ? true : _y, _z = _a.gestureEnabled, gestureEnabled = _z === void 0 ? false : _z, _0 = _a.keyboardDismissMode, keyboardDismissMode = _0 === void 0 ? "none" : _0, _1 = _a.keyboardHandlerEnabled, keyboardHandlerEnabled = _1 === void 0 ? true : _1, _2 = _a.isModal, isModal = _2 === void 0 ? true : _2, props = __rest(_a, ["animated", "closeOnPressBack", "bounciness", "extraScroll", "closeAnimationDuration", "delayActionSheetDrawTime", "openAnimationSpeed", "springOffset", "elevation", "initialOffsetFromBottom", "indicatorColor", "defaultOverlayOpacity", "overlayColor", "closable", "bottomOffset", "closeOnTouchBackdrop", "drawUnderStatusBar", "statusBarTranslucent", "gestureEnabled", "keyboardDismissMode", "keyboardHandlerEnabled", "isModal"]);
    var initialValue = useRef(0);
    var actionSheetHeight = useRef(0);
    var gestureBoundaries = useRef({});
    var _3 = useState({
        width: Dimensions.get("window").width,
        height: CALCULATED_DEVICE_HEIGHT || getDeviceHeight(statusBarTranslucent),
        portrait: true
    }), dimensions = _3[0], setDimensions = _3[1];
    var _4 = useSheetManager({
        id: props.id,
        onHide: function (data) {
            console.log(data);
            hideSheet(data);
        },
        onBeforeShow: props.onBeforeShow
    }), visible = _4.visible, setVisible = _4.setVisible;
    var animations = useState({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
        underlayTranslateY: new Animated.Value(100)
    })[0];
    var returnAnimation = function (velocity) {
        Animated.spring(animations.translateY, {
            toValue: initialValue.current,
            useNativeDriver: true,
            velocity: velocity
        }).start();
    };
    var hideAnimation = function (callback) {
        Animated.timing(animations.translateY, {
            duration: 150,
            easing: Easing["in"](Easing.ease),
            toValue: dimensions.height * 1.3,
            useNativeDriver: true
        }).start(callback);
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
    useImperativeHandle(ref, function () { return ({
        show: function () {
            setVisible(true);
        },
        hide: function (data) {
            hideSheet(data);
        },
        setModalVisible: function (visible) {
            if (visible) {
                setVisible(true);
            }
            else {
                hideSheet();
            }
        },
        snapToOffset: function (offset) {
            Animated.spring(animations.translateY, {
                toValue: actionSheetHeight.current - offset,
                useNativeDriver: true
            }).start();
        },
        handleChildScrollEnd: function () {
            console.warn("handleChildScrollEnd has been removed. Please use `useScrollHandlers` hook to enable scrolling in ActionSheet");
        },
        modifyGesturesForLayout: function (id, layout, scrollOffset) {
            //@ts-ignore
            gestureBoundaries.current[id] = __assign(__assign({}, layout), { scrollOffset: scrollOffset });
        }
    }); }, []);
    useEffect(function () {
        if (props.id) {
            SheetManager.add(props.id);
            SheetManager.registerRef(props.id, ref);
        }
        var listener = animations.translateY.addListener(function (value) {
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
            props.id && SheetManager.remove(props.id);
            (_a = hardwareBackPressEvent.current) === null || _a === void 0 ? void 0 : _a.remove();
        };
    }, [props === null || props === void 0 ? void 0 : props.id, dimensions.height]);
    var onHardwareBackPress = function () {
        return false;
    };
    var onRequestClose = function () { };
    var rootProps = isModal
        ? {
            visible: true,
            animationType: "none",
            testID: props.testID,
            supportedOrientations: SUPPORTED_ORIENTATIONS,
            onShow: props.onOpen,
            onRequestClose: onRequestClose,
            transparent: true,
            statusBarTranslucent: statusBarTranslucent
        }
        : {
            testID: props.testID,
            onLayout: function () {
                var _a;
                hardwareBackPressEvent.current = BackHandler.addEventListener("hardwareBackPress", onHardwareBackPress);
                (_a = props === null || props === void 0 ? void 0 : props.onOpen) === null || _a === void 0 ? void 0 : _a.call(props);
            },
            style: {
                position: "absolute",
                zIndex: 9999,
                width: "100%",
                height: "100%"
            },
            pointerEvents: (props === null || props === void 0 ? void 0 : props.backgroundInteractionEnabled)
                ? "box-none"
                : "auto"
        };
    var onDeviceLayout = React.useCallback(function (event) {
        var safeMarginFromTop = StatusBar.currentHeight || 0;
        var height = event.nativeEvent.layout.height - safeMarginFromTop;
        var width = Dimensions.get("window").width;
        if ((height === null || height === void 0 ? void 0 : height.toFixed(0)) === (CALCULATED_DEVICE_HEIGHT === null || CALCULATED_DEVICE_HEIGHT === void 0 ? void 0 : CALCULATED_DEVICE_HEIGHT.toFixed(0)) &&
            (width === null || width === void 0 ? void 0 : width.toFixed(0)) === dimensions.width.toFixed(0))
            return;
        initialValue.current =
            actionSheetHeight.current -
                actionSheetHeight.current * initialOffsetFromBottom;
        animations.translateY.setValue(actionSheetHeight.current * 1.3);
        setDimensions({
            width: width,
            height: height,
            portrait: height > width
        });
        opacityAnimation(1);
        returnAnimation();
    }, []);
    var hideSheet = function (data) {
        hideAnimation(function (_a) {
            var finished = _a.finished;
            if (closable)
                opacityAnimation(0);
            if (finished) {
                if (closable) {
                    setVisible(false);
                    if (props.id) {
                        actionSheetEventManager.publish("onclose_".concat(props.id), data || props.payload);
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
                        if (
                        //@ts-ignore
                        animations.translateY._value > 3 ||
                            !gestureBoundary)
                            gestures = true;
                        var scrollOffset = (gestureBoundary === null || gestureBoundary === void 0 ? void 0 : gestureBoundary.scrollOffset) || 0;
                        if (event.nativeEvent.pageY > (gestureBoundary === null || gestureBoundary === void 0 ? void 0 : gestureBoundary.y) &&
                            gesture.vy > 0 &&
                            scrollOffset <= 0) {
                            gestures = true;
                        }
                        else {
                            gestures = false;
                        }
                    }
                    return gestures;
                },
                onStartShouldSetPanResponder: function () { return true; },
                onPanResponderMove: function (_event, gesture) {
                    //@ts-ignore
                    if (animations.translateY._value <= -30 && gesture.dy <= 0)
                        return;
                    animations.translateY.setValue(
                    //@ts-ignore
                    animations.translateY._value < 0
                        ? 0 + gesture.dy / 15
                        : initialValue.current + gesture.dy);
                },
                onPanResponderEnd: function (_event, gesture) {
                    if (
                    //@ts-ignore
                    animations.translateY._value <
                        initialValue.current - springOffset) {
                        Animated.spring(animations.translateY, {
                            toValue: 0,
                            useNativeDriver: true,
                            velocity: gesture.vy
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
                }
            });
    }, [hideSheet, gestureEnabled, bottomOffset, closable]);
    var onTouch = function () {
        if (closeOnTouchBackdrop) {
            hideSheet();
        }
    };
    var onSheetLayout = function (event) {
        actionSheetHeight.current = event.nativeEvent.layout.height;
    };
    if (!visible)
        return null;
    return (<Root {...rootProps}>
        <Animated.View onLayout={onDeviceLayout} pointerEvents={(props === null || props === void 0 ? void 0 : props.backgroundInteractionEnabled) ? "box-none" : "auto"} style={[
            styles.parentContainer,
            {
                opacity: animations.opacity,
                width: "100%",
                justifyContent: "flex-end"
            },
        ]}>
          {!(props === null || props === void 0 ? void 0 : props.backgroundInteractionEnabled) ? (<View onTouchEnd={onTouch} onTouchMove={onTouch} onTouchStart={onTouch} testID={(_b = props.testIDs) === null || _b === void 0 ? void 0 : _b.backdrop} style={{
                height: "100%",
                width: "100%",
                position: "absolute",
                zIndex: 1,
                backgroundColor: overlayColor,
                opacity: defaultOverlayOpacity
            }}/>) : null}

          <Animated.View {...handlers.panHandlers} onLayout={onSheetLayout} style={[
            styles.container,
            __assign({ borderTopRightRadius: 10, borderTopLeftRadius: 10 }, getElevation(elevation || 5)),
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
                backgroundColor: ((_c = props.containerStyle) === null || _c === void 0 ? void 0 : _c.backgroundColor) || "white",
                width: "100%",
                borderRadius: ((_d = props.containerStyle) === null || _d === void 0 ? void 0 : _d.borderRadius) || 10,
                transform: [
                    {
                        translateY: animations.underlayTranslateY
                    },
                ]
            }}/>) : null}
            {gestureEnabled || props.headerAlwaysVisible ? (props.CustomHeaderComponent ? (props.CustomHeaderComponent) : (<Animated.View style={[
                styles.indicator,
                { backgroundColor: indicatorColor },
                props.indicatorStyle,
            ]}/>)) : null}

            {props === null || props === void 0 ? void 0 : props.children}

            <Animated.View style={{
            height: 100,
            position: "absolute",
            bottom: -100,
            backgroundColor: ((_e = props.containerStyle) === null || _e === void 0 ? void 0 : _e.backgroundColor) || "white",
            width: dimensions.width
        }}/>
          </Animated.View>
        </Animated.View>
      </Root>);
});
