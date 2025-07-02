import { useEffect } from "react";
import CreatorSocket from "../../managers/creatorSocket";
import { DEV_MODE } from "../../utils/lib";

const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

type Props = {
  notificationId: string;
  onNotification: () => void;
};

export default function RealtimeNotificationListener({
  notificationId,
  onNotification,
}: Props) {
  useEffect(() => {
    if (!notificationId) return;

    socketClient.connect();
    socketClient.on(notificationId, onNotification);

    socketClient.emit("registerNotification", {
      notificationId,
    });

    return () => {
      socketClient.off(notificationId, onNotification);
      socketClient.disconnect();
    };
  }, [notificationId, onNotification]);

  return null;
}
