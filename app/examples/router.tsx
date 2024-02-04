import React from 'react';
import {Text, View} from 'react-native';
import ActionSheet, {
  Route,
  useSheetRouteParams,
  useSheetRouter,
} from 'react-native-actions-sheet';
import {Button} from '../components/button';

const RouteA = () => {
  const router = useSheetRouter('sheet-router');
  return (
    <View
      style={{
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: 10,
      }}>
      <Text
        style={{
          marginBottom: 10,
          color: 'black',
          fontSize: 20,
          textAlign: 'center',
        }}>
        Route A
      </Text>
      <Button
        title="Go to Route B"
        onPress={() => {
          router.navigate('route-b', {param: 'value'});
        }}
      />
    </View>
  );
};

const RouteB = () => {
  const router = useSheetRouter('sheet-router');
  const params = useSheetRouteParams('sheet-router', 'route-b');
  console.log('route-b', 'params', params);

  return (
    <View
      style={{
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: 10,
      }}>
      <Text
        style={{
          marginBottom: 10,
          color: 'black',
          fontSize: 20,
          textAlign: 'center',
        }}>
        Route B
      </Text>
      <Button
        title="Go Back"
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

function RouterSheet() {
  return (
    <ActionSheet
      gestureEnabled={true}
      containerStyle={{
        paddingHorizontal: 12,
      }}
      enableRouterBackNavigation={true}
      routes={routes}
      isModal={false}
      initialRoute="route-a"
      springOffset={50}
      defaultOverlayOpacity={0.3}
    />
  );
}

export default RouterSheet;
