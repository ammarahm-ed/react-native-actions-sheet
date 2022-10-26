import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, } from 'react-native';
var emptyCoordinates = Object.freeze({
    screenX: 0,
    screenY: 0,
    width: 0,
    height: 0
});
var initialValue = {
    start: emptyCoordinates,
    end: emptyCoordinates
};
export function useKeyboard(enabled, isModal, onKeyboardShow, onKeyboardHide) {
    var _a = useState(false), shown = _a[0], setShown = _a[1];
    var _b = useState(initialValue), coordinates = _b[0], setCoordinates = _b[1];
    var _c = useState(0), keyboardHeight = _c[0], setKeyboardHeight = _c[1];
    var withTimeout = React.useCallback(function (callback, timeout) {
        if (timeout === void 0) { timeout = 1; }
        if (isModal || Platform.OS === 'ios')
            return callback();
        setTimeout(callback, timeout);
    }, [isModal]);
    var handleKeyboardWillShow = function (e) {
        setCoordinates({ start: e.startCoordinates, end: e.endCoordinates });
    };
    var handleKeyboardDidShow = React.useCallback(function (e) {
        onKeyboardShow === null || onKeyboardShow === void 0 ? void 0 : onKeyboardShow(e.endCoordinates.height);
        withTimeout(function () {
            setShown(true);
            setCoordinates({ start: e.startCoordinates, end: e.endCoordinates });
            setKeyboardHeight(e.endCoordinates.height);
        });
    }, [onKeyboardShow, withTimeout]);
    var handleKeyboardWillHide = function (e) {
        setCoordinates({ start: e.startCoordinates, end: e.endCoordinates });
    };
    var handleKeyboardDidHide = React.useCallback(function (e) {
        onKeyboardHide === null || onKeyboardHide === void 0 ? void 0 : onKeyboardHide();
        withTimeout(function () {
            setShown(false);
            if (e) {
                setCoordinates({ start: e.startCoordinates, end: e.endCoordinates });
            }
            else {
                setCoordinates(initialValue);
                setKeyboardHeight(0);
            }
        }, 1);
    }, [onKeyboardHide, withTimeout]);
    useEffect(function () {
        var subscriptions = [];
        if (enabled) {
            subscriptions = [
                Keyboard.addListener('keyboardWillShow', handleKeyboardWillShow),
                Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow),
                Keyboard.addListener('keyboardWillHide', handleKeyboardWillHide),
                Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide),
            ];
        }
        return function () {
            subscriptions.forEach(function (subscription) { return subscription.remove(); });
        };
    }, [enabled, handleKeyboardDidHide, handleKeyboardDidShow]);
    return {
        keyboardShown: !enabled ? false : shown,
        coordinates: !enabled || !shown ? emptyCoordinates : coordinates,
        keyboardHeight: !enabled || !shown ? 0 : keyboardHeight
    };
}
