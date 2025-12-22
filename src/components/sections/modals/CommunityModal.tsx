import { useTranslation } from "react-i18next";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { Modal } from "../../mockups/Modal";
import { communitiesConfig } from "../../composites/CommunityLink/communitiesConfig";
import { Community } from "../../composites/CommunityLink/types";

export const CommunityModal = () => {
  const { t } = useTranslation();
  const { setOpenedModals } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
  }));

  const handleClickOutside = () => {
    setOpenedModals({ community: false });
  };

  const handleCommunityClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getCommunityIcon = (type: Community["type"]) => {
    switch (type) {
      case "whatsapp":
        return svgs.whatsapp;
      default:
        return null;
    }
  };

  return (
    <Modal outsideClickHandler={handleClickOutside}>
      <div className="flex flex-col">
        <h1 className="text-center mb-2 text-2xl font-semibold flex items-center justify-center gap-3">
          <div className="w-12 h-8 flex items-center justify-center overflow-hidden flex-shrink-0">
            <div className="w-12 h-8 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full">
              {svgs.happyRigo}
            </div>
          </div>
          <span>{t(communitiesConfig.title || "communities.title")}</span>
        </h1>
        {communitiesConfig.description && (
          <p className="text-center mb-4 opacity-80 text-base">
            {t(communitiesConfig.description)}
          </p>
        )}
        <div className="flex flex-col gap-3">
          {communitiesConfig.communities.map((community) => {
            const icon = getCommunityIcon(community.type);
            return (
              <div
                key={community.id}
                onClick={() => handleCommunityClick(community.url)}
                className="flex items-center gap-4 p-4 rounded-lg transition-colors cursor-pointer bg-1 border active:scale-[0.99]"
              >
                {icon && (
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <div className="w-8 h-8 [&>svg]:w-8 [&>svg]:h-8">
                      {icon}
                    </div>
                  </div>
                )}
                <div className="flex flex-col flex-1">
                  <span className="font-medium text-base">
                    {t(community.name)}
                  </span>
                  {community.description && (
                    <span className="text-sm opacity-80 mt-1">
                      {t(community.description)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
