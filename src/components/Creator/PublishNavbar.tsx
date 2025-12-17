import useStore from "../../utils/store";
import { useEffect } from "react";
import PublishButton from "./PublishButton";
import SimpleButton from "../mockups/SimpleButton";
import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";
import MiniLessonListener from "./MiniLessonListener";
import SwitchComponent from "../ui/switch";

export const PublishNavbar = () => {
  const isCreator = useStore((state) => state.isCreator);
  const environment = useStore((state) => state.environment);
  const bctoken = useStore((state) => state.bc_token);
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);
  const { t } = useTranslation();

  useEffect(() => {
    if (isCreator && environment === "creatorWeb") {
      document.documentElement.style.setProperty("--header-height", "112px");
    } else {
      document.documentElement.style.setProperty("--header-height", "90px");
    }
  }, [isCreator, environment]);

  if (!isCreator || environment !== "creatorWeb") return null;
  return (
    <div className="flex-x justify-between padding-medium w-100 gap-small">
      <div className="flex-x align-center">
        <SimpleButton
          svg={svgs.grid}
          text={t("my-tutorials")}
          title={t("open-dashboard-tooltip")}
          action={() => {
            window.open(
              "https://learn.learnpack.co?token=" + bctoken,
              "_blank"
            );
          }}
          extraClass="svg-blue text-blue rounded nowrap"
        />
      </div>
      <div className="flex-x align-center gap-big">

        <MiniLessonListener />
        <SwitchComponent checked={mode === "creator"} onChange={(checked) => {
          if (checked) {
            setMode("creator");
          } else {
            setMode("student");
          }
        }} label={t("edit-mode")} id="edit-mode" />

        <PublishButton />
      </div>
    </div>
  );
};
