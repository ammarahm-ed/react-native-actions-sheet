import React, {useRef} from 'react';
import ActionSheet, {ActionSheetRef, registerSheet, SheetProps} from '../..';
import MenuButton from './btn';

function Sheet(props: SheetProps) {
  const actionSheetRef = useRef<ActionSheetRef>(null);

  return (
    <ActionSheet
      ref={actionSheetRef}
      id={props.sheetId}
      statusBarTranslucent
      gestureEnabled={true}
      containerStyle={{backgroundColor: '#BFD7EA'}}
      indicatorStyle={{backgroundColor: 'rgba(71, 87, 114, 0.13)'}}>
      <MenuButton
        title="Pin Chat"
        icon="pin-outline"
        onPress={() => console.log('Pinning Chat')}
      />
      <MenuButton
        title="Archive Chat"
        icon="archive-outline"
        onPress={() => console.log('Archiving Chat...')}
      />
      <MenuButton
        title="End Chat"
        icon="close-circle-outline"
        color={'#c0392b'}
        onPress={() => console.log('Ending Chat...')}
      />
    </ActionSheet>
  );
}

registerSheet('chat-list-options', Sheet);

export default Sheet;
