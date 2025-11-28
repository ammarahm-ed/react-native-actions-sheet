import {
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
          shadowColor: 'black',
          shadowOffset: {width: 0.3 * 4, height: 0.5 * 4},
          shadowOpacity: 0.2,
          shadowRadius: 0.7 * 4,
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
