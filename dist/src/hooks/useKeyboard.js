import { useEffect, useState } from "react";
import { Keyboard } from "react-native";
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
export function useKeyboard() {
    var _a = useState(false), shown = _a[0], setShown = _a[1];
    var _b = useState(initialValue), coordinates = _b[0], setCoordinates = _b[1];
    var _c = useState(0), keyboardHeight = _c[0], setKeyboardHeight = _c[1];
    var handleKeyboardWillShow = function (e) {
        setCoordinates({ start: e.startCoordinates, end: e.endCoordinates });
    };
    var handleKeyboardDidShow = function (e) {
        setShown(true);
        setCoordinates({ start: e.startCoordinates, end: e.endCoordinates });
        setKeyboardHeight(e.endCoordinates.height);
    };
    var handleKeyboardWillHide = function (e) {
        setCoordinates({ start: e.startCoordinates, end: e.endCoordinates });
    };
    var handleKeyboardDidHide = function (e) {
        setShown(false);
        if (e) {
            setCoordinates({ start: e.startCoordinates, end: e.endCoordinates });
        }
        else {
            setCoordinates(initialValue);
            setKeyboardHeight(0);
        }
    };
    useEffect(function () {
        var subscriptions = [
            Keyboard.addListener("keyboardWillShow", handleKeyboardWillShow),
            Keyboard.addListener("keyboardDidShow", handleKeyboardDidShow),
            Keyboard.addListener("keyboardWillHide", handleKeyboardWillHide),
            Keyboard.addListener("keyboardDidHide", handleKeyboardDidHide),
        ];
        return function () {
            subscriptions.forEach(function (subscription) { return subscription.remove(); });
        };
    }, []);
    return {
        keyboardShown: shown,
        coordinates: coordinates,
        keyboardHeight: keyboardHeight
    };
}
