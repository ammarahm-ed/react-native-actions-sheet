/* eslint-disable curly */
import {useEffect, useRef, useState} from 'react';
import {actionSheetEventManager} from '../eventmanager';
import {useProviderContext} from '../provider';

const useSheetManager = ({
  id,
  onHide,
  onBeforeShow,
  onContextUpdate,
  onFlushClose,
}: {
  id?: string;
  onHide: (data?: any) => void;
  onBeforeShow?: (data?: any, snapIndex?: number) => void;
  onContextUpdate: () => void;
  onFlushClose?: () => void;
}) => {
  const [visible, setVisible] = useState(false);
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
      // SheetManager publishes this *before* it subscribes to `onclose_`, so a
      // show during the iOS dismissal window finishes the old close first and
      // cannot resolve the new promise with stale data.
      actionSheetEventManager.subscribe(
        `flush_close_${id}`,
        (_data: any, context?: string) => {
          if (context && currentContext !== context) return;
          onFlushClose?.();
        },
      ),
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
