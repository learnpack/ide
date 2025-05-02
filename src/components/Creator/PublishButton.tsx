import { useState, useRef, useEffect, FC } from "react";
import { useTranslation } from "react-i18next";
import styles from "./PublishButton.module.css";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";
import { Modal } from "../mockups/Modal";
import ProgressBar from "../composites/ProgressBar/ProgressBar";
import useStore from "../../utils/store";
import { publishTutorial } from "../../utils/creator";
import { toast } from "react-hot-toast";
import { playEffect } from "../../utils/lib";
import { Notifier } from "../../managers/Notifier";
import { OpenWindowLink } from "../composites/OpenWindowLink";

// Modal interna que recibe onClose para cerrar
const PublishingModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const [publishing, setPublishing] = useState(false);
  const token = useStore((state) => state.token);
  const bctoken = useStore((state) => state.bc_token);

  const [deployedUrl, setDeployedUrl] = useState("");

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const res = await publishTutorial(bctoken, token);

      toast.success(t("tutorial-published-successfully"));
      setDeployedUrl(res.url);
      playEffect("success");
      Notifier.confetti();
    } catch (error) {
      toast.error(t("error-publishing-tutorial"));
      console.error(error, "ERROR FROM PUBLISH BUTTON");
    } finally {
      setPublishing(false);
    }
  };
  return (
    <div onMouseDown={(e) => e.stopPropagation()}>
      <SimpleButton
        text={t("publishMyTutorial")}
        action={handlePublish}
        svg={svgs.publish}
        extraClass="svg-blue text-blue active-on-hover w-100 rounded padding-small"
      />
      {publishing && (
        <Modal>
          <div className="flex-y gap-big padding-small">
            <h1 className="text-center big-svg m-0 palpitate">
              {svgs.rigoSoftBlue}
            </h1>
            <h3 className="text-center m-0">
              <p className="m-0">
                <strong className="text-blue">LearnPack</strong>{" "}
                {t("is-publishing-your-tutorial")}
              </p>
              <p className="m-0">{t("it-may-take-a-moment")}</p>
            </h3>
            <ProgressBar progress={50} height={8} />
            <div className="justify-center flex-x">
              <SimpleButton
                text={t("cancel")}
                action={onClose}
                extraClass="text-blue row-reverse"
              />
            </div>
          </div>
        </Modal>
      )}
      {deployedUrl && (
        <Modal outsideClickHandler={onClose}>
          <div className="flex-y gap-big padding-small">
            <h1 className="text-center big-svg m-0">{svgs.rigoSoftBlue}</h1>
            <h3 className="text-center m-0">
              {t("tutorial-published-successfully")}
            </h3>
            <h3 className="m-0 text-center">
              <OpenWindowLink
                href={deployedUrl + "?token=" + bctoken}
                text={t("visit-tutorial-here")}
              />
            </h3>
          </div>
        </Modal>
      )}
    </div>
  );
};

const PublishButton = () => {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownOpen &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleToggleDropdown = () => setDropdownOpen((v) => !v);

  return (
    <div ref={containerRef} className={styles.container}>
      <div className="flex-x align-center justify-center">
        {/* <span className={styles.verticalLine}></span> */}
        <SimpleButton
          text={t("publish")}
          action={handleToggleDropdown}
          extraClass="svg-white text-white row-reverse padding-small"
          svg={svgs.downTriangle}
        />
      </div>

      {dropdownOpen && (
        <div className={styles.menu}>
          <PublishingModal
            onClose={() => {
              setDropdownOpen(false);
            }}
          />
          <SimpleButton
            action={() => {
              mode === "student" ? setMode("creator") : setMode("student");
            }}
            text={
              mode === "student"
                ? t("continue-editing")
                : t("preview-as-student")
            }
            extraClass="svg-blue text-blue active-on-hover w-100 rounded padding-small"
            svg={mode === "student" ? svgs.edit : svgs.runCustom}
          />
        </div>
      )}
    </div>
  );
};

export default PublishButton;
