# registerSheet

A function used to register an `ActionSheet` with `SheetProvider`.

Parameters:

`id`

Id for the sheet. It should be something unique and human readable. For example, `confirm-sheet`.

| Type   | Required |
| ------ | -------- |
| string | true     |

`Sheet`

The component that contains the action sheet.

| Type                | Required |
| ------------------- | -------- |
| `React.ElementType` | true     |

`contexts`

> **Deprecated (no-op).** Extra context arguments are ignored. A registered sheet is available in every `SheetProvider`; choose the provider at `SheetManager.show` time using the `context` option instead.

| Type          | Required |
| ------------- | -------- |
| `...string[]` | false    |

```tsx
registerSheet("example-sheet", ExampleSheet);
```

::: tip
  A `SheetProvider` without a `context` prop has "global" context by default.
  When you register an action sheet, it's available in the "global"
  `SheetProvider` and any other provider you show it in.
:::
