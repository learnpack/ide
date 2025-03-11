import { useShallow } from "zustand/react/shallow";
import useStore from "../../../utils/store";
import { Modal } from "../../mockups/Modal";
import { useEffect, useState } from "react";
import TelemetryManager, { TTestAttempt } from "../../../managers/telemetry";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";
import { svgs } from "../../../assets/svgs";
import toast from "react-hot-toast";

const randomFrom0to10 = () => {
  return Math.floor(Math.random() * 10);
};

const createTestData = (): TTestAttempt => {
  return {
    starting_at: new Date().getTime(),
    stdout: "",
    ended_at: new Date().getTime(),
    exit_code: 0,
    source_code: "",
  };
};

export const TestStrugglesModal = () => {
  const { t } = useTranslation();
  const [failures, setFailures] = useState(0);
  const {
    setOpenedModals,
    currentExercisePosition,
    setRigoContext,
    toggleRigo,
    registerTelemetryEvent,
  } = useStore(
    useShallow((state) => {
      return {
        setOpenedModals: state.setOpenedModals,
        currentExercisePosition: state.currentExercisePosition,
        setRigoContext: state.setRigoContext,
        toggleRigo: state.toggleRigo,
        registerTelemetryEvent: state.registerTelemetryEvent,
      };
    })
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stepIndicators = TelemetryManager.getStepIndicators(
      Number(currentExercisePosition)
    );
    if (stepIndicators?.metrics.streak_test_struggle === 3) {
      setMessage(`${t("threeStrugglesAlert." + randomFrom0to10())}`);
    }
    if (stepIndicators?.metrics.streak_test_struggle === 9) {
      setMessage(`${t("nineStrugglesAlert." + randomFrom0to10())}`);
    }
    if (stepIndicators && stepIndicators?.metrics.streak_test_struggle >= 15) {
      setMessage(
        t("helpIsNowMandatory", {
          streakTestStruggle: String(
            stepIndicators?.metrics.streak_test_struggle ?? 15
          ),
        })
      );
    }
    setFailures(stepIndicators?.metrics.streak_test_struggle ?? 0);
  }, [currentExercisePosition]);

  const outsideClickHandler = () => {
    const stepIndicators = TelemetryManager.getStepIndicators(
      Number(currentExercisePosition)
    );
    if (
      stepIndicators?.metrics.streak_test_struggle &&
      stepIndicators?.metrics.streak_test_struggle < 15
    ) {
      setOpenedModals({ testStruggles: false });
    } else {
      toast.error(
        t("helpIsNowMandatory", { streakTestStruggle: String(failures) })
      );
    }
  };

  return (
    <Modal outsideClickHandler={outsideClickHandler}>
      <h2 className="m-0">{t("rigoWantsToHelpYou")}</h2>
      <p>{message}</p>
      <div className="flex-x gap-small justify-center">
        {failures < 15 && (
          <SimpleButton
            extraClass="bg-gray padding-small rounded"
            text={t("continueOnMyOwn")}
            action={() => setOpenedModals({ testStruggles: false })}
          />
        )}
        <SimpleButton
          extraClass="active-on-hover padding-small bg-rigo text-white rounded"
          text={t("yesHelpMe")}
          svg={svgs.rigoSvg}
          action={() => {
            toggleRigo({ ensure: "open" });
            setRigoContext({
              context:
                "The student is struggling with the test, in has failed " +
                String(failures) +
                " times in a row, please give him a hint on how to solve it.",
              userMessage: t("whatImDoingWrong"),
              performTests: true,
            });
            setOpenedModals({ testStruggles: false });
            registerTelemetryEvent("test", createTestData());
          }}
        />
      </div>
    </Modal>
  );
};
