import { useState, useRef, useEffect, FC } from "react";
import { useTranslation } from "react-i18next";
import styles from "./PublishButton.module.css";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";
import { Modal } from "../mockups/Modal";
import ProgressBar from "../composites/ProgressBar/ProgressBar";
import useStore from "../../utils/store";

// Modal interna que recibe onClose para cerrar
const PublishingModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  return (
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
  );
};

const PublishButton = () => {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
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

  const handlePublish = () => {
    setDropdownOpen(false);
    setPublishing(true);
  };

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
          <SimpleButton
            text={t("publishMyTutorial")}
            action={handlePublish}
            svg={svgs.publish}
            extraClass="svg-blue text-blue active-on-hover w-100 rounded padding-small"
          />
          <SimpleButton
            action={() => {
              mode === "student" ? setMode("creator") : setMode("student");
            }}
            text={mode === "student" ? t("continue-editing") : t("preview-as-student")}
            extraClass="svg-blue text-blue active-on-hover w-100 rounded padding-small"
            svg={mode === "student" ? svgs.edit : svgs.runCustom}
          />
        </div>
      )}

      {publishing && <PublishingModal onClose={() => setPublishing(false)} />}
    </div>
  );
};

export default PublishButton;
