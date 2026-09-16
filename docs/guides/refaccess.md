# Ref access from anywhere

You can access the [`ActionSheetRef`](/reference/actionsheetref) from anywhere in the app using [`SheetManager`](/reference/sheetmanager). This will return the topmost action sheet with the given id if multiple are open.

```ts
SheetManager.get('example-sheet').current?.snapToOffset(50);
```

You can also get ref of an action sheet in a specific `SheetProvider`.

```ts
SheetManager.get('example-sheet', 'local-context').current?.snapToOffset(50);
```

# Ref access in components

In components, ref can be accessed with [`useSheetRef`](/reference/usesheetref) hook or the `ref` prop on the `ActionSheet`. Both return a `RefObject`, so call methods through `.current`.

```ts
const ref = useSheetRef("example-sheet");

ref.current?.snapToOffset(50);
ref.current?.hide();
```
