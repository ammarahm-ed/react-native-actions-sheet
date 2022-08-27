/* eslint-disable curly */
import {useEffect, useState} from 'react';
import {actionSheetEventManager} from '../eventmanager';
import {useRef} from 'react';

const useSheetManager = ({
  id,
  onHide,
  onBeforeShow,
  onContextUpdate,
}: {
  id?: string;
  onHide: (data?: any) => void;
  onBeforeShow?: (data?: any) => void;
  onContextUpdate: (context?: string) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const contextRef = useRef<string>();

  useEffect(() => {
    if (!id) return;
    const subscriptions = [
      actionSheetEventManager.subscribe(
        `show_${id}`,
        (data: any, context?: string) => {
          if (visible) return;
          contextRef.current = context || 'global';
          onContextUpdate?.(context);
          onBeforeShow?.(data);
          setTimeout(() => {
            setVisible(true);
          }, 1);
        },
      ),
      actionSheetEventManager.subscribe(
        `hide_${id}`,
        (data: any, context = 'global') => {
          if (context !== contextRef.current) return;
          onHide?.(data);
        },
      ),
    ];
    return () => {
      subscriptions.forEach(s => s?.unsubscribe?.());
    };
  }, [id, onHide, onBeforeShow, onContextUpdate, visible]);

  return {
    visible,
    setVisible,
  };
};

export default useSheetManager;
