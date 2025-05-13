import useStore from "../../utils/store";
import { useEffect, useState } from "react";
import PublishButton from "./PublishButton";
import SimpleButton from "../mockups/SimpleButton";
import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";

export const PublishWarning = () => {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  return (
    <div
      className={`justify-center ${opened ? "w-fit-content" : "w-150px"}`}
      onClick={() => setOpened(!opened)}
    >
      <p
        className={`padding-smll text-cente
r text-blue bg-soft-blue rounded padding-small  w-100 ${
          opened ? "w-100" : " text-trimmed"
        }`}
      >
        {t("share-it-with-your-audience")}
      </p>
    </div>
  );
};

export const PublishNavbar = () => {
  const isCreator = useStore((state) => state.isCreator);
  // const lessonTitle = useStore((state) => state.lessonTitle);
  // const mode = useStore((state) => state.mode);
  // const setMode = useStore((state) => state.setMode);
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
    <div className="flex-x justify-between padding-medium w-100 gap-small">
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
      <PublishWarning />
      <div className="flex-x align-center gap-big">
        {/* <ShareButton /> */}
        <PublishButton />
      </div>
    </div>
  );
};
