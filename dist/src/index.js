var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import React, { Component, createRef } from "react";
import { Animated, BackHandler, Dimensions, FlatList, Keyboard, Modal, Platform, SafeAreaView, StatusBar, TouchableOpacity, View, } from "react-native";
import { actionSheetEventManager } from "./eventmanager";
import { SheetManager } from "./sheetmanager";
import { styles } from "./styles";
import { getDeviceHeight, getElevation, SUPPORTED_ORIENTATIONS, waitAsync, } from "./utils";
var safeAreaInnerHeight = 0;
var dummyData = ["dummy"];
var safeAreaPaddingTop = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
var calculatedDeviceHeight = Dimensions.get("window").height;
var defaultProps = {
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
    isModal: true
};
var ActionSheet = /** @class */ (function (_super) {
    __extends(ActionSheet, _super);
    function ActionSheet(props) {
        var _a;
        var _this = _super.call(this, props) || this;
        _this.actionSheetHeight = 0;
        _this.prevScroll = 0;
        _this.timeout = null;
        _this.offsetY = 0;
        _this.currentOffsetFromBottom = 0;
        _this.scrollAnimationEndValue = 0;
        _this.hasBounced = false;
        _this.layoutHasCalled = false;
        _this.isClosing = false;
        _this.isRecoiling = false;
        _this.isReachedTop = false;
        _this.deviceLayoutCalled = false;
        _this.transformValue = new Animated.Value(0);
        _this.opacityValue = new Animated.Value(0);
        _this.borderRadius = new Animated.Value(10);
        _this.underlayTranslateY = new Animated.Value(100);
        _this.underlayScale = new Animated.Value(1);
        _this.initialScrolling = false;
        _this.sheetManagerHideEvent = null;
        _this.sheetManagerShowEvent = null;
        _this.keyboardShowSubscription = null;
        _this.KeyboardHideSubscription = null;
        _this.hardwareBackPressEvent = null;
        /**
         * Snap ActionSheet to given offset.
         */
        _this.snapToOffset = function (offset) {
            var correction = _this.state.deviceHeight * 0.15;
            var extraScroll = _this.props.extraScroll || 0;
            var scrollOffset = _this.props.gestureEnabled
                ? offset + correction + extraScroll
                : offset + correction + extraScroll;
            _this.currentOffsetFromBottom = scrollOffset / _this.actionSheetHeight;
            _this.currentOffsetFromBottom = _this.currentOffsetFromBottom - 0.15;
            setTimeout(function () {
                _this._scrollTo(scrollOffset);
                _this.updateActionSheetPosition(scrollOffset);
            }, 500);
        };
        /**
         * Show the ActionSheet
         */
        _this.show = function () {
            _this.setModalVisible(true);
        };
        /**
         * Hide the ActionSheet
         */
        _this.hide = function () {
            _this.setModalVisible(false);
        };
        /**
         * Open/Close the ActionSheet
         */
        _this.setModalVisible = function (visible) {
            var modalVisible = _this.state.modalVisible;
            _this.initialScrolling = false;
            if (visible !== undefined) {
                if (modalVisible === visible) {
                    return;
                }
                modalVisible = !visible;
            }
            if (!modalVisible) {
                _this.setState({
                    modalVisible: true,
                    scrollable: _this.props.gestureEnabled || false
                });
            }
            else {
                _this._hideModal(null);
            }
        };
        _this._hideModal = function (data) {
            var _a;
            if (_this.isClosing)
                return;
            _this.isClosing = true;
            (_a = _this.hardwareBackPressEvent) === null || _a === void 0 ? void 0 : _a.remove();
            _this._hideAnimation(data);
        };
        _this.measure = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        setTimeout(function () {
                            var _a;
                            if (!_this.safeAreaViewRef.current) {
                                safeAreaPaddingTop = 25;
                                resolve(safeAreaPaddingTop);
                                return;
                            }
                            (_a = _this.safeAreaViewRef.current) === null || _a === void 0 ? void 0 : _a.measure(function (_x, _y, _width, height) {
                                safeAreaPaddingTop = height === 0 ? 25 : height;
                                safeAreaPaddingTop =
                                    !_this.props.drawUnderStatusBar && safeAreaPaddingTop > 30
                                        ? safeAreaPaddingTop - 12
                                        : safeAreaPaddingTop;
                                resolve(safeAreaPaddingTop);
                            });
                        }, 50);
                    })];
            });
        }); };
        _this._showModal = function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, gestureEnabled, delayActionSheetDraw, delayActionSheetDrawTime, height, scrollOffset;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.props, gestureEnabled = _a.gestureEnabled, delayActionSheetDraw = _a.delayActionSheetDraw, delayActionSheetDrawTime = _a.delayActionSheetDrawTime;
                        if (!(event === null || event === void 0 ? void 0 : event.nativeEvent))
                            return [2 /*return*/];
                        height = event.nativeEvent.layout.height;
                        if (!this.layoutHasCalled) return [3 /*break*/, 1];
                        this.actionSheetHeight = height;
                        this._returnToPrevScrollPosition(height);
                        return [2 /*return*/];
                    case 1:
                        this.initialScrolling = true;
                        this.layoutHasCalled = true;
                        this.actionSheetHeight = height;
                        scrollOffset = this.getInitialScrollPosition();
                        this.isRecoiling = false;
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 3];
                        return [4 /*yield*/, waitAsync(delayActionSheetDrawTime !== null && delayActionSheetDrawTime !== void 0 ? delayActionSheetDrawTime : 0)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        if (!delayActionSheetDraw) return [3 /*break*/, 5];
                        return [4 /*yield*/, waitAsync(delayActionSheetDrawTime !== null && delayActionSheetDrawTime !== void 0 ? delayActionSheetDrawTime : 0)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        this._scrollTo(scrollOffset, false);
                        this.prevScroll = scrollOffset;
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 7];
                        return [4 /*yield*/, waitAsync(delayActionSheetDrawTime !== null && delayActionSheetDrawTime !== void 0 ? delayActionSheetDrawTime : 0 / 2)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        if (!delayActionSheetDraw) return [3 /*break*/, 9];
                        return [4 /*yield*/, waitAsync((delayActionSheetDrawTime !== null && delayActionSheetDrawTime !== void 0 ? delayActionSheetDrawTime : 0) / 2)];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9:
                        this._openAnimation(scrollOffset);
                        this.underlayScale.setValue(1);
                        this.underlayTranslateY.setValue(100);
                        if (!gestureEnabled) {
                            this.props.onPositionChanged && this.props.onPositionChanged(true);
                        }
                        this.updateActionSheetPosition(scrollOffset);
                        _b.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        }); };
        _this._openAnimation = function (scrollOffset) {
            var _a = _this.props, bounciness = _a.bounciness, bounceOnOpen = _a.bounceOnOpen, animated = _a.animated, openAnimationSpeed = _a.openAnimationSpeed;
            if (animated) {
                _this.transformValue.setValue(scrollOffset);
                Animated.parallel([
                    Animated.spring(_this.transformValue, {
                        toValue: 0,
                        bounciness: bounceOnOpen ? bounciness : 1,
                        speed: openAnimationSpeed,
                        useNativeDriver: true
                    }),
                    Animated.timing(_this.opacityValue, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }),
                ]).start();
            }
            else {
                _this.opacityValue.setValue(1);
            }
        };
        _this._onScrollBegin = function (_event) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); }); };
        _this._onScrollBeginDrag = function (event) { return __awaiter(_this, void 0, void 0, function () {
            var verticalOffset;
            return __generator(this, function (_a) {
                verticalOffset = event.nativeEvent.contentOffset.y;
                this.prevScroll = verticalOffset;
                return [2 /*return*/];
            });
        }); };
        _this._onScrollEnd = function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, springOffset, extraScroll, verticalOffset, correction, scrollOffset;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = this.props, springOffset = _a.springOffset, extraScroll = _a.extraScroll;
                        verticalOffset = event.nativeEvent.contentOffset.y;
                        correction = this.state.deviceHeight * 0.15;
                        if (this.isRecoiling)
                            return [2 /*return*/];
                        if (!(this.prevScroll < verticalOffset || this.initialScrolling)) return [3 /*break*/, 4];
                        if (!(verticalOffset - this.prevScroll > (springOffset !== null && springOffset !== void 0 ? springOffset : 100) * 0.75 ||
                            this.initialScrolling)) return [3 /*break*/, 2];
                        this.isRecoiling = true;
                        this._applyHeightLimiter();
                        this.currentOffsetFromBottom =
                            this.currentOffsetFromBottom <
                                ((_b = this.props.initialOffsetFromBottom) !== null && _b !== void 0 ? _b : 1)
                                ? (_c = this.props.initialOffsetFromBottom) !== null && _c !== void 0 ? _c : 1
                                : 1;
                        scrollOffset = this.actionSheetHeight * this.currentOffsetFromBottom +
                            correction +
                            (extraScroll !== null && extraScroll !== void 0 ? extraScroll : 0);
                        if (this.initialScrolling) {
                            this.initialScrolling = false;
                            scrollOffset = this.prevScroll;
                        }
                        this._scrollTo(scrollOffset);
                        return [4 /*yield*/, waitAsync(300)];
                    case 1:
                        _d.sent();
                        this.isRecoiling = false;
                        this.props.onPositionChanged && this.props.onPositionChanged(true);
                        return [3 /*break*/, 3];
                    case 2:
                        this._returnToPrevScrollPosition(this.actionSheetHeight);
                        _d.label = 3;
                    case 3: return [3 /*break*/, 7];
                    case 4:
                        if (!(this.prevScroll - verticalOffset > (springOffset !== null && springOffset !== void 0 ? springOffset : 100))) return [3 /*break*/, 5];
                        this._hideModal(null);
                        return [3 /*break*/, 7];
                    case 5:
                        if (this.isRecoiling) {
                            return [2 /*return*/];
                        }
                        this.isRecoiling = true;
                        this._returnToPrevScrollPosition(this.actionSheetHeight);
                        return [4 /*yield*/, waitAsync(300)];
                    case 6:
                        _d.sent();
                        this.isRecoiling = false;
                        _d.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        _this._scrollTo = function (y, animated) {
            var _a;
            if (animated === void 0) { animated = true; }
            _this.scrollAnimationEndValue = y;
            _this.prevScroll = y;
            (_a = _this.scrollViewRef.current) === null || _a === void 0 ? void 0 : _a._listRef._scrollRef.scrollTo({
                x: 0,
                y: _this.scrollAnimationEndValue,
                animated: animated
            });
            if (_this.initialScrolling) {
                setTimeout(function () {
                    _this.initialScrolling = false;
                }, 500);
            }
        };
        _this._onTouchMove = function () {
            if (_this.props.closeOnTouchBackdrop) {
                _this._hideModal();
            }
            _this.setState({
                scrollable: false
            });
        };
        _this._onTouchStart = function () {
            if (_this.props.closeOnTouchBackdrop) {
                _this._hideModal();
            }
            _this.setState({
                scrollable: false
            });
        };
        _this._onTouchEnd = function () {
            _this._returnToPrevScrollPosition(_this.actionSheetHeight);
            if (_this.props.gestureEnabled) {
                _this.setState({
                    scrollable: true
                });
            }
        };
        _this._onScroll = function (event) {
            _this.offsetY = event.nativeEvent.contentOffset.y;
            var correction = _this.state.deviceHeight * 0.15;
            var distanceFromTop = _this.actionSheetHeight + correction - _this.offsetY;
            if (_this.actionSheetHeight < _this.offsetY) {
                if (!_this.isReachedTop) {
                    _this.isReachedTop = true;
                    _this.props.onPositionChanged && _this.props.onPositionChanged(true);
                }
            }
            else {
                if (_this.isReachedTop) {
                    _this.isReachedTop = false;
                    _this.props.onPositionChanged && _this.props.onPositionChanged(false);
                }
            }
            if (_this.actionSheetHeight >= _this.state.deviceHeight - 1) {
                if (distanceFromTop < _this.state.paddingTop) {
                    if (!_this.props.drawUnderStatusBar)
                        return;
                    _this.indicatorTranslateY.setValue(-_this.state.paddingTop + (_this.state.paddingTop - distanceFromTop));
                }
                else {
                    _this.indicatorTranslateY.setValue(-_this.state.paddingTop);
                }
            }
        };
        _this._onRequestClose = function () {
            if (_this.props.closeOnPressBack)
                _this._hideModal();
        };
        _this._onTouchBackdrop = function () {
            if (_this.props.closeOnTouchBackdrop) {
                _this._hideModal();
            }
        };
        _this.onSheetManagerShow = function (data) {
            if (_this.props.onBeforeShow) {
                _this.props.onBeforeShow(data);
            }
            _this.setModalVisible(true);
        };
        _this.onSheetMangerHide = function (data) {
            _this._hideModal(data);
        };
        _this._onKeyboardShow = function (event) {
            if (_this.props.keyboardHandlerEnabled) {
                _this.isRecoiling = true;
                var correction = Platform.OS === "android" ? 20 : 5;
                _this.setState({
                    keyboard: true,
                    keyboardPadding: event.endCoordinates.height + correction
                });
                waitAsync(300).then(function () {
                    _this.isRecoiling = false;
                });
            }
        };
        _this._onKeyboardHide = function () {
            _this.setState({
                keyboard: false,
                keyboardPadding: 0
            });
            Animated.parallel([
                Animated.spring(_this.transformValue, {
                    toValue: 0,
                    bounciness: _this.props.bounceOnOpen ? _this.props.bounciness : 1,
                    speed: _this.props.openAnimationSpeed,
                    useNativeDriver: true
                }),
                Animated.timing(_this.opacityValue, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }),
            ]).start();
        };
        /**
         * Attach this to any child ScrollView Component's onScrollEndDrag,
         * onMomentumScrollEnd,onScrollAnimationEnd callbacks to handle the ActionSheet
         * closing and bouncing back properly.
         */
        _this.handleChildScrollEnd = function () { return __awaiter(_this, void 0, void 0, function () {
            var scrollOffset;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                if (this.offsetY > this.prevScroll)
                    return [2 /*return*/];
                if (this.prevScroll - ((_a = this.props.springOffset) !== null && _a !== void 0 ? _a : 100) > this.offsetY) {
                    scrollOffset = this.getInitialScrollPosition();
                    if (this.offsetY > scrollOffset - 100) {
                        this.isRecoiling = true;
                        this._scrollTo(scrollOffset);
                        this.currentOffsetFromBottom = (_b = this.props.initialOffsetFromBottom) !== null && _b !== void 0 ? _b : 1;
                        this.prevScroll = scrollOffset;
                        setTimeout(function () {
                            _this.isRecoiling = false;
                        }, 500);
                    }
                    else {
                        this._hideModal();
                    }
                }
                else {
                    this.isRecoiling = true;
                    this._scrollTo(this.prevScroll, true);
                    setTimeout(function () {
                        _this.isRecoiling = false;
                    }, 500);
                }
                return [2 /*return*/];
            });
        }); };
        _this._onDeviceLayout = function (_event) { return __awaiter(_this, void 0, void 0, function () {
            var event;
            var _this = this;
            return __generator(this, function (_a) {
                event = __assign({}, _event);
                if (this.timeout) {
                    clearTimeout(this.timeout);
                }
                this.timeout = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                    var safeMarginFromTop, measuredPadding, _a, height, width;
                    var _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                safeMarginFromTop = 0;
                                if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.measure()];
                            case 1:
                                _a = _c.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                _a = StatusBar.currentHeight;
                                _c.label = 3;
                            case 3:
                                measuredPadding = _a;
                                if (!this.props.drawUnderStatusBar) {
                                    if (Platform.OS === "android" && !this.props.statusBarTranslucent)
                                        return [2 /*return*/];
                                    safeMarginFromTop = measuredPadding !== null && measuredPadding !== void 0 ? measuredPadding : 0;
                                    if (measuredPadding) {
                                        this.indicatorTranslateY.setValue(-measuredPadding);
                                    }
                                }
                                else {
                                    this.updateActionSheetPosition(this.offsetY);
                                }
                                height = event.nativeEvent.layout.height - safeMarginFromTop;
                                width = Dimensions.get("window").width;
                                if ((height === null || height === void 0 ? void 0 : height.toFixed(0)) === (calculatedDeviceHeight === null || calculatedDeviceHeight === void 0 ? void 0 : calculatedDeviceHeight.toFixed(0)) &&
                                    (width === null || width === void 0 ? void 0 : width.toFixed(0)) === ((_b = this.state.deviceWidth) === null || _b === void 0 ? void 0 : _b.toFixed(0)) &&
                                    this.deviceLayoutCalled)
                                    return [2 /*return*/];
                                this.deviceLayoutCalled = true;
                                calculatedDeviceHeight = height;
                                this.setState({
                                    deviceHeight: height,
                                    deviceWidth: width,
                                    portrait: height > width,
                                    paddingTop: measuredPadding !== null && measuredPadding !== void 0 ? measuredPadding : 0
                                });
                                return [2 /*return*/];
                        }
                    });
                }); }, 1);
                return [2 /*return*/];
            });
        }); };
        _this._keyExtractor = function (item) { return item; };
        _this.onHardwareBackPress = function () {
            _this._hideModal();
            return true;
        };
        _this.state = {
            modalVisible: false,
            scrollable: false,
            layoutHasCalled: false,
            keyboard: false,
            deviceHeight: calculatedDeviceHeight ||
                getDeviceHeight(_this.props.statusBarTranslucent),
            deviceWidth: Dimensions.get("window").width,
            portrait: true,
            safeAreaInnerHeight: safeAreaInnerHeight,
            paddingTop: safeAreaPaddingTop,
            keyboardPadding: 0
        };
        _this.scrollViewRef = createRef();
        _this.safeAreaViewRef = createRef();
        _this.currentOffsetFromBottom = (_a = _this.props.initialOffsetFromBottom) !== null && _a !== void 0 ? _a : 1;
        _this.indicatorTranslateY = new Animated.Value(-_this.state.paddingTop | 0);
        return _this;
    }
    ActionSheet.prototype._hideAnimation = function (data) {
        var _this = this;
        var _a = this.props, animated = _a.animated, closeAnimationDuration = _a.closeAnimationDuration, bottomOffset = _a.bottomOffset, initialOffsetFromBottom = _a.initialOffsetFromBottom, extraScroll = _a.extraScroll, closable = _a.closable;
        Animated.parallel([
            Animated.timing(this.opacityValue, {
                toValue: closable ? 0 : 1,
                duration: animated ? closeAnimationDuration : 1,
                useNativeDriver: true
            }),
            Animated.timing(this.transformValue, {
                toValue: closable ? this.actionSheetHeight * 2 : 0,
                duration: animated ? closeAnimationDuration : 1,
                useNativeDriver: true
            }),
        ]).start();
        waitAsync((closeAnimationDuration !== null && closeAnimationDuration !== void 0 ? closeAnimationDuration : 300) / 1.5).then(function () {
            if (!closable) {
                if (bottomOffset && bottomOffset > 0) {
                    _this.snapToOffset(bottomOffset);
                }
                else {
                    _this._scrollTo(_this.actionSheetHeight * (initialOffsetFromBottom !== null && initialOffsetFromBottom !== void 0 ? initialOffsetFromBottom : 1) +
                        _this.state.deviceHeight * 0.1 +
                        (extraScroll !== null && extraScroll !== void 0 ? extraScroll : 0), true);
                    _this.currentOffsetFromBottom = initialOffsetFromBottom !== null && initialOffsetFromBottom !== void 0 ? initialOffsetFromBottom : 1;
                }
                _this.isClosing = false;
            }
            else {
                _this._scrollTo(0, false);
                _this.currentOffsetFromBottom = initialOffsetFromBottom !== null && initialOffsetFromBottom !== void 0 ? initialOffsetFromBottom : 1;
                _this.setState({
                    modalVisible: !closable
                }, function () {
                    _this.isClosing = false;
                    _this.isReachedTop = false;
                    _this.props.onPositionChanged && _this.props.onPositionChanged(false);
                    _this.indicatorTranslateY.setValue(-_this.state.paddingTop);
                    _this.layoutHasCalled = false;
                    _this.deviceLayoutCalled = false;
                    _this.props.onClose && _this.props.onClose(data);
                    if (_this.props.id) {
                        actionSheetEventManager.publish("onclose_".concat(_this.props.id), data);
                    }
                });
            }
        });
    };
    ActionSheet.prototype._applyHeightLimiter = function () {
        if (this.actionSheetHeight > this.state.deviceHeight) {
            this.actionSheetHeight =
                (this.actionSheetHeight -
                    (this.actionSheetHeight - this.state.deviceHeight)) *
                    1;
        }
    };
    ActionSheet.prototype.updateActionSheetPosition = function (scrollPosition) {
        if (this.actionSheetHeight >= this.state.deviceHeight - 1) {
            var correction = this.state.deviceHeight * 0.15;
            var distanceFromTop = this.actionSheetHeight + correction - scrollPosition;
            if (distanceFromTop < safeAreaPaddingTop) {
                if (!this.props.drawUnderStatusBar)
                    return;
                this.indicatorTranslateY.setValue(0);
            }
            else {
                this.indicatorTranslateY.setValue(-safeAreaPaddingTop);
            }
        }
    };
    ActionSheet.prototype._returnToPrevScrollPosition = function (height) {
        var _a;
        var correction = this.state.deviceHeight * 0.15;
        var scrollOffset = height * this.currentOffsetFromBottom +
            correction +
            ((_a = this.props.extraScroll) !== null && _a !== void 0 ? _a : 0);
        this.updateActionSheetPosition(scrollOffset);
        this._scrollTo(scrollOffset);
    };
    ActionSheet.prototype.componentDidMount = function () {
        this.props.id && SheetManager.add(this.props.id);
        this.keyboardShowSubscription = Keyboard.addListener(Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow", this._onKeyboardShow);
        this.KeyboardHideSubscription = Keyboard.addListener(Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide", this._onKeyboardHide);
        if (this.props.id) {
            this.sheetManagerShowEvent = actionSheetEventManager.subscribe("show_".concat(this.props.id), this.onSheetManagerShow);
            this.sheetManagerHideEvent = actionSheetEventManager.subscribe("hide_".concat(this.props.id), this.onSheetMangerHide);
        }
    };
    ActionSheet.prototype.componentWillUnmount = function () {
        var _a, _b;
        this.props.id && SheetManager.remove(this.props.id);
        (_a = this.keyboardShowSubscription) === null || _a === void 0 ? void 0 : _a.remove();
        (_b = this.KeyboardHideSubscription) === null || _b === void 0 ? void 0 : _b.remove();
        this.sheetManagerHideEvent && this.sheetManagerHideEvent();
        this.sheetManagerShowEvent && this.sheetManagerShowEvent();
    };
    ActionSheet.prototype.getScrollPositionFromOffset = function (offset, correction) {
        var _a, _b;
        return this.props.gestureEnabled
            ? this.actionSheetHeight * offset +
                correction +
                ((_a = this.props.extraScroll) !== null && _a !== void 0 ? _a : 0)
            : this.actionSheetHeight + correction + ((_b = this.props.extraScroll) !== null && _b !== void 0 ? _b : 0);
    };
    ActionSheet.prototype.getInitialScrollPosition = function () {
        var _a, _b;
        this._applyHeightLimiter();
        var correction = this.state.deviceHeight * 0.15;
        var scrollPosition = this.getScrollPositionFromOffset((_a = this.props.initialOffsetFromBottom) !== null && _a !== void 0 ? _a : 1, correction);
        this.currentOffsetFromBottom = (_b = this.props.initialOffsetFromBottom) !== null && _b !== void 0 ? _b : 1;
        this.updateActionSheetPosition(scrollPosition);
        return scrollPosition;
    };
    ActionSheet.prototype.render = function () {
        var _this = this;
        var _a;
        var _b = this.state, scrollable = _b.scrollable, modalVisible = _b.modalVisible;
        var _c = this.props, testID = _c.testID, onOpen = _c.onOpen, overlayColor = _c.overlayColor, gestureEnabled = _c.gestureEnabled, elevation = _c.elevation, indicatorColor = _c.indicatorColor, defaultOverlayOpacity = _c.defaultOverlayOpacity, children = _c.children, containerStyle = _c.containerStyle, CustomHeaderComponent = _c.CustomHeaderComponent, headerAlwaysVisible = _c.headerAlwaysVisible, keyboardShouldPersistTaps = _c.keyboardShouldPersistTaps, statusBarTranslucent = _c.statusBarTranslucent, keyboardDismissMode = _c.keyboardDismissMode, isModal = _c.isModal;
        var Root = isModal
            ? Modal
            : View;
        var rootProps = isModal
            ? {
                visible: true,
                animationType: "none",
                // @ts-ignore
                testID: testID,
                supportedOrientations: SUPPORTED_ORIENTATIONS,
                onShow: onOpen,
                onRequestClose: this._onRequestClose,
                transparent: true,
                statusBarTranslucent: statusBarTranslucent
            }
            : {
                testID: testID,
                onLayout: function () {
                    _this.hardwareBackPressEvent = BackHandler.addEventListener("hardwareBackPress", _this.onHardwareBackPress);
                    onOpen && onOpen();
                },
                style: {
                    position: "absolute",
                    zIndex: 9999,
                    width: "100%",
                    height: "100%"
                }
            };
        return !modalVisible ? null : (<>
        <Root {...rootProps}>
          <SafeAreaView pointerEvents="none" style={{
                position: "absolute",
                width: 0
            }} ref={this.safeAreaViewRef}>
            <View />
          </SafeAreaView>
          <Animated.View onLayout={this._onDeviceLayout} style={[
                styles.parentContainer,
                {
                    opacity: this.opacityValue,
                    width: "100%"
                },
            ]}>
            {this.props.ExtraOverlayComponent}

            <FlatList testID={(_a = this.props.testIDs) === null || _a === void 0 ? void 0 : _a.scrollview} bounces={false} keyboardShouldPersistTaps={keyboardShouldPersistTaps} keyboardDismissMode={keyboardDismissMode} ref={this.scrollViewRef} scrollEventThrottle={16} overScrollMode="never" showsVerticalScrollIndicator={false} onMomentumScrollBegin={this._onScrollBegin} onScrollEndDrag={this._onScrollEnd} onMomentumScrollEnd={this._onScrollEnd} scrollEnabled={scrollable} onScrollBeginDrag={this._onScrollBeginDrag} onTouchEnd={this._onTouchEnd} onScroll={this._onScroll} scrollsToTop={false} style={[
                styles.scrollView,
                {
                    width: this.state.deviceWidth
                },
            ]} contentContainerStyle={{
                width: this.state.deviceWidth
            }} data={dummyData} keyExtractor={this._keyExtractor} renderItem={function () {
                var _a;
                return (<View style={{
                        width: "100%"
                    }}>
                  <Animated.View onTouchStart={_this._onTouchBackdrop} onTouchMove={_this._onTouchBackdrop} onTouchEnd={_this._onTouchBackdrop} style={{
                        height: "100%",
                        width: "100%",
                        position: "absolute",
                        zIndex: 1,
                        backgroundColor: overlayColor,
                        opacity: defaultOverlayOpacity
                    }}/>
                  <View onTouchMove={_this._onTouchMove} onTouchStart={_this._onTouchStart} onTouchEnd={_this._onTouchEnd} style={{
                        height: _this.state.deviceHeight * 1.15,
                        width: "100%",
                        zIndex: 10
                    }}>
                    <TouchableOpacity testID={(_a = _this.props.testIDs) === null || _a === void 0 ? void 0 : _a.backdrop} onPress={_this._onTouchBackdrop} onLongPress={_this._onTouchBackdrop} style={{
                        height: _this.state.deviceHeight * 1.15,
                        width: "100%"
                    }}/>
                  </View>

                  <Animated.View onLayout={_this._showModal} style={[
                        styles.container,
                        {
                            borderRadius: 10
                        },
                        containerStyle,
                        __assign(__assign({}, getElevation(elevation !== null && elevation !== void 0 ? elevation : 5)), { zIndex: 11, opacity: _this.opacityValue, transform: [
                                {
                                    translateY: _this.transformValue
                                },
                            ], maxHeight: _this.state.deviceHeight, paddingBottom: _this.state.keyboardPadding }),
                    ]}>
                    <Animated.View style={{
                        maxHeight: _this.state.deviceHeight,
                        transform: [
                            {
                                translateY: _this.indicatorTranslateY
                            },
                        ],
                        marginTop: _this.state.paddingTop,
                        marginBottom: -_this.state.paddingTop
                    }}>
                      {gestureEnabled || headerAlwaysVisible ? (CustomHeaderComponent ? (CustomHeaderComponent) : (<Animated.View style={[
                            styles.indicator,
                            { backgroundColor: indicatorColor },
                            _this.props.indicatorStyle,
                        ]}/>)) : null}

                      {children}
                    </Animated.View>

                    <View style={{
                        height: 200,
                        backgroundColor: (containerStyle === null || containerStyle === void 0 ? void 0 : containerStyle.backgroundColor) || "#ffffff",
                        position: "absolute",
                        bottom: -195,
                        width: (containerStyle === null || containerStyle === void 0 ? void 0 : containerStyle.width) || "100%"
                    }}/>
                  </Animated.View>
                </View>);
            }}/>
          </Animated.View>
        </Root>
      </>);
    };
    ActionSheet.defaultProps = defaultProps;
    return ActionSheet;
}(Component));
export default ActionSheet;
