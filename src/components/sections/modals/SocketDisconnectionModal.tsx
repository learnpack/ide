import SimpleButton from "../../mockups/SimpleButton";

import { Modal } from "../../mockups/Modal";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import { createBugReportUrl, getSlugFromPath } from "../../../utils/lib";
import { svgs } from "../../../assets/svgs";

export default function SocketDisconnectionModal() {
  return (
    <Modal
      blockScroll={false}
      outsideClickHandler={() => {}}
      htmlId="socket-disconnected"
    >
      <Header />
      <Content />
    </Modal>
  );
}

const Header = () => {
  const { t } = useTranslation();
  const environment = useStore((state) => state.environment);
  return (
    <div>
      <h1 className="d-flex align-center gap-small justify-center big-svg">
        {svgs.sadRigo}
        <span>
          {environment === "localhost"
            ? t("Socket disconnected!")
            : t("we-had-a-problem")}
        </span>
      </h1>
    </div>
  );
};

const WindowReloader = () => {
  const { t } = useTranslation();
  const reload = () => {
    window.location.reload();
  };
  return (
    <SimpleButton
      extraClass="bg-blue pill centered"
      action={reload}
      text={t("Reload")}
    />
  );
};

type TStep = {
  title: string;
  instructions: React.ReactNode;
};

const Step = (props: TStep) => {
  return (
    <div>
      <h3>{props.title}</h3>
      {props.instructions}
    </div>
  );
};

const VscodeSteps = () => {
  const { t } = useTranslation();
  const steps = [
    {
      title: t("Step 1"),
      instructions: (
        <>
          <p>{t("Check that Learnpack is running in your terminal.")}</p>
          <p>
            {t("Run: ")} <code>learnpack start</code>
          </p>
        </>
      ),
    },
    {
      title: t("Step 2"),
      instructions: (
        <>
          <p>
            {t(
              "If Learnpack is running but you still see this modal, reload the window:"
            )}
          </p>
          <WindowReloader />
        </>
      ),
    },
  ];

  return (
    <div>
      {steps.map((step, index) => (
        <Step key={index} title={step.title} instructions={step.instructions} />
      ))}
    </div>
  );
};

const Content = () => {
  const { t } = useTranslation();
  const environment = useStore((state) => state.environment);
  return (
    <div>
      {environment === "localhost" ? (
        <>
          <p>{t("Sorry, this error can happen for certain reasons.")}</p>
          <p>
            {t("The basic steps to troubleshoot this error are the following:")}
          </p>
          <VscodeSteps />
        </>
      ) : (
        <>
          <p>{t("we-didnt-find-the-tutorial")}</p>
          {environment === "creatorWeb" && (
            <p>{t("make-sure-you-are-the-author-of-the-course")}</p>
          )}
          <SimpleButton
            extraClass="bg-blue-rigo pill centered text-white"
            action={() => {
              window.open(
                createBugReportUrl(
                  "Initial",
                  getSlugFromPath() || "No slug available",
                  "error-on-startup. Environment: " + environment
                ),
                "_blank"
              );
            }}
            text={t("report-bug")}
            svg={svgs.warning}
          />
        </>
      )}
    </div>
  );
};
