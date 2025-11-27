import { useState } from "react";
import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { TSyncNotification } from "../../utils/storeTypes";
import { SyncNotificationCard } from "./SyncNotificationCard";
import { SyncConfirmationModal } from "./SyncConfirmationModal";
import { Modal } from "../mockups/Modal";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "@/assets/svgs";

interface Props {
  onClose: () => void;
}

export const SyncNotificationsModal = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const syncNotifications = useStore(s => s.syncNotifications);
  const [selectedNotification, setSelectedNotification] = useState<TSyncNotification | null>(null);
  
  // Show pending and processing notifications
  const activeNotifications = syncNotifications.filter(
    n => n.status === "pending" || n.status === "processing" || n.status === "error"
  );
  
  return (
    <>
      <Modal outsideClickHandler={onClose} minWidth="500px">
        <div className="flex-y gap-small">
          <div className="flex-x align-center gap-small">
            <div className="medium-svg flex-x align-center">{svgs.rigoSoftBlue}</div>
            <h2 className="text-bold">{t("sync-notification-title")}</h2>
          </div>
          <p style={{ color: "var(--color-inactive)" }}>
            {t("sync-notification-description")}
          </p>
          
          {activeNotifications.length === 0 ? (
            <div className="flex-y align-center justify-center padding-medium">
              <p style={{ color: "var(--color-inactive)" }}>{t("no-sync-notifications")}</p>
            </div>
          ) : (
            <div className="flex-y gap-small" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {activeNotifications.map(notification => (
                <SyncNotificationCard
                  key={notification.id}
                  notification={notification}
                  onSyncClick={() => setSelectedNotification(notification)}
                />
              ))}
            </div>
          )}
          
          <div className="flex-x justify-end gap-medium" style={{ paddingTop: "16px", borderTop: "1px solid var(--color-inactive)" }}>
            <SimpleButton
              extraClass="bg-gray text-black padding-small rounded"
              text={t("close")}
              action={onClose}
            />
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

