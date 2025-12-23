import { Icon } from "../../Icon";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";

export const CommunityLink = () => {
  const { t } = useTranslation();
  const { setOpenedModals } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
  }));

  return (
    <div
      onClick={() => {
        setOpenedModals({ community: true });
      }}
      className="d-inline-flex items-center gap-small padding-small rounded bg-blue-opaque fit-content active-on-hover"
    >
      <Icon 
        name="MessageCircle" 
        size={20} 
        color="var(--color-blue-rigo)" 
      />
      <span>{t("communities.linkText")}</span>
    </div>
  );
};

