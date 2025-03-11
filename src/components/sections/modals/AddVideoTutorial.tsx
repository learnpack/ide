import { useState } from "react";
import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
export const AddVideoTutorial = () => {
  const [tutorial, setTutorial] = useState("");
  const { t } = useTranslation();
  const { addVideoTutorial, setOpenedModals } = useStore((state) => ({
    addVideoTutorial: state.addVideoTutorial,
    setOpenedModals: state.setOpenedModals,
  }));

  return (
    <Modal
      outsideClickHandler={() => setOpenedModals({ addVideoTutorial: false })}
    >
      <div className="flex-y gap-small">
        <h2>{t("pasteTutorialUrl")}</h2>
        <input
          type="text"
          className="input w-100"
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          value={tutorial}
          onChange={(e) => setTutorial(e.target.value)}
        />
        <div className="flex-x justify-center">
          <SimpleButton
            text={t("finish")}
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
        </div>
      </div>
    </Modal>
  );
};
