import useStore from "../../utils/store";
import { useEffect } from "react";
import PublishButton from "./PublishButton";
import SimpleButton from "../mockups/SimpleButton";
import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";

export const PublishNavbar = () => {
  const isCreator = useStore((state) => state.isCreator);
  // const lessonTitle = useStore((state) => state.lessonTitle);
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);
  const environment = useStore((state) => state.environment);
  const bctoken = useStore((state) => state.bc_token);
  const { t } = useTranslation();

  useEffect(() => {
    if (isCreator) {
      document.documentElement.style.setProperty("--header-height", "150px");
    } else {
      document.documentElement.style.setProperty("--header-height", "80px");
    }
  }, [isCreator]);

  if (!isCreator || environment !== "creatorWeb") return null;
  return (
    <div className="flex-x justify-between padding-medium">
      <div className="flex-x align-center">
        <SimpleButton
          svg={svgs.grid}
          text={t("my-tutorials")}
          action={() => {
            window.open(
              "https://www.learnpack.co/my-tutorials?token=" + bctoken,
              "_blank"
            );
          }}
          extraClass="svg-blue text-blue rounded nowrap"
        />
      </div>
      <div
        className="w-100 flex-x justify-center"
        onClick={() => {
          if (mode === "creator") {
            setMode("student");
          } else {
            setMode("creator");
          }
        }}
      >
        <SimpleButton
          svg={mode === "creator" ? svgs.edit : svgs.runCustom}
          text={
            mode === "creator"
              ? t("you-are-in-edit-mode")
              : t("you-are-in-student-mode")
          }
          extraClass="svg-blue text-blue rounded nowrap  bg-1 border-heavy-blue padding-small"
        />
      </div>
      <div className="flex-x align-center gap-big">
        {/* <ShareButton /> */}
        <PublishButton />
      </div>
    </div>
  );
};
