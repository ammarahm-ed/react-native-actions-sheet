import {AccessibilityInfo, Platform} from 'react-native';
import {useEffect, useRef} from 'react';

let accessibilityInfo = {
  prefersCrossFadeTransitions: false,
  isReduceMotionEnabled: false,
};

export async function getAccessibilityInfo() {
  if (Platform.OS !== "ios") return accessibilityInfo;
  try {
    accessibilityInfo.isReduceMotionEnabled =
      await AccessibilityInfo.isReduceMotionEnabled();
    if (!accessibilityInfo.isReduceMotionEnabled) {
      accessibilityInfo.prefersCrossFadeTransitions = false;
      return accessibilityInfo;
    }
    accessibilityInfo.prefersCrossFadeTransitions =
      await AccessibilityInfo.prefersCrossFadeTransitions();
    return accessibilityInfo;
  } catch (e) {
    return accessibilityInfo;
  }
}

getAccessibilityInfo();

export function useAccessibility() {
  const accessibilityRef = useRef(accessibilityInfo);

  useEffect(() => {
    let subscription: {remove: () => void};
    if (Platform.OS === 'ios') {
      const handler = () => {
        getAccessibilityInfo().then(
          result => (accessibilityRef.current = result),
        );
      };

      subscription = AccessibilityInfo.addEventListener?.('change', handler);
      handler();
    }

    return () => {
      subscription?.remove?.();
    };
  }, []);

  return accessibilityRef;
}
