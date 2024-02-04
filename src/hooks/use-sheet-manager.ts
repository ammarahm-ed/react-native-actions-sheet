/* eslint-disable curly */
import {useEffect, useState} from 'react';
import {actionSheetEventManager} from '../eventmanager';
import {useProviderContext} from '../provider';

const useSheetManager = ({
  id,
  onHide,
  onBeforeShow,
  onContextUpdate,
}: {
  id?: string;
  onHide: (data?: any) => void;
  onBeforeShow?: (data?: any) => void;
  onContextUpdate: () => void;
}) => {
  const [visible, setVisible] = useState(false);
  const currentContext = useProviderContext();

  useEffect(() => {
    if (!id) return undefined;

    const subscriptions = [
      actionSheetEventManager.subscribe(
        `show_${id}`,
        (data: any, context?: string) => {
          if (currentContext !== context) return;
          if (visible) return;
          onContextUpdate?.();
          onBeforeShow?.(data);
          setVisible(true);
        },
      ),
      actionSheetEventManager.subscribe(`hide_${id}`, (data: any, context) => {
        if (currentContext !== context) return;
        onHide?.(data);
      }),
    ];
    return () => {
      subscriptions.forEach(s => s?.unsubscribe?.());
    };
  }, [id, onHide, onBeforeShow, onContextUpdate, visible, currentContext]);

  return {
    visible,
    setVisible,
  };
};

export default useSheetManager;
