# useSheetRef

Returns a `RefObject` pointing at the current sheet's [ref](./actionsheetref). Access the methods through `.current`.

```ts
// Some where in your sheet's component tree.
const ref = useSheetRef("example-sheet");

// Use methods on the current sheet.
ref.current?.hide();
```
