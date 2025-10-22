import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";

export const ToggleSidebar = () => {
  const { t } = useTranslation();
  const {
    setShowSidebar,
    showSidebar,
    reportEnrichDataLayer,
  } = useStore((state) => ({
    setShowSidebar: state.setShowSidebar,
    showSidebar: state.showSidebar,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    getCurrentExercise: state.getCurrentExercise,
    currentExercisePosition: state.currentExercisePosition,
  }));

  return (
    <SimpleButton
      svg={svgs.dropdownButton}
      id="sidebar-toggle"
      title={t("toggle-sidebar")}
      extraClass={`padding-small rounded ${showSidebar ? "bg-rigo " : ""}`}
      action={() => {
        setShowSidebar(!showSidebar);
        if (!showSidebar) {
          reportEnrichDataLayer("learnpack_open_hamburger", {
          });
        }
      }}
    />
  );
};
