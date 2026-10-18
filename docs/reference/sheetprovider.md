# SheetProvider props

`SheetProvider` wraps your app and is responsible for rendering all the action sheets.

Props:

## `context`

When you want to show action sheet from a modal, you must create a new `SheetProvider` inside the modal with a unique context id. Then you have to register the action sheet you want to show with that context id.

```ts
// Register an action sheet. It becomes available in every SheetProvider.
registerSheet("example-sheet", ExampleSheet);
```

::: tip
  A sheet registered with `registerSheet` is available to be shown in any
  `SheetProvider`. Which provider actually renders it is decided at
  `SheetManager.show` time via the `context` option — you no longer pass a list
  of contexts to `registerSheet` (any extra context arguments are a no-op and
  deprecated).
:::

::: tip
  Using the `SheetProvider` is optional. However it is the recommended way to
  handle action sheets in your app.
:::
