import React, {
  forwardRef,
  Fragment,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  Dimensions,
  GestureResponderEvent,
  Keyboard,
  LayoutRectangle,
  Modal,
  NativeEventSubscription,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  GestureType,
  PanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  measure,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  DraggableNodes,
  DraggableNodesContext,
  GestureRegion,
  LayoutRect,
  NodesRef,
  PanGestureRefContext,
  WorkletScrollContext,
  WorkletScrollContextType,
} from './context';
import EventManager, {actionSheetEventManager} from './eventmanager';
import {useAccessibility} from './hooks/use-accessibility';
import {
  Route,
  RouterContext,
  RouterParamsContext,
  useRouter,
} from './hooks/use-router';
import {resolveScrollRef} from './hooks/use-scroll-handlers';
import useSheetManager from './hooks/use-sheet-manager';
import {useKeyboard} from './hooks/useKeyboard';
import {
  providerRegistryStack,
  SheetProvider,
  useProviderContext,
  useSheetIDContext,
  useSheetPayload,
  useSheetRef,
} from './provider';
import {getZIndexFromStack, SheetManager} from './sheetmanager';
import {styles} from './styles';
import {ActionSheetProps, ActionSheetRef, CloseRequestType} from './types';
import {getElevation, SUPPORTED_ORIENTATIONS} from './utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Window over which layout events are coalesced before geometry is committed.
// Long enough to absorb multi-pass layout (e.g. Android modal), short enough to
// be invisible since the sheet is off-screen until the first commit.
const LAYOUT_SETTLE_MS = 32;

// Distance (px) over which the draw-under-status-bar effect blends in as the
// sheet's top approaches the top of the screen.
const STATUS_BAR_REVEAL_DISTANCE = 64;
export default forwardRef<ActionSheetRef, ActionSheetProps>(
  function ActionSheet(
    {
      animated = true,
      closeOnPressBack = true,
      springOffset = 50,
      elevation = 5,
      disableElevation = false,
      defaultOverlayOpacity = 0.3,
      overlayColor = 'black',
      closable = true,
      closeOnTouchBackdrop = true,
      onTouchBackdrop,
      drawUnderStatusBar = false,
      gestureEnabled = false,
      isModal = true,
      snapPoints: snapPointsProp = [100],
      initialSnapIndex = 0,
      overdrawEnabled = true,
      overdrawFactor = 15,
      overdrawSize = 100,
      zIndex = 999,
      keyboardHandlerEnabled = true,
      ExtraOverlayComponent,
      returnValue,
      routes,
      initialRoute,
      onBeforeShow,
      enableRouterBackNavigation,
      onBeforeClose,
      enableGesturesInScrollView = true,
      experimentalWorkletGestures = true,
      legacyGestures = false,
      disableDragBeyondMinimumSnapPoint,
      useBottomSafeAreaPadding = true,
      initialTranslateFactor = 1.1,
      openAnimationConfig = {
        damping: 110,
        mass: 4,
        stiffness: 900,
        overshootClamping: true,
      },
      onRequestClose,
      ...props
    },
    ref,
  ) {
    const snapPoints = React.useMemo(
      () =>
        snapPointsProp[snapPointsProp.length - 1] !== 100
          ? [...snapPointsProp, 100]
          : snapPointsProp,
      // Stabilize identity across renders so dependent callbacks are not recreated
      // when the parent passes an inline snapPoints array.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [snapPointsProp.join(',')],
    );
    const initialValue = useRef(-1);
    const actionSheetHeight = useRef(0);
    const insets = useSafeAreaInsets();
    const internalEventManager = React.useMemo(() => new EventManager(), []);
    const currentContext = useProviderContext();
    const currentSnapIndex = useRef(initialSnapIndex);
    const accessibilityInfo = useAccessibility();
    const sheetRef = useSheetRef();
    const sheetHeightRef = useRef(0);
    const minTranslateValue = useRef(0);
    const keyboardWasVisible = useRef(false);
    const id = useSheetIDContext();
    const sheetId = props.id || id;
    const panViewRef = useRef<View>(null);
    const rootViewContainerRef = useRef<View>(null);
    const payload = useSheetPayload();
    const payloadRef = useRef<any>(undefined);
    payloadRef.current = payload;
    const gestureBoundaries = useRef<{
      [name: string]: LayoutRectangle & {
        scrollOffset?: number;
      };
    }>({});
    const hiding = useRef(false);
    const returnValueRef = useRef(returnValue);
    const sheetPayload = useSheetPayload();
    const panGestureRef = useRef<GestureType>(undefined);
    const closing = useRef(false);
    const draggableNodes = useRef<NodesRef>([]);
    const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [dimensions, setDimensions] = useState({
      width: -1,
      height: -1,
    });
    const dimensionsRef = useRef(dimensions);
    dimensionsRef.current = dimensions;
    // Latest container size reported by onLayout, before it has settled. Layout
    // events (especially two-pass Android modal layout: a smaller frame then the
    // real one) are coalesced and only committed once they stop changing.
    const pendingDimensionsRef = useRef(dimensions);
    const containerStyle = StyleSheet.flatten(props.containerStyle);
    const providerId = useRef(`$$-auto-${sheetId}-${currentContext}-provider`);
    providerId.current = `$$-auto-${sheetId}-${currentContext}-provider`;

    const {visible, setVisible, visibleRef} = useSheetManager({
      id: sheetId,
      onHide: data => {
        hideSheet(undefined, data, true);
      },
      onBeforeShow: (data, snapIndex) => {
        routerRef.current?.initialNavigation();
        if (snapIndex !== undefined) {
          setCurrentSnapIndex(snapIndex);
        }
        onBeforeShow?.(data as never);
      },
      onContextUpdate: () => {
        if (sheetId) {
          SheetManager.add(sheetId, currentContext);
          SheetManager.registerRef(sheetId, currentContext, {
            current: getRef(),
          } as RefObject<ActionSheetRef>);
        }
      },
    });

    const opacity = useSharedValue(0);
    const actionSheetOpacity = useSharedValue(0);
    const translateY = useSharedValue(Dimensions.get('window').height * 2);
    const routeOpacity = useSharedValue(0);

    // Geometry mirrored into shared values so the underlay and onChange position
    // math can run entirely on the UI thread (no per-frame JS bridge hop).
    // These are also the source-of-truth read by the worklet gesture (Phase 3).
    const actionSheetHeightSV = useSharedValue(0);
    const minTranslateValueSV = useSharedValue(0);
    const insetTopSV = useSharedValue(insets.top);
    // Sheet position/snap state mirrored from the JS refs below via dual-write
    // helpers, so worklets can read them without a JS-thread hop.
    const initialValueSV = useSharedValue(-1);
    const currentSnapIndexSV = useSharedValue(initialSnapIndex);
    const keyboardHeightSV = useSharedValue(0);
    const keyboardShownSV = useSharedValue(false);
    const snapPointsSV = useSharedValue<number[]>(snapPoints);
    // Worklet scroll-arbitration state (experimentalWorkletGestures).
    const isRefreshingSV = useSharedValue(false);
    // Registry of gesture regions (scrollables + gesture-blocking views). The
    // worklet pan gesture measures these at gesture start to decide, per finger,
    // whether to drag the sheet, hand off to a scrollable, or stay put.
    const gestureRegions = useRef<GestureRegion[]>([]);
    const [registryVersion, setRegistryVersion] = useState(0);
    const registerRegion = useCallback((region: GestureRegion) => {
      gestureRegions.current.push(region);
      setRegistryVersion(v => v + 1);
      return () => {
        const index = gestureRegions.current.findIndex(
          r => r.id === region.id,
        );
        if (index > -1) gestureRegions.current.splice(index, 1);
        setRegistryVersion(v => v + 1);
      };
    }, []);

    // Keeps a ref and its mirror shared value in sync in one place.
    const setInitialValue = React.useCallback(
      (value: number) => {
        initialValue.current = value;
        initialValueSV.value = value;
      },
      [initialValueSV],
    );
    const setCurrentSnapIndex = React.useCallback(
      (value: number) => {
        currentSnapIndex.current = value;
        currentSnapIndexSV.value = value;
      },
      [currentSnapIndexSV],
    );

    useEffect(() => {
      insetTopSV.value = insets.top;
    }, [insetTopSV, insets.top]);

    useEffect(() => {
      snapPointsSV.value = snapPoints;
    }, [snapPoints, snapPointsSV]);

    // How "full-screen" the sheet is, 0 -> 1, purely from geometry: the sheet
    // card's top edge on screen equals translateY, so this ramps up smoothly over
    // the last STATUS_BAR_REVEAL_DISTANCE px as the top reaches the status bar.
    // Reaches 1 only for sheets tall enough to actually cover it, so no explicit
    // "percent covered" threshold is needed. Drives the status-bar fill + the
    // top-corner flattening.
    const fullscreenProgress = useDerivedValue(() => {
      if (!drawUnderStatusBar) return 0;
      const inset = insetTopSV.value;
      if (inset <= 0) return 0;
      return interpolate(
        translateY.value,
        [inset + STATUS_BAR_REVEAL_DISTANCE, inset],
        [0, 1],
        Extrapolation.CLAMP,
      );
    });
    const router = useRouter({
      routes: routes,
      getRef: () => getRef(),
      initialRoute: initialRoute as string,
      onNavigate: props.onNavigate,
      onNavigateBack: props.onNavigateBack,
      routeOpacity: routeOpacity,
    });
    const routerRef = useRef(router);
    returnValueRef.current = returnValue;
    routerRef.current = router;
    const keyboard = useKeyboard(keyboardHandlerEnabled);
    useEffect(() => {
      keyboardShownSV.value = keyboard.keyboardShown;
      keyboardHeightSV.value = keyboard.keyboardHeight;
    }, [
      keyboard.keyboardShown,
      keyboard.keyboardHeight,
      keyboardShownSV,
      keyboardHeightSV,
    ]);
    const prevSnapIndex = useRef<number>(initialSnapIndex);
    const draggableNodesContext: DraggableNodes = React.useMemo(
      () => ({
        nodes: draggableNodes,
      }),
      [],
    );
    const notifyOffsetChange = (value: number) => {
      internalEventManager.publish('onoffsetchange', value);
    };

    const notifySnapIndexChanged = React.useCallback(() => {
      if (prevSnapIndex.current !== currentSnapIndex.current) {
        prevSnapIndex.current = currentSnapIndex.current;
        props.onSnapIndexChange?.(currentSnapIndex.current);
      }
    }, [props.onSnapIndexChange]);

    const moveSheetWithAnimation = React.useCallback(
      (
        velocity?: number,
        value?: number,
        min?: number,
        gestureEnd?: boolean,
      ) => {
        let initial = value || initialValue.current;
        let minTranslate = min || minTranslateValue.current;
        if (!animated) {
          actionSheetOpacity.value = 1;
          translateY.value = initial;
          return;
        }

        const config = openAnimationConfig;
        const correctedValue = initial > minTranslate ? initial : 0;

        notifyOffsetChange(correctedValue as number);
        if (
          accessibilityInfo.current.prefersCrossFadeTransitions &&
          !gestureEnd
        ) {
          actionSheetOpacity.value = 0;
          translateY.value = initial;
          actionSheetOpacity.value = withTiming(1, {
            duration: 150,
            easing: Easing.in(Easing.ease),
          });
        } else {
          actionSheetOpacity.value = 1;
          translateY.value = withSpring(initial, {
            ...config,
            velocity: typeof velocity !== 'number' ? undefined : velocity,
          });
        }

        notifySnapIndexChanged();
      },
      [animated, openAnimationConfig],
    );

    const animationSheetOpacity = React.useCallback((value: number) => {
      opacity.value = withTiming(value, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });
    }, []);

    const hideSheetWithAnimation = React.useCallback(
      (vy?: number, callback?: () => void, gestureEnd?: boolean) => {
        if (!animated) {
          callback?.();
          return;
        }
        const config = props.closeAnimationConfig;
        animationSheetOpacity(0);
        const endTranslateValue = dimensionsRef.current.height * 1.3;
        if (
          accessibilityInfo.current.prefersCrossFadeTransitions &&
          !gestureEnd
        ) {
          actionSheetOpacity.value = withTiming(
            0,
            {
              duration: 200,
              easing: Easing.in(Easing.ease),
            },
            finished => {
              'worklet';
              if (finished) {
                translateY.value = endTranslateValue;
              }
              // Fire onClose exactly when the animation settles (drift-free,
              // even when the JS thread is busy) instead of via setTimeout.
              if (callback) runOnJS(callback)();
            },
          );
        } else {
          translateY.value = withTiming(
            endTranslateValue,
            config || {
              velocity: typeof vy !== 'number' ? 3.0 : vy + 1,
              duration: 200,
            },
            () => {
              'worklet';
              if (callback) runOnJS(callback)();
            },
          );
        }
      },
      [animated, animationSheetOpacity, props.closeAnimationConfig, setVisible],
    );

    const getCurrentPosition = React.useCallback(() => {
      return translateY.value <= minTranslateValue.current + 5
        ? 0
        : (translateY.value as number);
    }, []);

    const getNextPosition = React.useCallback(
      (snapIndex: number) => {
        return (
          actionSheetHeight.current +
          minTranslateValue.current -
          (actionSheetHeight.current * snapPoints[snapIndex]) / 100
        );
      },
      [snapPoints],
    );

    const hardwareBackPressEvent = useRef<NativeEventSubscription>(null);
    const Root: React.ElementType =
      isModal && !props?.backgroundInteractionEnabled ? Modal : Animated.View;

    const onChange = props.onChange;
    const onChangeWorklet = props.onChangeWorklet;
    // Computes the visible percentage on the UI thread and only hops to JS when
    // the rounded integer changes. Replaces the per-frame translateY.addListener
    // -> runOnJS bridge.
    useAnimatedReaction(
      () => {
        const sheetHeight = actionSheetHeightSV.value;
        if (sheetHeight <= 0) return -1;
        const correctedValue =
          translateY.value > minTranslateValueSV.value
            ? translateY.value - minTranslateValueSV.value
            : 0;
        return Math.round(((sheetHeight - correctedValue) / sheetHeight) * 100);
      },
      (rounded, previous) => {
        if (rounded < 0 || rounded === previous) return;
        onChangeWorklet?.(rounded);
        if (onChange) runOnJS(onChange)(rounded);
      },
      [onChange, onChangeWorklet],
    );

    // Computes the sheet geometry from the *settled* container size + sheet
    // height. Called only from the debounced scheduler below, so it never runs on
    // a transient (e.g. first-pass Android) measurement.
    const processLayout = React.useCallback(() => {
      // Commit the settled container size (used by styles + close animations).
      const pending = pendingDimensionsRef.current;
      if (
        pending.height >= 10 &&
        (dimensionsRef.current.width !== pending.width ||
          dimensionsRef.current.height !== pending.height)
      ) {
        dimensionsRef.current = pending;
        setDimensions(pending);
      }

      if (dimensionsRef.current.height === -1) return;
      if (closing.current) return;

      const sheetHeight = sheetHeightRef.current;
      const rootViewHeight = dimensionsRef.current.height;

      actionSheetHeight.current =
        sheetHeight > rootViewHeight ? rootViewHeight : sheetHeight;
      actionSheetHeightSV.value = actionSheetHeight.current;

      let initial = initialValue.current;
      let minTranslate = rootViewHeight - actionSheetHeight.current;

      if (initial === -1) {
        translateY.value = rootViewHeight * initialTranslateFactor;
      }

      const nextInitialValue =
        actionSheetHeight.current +
        minTranslate -
        (actionSheetHeight.current * snapPoints[currentSnapIndex.current]) / 100;

      initial =
        (keyboard.keyboardShown || keyboardWasVisible.current) &&
        initial <= nextInitialValue &&
        initial >= minTranslate
          ? initial
          : nextInitialValue;

      const sheetBottomEdgePosition =
        initial +
        (actionSheetHeight.current * snapPoints[currentSnapIndex.current]) / 100;

      const sheetPositionWithKeyboard =
        sheetBottomEdgePosition -
        (rootViewHeight - keyboard.keyboardHeight);

      initial = keyboard.keyboardShown
        ? initial - sheetPositionWithKeyboard
        : initial;

      if (keyboard.keyboardShown) {
        minTranslate = minTranslate - keyboard.keyboardHeight;
      }

      minTranslateValue.current = minTranslate;
      minTranslateValueSV.value = minTranslate;
      setInitialValue(initial);

      animationSheetOpacity(defaultOverlayOpacity);
      moveSheetWithAnimation(undefined, initial, minTranslate);

      if (Platform.OS === 'web') {
        document.body.style.overflowY = 'hidden';
        document.documentElement.style.overflowY = 'hidden';
      }
    }, [
      snapPoints,
      keyboard.keyboardShown,
      keyboard.keyboardHeight,
      animationSheetOpacity,
      translateY,
      moveSheetWithAnimation,
      setInitialValue,
      defaultOverlayOpacity,
      initialTranslateFactor,
    ]);

    // Coalesce layout events across all sources (root container + sheet view).
    // Geometry is committed only once the size stops changing for a short window,
    // so a transient smaller/earlier measurement never positions the sheet. The
    // sheet is off-screen until the first commit, so this settle is invisible.
    const scheduleLayout = React.useCallback(() => {
      if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
      layoutTimeoutRef.current = setTimeout(() => {
        layoutTimeoutRef.current = null;
        processLayout();
      }, LAYOUT_SETTLE_MS);
    }, [processLayout]);

    const onSheetLayout = React.useCallback(
      (height: number) => {
        sheetHeightRef.current = height;
        scheduleLayout();
      },
      [scheduleLayout],
    );

    const onRootLayout = React.useCallback(
      (width: number, height: number) => {
        if (height < 10) return;
        pendingDimensionsRef.current = {width, height};
        scheduleLayout();
      },
      [scheduleLayout],
    );

    useEffect(() => {
      return () => {
        if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
      };
    }, []);

    // Recompute the sheet position when the keyboard shows/hides. Previously this
    // was forced with a `marginTop: 0.5` style toggle that triggered a layout
    // pass; now we recompute directly from the last measured sheet height.
    useEffect(() => {
      if (!visibleRef.current.value) return;
      if (!sheetHeightRef.current) return;
      scheduleLayout();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keyboard.keyboardShown, keyboard.keyboardHeight]);

    const hideSheet = React.useCallback(
      (
        vy?: number,
        data?: any,
        isSheetManagerOrRef?: boolean,
        gestureEnd?: boolean,
      ) => {
        if (hiding.current) return;

        let closeRequestResult = true;
        if (gestureEnd) {
          if (onRequestClose) {
            closeRequestResult = onRequestClose?.(CloseRequestType.SWIPE);
          }
        }

        if ((!closable || !closeRequestResult) && !isSheetManagerOrRef) {
          const next = getNextPosition(currentSnapIndex.current);
          moveSheetWithAnimation(vy, next, undefined, gestureEnd);
          setInitialValue(next);
          return;
        }

        hiding.current = true;
        onBeforeClose?.((data || returnValueRef.current || data) as never);
        if (closable) {
          closing.current = true;
          Keyboard.dismiss();
        }
        const onCompleteAnimation = () => {
          if (closable || isSheetManagerOrRef) {
            const providerIndex = providerRegistryStack.indexOf(providerId.current);
            if (providerIndex > -1) {
              providerRegistryStack.splice(providerIndex, 1);
            }
            setVisible(false);
            visibleRef.current.value = false;
            if (props.onClose) {
              props.onClose?.(
                (data || returnValueRef.current || data) as never,
              );
              hiding.current = false;
            }
            hardwareBackPressEvent.current?.remove();
            if (sheetId) {
              SheetManager.remove(sheetId, currentContext);
              hiding.current = false;
              actionSheetEventManager.publish(
                `onclose_${sheetId}`,
                data || returnValueRef.current || data,
                currentContext || 'global',
              );
            } else {
              hiding.current = false;
            }
            setCurrentSnapIndex(initialSnapIndex);
            closing.current = false;
            setInitialValue(-1);
            actionSheetOpacity.value = 0;
            translateY.value = Dimensions.get('window').height * 2;
            keyboard.reset();
          } else {
            opacity.value = 1;
            moveSheetWithAnimation(1, undefined, undefined, gestureEnd);
          }
        };
        hideSheetWithAnimation(vy, onCompleteAnimation, gestureEnd);
        if (Platform.OS === 'web') {
          document.body.style.overflowY = 'auto';
          document.documentElement.style.overflowY = 'auto';
        }
      },
      [
        closable,
        hideSheetWithAnimation,
        props.onClose,
        moveSheetWithAnimation,
        keyboard,
        setVisible,
      ],
    );

    const onHardwareBackPress = React.useCallback(() => {
      if (
        visible &&
        enableRouterBackNavigation &&
        routerRef.current?.canGoBack()
      ) {
        routerRef.current?.goBack();
        return true;
      }

      let closeRequestResult = true;
      if (onRequestClose) {
        closeRequestResult = onRequestClose?.(CloseRequestType.BACK_PRESS);
      }

      if (visible && closable && closeOnPressBack && closeRequestResult) {
        hideSheet();
        return true;
      }
      return false;
    }, [
      closable,
      closeOnPressBack,
      hideSheet,
      enableRouterBackNavigation,
      visible,
    ]);

    /**
     * Snap towards the top
     */
    const snapForward = React.useCallback(
      (vy: number, gestureEnd?: boolean) => {
        if (currentSnapIndex.current === snapPoints.length - 1) {
          const next = getNextPosition(currentSnapIndex.current);
          moveSheetWithAnimation(vy, next, undefined, gestureEnd);
          setInitialValue(next);
          return;
        }
        let nextSnapPoint = 0;
        let nextSnapIndex = 0;
        if (getCurrentPosition() === 0) {
          nextSnapPoint = snapPoints[(nextSnapIndex = snapPoints.length - 1)];
        } else {
          for (let i = currentSnapIndex.current; i < snapPoints.length; i++) {
            if (getNextPosition(i) < getCurrentPosition()) {
              nextSnapPoint = snapPoints[(nextSnapIndex = i)];
              break;
            }
          }
        }

        if (nextSnapPoint > 100) {
          console.warn('Snap points should range between 0 to 100.');
          moveSheetWithAnimation(vy, undefined, undefined, gestureEnd);
          return;
        }
        setCurrentSnapIndex(nextSnapIndex);
        const next = getNextPosition(currentSnapIndex.current);
        setInitialValue(next);
        moveSheetWithAnimation(vy, next, undefined, gestureEnd);
      },
      [getCurrentPosition, getNextPosition, moveSheetWithAnimation, snapPoints],
    );
    /**
     * Snap towards the bottom
     */
    const snapBackward = React.useCallback(
      (vy: number, gestureEnd?: boolean) => {
        if (currentSnapIndex.current === 0) {
          if (closable) {
            setInitialValue(dimensionsRef.current.height * 1.3);
            hideSheet(vy, undefined, false, gestureEnd);
          } else {
            const next = getNextPosition(currentSnapIndex.current);
            moveSheetWithAnimation(vy, next, undefined, gestureEnd);
            setInitialValue(next);
          }
          return;
        }

        let nextSnapPoint = 0;
        let nextSnapIndex = 0;
        for (let i = currentSnapIndex.current; i > -1; i--) {
          if (getNextPosition(i) > getCurrentPosition()) {
            nextSnapPoint = snapPoints[(nextSnapIndex = i)];
            break;
          }

          if (i === 0 && getCurrentPosition() > getNextPosition(i)) {
            if (closable) {
              setInitialValue(dimensionsRef.current.height * 1.3);
              hideSheet(vy, undefined, undefined, gestureEnd);
              return;
            }
          }
        }

        if (nextSnapPoint < 0) {
          console.warn('Snap points should range between 0 to 100.');
          moveSheetWithAnimation(vy, undefined, undefined, gestureEnd);
          return;
        }
        setCurrentSnapIndex(nextSnapIndex);
        const next = getNextPosition(currentSnapIndex.current);
        setInitialValue(next);
        moveSheetWithAnimation(vy, next, undefined, gestureEnd);
      },
      [
        closable,
        getCurrentPosition,
        getNextPosition,
        hideSheet,
        moveSheetWithAnimation,
        snapPoints,
      ],
    );

    function getRectBoundary(rect?: LayoutRect | null) {
      if (rect) {
        const {w, h, px, py} = rect;
        return {...rect, boundryX: px + w, boundryY: py + h};
      }
      return {w: 0, h: 0, px: 0, py: 0, x: 0, y: 0, boundryX: 0, boundryY: 0};
    }

    const getActiveDraggableNodes = React.useCallback(
      (absoluteX: number, absoluteY: number, returnAllNodes?: boolean) => {
        if (draggableNodes.current?.length === 0) return [];
        const activeNodes: {
          rectWithBoundary: LayoutRect;
          node: NodesRef['0'];
        }[] = [];
        for (let node of draggableNodes.current) {
          const rect = getRectBoundary(node.rect.current);
          if (rect.boundryX === 0 && rect.boundryY === 0) continue;
          if (returnAllNodes) {
            activeNodes.push({
              rectWithBoundary: rect,
              node: node,
            });
          } else if (
            absoluteX > rect.px &&
            absoluteY > rect.py &&
            absoluteX < rect.boundryX &&
            absoluteY < rect.boundryY
          ) {
            activeNodes.push({
              rectWithBoundary: rect,
              node: node,
            });
          }
        }
        return activeNodes;
      },
      [],
    );

    // Snap decision at the end of a worklet-driven drag. Runs once on the JS
    // thread (via runOnJS) at gesture release — not per frame — and reuses the
    // existing snap logic. The spring animation itself still runs on the UI
    // thread inside moveSheetWithAnimation/snapForward/snapBackward.
    const handleGestureEnd = React.useCallback(
      (vy: number) => {
        if (!gestureEnabled) return;
        // Released while rubber-banded above the fully-open position (overdraw).
        // The finger velocity here is in un-compressed space (the sheet only moved
        // ~1/overdrawFactor of the finger), so feeding it straight into the spring
        // over-springs and looks like a jump. Spring back to the top gently.
        if (translateY.value < minTranslateValue.current) {
          const top = getNextPosition(snapPoints.length - 1);
          setCurrentSnapIndex(snapPoints.length - 1);
          setInitialValue(top);
          moveSheetWithAnimation(1, top, undefined, true);
          return;
        }
        const current = getCurrentPosition();
        const isMovingUp = current < initialValue.current;
        if (
          (!isMovingUp && current < initialValue.current + springOffset) ||
          (isMovingUp && current > initialValue.current - springOffset)
        ) {
          moveSheetWithAnimation(1, undefined, undefined, true);
          return;
        }
        if (!isMovingUp) {
          snapBackward(vy, true);
        } else {
          snapForward(vy, true);
        }
      },
      [
        gestureEnabled,
        getNextPosition,
        setCurrentSnapIndex,
        setInitialValue,
        snapPoints,
        getCurrentPosition,
        moveSheetWithAnimation,
        snapBackward,
        snapForward,
        springOffset,
      ],
    );

    const panGesture = React.useMemo(() => {
      let prevDeltaY = 0;
      let deltaYOnGestureStart = 0;
      let velocity = 0;
      let start: {
        x: number;
        y: number;
      };
      let oldValue = 0;
      let isRefreshing = false;
      const offsets: number[] = [];

      function scrollable(value: boolean) {
        for (let i = 0; i < draggableNodes.current.length; i++) {
          const node = draggableNodes.current[i];
          const scrollRef = resolveScrollRef(node.ref);
          if (Platform.OS === 'ios' || Platform.OS === 'web') {
            if (!value) {
              if (!offsets[i] || node.offset.current?.y === 0) {
                offsets[i] = node.offset.current?.y || 0;
              }
              if (Platform.OS === 'web') {
                (scrollRef as HTMLDivElement).scrollTop = offsets[i];
              } else {
                scrollRef.scrollTo({
                  x: 0,
                  y: offsets[i],
                  animated: false,
                });
              }
            } else {
              offsets[i] = node.offset.current?.y || 0;
            }
          } else if (Platform.OS === 'android') {
            scrollRef?.setNativeProps({
              scrollEnabled: value,
            });
          }
        }
      }

      let blockPan = false;

      const onChange = (
        absoluteX: number,
        absoluteY: number,
        translationY: number,
      ) => {
        if (!gestureEnabled) return;
        let deltaY = translationY;
        let isSwipingDown = prevDeltaY < deltaY;

        prevDeltaY = deltaY;

        if (!start) {
          start = {
            x: absoluteX,
            y: absoluteY,
          };
        }

        const isFullOpen = getCurrentPosition() === 0;

        const activeDraggableNodes = getActiveDraggableNodes(
          start.x,
          start.y,
          !isFullOpen || (isFullOpen && !isSwipingDown),
        );

        if (
          enableGesturesInScrollView &&
          activeDraggableNodes.length > 0 &&
          !isRefreshing
        ) {
          const nodeIsScrolling = activeDraggableNodes.some(
            node => node.node.offset.current.y !== 0,
          );

          /**
           * Draggable nodes handling cases:
           *
           * 1. Sheet not fully open, swiping up, scrolling: false panning: true (will transition to scrolling once sheet reaches top position)
           * 2. Sheet fully open, swiping up, scrolling: true, panning: false
           * 3. Sheet not fully open, swiping down, scrolling: false, panning: true
           * 4. Sheet fully open, scroll offset > 0, scrolling: true, panning: false will transition into scrolling: false, panning: true, once scroll reaches offset=0
           * 5. Add support for pull to refresh
           */

          // 1. Sheet not fully open, swiping up, scrolling: false panning: true (will transition to scrolling once sheet reaches top position)
          if (!isFullOpen && !isSwipingDown) {
            scrollable(false);
            blockPan = false;
          }

          // 2. Sheet fully open, swiping up, scrolling: true, panning: false
          if (isFullOpen && !isSwipingDown) {
            scrollable(true);
            blockPan = true;
          }
          //  3. Sheet not fully open, swiping down, scrolling: false, panning: true
          if (!isFullOpen && isSwipingDown) {
            if (nodeIsScrolling) {
              scrollable(true);
              blockPan = true;
            } else {
              scrollable(false);
              blockPan = false;
            }
          }

          // 4. Sheet fully open, scroll offset > 0, scrolling: true, panning: false will transition into scrolling: false, panning: true, once scroll reaches offset=0
          if (isFullOpen && isSwipingDown) {
            if (nodeIsScrolling) {
              scrollable(true);
              blockPan = true;
            } else {
              if (!deltaYOnGestureStart && deltaY > 0) {
                deltaYOnGestureStart = deltaY;
              }
              const hasRefreshControl = activeDraggableNodes.some(
                node => node.node.handlerConfig.hasRefreshControl,
              );
              if (hasRefreshControl) {
                for (const node of activeDraggableNodes) {
                  if (node.node.handlerConfig.hasRefreshControl) {
                    // Refresh Control will work in to 15% area of the DraggableNode.
                    const refreshControlBounds =
                      node.rectWithBoundary.py +
                      node.rectWithBoundary.h *
                        node.node.handlerConfig.refreshControlBoundary;

                    if (!refreshControlBounds) continue;
                    if (absoluteY < refreshControlBounds) {
                      scrollable(true);
                      blockPan = true;
                      isRefreshing = true;
                    }
                  }
                }
              } else {
                scrollable(false);
                blockPan = false;
              }
            }
          }
        } else if (
          !enableGesturesInScrollView &&
          activeDraggableNodes.length > 0
        ) {
          blockPan = true;
        } else {
          blockPan = false;
        }

        if (isRefreshing) {
          blockPan = true;
          scrollable(true);
        }

        let value = oldValue;

        deltaY = deltaY - deltaYOnGestureStart;
        if (!blockPan) {
          value = initialValue.current + deltaY;
          oldValue = value;
        }

        if (blockPan) return;

        velocity = 1;
        const correctedValue =
          value <= minTranslateValue.current
            ? minTranslateValue.current - value
            : value;

        if (correctedValue / overdrawFactor >= overdrawSize && deltaY <= 0) {
          return;
        }

        const minSnapPoint = getNextPosition(0);
        const translateYValue =
          value <= minTranslateValue.current
            ? overdrawEnabled
              ? minTranslateValue.current - correctedValue / overdrawFactor
              : minTranslateValue.current
            : value;

        if (!closable && disableDragBeyondMinimumSnapPoint) {
          translateY.value =
            translateYValue >= minSnapPoint ? minSnapPoint : translateYValue;
        } else {
          translateY.value = translateYValue;
        }
      };

      const onEnd = () => {
        if (!gestureEnabled) return;
        deltaYOnGestureStart = 0;
        const isMovingUp = getCurrentPosition() < initialValue.current;

        scrollable(true);

        if (
          (!isMovingUp &&
            getCurrentPosition() < initialValue.current + springOffset) ||
          (isMovingUp &&
            getCurrentPosition() > initialValue.current - springOffset)
        ) {
          moveSheetWithAnimation(1, undefined, undefined, true);
          velocity = 0;
          return;
        }

        if (!isMovingUp) {
          snapBackward(velocity, true);
        } else {
          snapForward(velocity, true);
        }
        velocity = 0;
      };

      return Platform.OS === 'web'
        ? PanResponder.create({
            onMoveShouldSetPanResponder: (_event, gesture) => {
              let vy = gesture.vy < 0 ? gesture.vy * -1 : gesture.vy;
              let vx = gesture.vx < 0 ? gesture.vx * -1 : gesture.vx;
              if (vy < 0.05 || vx > 0.05) {
                return false;
              }

              const activeDraggableNodes = getActiveDraggableNodes(
                _event.nativeEvent.pageX,
                _event.nativeEvent.pageY,
              );
              for (let node of activeDraggableNodes) {
                const scrollRef = resolveScrollRef(node.node.ref);
                offsets.push((scrollRef as HTMLDivElement).scrollTop);
              }
              return true;
            },
            onStartShouldSetPanResponder: (_event, _gesture) => {
              const activeDraggableNodes = getActiveDraggableNodes(
                _event.nativeEvent.pageX,
                _event.nativeEvent.pageY,
              );
              for (let node of activeDraggableNodes) {
                const scrollRef = resolveScrollRef(node.node.ref);
                offsets.push((scrollRef as HTMLDivElement).scrollTop);
              }
              return true;
            },
            onPanResponderMove: (_event, gesture) => {
              onChange(
                _event.nativeEvent.pageX,
                _event.nativeEvent.pageY,
                gesture.dy,
              );
            },
            onPanResponderEnd: onEnd,
          })
        : Gesture.Pan()
            .withRef(panGestureRef)
            .onChange(event =>
              onChange(event.absoluteX, event.absoluteY, event.translationY),
            )
            .runOnJS(true)
            .activeOffsetY([-5, 5])
            .failOffsetX([-5, 5])
            .onEnd(onEnd);
    }, [gestureEnabled]);

    // Fully worklet-driven pan gesture. Per-frame drag and scroll<->drag
    // arbitration run on the UI thread; only the snap decision at release hops
    // to JS (once) via handleGestureEnd.
    //
    // On gesture start it measures every registered region to find, on the UI
    // thread, which scrollable (or gesture-blocking region) is under the finger,
    // so multiple scrollables are arbitrated correctly at the same time.
    const workletPanGesture = React.useMemo(() => {
      const overdrawFactorC = overdrawFactor;
      const overdrawSizeC = overdrawSize;
      const overdrawEnabledC = overdrawEnabled;
      const closableC = closable;
      const disableBeyondC = disableDragBeyondMinimumSnapPoint;
      const enableInScrollC = enableGesturesInScrollView;
      // Snapshot of the registry captured for this gesture instance. The memo
      // rebuilds whenever registryVersion changes so this stays current.
      const regions = gestureRegions.current.slice();
      // activeKind: 0 = none/sheet, 1 = scrollable, 2 = gesture-blocking region.
      // dragging: whether the sheet is currently being moved by the finger. The
      // drag anchors to the sheet's actual position when it starts (dragBaseSheetY
      // / dragBaseTranslationY), so a frame that briefly hands back to the
      // scrollable (at the offset==0 boundary) freezes the sheet in place and the
      // next frame resumes seamlessly instead of snapping back to fully-open.
      const ctx = {
        activeKind: 0,
        activeIndex: -1,
        hasRefresh: false,
        refreshBoundaryY: 0,
        dragging: false,
        dragBaseSheetY: 0,
        dragBaseTranslationY: 0,
      };

      return Gesture.Pan()
        .withRef(panGestureRef)
        .onBegin(event => {
          'worklet';
          ctx.activeKind = 0;
          ctx.activeIndex = -1;
          ctx.hasRefresh = false;
          ctx.refreshBoundaryY = 0;
          ctx.dragging = false;

          let bestScrollIndex = -1;
          let bestScrollArea = Number.MAX_VALUE;
          for (let i = 0; i < regions.length; i++) {
            const region = regions[i];
            const m = measure(region.animatedRef);
            if (!m) continue;
            const inside =
              event.absoluteX >= m.pageX &&
              event.absoluteX <= m.pageX + m.width &&
              event.absoluteY >= m.pageY &&
              event.absoluteY <= m.pageY + m.height;
            if (!inside) continue;
            if (region.kind === 'ignore') {
              // A gesture-blocking region always wins — the sheet stays put.
              ctx.activeKind = 2;
              return;
            }
            // Prefer the smallest matching scrollable (most specific / innermost).
            const area = m.width * m.height;
            if (area < bestScrollArea) {
              bestScrollArea = area;
              bestScrollIndex = i;
              ctx.hasRefresh = !!region.hasRefreshControl;
              ctx.refreshBoundaryY =
                m.pageY + m.height * (region.refreshControlBoundary ?? 0.15);
            }
          }
          if (bestScrollIndex > -1) {
            ctx.activeKind = 1;
            ctx.activeIndex = bestScrollIndex;
          }
        })
        .onChange(event => {
          'worklet';
          if (!gestureEnabled) return;
          // Gesture-blocking region: never move the sheet.
          if (ctx.activeKind === 2) {
            ctx.dragging = false;
            return;
          }

          const swipingDown = event.changeY > 0;
          const minTranslate = minTranslateValueSV.value;
          const fullOpen = translateY.value <= minTranslate + 5;

          let block = false;
          if (ctx.activeKind === 1 && enableInScrollC && !isRefreshingSV.value) {
            const region = regions[ctx.activeIndex];
            const nodeScrolling = (region?.scrollY?.value ?? 0) > 0;
            // Case 2: fully open + swiping up while list has room -> let it scroll.
            if (fullOpen && !swipingDown) {
              block = true;
            }
            // Cases 3a/4a: swiping down while the list is still scrolled -> scroll.
            else if (swipingDown && nodeScrolling) {
              block = true;
            }
            // Case 5: pull-to-refresh. Fully open, pulling down from the top of a
            // list that has a RefreshControl, within its trigger zone.
            else if (
              fullOpen &&
              swipingDown &&
              !nodeScrolling &&
              ctx.hasRefresh &&
              event.absoluteY < ctx.refreshBoundaryY
            ) {
              isRefreshingSV.value = true;
              block = true;
            }
          } else if (ctx.activeKind === 1 && !enableInScrollC) {
            block = true;
          }

          if (block || isRefreshingSV.value) {
            // Hand the frame to the scrollable: freeze the sheet where it is so
            // the next drag frame resumes from here instead of jumping.
            ctx.dragging = false;
            return;
          }

          // Anchor the drag to the sheet's current position the moment it starts
          // moving. Captured once — a stray blocked frame just re-anchors here,
          // with no visible jump.
          if (!ctx.dragging) {
            ctx.dragging = true;
            ctx.dragBaseSheetY = translateY.value;
            ctx.dragBaseTranslationY = event.translationY;
          }

          const value =
            ctx.dragBaseSheetY + (event.translationY - ctx.dragBaseTranslationY);
          const correctedValue =
            value <= minTranslate ? minTranslate - value : value;

          // When overdrawn to the limit, keep absorbing upward movement but let
          // the user drag back down immediately.
          if (
            correctedValue / overdrawFactorC >= overdrawSizeC &&
            event.changeY <= 0
          ) {
            return;
          }

          const sheetHeight = actionSheetHeightSV.value;
          const firstSnap = snapPointsSV.value[0] ?? 100;
          const minSnapPoint =
            sheetHeight + minTranslate - (sheetHeight * firstSnap) / 100;

          const translateYValue =
            value <= minTranslate
              ? overdrawEnabledC
                ? minTranslate - correctedValue / overdrawFactorC
                : minTranslate
              : value;

          if (!closableC && disableBeyondC) {
            translateY.value =
              translateYValue >= minSnapPoint ? minSnapPoint : translateYValue;
          } else {
            translateY.value = translateYValue;
          }
        })
        .onEnd(event => {
          'worklet';
          if (!gestureEnabled) return;
          ctx.dragging = false;
          isRefreshingSV.value = false;
          if (ctx.activeKind === 2) return;
          runOnJS(handleGestureEnd)(event.velocityY);
        })
        .activeOffsetY([-5, 5])
        .failOffsetX([-5, 5]);
    }, [
      gestureEnabled,
      overdrawFactor,
      overdrawSize,
      overdrawEnabled,
      closable,
      disableDragBeyondMinimumSnapPoint,
      enableGesturesInScrollView,
      handleGestureEnd,
      registryVersion,
    ]);

    // Worklet gesture engine is the default on every platform. `legacyGestures`
    // (or explicitly `experimentalWorkletGestures={false}`) opts back into the
    // pre-v11 PanResponder/JS gesture path.
    const useWorkletGestures = legacyGestures ? false : experimentalWorkletGestures;
    const activeGesture = useWorkletGestures ? workletPanGesture : panGesture;

    const workletScrollContext = React.useMemo<WorkletScrollContextType>(
      () => ({
        enabled: useWorkletGestures,
        gestureEnabled,
        enableGesturesInScrollView,
        translateY,
        minTranslateValue: minTranslateValueSV,
        isRefreshing: isRefreshingSV,
        register: registerRegion,
      }),
      [
        useWorkletGestures,
        gestureEnabled,
        enableGesturesInScrollView,
        registerRegion,
      ],
    );

    const onTouch = (event: GestureResponderEvent) => {
      onTouchBackdrop?.(event);
      if (enableRouterBackNavigation && router.canGoBack()) {
        router.goBack();
        return;
      }

      let closeRequestResult = true;
      if (onRequestClose) {
        closeRequestResult = onRequestClose?.(CloseRequestType.TOUCH_BACKDROP);
      }

      if (closeOnTouchBackdrop && closable && closeRequestResult) {
        hideSheet();
      }
    };

    const getRef = useCallback(
      (): ActionSheetRef => ({
        show: (snapIndex?: number) => {
          if (typeof snapIndex === 'number') {
            setCurrentSnapIndex(snapIndex);
          }
          onBeforeShow?.();
          routerRef.current?.initialNavigation();
          setVisible(true);
        },
        hide: (data: any) => {
          hideSheet(undefined, data, true);
        },
        setModalVisible: (_visible?: boolean) => {
          if (_visible) {
            setVisible(true);
          } else {
            hideSheet();
          }
        },
        snapToOffset: (offset: number) => {
          setInitialValue(
            actionSheetHeight.current +
              minTranslateValue.current -
              (actionSheetHeight.current * offset) / 100,
          );
          translateY.value = withSpring(
            initialValue.current,
            openAnimationConfig,
          );
        },
        snapToRelativeOffset: (offset: number) => {
          if (offset === 0) {
            getRef().snapToIndex(currentSnapIndex.current);
            return;
          }
          const availableHeight =
            actionSheetHeight.current + minTranslateValue.current;
          setInitialValue(
            initialValue.current + initialValue.current * (offset / 100),
          );
          if (initialValue.current > availableHeight) {
            getRef().snapToOffset(100);
            return;
          }
          translateY.value = withSpring(
            initialValue.current,
            openAnimationConfig,
          );
        },
        snapToIndex: (index: number) => {
          if (index > snapPoints.length || index < 0) return;
          if (!visibleRef.current.value) {
            getRef().show(index);
            return;
          }
          setCurrentSnapIndex(index);
          setInitialValue(getNextPosition(index));
          translateY.value = withSpring(
            initialValue.current,
            openAnimationConfig,
          );
          notifySnapIndexChanged();
        },
        handleChildScrollEnd: () => {
          console.warn(
            'handleChildScrollEnd has been removed. Please use `useScrollHandlers` hook to enable scrolling in ActionSheet',
          );
        },
        modifyGesturesForLayout: (_id, layout, scrollOffset) => {
          gestureBoundaries.current[_id] = {
            ...layout,
            scrollOffset: scrollOffset,
          };
        },
        currentSnapIndex: () => currentSnapIndex.current,
        isGestureEnabled: () => gestureEnabled,
        isOpen: () => visibleRef.current.value,
        keyboardHandler: (enabled?: boolean) => {
          keyboard.pauseKeyboardHandler.current = enabled;
        },
        ev: internalEventManager,
        currentPayload: () => payloadRef.current as never,
      }),
      [
        internalEventManager,
        onBeforeShow,
        setVisible,
        hideSheet,
        translateY,
        openAnimationConfig,
        snapPoints.length,
        getNextPosition,
        notifySnapIndexChanged,
        gestureEnabled,
        visible,
        keyboard.pauseKeyboardHandler,
      ],
    );

    useImperativeHandle(ref, getRef, [getRef]);

    useEffect(() => {
      if (sheetId) {
        SheetManager.registerRef(sheetId, currentContext, {
          current: getRef(),
        } as RefObject<ActionSheetRef>);
      }
      sheetRef.current = getRef();
    }, [currentContext, getRef, sheetId, sheetRef]);

    const onModalRequestClose = React.useCallback(() => {
      if (enableRouterBackNavigation && routerRef.current?.canGoBack()) {
        routerRef.current?.goBack();
        return;
      }

      let closeRequestResult = true;
      if (onRequestClose) {
        closeRequestResult = onRequestClose?.(CloseRequestType.BACK_PRESS);
      }

      if (visible && closable && closeOnPressBack && closeRequestResult) {
        hideSheet();
      }
    }, [hideSheet, enableRouterBackNavigation, closeOnPressBack, visible]);
    const rootProps = React.useMemo(
      () =>
        isModal && !props.backgroundInteractionEnabled
          ? {
              visible: true,
              animationType: 'none',
              testID: props.testIDs?.modal || props.testID,
              supportedOrientations: SUPPORTED_ORIENTATIONS,
              onShow: props.onOpen,
              onRequestClose: onModalRequestClose,
              transparent: true,
              /**
               * Always true, it causes issue with keyboard handling.
               */
              statusBarTranslucent: true,
            }
          : {
              testID: props.testIDs?.root || props.testID,
              onLayout: () => {
                hardwareBackPressEvent.current = BackHandler.addEventListener(
                  'hardwareBackPress',
                  onHardwareBackPress,
                );
                props?.onOpen?.();
              },
              style: {
                position: 'absolute',
                zIndex: zIndex
                  ? zIndex
                  : sheetId
                    ? getZIndexFromStack(sheetId, currentContext)
                    : 999,
                width: '100%',
                height: '100%',
              },
              pointerEvents: props?.backgroundInteractionEnabled
                ? 'box-none'
                : 'auto',
            },
      [
        currentContext,
        isModal,
        onHardwareBackPress,
        onModalRequestClose,
        props,
        zIndex,
        sheetId,
      ],
    );

    const renderRoute = useCallback(
      (route: Route) => {
        const RouteComponent = route.component as any;
        return (
          <Animated.View
            key={route.name}
            style={{
              display:
                route.name !== router.currentRoute?.name ? 'none' : 'flex',
              opacity: routeOpacity,
            }}>
            <RouterParamsContext.Provider value={route?.params}>
              <RouteComponent
                router={router}
                params={route?.params}
                payload={sheetPayload}
              />
            </RouterParamsContext.Provider>
          </Animated.View>
        );
      },
      [routeOpacity, router, sheetPayload],
    );

    const context = React.useMemo(
      () => ({
        ref: panGestureRef,
        eventManager: internalEventManager,
      }),
      [internalEventManager],
    );

    const animatedOpacityStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
      };
    }, [opacity]);

    const animatedActionSheetStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: translateY.value,
          },
        ],
        opacity: actionSheetOpacity.value,
      };
    }, [translateY]);

    const baseTopLeftRadius =
      (containerStyle?.borderTopLeftRadius as number) || 10;
    const baseTopRightRadius =
      (containerStyle?.borderTopRightRadius as number) || 10;

    // Flatten the top corners as the sheet reaches full screen (iOS-style).
    const animatedCornerStyle = useAnimatedStyle(() => {
      const progress = fullscreenProgress.value;
      return {
        borderTopLeftRadius: interpolate(
          progress,
          [0, 1],
          [baseTopLeftRadius, 0],
          Extrapolation.CLAMP,
        ),
        borderTopRightRadius: interpolate(
          progress,
          [0, 1],
          [baseTopRightRadius, 0],
          Extrapolation.CLAMP,
        ),
      };
    }, [baseTopLeftRadius, baseTopRightRadius]);

    // Reveals the flat fill that continues the sheet surface up behind the status
    // bar. It rides along with the sheet, so it's kept invisible until the sheet
    // is almost at the top, then fades in over the last stretch — reading as the
    // surface snapping flush to the top rather than a strip floating up.
    const animatedStatusBarFillStyle = useAnimatedStyle(() => {
      return {
        opacity: interpolate(
          fullscreenProgress.value,
          [0.5, 1],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      };
    }, []);

    // Legacy web uses PanResponder (panHandlers spread on the View). Every other
    // case — the worklet path on any platform (incl. web), or the legacy native
    // path — uses a GestureDetector.
    const isPanResponderGesture = !useWorkletGestures && Platform.OS === 'web';
    const GestureWrapper = isPanResponderGesture ? Fragment : GestureDetector;

    return (
      <>
        {visible ? (
          <Root {...rootProps}>
            <GestureHandlerRoot
              isModal={isModal}
              style={styles.parentContainer}
              pointerEvents={
                props?.backgroundInteractionEnabled ? 'box-none' : 'auto'
              }>
              <PanGestureRefContext.Provider value={context}>
                <WorkletScrollContext.Provider value={workletScrollContext}>
                  <DraggableNodesContext.Provider value={draggableNodesContext}>
                  <Animated.View
                    onLayout={event => {
                      onRootLayout(
                        event.nativeEvent.layout.width,
                        event.nativeEvent.layout.height,
                      );
                    }}
                    ref={rootViewContainerRef}
                    pointerEvents={
                      props?.backgroundInteractionEnabled ? 'box-none' : 'auto'
                    }
                    style={[
                      styles.parentContainer,
                      {
                        width: '100%',
                        justifyContent: 'flex-end',
                      },
                    ]}>
                    <>
                      {!props?.backgroundInteractionEnabled ? (
                        <AnimatedPressable
                          onPress={onTouch}
                          testID={props.testIDs?.backdrop}
                          style={[
                            {
                              height: dimensions.height + insets.top + 100,
                              width: '100%',
                              position: 'absolute',
                              backgroundColor: overlayColor,
                            },
                            animatedOpacityStyle,
                          ]}
                          {...(props.backdropProps ? props.backdropProps : {})}
                        />
                      ) : null}

                      {dimensions.height === -1 &&
                      Platform.OS === 'web' ? null : (
                        <Animated.View
                          pointerEvents="box-none"
                          style={[
                            {
                              borderTopRightRadius:
                                containerStyle?.borderTopRightRadius || 10,
                              borderTopLeftRadius:
                                containerStyle?.borderTopLeftRadius || 10,
                              backgroundColor:
                                containerStyle?.backgroundColor || 'white',
                              borderBottomLeftRadius:
                                containerStyle?.borderBottomLeftRadius ||
                                undefined,
                              borderBottomRightRadius:
                                containerStyle?.borderBottomRightRadius ||
                                undefined,
                              borderRadius:
                                containerStyle?.borderRadius || undefined,
                              width: containerStyle?.width || '100%',
                              maxWidth: containerStyle?.maxWidth,
                              ...(!disableElevation
                                ? getElevation(
                                    typeof elevation === 'number'
                                      ? elevation
                                      : 5,
                                  )
                                : {}),
                              height: dimensions.height,
                              maxHeight: dimensions.height,
                            },
                            animatedActionSheetStyle,
                            drawUnderStatusBar ? animatedCornerStyle : undefined,
                          ]}>
                          <GestureWrapper
                            {...(isPanResponderGesture
                              ? ({} as any)
                              : {
                                  gesture: activeGesture as PanGesture,
                                })}>
                            <Animated.View
                              {...(isPanResponderGesture
                                ? (activeGesture as any)?.panHandlers || {}
                                : {})}
                              onLayout={event =>
                                onSheetLayout(event.nativeEvent.layout.height)
                              }
                              ref={panViewRef}
                              testID={props.testIDs?.sheet}
                              style={[
                                styles.container,
                                {
                                  borderTopRightRadius: 10,
                                  borderTopLeftRadius: 10,
                                },
                                props.containerStyle,
                                {
                                  maxHeight: keyboard.keyboardShown
                                    ? dimensions.height -
                                      insets.top -
                                      keyboard.keyboardHeight
                                    : dimensions.height - insets.top,
                                  paddingBottom:
                                    (Platform.OS === 'ios' &&
                                      keyboard.keyboardShown) ||
                                    !useBottomSafeAreaPadding
                                      ? 0
                                      : insets.bottom,
                                },
                              ]}>
                              {drawUnderStatusBar && insets.top > 0 ? (
                                <Animated.View
                                  pointerEvents="none"
                                  style={[
                                    {
                                      position: 'absolute',
                                      top: -insets.top,
                                      left: 0,
                                      right: 0,
                                      // Overlap 1px into the sheet to avoid a
                                      // hairline seam at the join.
                                      height: insets.top + 1,
                                      backgroundColor:
                                        containerStyle?.backgroundColor ||
                                        'white',
                                    },
                                    animatedStatusBarFillStyle,
                                  ]}
                                />
                              ) : null}
                              {gestureEnabled || props.headerAlwaysVisible ? (
                                props.CustomHeaderComponent ? (
                                  props.CustomHeaderComponent
                                ) : (
                                  <Animated.View
                                    style={[
                                      styles.indicator,
                                      props.indicatorStyle,
                                    ]}
                                  />
                                )
                              ) : null}

                              {router?.hasRoutes() ? (
                                <RouterContext.Provider value={router}>
                                  {router?.stack.map(renderRoute)}
                                </RouterContext.Provider>
                              ) : (
                                props?.children
                              )}
                            </Animated.View>
                          </GestureWrapper>

                          {overdrawEnabled ? (
                            <Animated.View
                              style={{
                                position: 'absolute',
                                height: overdrawSize,
                                bottom: -overdrawSize,
                                backgroundColor:
                                  containerStyle?.backgroundColor || 'white',
                                width:
                                  containerStyle?.width || dimensions.width,
                              }}
                            />
                          ) : null}
                        </Animated.View>
                      )}

                      {ExtraOverlayComponent}
                      {props.withNestedSheetProvider}
                      {sheetId ? (
                        <SheetProvider
                          context={providerId.current}
                        />
                      ) : null}
                    </>
                  </Animated.View>
                  </DraggableNodesContext.Provider>
                </WorkletScrollContext.Provider>
              </PanGestureRefContext.Provider>
            </GestureHandlerRoot>
          </Root>
        ) : null}
      </>
    );
  },
);

const GestureHandlerRoot = (props: any) => {
  return props.isModal ? (
    <GestureHandlerRootView
      style={props.style}
      pointerEvents={props.pointerEvents}>
      {props.children}
    </GestureHandlerRootView>
  ) : (
    <>{props.children}</>
  );
};
