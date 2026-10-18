# SheetDefinition

Definition of a Sheet for intellisense when using `SheetManager` or `useSheetRouter` hook.

## `payload`

Data that a sheet can be accessed in a sheet with `useSheetPayload` hook when it is opened.

| Type | Required |
| ---- | -------- |
| any  | false    |

## `returnValue`

Data that a sheet must return when closed.

| Type | Required |
| ---- | -------- |
| any  | false    |

## `routes`

All the routes that this sheet will have.

| Type   | Required |
| ------ | -------- |
| object | false    |

```ts
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'example-sheet': SheetDefinition<{
      payload: string;
      returnValue: boolean;
      routes: {
        'route-1': RouteDefinition<{
          param: 'param';
        }>;
      };
    }>;
  }
}
```
