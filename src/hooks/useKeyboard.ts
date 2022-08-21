import {useEffect, useState} from 'react';
import {
  EmitterSubscription,
  Keyboard,
  KeyboardEventListener,
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

export function useKeyboard(enabled: boolean) {
  const [shown, setShown] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    start: undefined | ScreenRect;
    end: ScreenRect;
  }>(initialValue);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  const handleKeyboardWillShow: KeyboardEventListener = e => {
    setCoordinates({start: e.startCoordinates, end: e.endCoordinates});
  };
  const handleKeyboardDidShow: KeyboardEventListener = e => {
    setShown(true);
    setCoordinates({start: e.startCoordinates, end: e.endCoordinates});
    setKeyboardHeight(e.endCoordinates.height);
  };
  const handleKeyboardWillHide: KeyboardEventListener = e => {
    setCoordinates({start: e.startCoordinates, end: e.endCoordinates});
  };
  const handleKeyboardDidHide: KeyboardEventListener = e => {
    setShown(false);
    if (e) {
      setCoordinates({start: e.startCoordinates, end: e.endCoordinates});
    } else {
      setCoordinates(initialValue);
      setKeyboardHeight(0);
    }
  };

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
  }, [enabled]);
  return {
    keyboardShown: !enabled ? false : shown,
    coordinates: !enabled ? emptyCoordinates : coordinates,
    keyboardHeight: !enabled ? 0 : keyboardHeight,
  };
}
