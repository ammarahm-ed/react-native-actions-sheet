import React, { useEffect, useRef, useState } from 'react';
import {
  EmitterSubscription,
  Keyboard,
  KeyboardEventListener,
  Platform
} from 'react-native';

type ScreenRect = {
  screenX: number;
  screenY: number;
  width: number;
  height: number;
};

const emptyCoordinates = Object.freeze({
  screenX: 0,
  screenY: 0,
  width: 0,
  height: 0,
});
const initialValue = {
  start: emptyCoordinates,
  end: emptyCoordinates,
};

export function useKeyboard(enabled: boolean) {
  const pauseKeyboardHandler = useRef(false);
  const [shown, setShown] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    start: undefined | ScreenRect;
    end: ScreenRect;
  }>(initialValue);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const handleKeyboardDidShow: KeyboardEventListener = React.useCallback(e => {
    if (pauseKeyboardHandler.current) return;
    setCoordinates({start: e.startCoordinates, end: e.endCoordinates});
    setKeyboardHeight(e.endCoordinates.height);
    setShown(true);
  }, []);
  const handleKeyboardDidHide: KeyboardEventListener = React.useCallback(e => {
    setShown(false);
    if (e) {
      setCoordinates({start: e.startCoordinates, end: e.endCoordinates});
    } else {
      setCoordinates(initialValue);
      setKeyboardHeight(0);
    }
  }, []);

  useEffect(() => {
    let subscriptions: EmitterSubscription[] = [];
    if (enabled) {
      subscriptions = [
        Keyboard.addListener('keyboardDidChangeFrame', handleKeyboardDidShow),
        Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide),
      ];
      if (Platform.OS == 'android') {
        subscriptions.push(
          Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow),
        );
      } else {
        subscriptions.push(
          Keyboard.addListener('keyboardWillShow', handleKeyboardDidShow),
          Keyboard.addListener('keyboardWillHide', handleKeyboardDidHide),
        );
      }
    }

    return () => {
      subscriptions.forEach(subscription => subscription.remove());
    };
  }, [enabled, handleKeyboardDidHide, handleKeyboardDidShow]);
  return {
    keyboardShown: !enabled ? false : shown,
    coordinates: {
      start: !enabled || !shown ? emptyCoordinates : coordinates.start,
      end: !enabled || !shown ? emptyCoordinates : coordinates.end
    },
    keyboardHeight: !enabled || !shown ? 0 : keyboardHeight,
    pauseKeyboardHandler,
    reset: () => {
      setShown(false);
      setKeyboardHeight(0);
    },
  };
}
