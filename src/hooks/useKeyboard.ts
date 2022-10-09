import React, {useEffect, useState} from 'react';
import {
  EmitterSubscription,
  Keyboard,
  KeyboardEventListener,
  Platform,
  ScreenRect,
} from 'react-native';

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

export function useKeyboard(
  enabled: boolean,
  isModal: boolean,
  onKeyboardShow: (height: number) => void,
  onKeyboardHide: () => void,
) {
  const [shown, setShown] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    start: undefined | ScreenRect;
    end: ScreenRect;
  }>(initialValue);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  const withTimeout = React.useCallback(
    (callback: () => void, timeout = 1) => {
      if (isModal || Platform.OS === 'ios') return callback();
      setTimeout(callback, timeout);
    },
    [isModal],
  );

  const handleKeyboardWillShow: KeyboardEventListener = e => {
    setCoordinates({start: e.startCoordinates, end: e.endCoordinates});
  };
  const handleKeyboardDidShow: KeyboardEventListener = React.useCallback(
    e => {
      onKeyboardShow?.(e.endCoordinates.height);
      withTimeout(() => {
        setShown(true);
        setCoordinates({start: e.startCoordinates, end: e.endCoordinates});
        setKeyboardHeight(e.endCoordinates.height);
      });
    },
    [onKeyboardShow, withTimeout],
  );
  const handleKeyboardWillHide: KeyboardEventListener = e => {
    setCoordinates({start: e.startCoordinates, end: e.endCoordinates});
  };
  const handleKeyboardDidHide: KeyboardEventListener = React.useCallback(
    e => {
      onKeyboardHide?.();
      withTimeout(() => {
        setShown(false);
        if (e) {
          setCoordinates({start: e.startCoordinates, end: e.endCoordinates});
        } else {
          setCoordinates(initialValue);
          setKeyboardHeight(0);
        }
      }, 1);
    },
    [onKeyboardHide, withTimeout],
  );

  useEffect(() => {
    let subscriptions: EmitterSubscription[] = [];
    if (enabled) {
      subscriptions = [
        Keyboard.addListener('keyboardWillShow', handleKeyboardWillShow),
        Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow),
        Keyboard.addListener('keyboardWillHide', handleKeyboardWillHide),
        Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide),
      ];
    }

    return () => {
      subscriptions.forEach(subscription => subscription.remove());
    };
  }, [enabled, handleKeyboardDidHide, handleKeyboardDidShow]);
  return {
    keyboardShown: !enabled ? false : shown,
    coordinates: !enabled ? emptyCoordinates : coordinates,
    keyboardHeight: !enabled ? 0 : keyboardHeight,
  };
}
