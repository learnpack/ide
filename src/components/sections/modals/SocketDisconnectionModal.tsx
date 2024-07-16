import SimpleButton from "../../mockups/SimpleButton";

import { Modal } from "../../mockups/Modal";
import { useTranslation } from "react-i18next";

export default function SocketDisconnectionModal() {
  return (
    <Modal blockScroll={false} outsideClickHandler={() => {}} htmlId="socket-disconnected">
      <Header />
      <Content />
    </Modal>
  );
}

const Header = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-center">{t("Socket disconnected!")}</h1>
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

const Steps = () => {
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
  return (
    <div>
      <p>{t("Sorry, this error can happen for certain reasons.")}</p>
      <p>
        {t("The basic steps to troubleshoot this error are the following:")}
      </p>
      <Steps />
    </div>
  );
};
