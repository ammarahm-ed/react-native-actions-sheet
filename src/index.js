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

const ActionSheet = ({
  children = <View />,
  animated = true,
  animationType = 'fade',
  closeOnPressBack = true,
  gestureEnabled = true,
  initialOffsetFromBottom = 0.5,
  customStyles = {},
  onClose = () => {},
  onOpen = () => {},
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [scrollable, setScrollable] = useState(false);
  let customComponentHeight;

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
    scrollTo(0);
    setTimeout(() => {
      setModalVisible(false);
      onClose();
    }, 50);
  };

  _showModal = event => {
    customComponentHeight = event.nativeEvent.layout.height;

    _scrollTo(
      gestureEnabled
        ? customComponentHeight * initialOffsetFromBottom
        : customComponentHeight,
    );
  };

  const _onScrollBeginDrag = event => {
    let verticalOffset = event.nativeEvent.contentOffset.y;
    prevScroll = verticalOffset;
  };

  const _onScrollEndDrag = event => {
    let verticalOffset = event.nativeEvent.contentOffset.y;

    if (prevScroll < verticalOffset) {
      if (verticalOffset - prevScroll > 50) {
        _scrollTo(customComponentHeight);
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
      <View style={styles.parentContainer}>
        <ScrollView
          bounces={false}
          ref={ref => (scrollViewRef = ref)}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollable}
          onScrollBeginDrag={_onScrollBeginDrag}
          onScrollEndDrag={_onScrollEndDrag}
          overScrollMode="always"
          style={styles.scrollview}>
          <View
            onTouchMove={_onTouchMove}
            onTouchStart={_onTouchStart}
            onTouchEnd={_onTouchEnd}
            style={{
              height: deviceHeight,
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
          <View onLayout={_showModal} style={[customStyles, styles.container]}>
            <View style={styles.indicator} />
            {children}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ActionSheet;
