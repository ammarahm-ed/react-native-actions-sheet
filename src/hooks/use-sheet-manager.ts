import { useEffect, useState } from "react";
import { actionSheetEventManager } from "../eventmanager";

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

  useEffect(() => {
    if (!id) return;
    const subscriptions = [
      actionSheetEventManager.subscribe(
        `show_${id}`,
        (data: any, context?: string) => {
          onContextUpdate?.(context);
          onBeforeShow?.(data);
          setTimeout(() => {
            setVisible(true);
          }, 1);
        }
      ),
      actionSheetEventManager.subscribe(`hide_${id}`, (data: any) => {
        onHide?.(data);
      }),
    ];
    return () => {
      subscriptions.forEach((s) => s?.unsubscribe?.());
    };
  }, [id, onHide, onBeforeShow]);

  return {
    visible,
    setVisible,
  };
};

export default useSheetManager;
