import { useState } from "react";
import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { cleanFloatString } from "../../../utils/lib";

export const AddVideoTutorial = () => {
  const [tutorial, setTutorial] = useState("");
  const { t } = useTranslation();
  const {
    addVideoTutorial,
    setOpenedModals,
    removeVideoTutorial,
    videoTutorial,
    getCurrentExercise,
  } = useStore((state) => ({
    addVideoTutorial: state.addVideoTutorial,
    setOpenedModals: state.setOpenedModals,
    removeVideoTutorial: state.removeVideoTutorial,
    videoTutorial: state.videoTutorial,
    getCurrentExercise: state.getCurrentExercise,
  }));

  const ex = getCurrentExercise();

  return (
    <Modal
      outsideClickHandler={() => setOpenedModals({ addVideoTutorial: false })}
    >
      <div className="flex-y gap-small">
        <h2>
          {t("addAVideoToStep", {
            step: cleanFloatString(ex.title.split("-")[0]),
          })}
        </h2>
        <p>
          {t("addVideoExplanation", {
            step: cleanFloatString(ex.title.split("-")[0]),
          })}
        </p>
        <input
          type="text"
          className="input w-100"
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          value={tutorial}
          onChange={(e) => setTutorial(e.target.value)}
        />
        <div className="flex-x justify-center">
          <SimpleButton
            text={t("addAVideoToStep", {
              step: cleanFloatString(ex.title.split("-")[0]),
            })}
            svg={svgs.checkIcon}
            extraClass=" active-on-hover padding-medium rounded"
            action={async () => {
              if (tutorial) {
                const tid = toast.loading(t("Adding video tutorial..."));
                await addVideoTutorial(tutorial);
                toast.success(t("Video tutorial added"), { id: tid });
                setOpenedModals({ addVideoTutorial: false });
              } else {
                toast.error(t("Please enter a valid URL"));
              }
            }}
          />
          {videoTutorial && (
            <SimpleButton
              text={t("remove-current-video")}
              svg={svgs.trash}
              extraClass=" active-on-hover padding-medium rounded"
              action={async () => {
                const tid = toast.loading(t("removing-video-tutorial"));
                await removeVideoTutorial();
                toast.success(t("video-tutorial-removed"), { id: tid });
                setOpenedModals({ addVideoTutorial: false });
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};
