import {
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

export function Button(
  props: PressableProps & {
    btnTitleStyle?: TextStyle;
    title: string;
  },
) {
  return (
    <Pressable
      {...props}
      style={[
        {
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: 'black',
          paddingHorizontal: 10,
          borderRadius: 10,
          elevation: 5,
          ...(Platform.OS === 'android'
            ? null
            : {boxShadow: '0px 2px 2.8px rgba(0, 0, 0, 0.2)'}),
          width: '100%',
          marginBottom: 10,
        },
        props.style as StyleProp<ViewStyle>,
      ]}>
      <Text
        style={[
          {
            color: 'white',
            fontWeight: 'bold',
          },
          props.btnTitleStyle,
        ]}>
        {props.title}
      </Text>
    </Pressable>
  );
}
