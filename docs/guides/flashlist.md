# FlashList

If you want to use `@shopify/flash-list` inside the `ActionSheet` you need to do the following.

```tsx
import ActionSheet, {ScrollView} from 'react-native-actions-sheet';
import {FlashList} from '@shopify/flash-list';

const ExampleSheet = () => {
  return (
    <ActionSheet>
      <FlashList renderScrollComponent={ScrollView} />
    </ActionSheet>
  );
};
```
