import { useState } from "react";
import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { TSyncNotification } from "../../utils/storeTypes";
import { SyncNotificationCard } from "./SyncNotificationCard";
import { SyncConfirmationModal } from "./SyncConfirmationModal";
import { Modal } from "../mockups/Modal";

interface Props {
  onClose: () => void;
}

export const SyncNotificationsModal = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const syncNotifications = useStore(s => s.syncNotifications);
  const [selectedNotification, setSelectedNotification] = useState<TSyncNotification | null>(null);
  
  // Show pending and processing notifications
  const activeNotifications = syncNotifications.filter(
    n => n.status === "pending" || n.status === "processing"
  );
  
  return (
    <>
      <Modal outsideClickHandler={onClose} minWidth="500px">
        <div className="min-w-[500px] max-w-[600px]">
          <h2 className="text-xl font-semibold mb-2">{t("sync-notification-title")}</h2>
          <p className="text-sm text-[var(--color-inactive)] mb-5">
            {t("sync-notification-description")}
          </p>
          
          {activeNotifications.length === 0 ? (
            <div className="py-10 text-center text-[var(--color-inactive)]">
              <p>{t("no-sync-notifications")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto mb-5">
              {activeNotifications.map(notification => (
                <SyncNotificationCard
                  key={notification.id}
                  notification={notification}
                  onSyncClick={() => setSelectedNotification(notification)}
                />
              ))}
            </div>
          )}
          
          <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--color-inactive)]">
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </Modal>
      
      {selectedNotification && (
        <SyncConfirmationModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </>
  );
};

