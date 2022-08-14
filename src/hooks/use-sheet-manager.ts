import { useEffect, useState } from "react";
import { actionSheetEventManager } from "../eventmanager";

const useSheetManager = ({
  id,
  onHide,
  onBeforeShow,
}: {
  id?: string;
  onHide: (data?: any) => void;
  onBeforeShow?: (data?: any) => void;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    const subscriptions = [
      actionSheetEventManager.subscribe(`show_${id}`, (data: any) => {
        onBeforeShow?.(data);
        setVisible(true);
      }),
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
