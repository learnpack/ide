import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { Icon } from "../Icon";
import { SyncNotificationsModal } from "./SyncNotificationsModal";
import SimpleButton from "../mockups/SimpleButton";

export const SyncNotificationBadge = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const syncNotifications = useStore(s => s.syncNotifications);

  // Show pending, processing and error notifications
  const activeNotifications = syncNotifications.filter(
    n => n.status === "pending" || n.status === "processing" || n.status === "error"
  );

  // Close modal when there are no active notifications
  useEffect(() => {
    if (activeNotifications.length === 0) {
      setShowModal(false);
    }
  }, [activeNotifications.length]);
  
  if (activeNotifications.length === 0) return null;
  
  return (
    <>
      <div 
        style={{ 
          position: "relative",
          width: "fit-content",
          padding: "7px",
          borderRadius: "10px",
          backgroundColor: "transparent",
          border: "none"
        }}
      >
        <SimpleButton
          action={() => setShowModal(true)}
          svg={<Icon name="Bell" size={20} />}
          title={t("sync-notification-badge-tooltip")}
        />
        <span 
          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2"
          style={{ borderColor: "var(--bg-color)" }}
        >
          {activeNotifications.length}
        </span>
      </div>
      
      {showModal && (
        <SyncNotificationsModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

