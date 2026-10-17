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
  AccessibilityActionEvent,
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
  SheetPosition,
  SheetPositionContext,
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
import {getElevation, SUPPORTED_ORIENTATIONS, webOnlyDeps} from './utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Window over which layout events are coalesced before geometry is committed.
// Long enough to absorb multi-pass layout (e.g. Android modal), short enough to
// be invisible since the sheet is off-screen until the first commit.
const LAYOUT_SETTLE_MS = 32;

// Distance (px) over which the draw-under-status-bar effect blends in as the
// sheet's top approaches the top of the screen.
const STATUS_BAR_REVEAL_DISTANCE = 64;

// How far a release velocity (px/s) "throws" the sheet when picking the snap
// point to settle on. Higher = a flick carries further before snapping. Tuned to
// feel like a native scroll-view fling.
const VELOCITY_PROJECTION = 0.08;
export default forwardRef<ActionSheetRef, ActionSheetProps>(
  function ActionSheet(
    {
      animated = true,
      closeOnPressBack = true,
      springOffset = 50,
      elevation = 5,
      disableElevation = false,
      defaultOverlayOpacity = 0.3,
      dimBackdropOnDrag = true,
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
    // iOS only: the sheet tears down and animates away, but `onClose` and the
    // `SheetManager` promises must not run until the native Modal has actually
    // been dismissed. Otherwise a handler that presents a view controller
    // (camera, share sheet, alert) or pushes a native-stack modal runs while the
    // sheet's own Modal is still presented, and UIKit dismisses the wrong
    // controller or blocks. The work is parked here and run from the Modal's
    // `onDismiss`, with a timeout as a backstop so a promise can never hang.
    const pendingCloseNotify = useRef<null | (() => void)>(null);
    const closeNotifyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Keeps the Modal mounted while it dismisses: unmounting it in the same tick
    // can drop the native `onDismiss` event, so we flip `visible` to false first
    // (a real true -> false transition, which always reports) and unmount after.
    const [modalDismissing, setModalDismissing] = useState(false);
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
    // Container height, NOT adjusted for the keyboard — used for backdrop dimming
    // so the fade range doesn't shift when the keyboard opens/closes.
    const rootHeightSV = useSharedValue(0);
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
    // Normalized openness (0 closed -> 1 fully open) exposed via useSheetPosition.
    const sheetProgress = useDerivedValue(() => {
      const sheetHeight = actionSheetHeightSV.value;
      if (sheetHeight <= 0) return 0;
      const minT = minTranslateValueSV.value;
      return interpolate(
        translateY.value,
        [minT + sheetHeight, minT],
        [0, 1],
        Extrapolation.CLAMP,
      );
    });
    const sheetPosition = React.useMemo<SheetPosition>(
      () => ({
        y: translateY,
        height: actionSheetHeightSV,
        progress: sheetProgress,
      }),
      [translateY, actionSheetHeightSV, sheetProgress],
    );

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
    // Same treatment as the animated styles: the deps array is web-only. On
    // native Reanimated derives the inputs from the worklet closures, which
    // capture these same two callbacks, so the reaction still restarts when
    // either changes.
    const onChangeReactionDeps = webOnlyDeps([onChange, onChangeWorklet]);
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
      onChangeReactionDeps,
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
      rootHeightSV.value = rootViewHeight;

      // Cap the sheet to the space actually available. When the keyboard is up
      // this excludes the keyboard, so a stale (pre-keyboard, taller) measurement
      // can't compute an above-screen position before the view re-measures.
      const maxSheetHeight = keyboard.keyboardShown
        ? rootViewHeight - insets.top - keyboard.keyboardHeight
        : rootViewHeight;
      actionSheetHeight.current = Math.min(
        sheetHeight,
        Math.max(0, maxSheetHeight),
      );
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
        keyboard.keyboardShown &&
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
      insets.top,
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

    // Recompute the sheet position when the keyboard shows/hides. The sheet's
    // paddingBottom / maxHeight change with the keyboard, so the last onLayout
    // height can lag the new keyboard state; repositioning from a stale (still
    // bottom-padded) height would align the padded edge to the keyboard instead
    // of the content edge. Measure the sheet fresh (after the re-layout has
    // committed) and reposition from that.
    useEffect(() => {
      if (!visibleRef.current.value) return undefined;
      const raf = requestAnimationFrame(() => {
        const node = panViewRef.current as unknown as {
          measure?: (
            cb: (
              x: number,
              y: number,
              w: number,
              h: number,
            ) => void,
          ) => void;
        } | null;
        if (node?.measure) {
          node.measure((_x, _y, _w, h) => {
            if (h > 0) sheetHeightRef.current = h;
            scheduleLayout();
          });
        } else {
          scheduleLayout();
        }
      });
      return () => cancelAnimationFrame(raf);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keyboard.keyboardShown, keyboard.keyboardHeight]);

    /**
     * Runs a parked close notification exactly once, and cancels its backstop.
     */
    const runPendingCloseNotify = React.useCallback(() => {
      if (closeNotifyTimeout.current) {
        clearTimeout(closeNotifyTimeout.current);
        closeNotifyTimeout.current = null;
      }
      const notify = pendingCloseNotify.current;
      pendingCloseNotify.current = null;
      notify?.();
    }, []);

    /**
     * iOS Modal only. Fires once the sheet's view controller is really gone, so
     * `onClose` handlers are free to present another one.
     */
    const onModalDismiss = React.useCallback(() => {
      setModalDismissing(false);
      runPendingCloseNotify();
      setVisible(false);
    }, [runPendingCloseNotify, setVisible]);

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
            // Teardown runs now, as it always did: the sheet is gone from the
            // provider stack, its snap/translate state is reset, and the ref
            // reports closed.
            const providerIndex = providerRegistryStack.indexOf(providerId.current);
            if (providerIndex > -1) {
              providerRegistryStack.splice(providerIndex, 1);
            }
            visibleRef.current.value = false;
            setCurrentSnapIndex(initialSnapIndex);
            closing.current = false;
            setInitialValue(-1);
            actionSheetOpacity.value = 0;
            translateY.value = Dimensions.get('window').height * 2;
            keyboard.reset();

            // Notification is separate: it is what resolves `SheetManager`'s
            // promises and runs the app's `onClose`.
            const notify = () => {
              const closeData = data || returnValueRef.current || data;
              props.onClose?.(closeData as never);
              hardwareBackPressEvent.current?.remove();
              if (sheetId) {
                SheetManager.remove(sheetId, currentContext);
                actionSheetEventManager.publish(
                  `onclose_${sheetId}`,
                  closeData,
                  currentContext || 'global',
                );
              }
              hiding.current = false;
            };

            if (
              Platform.OS === 'ios' &&
              isModal &&
              !props.backgroundInteractionEnabled
            ) {
              // Hold the notification until the native Modal is dismissed, so a
              // handler may present a view controller or navigate safely.
              pendingCloseNotify.current = notify;
              setModalDismissing(true);
              closeNotifyTimeout.current = setTimeout(() => {
                // `onDismiss` never arrived; never leave a promise hanging.
                runPendingCloseNotify();
                setVisible(false);
              }, 500);
            } else {
              notify();
              setVisible(false);
            }
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
        props.backgroundInteractionEnabled,
        moveSheetWithAnimation,
        keyboard,
        setVisible,
        isModal,
        runPendingCloseNotify,
      ],
    );

    // Reopening while a close is still being handed off to the native Modal
    // (iOS): flush the parked notification so the previous close's promises
    // resolve, then present again.
    React.useEffect(() => {
      if (visible) {
        setModalDismissing(false);
        runPendingCloseNotify();
      }
    }, [visible, runPendingCloseNotify]);

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

    // Settles a worklet-driven drag to a target snap index (chosen by velocity
    // projection in the gesture's onEnd) or closes the sheet. Runs once on the JS
    // thread at release — not per frame. The target already accounts for fling
    // velocity, so the spring itself uses a gentle velocity (no double-counting,
    // no overdraw over-spring).
    const handleGestureSettle = React.useCallback(
      (targetIndex: number, shouldClose: boolean) => {
        if (!gestureEnabled) return;
        if (shouldClose && closable) {
          setInitialValue(dimensionsRef.current.height * 1.3);
          hideSheet(undefined, undefined, false, true);
          return;
        }
        const target = getNextPosition(targetIndex);
        setCurrentSnapIndex(targetIndex);
        setInitialValue(target);
        moveSheetWithAnimation(1, target, undefined, true);
      },
      [
        gestureEnabled,
        closable,
        hideSheet,
        getNextPosition,
        setCurrentSnapIndex,
        setInitialValue,
        moveSheetWithAnimation,
      ],
    );

    const panGesture = React.useMemo(() => {
      let prevDeltaY = 0;
      let deltaYOnGestureStart = 0;
      let velocity = 0;
      let start:
        | {
            x: number;
            y: number;
          }
        | undefined;
      let oldValue = 0;
      let isRefreshing = false;
      const offsets: number[] = [];

      function scrollable(value: boolean) {
        for (let i = 0; i < draggableNodes.current.length; i++) {
          const node = draggableNodes.current[i];
          // A gesture-blocking region is not a scrollable: there is nothing to
          // pin, and writing `scrollTop` to it would be meaningless.
          if (node.handlerConfig?.blocksGesture) continue;
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

      /**
       * Set on touchstart: the touch began inside a gesture-blocking region
       * (`SheetGestureBlocker`), which owns the gesture. The decision is made
       * once, where the gesture began, never where the finger has travelled to
       * since — that is exactly how the worklet engine resolves a region too.
       */
      let blockedTouchStart = false;

      /**
       * Web only — blocking regions are measured straight from the DOM rather
       * than from the registry's cached rect, which is refreshed on a debounced
       * timer after the sheet moves and is therefore routinely stale. A stale
       * rect is precisely what a region decision cannot tolerate: mid-drag the
       * finger would be tested against where the region used to be. There are
       * only ever a handful of regions, and this runs once per touch.
       */
      const isBlockedAt = (absoluteX: number, absoluteY: number) => {
        if (Platform.OS !== 'web') return false;
        for (const node of draggableNodes.current) {
          if (!node.handlerConfig?.blocksGesture) continue;
          const rect = (
            resolveScrollRef(node.ref) as HTMLElement | null
          )?.getBoundingClientRect?.();
          if (!rect) continue;
          if (
            absoluteX > rect.left &&
            absoluteY > rect.top &&
            absoluteX < rect.right &&
            absoluteY < rect.bottom
          ) {
            return true;
          }
        }
        return false;
      };

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

              if (blockedTouchStart) {
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
              blockedTouchStart = isBlockedAt(
                _event.nativeEvent.pageX,
                _event.nativeEvent.pageY,
              );
              if (blockedTouchStart) {
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
            onPanResponderGrant: () => {
              // `start` is the point the drag-vs-scroll decision is made against
              // and `prevDeltaY` is that decision's last movement delta; both are
              // per-gesture state that `onChange` only ever sets. Without clearing
              // them here the origin of the session's first touch (usually a list)
              // keeps deciding every later drag, so scrolling a list once would
              // leave the sheet hard to drag from anywhere for the rest of the
              // session. Web only — native's Gesture.Pan path is untouched.
              start = undefined;
              prevDeltaY = 0;
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
            // Passed wrapped, like `onChange` above: with the Worklets Babel
            // plugin in bundle mode each callback is extracted into its own
            // worklet file and its closure serialized, and `onEnd` writes to
            // closure state that only exists on the JS side. Handing the
            // function to `.onEnd` directly makes the extracted worklet *be*
            // `onEnd`, which crashes there; a thin arrow wrapper keeps the real
            // function on the JS thread (`runOnJS(true)` is set above).
            .onEnd(() => onEnd());
    }, [gestureEnabled]);

    // Fully worklet-driven pan gesture. Per-frame drag and scroll<->drag
    // arbitration run on the UI thread; only the snap decision at release hops
    // to JS (once) via handleGestureSettle.
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
      const springOffsetC = springOffset;
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
        // Whether this pan instance has claimed the gesture already. A handler
        // that is mid-drag must not be failed by an extra finger landing in a
        // blocking region.
        activated: false,
      };

      /**
       * Whether the point falls inside a gesture-blocking region
       * (`SheetGestureBlocker` / `useSheetGestureRegion`). Regions are measured
       * live on the UI thread, so the result tracks the sheet as it moves.
       */
      const beginsInBlockingRegion = (x: number, y: number) => {
        'worklet';
        for (let i = 0; i < regions.length; i++) {
          const region = regions[i];
          if (region.kind !== 'ignore') continue;
          const m = measure(region.animatedRef);
          if (!m) continue;
          if (
            x >= m.pageX &&
            x <= m.pageX + m.width &&
            y >= m.pageY &&
            y <= m.pageY + m.height
          ) {
            return true;
          }
        }
        return false;
      };

      return Gesture.Pan()
        .withRef(panGestureRef)
        // A touch that begins inside a blocking region belongs to the view under
        // the finger (an inner ScrollView, slider, canvas, ...), not to the
        // sheet. Deciding that in `onBegin` is too late: once this pan activates,
        // Android cancels the child's touch stream, so an inner scrollable stops
        // scrolling and the sheet's behaviour depends on which of the two wins
        // the activation race. Failing the handler on touch-down hands the whole
        // gesture to the child — the sheet cannot move, and the child works.
        .onTouchesDown((event, state) => {
          'worklet';
          if (!gestureEnabled || ctx.activated) return;
          const touches = event.changedTouches;
          for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            if (beginsInBlockingRegion(touch.absoluteX, touch.absoluteY)) {
              state.fail();
              return;
            }
          }
        })
        .onStart(() => {
          'worklet';
          ctx.activated = true;
        })
        .onFinalize(() => {
          'worklet';
          ctx.activated = false;
        })
        .onBegin(event => {
          'worklet';
          ctx.activeKind = 0;
          ctx.activeIndex = -1;
          ctx.hasRefresh = false;
          ctx.refreshBoundaryY = 0;
          ctx.dragging = false;

          // Safety net for a region that only became measurable after touch-down
          // (`onTouchesDown` already failed the gesture for the normal case).
          if (beginsInBlockingRegion(event.absoluteX, event.absoluteY)) {
            ctx.activeKind = 2;
            return;
          }

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
            if (region.kind !== 'scroll') continue;
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

          // Project where the sheet would coast to given the release velocity,
          // then settle on the nearest snap point. This is what makes a quick
          // flick carry to the next detent (or dismiss) rather than depending
          // only on how far the finger travelled.
          const projected = translateY.value + event.velocityY * VELOCITY_PROJECTION;
          const sheetHeight = actionSheetHeightSV.value;
          const minT = minTranslateValueSV.value;
          const points = snapPointsSV.value;

          let bestIndex = 0;
          let bestDistance = Number.MAX_VALUE;
          let lowestOffset = 0;
          for (let i = 0; i < points.length; i++) {
            const offset = sheetHeight + minT - (sheetHeight * points[i]) / 100;
            if (i === 0) lowestOffset = offset;
            const distance = Math.abs(projected - offset);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestIndex = i;
            }
          }

          // Close when the throw carries past the lowest snap by more than the
          // spring-back threshold (index 0 is the lowest / most-closed position).
          const shouldClose =
            closableC &&
            bestIndex === 0 &&
            projected - lowestOffset > springOffsetC;

          runOnJS(handleGestureSettle)(bestIndex, shouldClose);
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
      springOffset,
      handleGestureSettle,
      registryVersion,
    ]);

    // Worklet gesture engine is the default on native. `legacyGestures` (or
    // explicitly `experimentalWorkletGestures={false}`) opts back into the
    // pre-v11 PanResponder/JS gesture path.
    //
    // Web always uses the PanResponder path. RNGH's `GestureDetector` on web is
    // driven purely by pointer events, and the browser fires `pointercancel` on
    // that pointer as soon as a touch inside a nested scrollable is claimed for
    // scrolling. RNGH installs no touch-event fallback, so the pan is dead for
    // the rest of the gesture and can never arbitrate with the scrollable: the
    // sheet no longer expands before the list starts scrolling, and a scroll
    // that reverses into a downward drag can no longer close the sheet.
    // `PanResponder` runs off touch events, which do survive the browser
    // claiming the gesture, and worklets execute on the main thread on web
    // anyway, so the worklet engine buys nothing there.
    const useWorkletGestures =
      Platform.OS !== 'web' && !legacyGestures && experimentalWorkletGestures;
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

    // Screen-reader "adjustable" actions on the grabber: swipe up/down to move
    // between snap points.
    const onGrabberAccessibilityAction = React.useCallback(
      (event: AccessibilityActionEvent) => {
        if (event.nativeEvent.actionName === 'increment') {
          snapForward(1, false);
        } else if (event.nativeEvent.actionName === 'decrement') {
          snapBackward(1, false);
        }
      },
      [snapForward, snapBackward],
    );

    const grabberAccessibilityProps =
      gestureEnabled && snapPoints.length > 1
        ? {
            accessible: true,
            accessibilityRole: 'adjustable' as const,
            accessibilityLabel:
              props.accessibilityLabels?.grabber ?? 'Sheet position',
            accessibilityActions: [
              {name: 'increment'},
              {name: 'decrement'},
            ],
            onAccessibilityAction: onGrabberAccessibilityAction,
          }
        : undefined;

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
        // NOTE: open state is read through `visibleRef.current`, not `visible`,
        // so `visible` is intentionally not a dependency (keeps the ref stable
        // across open/close).
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
              // Kept mounted while it dismisses so `onDismiss` is delivered;
              // the sheet unmounts from the handler below.
              visible: !modalDismissing,
              onDismiss: onModalDismiss,
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
                // `pointerEvents` is a style on RN-web 0.21 (the prop is
                // deprecated) and works as a style on native since 0.71.
                pointerEvents: props?.backgroundInteractionEnabled
                  ? 'box-none'
                  : 'auto',
              },
            },
      [
        currentContext,
        isModal,
        modalDismissing,
        onHardwareBackPress,
        onModalDismiss,
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

    // Backdrop opacity follows the sheet: full at any snap point, fading toward 0
    // only as the sheet is dragged below the lowest snap toward dismissal. The
    // `opacity` envelope still drives the open/close fade; this multiplies it by a
    // drag-progress factor.
    const animatedOpacityStyleDeps = webOnlyDeps([opacity, dimBackdropOnDrag]);
    const animatedOpacityStyle = useAnimatedStyle(() => {
      if (!dimBackdropOnDrag) return {opacity: opacity.value};
      const sheetHeight = actionSheetHeightSV.value;
      const rootHeight = rootHeightSV.value;
      const points = snapPointsSV.value;
      if (sheetHeight <= 0 || rootHeight <= 0 || points.length === 0) {
        return {opacity: opacity.value};
      }
      // Fade range is keyboard-independent (uses rootHeight, not the
      // keyboard-adjusted minTranslate): full at/above the lowest snap, fading to
      // 0 as dragged toward the bottom. This keeps the backdrop steady when the
      // sheet shifts up/down for the keyboard.
      const lowest = rootHeight - (sheetHeight * points[0]) / 100;
      const progress = interpolate(
        translateY.value,
        [lowest, rootHeight],
        [1, 0],
        Extrapolation.CLAMP,
      );
      return {opacity: opacity.value * progress};
    }, animatedOpacityStyleDeps);

    const animatedActionSheetStyleDeps = webOnlyDeps([translateY]);
    const animatedActionSheetStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: translateY.value,
          },
        ],
        opacity: actionSheetOpacity.value,
      };
    }, animatedActionSheetStyleDeps);

    const baseTopLeftRadius =
      (containerStyle?.borderTopLeftRadius as number) || 10;
    const baseTopRightRadius =
      (containerStyle?.borderTopRightRadius as number) || 10;

    // Flatten the top corners as the sheet reaches full screen (iOS-style).
    const animatedCornerStyleDeps = webOnlyDeps([
      baseTopLeftRadius,
      baseTopRightRadius,
    ]);
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
    }, animatedCornerStyleDeps);

    // Reveals the flat fill that continues the sheet surface up behind the status
    // bar. It rides along with the sheet, so it's kept invisible until the sheet
    // is almost at the top, then fades in over the last stretch — reading as the
    // surface snapping flush to the top rather than a strip floating up.
    const animatedStatusBarFillStyleDeps = webOnlyDeps([]);
    const animatedStatusBarFillStyle = useAnimatedStyle(() => {
      return {
        opacity: interpolate(
          fullscreenProgress.value,
          [0.5, 1],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      };
    }, animatedStatusBarFillStyleDeps);

    // Web always uses PanResponder (panHandlers spread on the View) — see the
    // engine selection above. Native uses a GestureDetector, whether it is
    // running the worklet pan gesture or the legacy one.
    const isPanResponderGesture = !useWorkletGestures && Platform.OS === 'web';
    const GestureWrapper = isPanResponderGesture ? Fragment : GestureDetector;

    return (
      <>
        {visible ? (
          <Root {...rootProps}>
            <GestureHandlerRoot
              isModal={isModal}
              style={[
                styles.parentContainer,
                {
                  pointerEvents: props?.backgroundInteractionEnabled
                    ? 'box-none'
                    : 'auto',
                },
              ]}>
              <PanGestureRefContext.Provider value={context}>
                <SheetPositionContext.Provider value={sheetPosition}>
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
                    style={[
                      styles.parentContainer,
                      {
                        width: '100%',
                        justifyContent: 'flex-end',
                        pointerEvents: props?.backgroundInteractionEnabled
                          ? 'box-none'
                          : 'auto',
                      },
                    ]}>
                    <>
                      {!props?.backgroundInteractionEnabled ? (
                        <AnimatedPressable
                          onPress={onTouch}
                          testID={props.testIDs?.backdrop}
                          // Expose the backdrop as a close button to screen
                          // readers only when tapping it actually closes.
                          accessible={closeOnTouchBackdrop && closable}
                          accessibilityRole="button"
                          accessibilityLabel={
                            props.accessibilityLabels?.backdrop ?? 'Close'
                          }
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
                          // Treat the sheet as modal for screen readers and let
                          // the VoiceOver/TalkBack escape gesture dismiss it.
                          accessibilityViewIsModal={
                            isModal && !props?.backgroundInteractionEnabled
                          }
                          onAccessibilityEscape={onModalRequestClose}
                          style={[
                            {pointerEvents: 'box-none'},
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
                                  style={[
                                    {
                                      position: 'absolute',
                                      top: -insets.top,
                                      left: 0,
                                      right: 0,
                                      pointerEvents: 'none',
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
                                    {...grabberAccessibilityProps}
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
                </SheetPositionContext.Provider>
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
    // `pointerEvents` arrives inside `style` (see the call site): the prop is
    // deprecated on RN-web 0.21 and the style form works on native too.
    <GestureHandlerRootView style={props.style}>
      {props.children}
    </GestureHandlerRootView>
  ) : (
    <>{props.children}</>
  );
};
