import React from 'react';
import {
  ColorValue,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

type MenuButtonProps = {
  icon: string;
  title: string;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  color?: ColorValue | undefined;
};

function MenuButton({title, color, onPress}: MenuButtonProps) {
  return (
    <TouchableHighlight
      accessible={true}
      underlayColor={'rgba(0, 0, 0, 0.15)'}
      onPress={onPress}>
      <View style={styles.container}>
        <Text style={[styles.title, {color: color ?? '#1A212E'}]}>{title}</Text>
      </View>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
  },
  title: {
    fontSize: 16,
    marginLeft: 15,
    color: '#1A212E',
  },
});

export default MenuButton;
