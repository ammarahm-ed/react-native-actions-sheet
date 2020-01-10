import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import {styles} from './styles';
let scrollViewRef;
const deviceHeight = Dimensions.get('window').height;

const getElevation = elevation => {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: {width: 0.3 * elevation, height: 0.5 * elevation},
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation,
  };
};

const ActionSheet = ({
  children = <View />,
  animated = true,
  animationType = 'fade',
  closeOnPressBack = true,
  gestureEnabled = true,
  elevation = 5,
  initialOffsetFromBottom = 0.6,
  indicatorColor = 'gray',
  customStyles = {backgroundColor: 'white'},
  overlayColor = 'rgba(0,0,0,0.3)',
  onClose = () => {},
  onOpen = () => {},
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [scrollable, setScrollable] = useState(false);
  const [layoutHasCalled, setLayoutHasCalled] = useState(false);

  ActionSheet.customComponentHeight;
  ActionSheet.prevScroll;

  ActionSheet._setModalVisible = () => {
    if (!modalVisible) {
      setModalVisible(true);
      if (gestureEnabled) {
        setScrollable(true);
      }
    } else {
      _hideModal();
    }
  };

  _hideModal = () => {
    _scrollTo(0);
    setTimeout(() => {
      setLayoutHasCalled(false);
      setModalVisible(false);

      onClose();
    }, 150);
  };

  _showModal = event => {
    if (layoutHasCalled) {
      return;
    } else {
      ActionSheet.customComponentHeight = event.nativeEvent.layout.height;
      let addFactor = deviceHeight * 0.1;
      _scrollTo(
        gestureEnabled
          ? ActionSheet.customComponentHeight * initialOffsetFromBottom +
              addFactor
          : ActionSheet.customComponentHeight,
      );
      setLayoutHasCalled(true);
    }
  };

  const _onScrollBeginDrag = event => {
    let verticalOffset = event.nativeEvent.contentOffset.y;
    prevScroll = verticalOffset;
  };

  const _onScrollEndDrag = event => {
    let verticalOffset = event.nativeEvent.contentOffset.y;

    if (prevScroll < verticalOffset) {
      if (verticalOffset - prevScroll > 35) {
        let addFactor = deviceHeight * 0.1;
        _scrollTo(ActionSheet.customComponentHeight + addFactor);
      } else {
        _scrollTo(prevScroll);
      }
    } else {
      if (prevScroll - verticalOffset > 50) {
        _hideModal();
      } else {
        _scrollTo(prevScroll);
      }
    }
  };

  _scrollTo = y => {
    scrollViewRef.scrollTo({
      x: 0,
      y: y,
      animated: true,
    });
  };

  _onTouchMove = () => {
    setScrollable(false);
  };

  _onTouchStart = () => {
    setScrollable(false);
  };

  _onTouchEnd = () => {
    if (gestureEnabled) {
      setScrollable(true);
    }
  };

  return (
    <Modal
      visible={modalVisible}
      animationType={animationType}
      animated={animated}
      onShow={() => onOpen}
      onRequestClose={() => {
        if (closeOnPressBack) _hideModal();
      }}
      transparent={true}>
      <View style={[styles.parentContainer, {backgroundColor: overlayColor}]}>
        <ScrollView
          bounces={false}
          ref={ref => (scrollViewRef = ref)}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollable}
          onScrollBeginDrag={_onScrollBeginDrag}
          onScrollEndDrag={_onScrollEndDrag}
          onTouchEnd={_onTouchEnd}
          overScrollMode="always"
          style={[styles.scrollview]}>
          <View
            onTouchMove={_onTouchMove}
            onTouchStart={_onTouchStart}
            onTouchEnd={_onTouchEnd}
            style={{
              height: deviceHeight * 1.1,
              width: '100%',
            }}>
            <TouchableOpacity
              onPress={_hideModal}
              onLongPress={_hideModal}
              style={{
                height: deviceHeight,
                width: '100%',
              }}
            />
          </View>
          <View
            onLayout={_showModal}
            style={[styles.container, customStyles, {...getElevation(5)}]}>
            <View
              style={[styles.indicator, {backgroundColor: indicatorColor}]}
            />
            {children}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ActionSheet;
