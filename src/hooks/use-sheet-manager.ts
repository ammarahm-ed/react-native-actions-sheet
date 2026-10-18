/* eslint-disable curly */
import {useEffect, useRef, useState} from 'react';
import {actionSheetEventManager} from '../eventmanager';
import {useProviderContext} from '../provider';

const useSheetManager = ({
  id,
  onHide,
  onBeforeShow,
  onContextUpdate,
  initialVisible = false,
}: {
  id?: string;
  onHide: (data?: any) => void;
  onBeforeShow?: (data?: any, snapIndex?: number) => void;
  onContextUpdate: () => void;
  initialVisible?: boolean;
}) => {
  const [visible, setVisible] = useState(initialVisible);
  const currentContext = useProviderContext();
  const visibleRef = useRef({
    value: visible,
  });
  visibleRef.current.value = visible;
  useEffect(() => {
    if (!id) return undefined;

    const subscriptions = [
      actionSheetEventManager.subscribe(
        `show_${id}`,
        (data: any, context?: string, snapIndex?: number) => {
          if (currentContext !== context) return;
          if (visible) return;
          onContextUpdate?.();
          onBeforeShow?.(data, snapIndex);
          setVisible(true);
        },
      ),
      actionSheetEventManager.subscribe(`hide_${id}`, (data: any, context) => {
        if (context && currentContext !== context) return;
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
    visibleRef: visibleRef,
  };
};

export default useSheetManager;
