import React, { Component } from "react";
import { Animated, EmitterSubscription, KeyboardEvent, LayoutChangeEvent, NativeEventSubscription, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import type { ActionSheetProps } from "./types";
declare type State = {
    modalVisible: boolean;
    scrollable: boolean;
    layoutHasCalled: boolean;
    keyboard: boolean;
    deviceHeight: number;
    deviceWidth: number;
    portrait: boolean;
    safeAreaInnerHeight: number;
    paddingTop: number;
    keyboardPadding: number;
};
declare const defaultProps: {
    animated: boolean;
    closeOnPressBack: boolean;
    bounciness: number;
    extraScroll: number;
    closeAnimationDuration: number;
    delayActionSheetDrawTime: number;
    openAnimationSpeed: number;
    springOffset: number;
    elevation: number;
    initialOffsetFromBottom: number;
    indicatorColor: string;
    defaultOverlayOpacity: number;
    overlayColor: string;
    closable: boolean;
    bottomOffset: number;
    closeOnTouchBackdrop: boolean;
    drawUnderStatusBar: boolean;
    statusBarTranslucent: boolean;
    gestureEnabled: boolean;
    keyboardDismissMode: string;
    keyboardHandlerEnabled: boolean;
    isModal: boolean;
};
declare type Props = Partial<typeof defaultProps> & ActionSheetProps;
export default class ActionSheet extends Component<Props, State, any> {
    static defaultProps: {
        animated: boolean;
        closeOnPressBack: boolean;
        bounciness: number;
        extraScroll: number;
        closeAnimationDuration: number;
        delayActionSheetDrawTime: number;
        openAnimationSpeed: number;
        springOffset: number;
        elevation: number;
        initialOffsetFromBottom: number;
        indicatorColor: string;
        defaultOverlayOpacity: number;
        overlayColor: string;
        closable: boolean;
        bottomOffset: number;
        closeOnTouchBackdrop: boolean;
        drawUnderStatusBar: boolean;
        statusBarTranslucent: boolean;
        gestureEnabled: boolean;
        keyboardDismissMode: string;
        keyboardHandlerEnabled: boolean;
        isModal: boolean;
    };
    actionSheetHeight: number;
    prevScroll: number;
    timeout: any;
    offsetY: number;
    currentOffsetFromBottom: number;
    scrollAnimationEndValue: number;
    hasBounced: boolean;
    layoutHasCalled: boolean;
    isClosing: boolean;
    isRecoiling: boolean;
    isReachedTop: boolean;
    deviceLayoutCalled: boolean;
    scrollViewRef: React.RefObject<any>;
    safeAreaViewRef: React.RefObject<any>;
    transformValue: Animated.Value;
    opacityValue: Animated.Value;
    borderRadius: Animated.Value;
    underlayTranslateY: Animated.Value;
    underlayScale: Animated.Value;
    indicatorTranslateY: Animated.Value;
    initialScrolling: boolean;
    sheetManagerHideEvent: (() => void) | null;
    sheetManagerShowEvent: (() => void) | null;
    keyboardShowSubscription: EmitterSubscription | null;
    KeyboardHideSubscription: EmitterSubscription | null;
    hardwareBackPressEvent: NativeEventSubscription | null;
    constructor(props: ActionSheetProps);
    /**
     * Snap ActionSheet to given offset.
     */
    snapToOffset: (offset: number) => void;
    /**
     * Show the ActionSheet
     */
    show: () => void;
    /**
     * Hide the ActionSheet
     */
    hide: () => void;
    /**
     * Open/Close the ActionSheet
     */
    setModalVisible: (visible?: boolean | undefined) => void;
    _hideAnimation(data: unknown): void;
    _hideModal: (data?: unknown) => void;
    measure: () => Promise<number>;
    _showModal: (event: LayoutChangeEvent) => Promise<void>;
    _openAnimation: (scrollOffset: number) => void;
    _onScrollBegin: (_event: NativeSyntheticEvent<NativeScrollEvent>) => Promise<void>;
    _onScrollBeginDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => Promise<void>;
    _applyHeightLimiter(): void;
    _onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => Promise<void>;
    updateActionSheetPosition(scrollPosition: number): void;
    _returnToPrevScrollPosition(height: number): void;
    _scrollTo: (y: number, animated?: boolean) => void;
    _onTouchMove: () => void;
    _onTouchStart: () => void;
    _onTouchEnd: () => void;
    _onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    _onRequestClose: () => void;
    _onTouchBackdrop: () => void;
    onSheetManagerShow: (data?: unknown) => void;
    onSheetMangerHide: (data?: unknown) => void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    _onKeyboardShow: (event: KeyboardEvent) => void;
    _onKeyboardHide: () => void;
    /**
     * Attach this to any child ScrollView Component's onScrollEndDrag,
     * onMomentumScrollEnd,onScrollAnimationEnd callbacks to handle the ActionSheet
     * closing and bouncing back properly.
     */
    handleChildScrollEnd: () => Promise<void>;
    _onDeviceLayout: (_event: LayoutChangeEvent) => Promise<void>;
    getScrollPositionFromOffset(offset: number, correction: number): number;
    getInitialScrollPosition(): number;
    _keyExtractor: (item: string) => string;
    onHardwareBackPress: () => boolean;
    render(): JSX.Element | null;
}
export {};
//# sourceMappingURL=index.d.ts.map