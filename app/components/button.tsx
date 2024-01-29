import {Text, TextStyle, TouchableOpacity} from 'react-native';
import {TouchableOpacityProps} from 'react-native-gesture-handler';

export function Button(
  props: TouchableOpacityProps & {
    btnTitleStyle?: TextStyle;
    title: string;
  },
) {
  return (
    <TouchableOpacity
      {...props}
      style={[
        {
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: '#2563eb',
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
        props.style,
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
    </TouchableOpacity>
  );
}
