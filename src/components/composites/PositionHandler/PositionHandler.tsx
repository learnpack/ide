import { useEffect, useRef, useState } from "react";
import { eventBus } from "../../../managers/eventBus";
import useStore from "../../../utils/store";
// import toast from "react-hot-toast";
import TelemetryManager from "../../../managers/telemetry";
import { Modal } from "../../mockups/Modal";
import { useTranslation } from "react-i18next";
import { svgs } from "../../../assets/svgs";
import SimpleButton from "../../mockups/SimpleButton";

const ValidationModal = ({
  onStayHere,
  onSkip,
}: {
  onStayHere: () => void;
  onSkip: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <Modal>
      <div>
        <h2 className="text-center">{t("pending-tasks")}</h2>
        <div className="flex-x justify-center gap-small align-center padding-medium rounded gap-small bg-1">
          <div className="big-svg">{svgs.rigoSoftBlue}</div>
          <p className="text-center">{t("pending-tasks-description")}</p>
        </div>
        <div className="flex-x gap-small justify-center">
          <SimpleButton
            text={t("continueAnyway")}
            svg={svgs.nextArrowButton}
            extraClass="padding-small border-gray rounded"
            action={onSkip}
          />
          <SimpleButton
            text={t("stay-here")}
            svg={svgs.downArrow}
            extraClass="padding-small bg-blue-rigo text-white rounded"
            action={onStayHere}
          />
        </div>
      </div>
    </Modal>
  );
};

export const PositionHandler = () => {
  const handlePositionChange = useStore((s) => s.handlePositionChange);

  const currentExercisePosition = useStore((s) => s.currentExercisePosition);
  const [shouldValidate, setShouldValidate] = useState(false);
  const desiredPosition = useRef(0);
  const currentExercisePositionRef = useRef(Number(currentExercisePosition));

  useEffect(() => {
    eventBus.on("position_change", (event) => {
      desiredPosition.current = event.position;
      handler();
    });
  }, []);

  useEffect(() => {
    currentExercisePositionRef.current = Number(currentExercisePosition);
  }, [currentExercisePosition]);

  const handler = () => {
    const result = TelemetryManager.hasPendingTasks(
      Number(currentExercisePositionRef.current)
    );
    if (result) {
      setShouldValidate(true);
      return;
    } else {
      handlePositionChange(desiredPosition.current);
      eventBus.emit("position_changed", {});
    }
  };

  return (
    <div>
      {shouldValidate && (
        <ValidationModal
          onStayHere={() => {
            eventBus.emit("position_changed", {});
            setShouldValidate(false);
          }}
          onSkip={() => {
            handlePositionChange(desiredPosition.current);
            setShouldValidate(false);
            eventBus.emit("position_changed", {});
          }}
        />
      )}
    </div>
  );
};
