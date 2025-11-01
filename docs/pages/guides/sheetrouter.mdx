# Using ActionSheet router

ActionSheet comes with a tiny router for navigation between different routes in an ActionSheet. This is useful for making different flows in your app without the need to open/close different ActionSheets.

You can say that using a router is like having one Sheet that can replace multiple Sheets in your app with routes.

Router works like any navigation router in your app.

```tsx
import ActionSheet, {
  Route,
  RouteScreenProps,
  useSheetRouter,
  useSheetRouteParams,
} from 'react-native-actions-sheet';

const RouteA = ({router}: RouteScreenProps<"sheet-with-router", "route-a">) => {
  return (
    <View>
      <Button
        title="Go to Route B"
        onPress={() => {
          router.navigate('route-b', {data: 'test'});
        }}
      />
    </View>
  );
};

const RouteB = () => {
  const router = useSheetRouter("sheet-with-router");
  const params = useSheetRouteParams("sheet-with-router", "route-b");

  return (
    <View>
      <Button
        title="Go Back to Route A"
        onPress={() => {
          router.goBack();
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

function SheetWithRouter(props: SheetProps) {
  return (
    <ActionSheet
      enableRouterBackNavigation={true}
      routes={routes}
      initialRoute="route-a"
    />
  );
}

export default SheetWithRouter;
```

Finally register the sheet along with routes in `sheets.tsx` file.

```ts
import {registerSheet} from 'react-native-actions-sheet';
import {SheetWithRouter} from './sheet-with-router';

registerSheet('sheet-with-router', SheetWithRouter);

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'sheet-with-router': SheetDefinition<{
      routes: {
        'route-a': RouteDefinition;
        // Route B with params.
        'route-b': RouteDefinition<{
          data: string
        }>;
      };
    }>;
  }
}
```
