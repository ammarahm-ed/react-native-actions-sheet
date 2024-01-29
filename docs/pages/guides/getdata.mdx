# Returning results from ActionSheet

React components are deeply coupled with their local state. However sometimes we want things to work differently and in a imperitive way. Let's look at an example where we need to get a confirmation from user before taking an action.

Define the returnValue types in your Sheet definition:

```ts
import {SheetDefinition, registerSheet} from 'react-native-actions-sheet';

registerSheet("confirm-sheet", ExampleSheet);

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'confirm-sheet': SheetDefinition<{
      payload: {
        message: string
      }
      returnValue: boolean;
    }>;
  }
}
```

So we have a function that we can call whenever we are opening an external link from our app.

```ts
async function openExternalLink(link: string) {
  const canOpen = await SheetManager.show('confirm-sheet', {
    payload: {
      message: `Do you want to open ${link} in your phone browser?`,
    },
  });
  if (canOpen) {
    Linking.openUrl(link);
  }
}
```

And in our `ConfirmSheet` component.

```tsx
function ConfirmSheet(props: SheetProps<"confirm-sheet">) {
  return (
    <ActionSheet id={props.sheetId}>
      <Text
        style={{
          marginBottom: 10,
          color: 'black',
        }}>
        {props.payload?.message}
      </Text>
      <Button
        title="No"
        onPress={() => {
          SheetManager.hide(props.sheetId, {
            payload: false,
          });
        }}
      />
      <Button
        title="Yes"
        onPress={() => {
          SheetManager.hide(props.sheetId, {
            payload: true,
          });
        }}
      />
    </ActionSheet>
  );
}
```

## Chaining

You can also chain showing ActionSheets one after the other using `await`. Each promise will resolve when the ActionSheet has closed.

```ts
let result = await SheetManager.show('sheet-a');
if (result) return await SheetManager.show('sheet-b');
/// and so on.
```
