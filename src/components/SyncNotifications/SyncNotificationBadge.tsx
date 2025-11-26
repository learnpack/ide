import { useState } from "react";
import useStore from "../../utils/store";
import { Icon } from "../Icon";
import { SyncNotificationsModal } from "./SyncNotificationsModal";

export const SyncNotificationBadge = () => {
  const [showModal, setShowModal] = useState(false);
  const syncNotifications = useStore(s => s.syncNotifications);
  
  // Only show pending notifications
  const pendingNotifications = syncNotifications.filter(
    n => n.status === "pending"
  );
  
  if (pendingNotifications.length === 0) return null;
  
  return (
    <>
      <button 
        onClick={() => setShowModal(true)} 
        className="relative bg-[var(--bg-color)] border border-[var(--color-active)] rounded-md px-2.5 py-2 hover:bg-[var(--color-blue-opaque)] hover:scale-105 transition-all duration-200 flex items-center justify-center"
        title="Synchronization notifications"
      >
        <Icon name="Bell" size={20} />
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-[var(--bg-color)]">
          {pendingNotifications.length}
        </span>
      </button>
      
      {showModal && (
        <SyncNotificationsModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

