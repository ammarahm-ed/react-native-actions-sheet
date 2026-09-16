# useSheetPayload

Returns the current sheet's payload data with which the sheet was opened.

```ts
SheetManager.show("user-properties", {
    payload: {
        userId: 'user-id'
    }
});
// Some where in your sheet's component tree.
const payload = useSheetPayload("user-properties");

// Access the values on the payload.
payload.userId
```
