# SheetProps

Default props on any action sheet component registered with `SheetProvider`.

## `sheetId`

Id of the current action sheet. It is assigned automatically when the sheet is registered with `registerSheet`.

## `payload`

Any data that has been passed to the action sheet when calling `SheetManager.show` can be accessed from here.

## `overrideProps`

Props passed to `SheetManager.show`/`SheetManager.update` via their `overrideProps` option. Forward these to the `ActionSheet` component to apply them.

```tsx
function ExampleSheet(props: SheetProps<"example-sheet">) {
  return (
    <ActionSheet id={props.sheetId} {...props.overrideProps}>
      <View>
        <Text>{props.payload?.title}</Text>
      </View>
    </ActionSheet>
  );
}
```

::: tip
  `sheetId` is assigned when calling `registerSheet` method. `payload` can be sent to
  the action sheet through `SheetManager.show` function. `payload` is recieved
  by the component before it is visible to the user therefore the action sheet
  always renders with the correct information.
:::
