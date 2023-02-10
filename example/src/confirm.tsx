import React from 'react';
import {Button, Text, View} from 'react-native';
import ActionSheet, {Route, RouteScreenProps, SheetProps} from '../../';

const RouteA = ({router}: RouteScreenProps) => {
  return (
    <View>
      <Text
        style={{
          marginBottom: 10,
          color: 'black',
          height: 500,
        }}>
        A
      </Text>
      <Button
        title="No"
        onPress={() => {
          router?.navigate('route-b', undefined, 1);
        }}
      />
    </View>
  );
};

const RouteB = ({router}: {router: any}) => {
  return (
    <View>
      <Text
        style={{
          marginBottom: 10,
          color: 'black',
          height: 100,
        }}>
        B
      </Text>
      <Button
        title="No"
        onPress={() => {
          router?.goBack(undefined, 10);
        }}
      />
    </View>
  );
};

const routes: Route[] = [
  {
    name: 'route-a',
    component: RouteA,
  },
  {
    name: 'route-b',
    component: RouteB,
  },
];

function ConfirmSheet(props: SheetProps) {
  return (
    <ActionSheet
      id={props.sheetId}
      statusBarTranslucent={false}
      drawUnderStatusBar={false}
      gestureEnabled={true}
      containerStyle={{
        paddingHorizontal: 12,
      }}
      onClose={data => {
        console.log(data, 'called');
      }}
      routes={routes}
      initialRoute="route-a"
      springOffset={50}
      defaultOverlayOpacity={0.3}
    />
  );
}

export default ConfirmSheet;
