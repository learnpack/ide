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

const PublishConfirmationModal: FC<{
  onClose: () => void;
  onPublish: () => Promise<void>;
}> = ({ onClose, onPublish }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const getUserConsumables = useStore((state) => state.getUserConsumables);
  const bcToken = useStore((state) => state.bc_token);
  const openLink = useStore((state) => state.openLink);
  const [hasEnoughConsumables, setHasEnoughConsumables] = useState(false);

  useEffect(() => {
    checkConsumables();
  }, []);

  const checkConsumables = async () => {
    const consumables = await getUserConsumables();
    console.log(consumables, "CONSUMABLES");
    if (consumables.ai_generation > 0 || consumables.ai_generation === -1) {
      setHasEnoughConsumables(true);
    }
  };

  return (
    <>
      <SimpleButton
        text={t("publishMyTutorial")}
        action={() => setIsOpen(true)}
        svg={svgs.publish}
        extraClass="svg-blue text-blue active-on-hover w-100 rounded padding-small"
      />
      {isOpen && hasEnoughConsumables && (
        <Modal outsideClickHandler={() => setIsOpen(false)} extraClass="bg-2">
          <div className="flex-y gap-big padding-small">
            <h2 className="text-center big-svg m-0 flex-y align-center justify-center">
              {svgs.happyRigo}
              <span>{t("almost-there")}</span>
            </h2>
            <p className="padding-smll text-blue bg-soft-blue rounded padding-small text-big text-center">
              {t("share-it-with-your-audience")}
            </p>

            <div className="flex-x gap-small justify-center align-center">
              <SimpleButton
                extraClass="text-blue row-reverse padding-medium rounded"
                text={t("cancel")}
                action={onClose}
              />
              <SimpleButton
                extraClass=" row-reverse bg-blue-rigo text-white padding-medium rounded"
                svg={"🚀"}
                text={t("publish")}
                action={onPublish}
              />
            </div>
          </div>
        </Modal>
      )}
      {isOpen && !hasEnoughConsumables && (
        <Modal outsideClickHandler={() => setIsOpen(false)} extraClass="bg-2">
          <div className="flex-y gap-big align-center justify-center">
            <div className="flex-x align-center justify-center">
              {svgs.sadRigo}
            </div>
            <p className="text-big">{t("not-enough-consumables")}</p>

            <SimpleButton
              extraClass="text-white bg-blue-rigo padding-medium rounded fit-content"
              text={t("buy-more-consumables")}
              action={() => {
                openLink(
                  `https://www.learnpack.co/my-tutorials?token=${bcToken}`
                );
                setIsOpen(false);
              }}
            />
          </div>
        </Modal>
      )}
    </>
  );
};
const PublishingModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const [publishing, setPublishing] = useState(false);
  const token = useStore((state) => state.token);
  const bctoken = useStore((state) => state.bc_token);
  const openLink = useStore((state) => state.openLink);

  const [deployedUrl, setDeployedUrl] = useState("");

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const res = await publishTutorial(bctoken, token);

      toast.success(t("tutorial-published-successfully"));
      setDeployedUrl(res.url);
      // setDeployedUrl("https://www.google.com");

      playEffect("success");
      Notifier.confetti();
    } catch (error) {
      toast.error(t("error-publishing-tutorial"));
      console.error(error, "ERROR FROM PUBLISH BUTTON");
    } finally {
      console.log("finally");

      setPublishing(false);
    }
  };
  return (
    <div onMouseDown={(e) => e.stopPropagation()}>
      <PublishConfirmationModal onClose={onClose} onPublish={handlePublish} />
      {publishing && (
        <Modal extraClass="bg-2">
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
            <ProgressBar duration={4} height={8} />
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
            <h1 className="text-center  m-0">{svgs.congratsRigo}</h1>
            <h3 className="text-center m-0">
              {t("tutorial-published-successfully")}
            </h3>
            <p className="text-center m-0">
              {t("congratulations-your-tutorial-is-published")}
            </p>
            <h4 className="text-center">{t("share-your-tutorial")}</h4>
            <div className="flex-x gap-small align-center justify-between border-gray rounded padding-small">
              <p className="m-0 ">{deployedUrl}</p>
              <div className="flex-x gap-small">
                <SimpleButton
                  title={t("visit-tutorial-here")}
                  extraClass=""
                  svg={svgs.sendSvg}
                  action={() => {
                    openLink(deployedUrl + "?token=" + bctoken);
                  }}
                />
                <SimpleButton
                  title={t("copy-tutorial-link")}
                  extraClass=""
                  svg={svgs.copy}
                  action={() => {
                    navigator.clipboard.writeText(deployedUrl);
                    toast.success(t("tutorial-link-copied"));
                  }}
                />
              </div>
            </div>
          </div>
          <div>
            <p className="text-center">{t("you-can-also-share-via")}</p>
            <div className="flex-x justify-center align-center gap-big">
              <SimpleButton
                text={"X"}
                svg={svgs.twitter}
                title={t("share-on-twitter")}
                action={() => {
                  const url = encodeURIComponent(deployedUrl);
                  const text = encodeURIComponent(t("check-out-my-tutorial"));
                  window.open(
                    `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
                    "_blank"
                  );
                }}
              />
              <SimpleButton
                text={"Linkedin"}
                svg={svgs.linkedin}
                title={t("share-on-linkedin")}
                action={() => {
                  const url = encodeURIComponent(deployedUrl);
                  const title = encodeURIComponent(t("check-out-my-tutorial"));
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`,
                    "_blank"
                  );
                }}
              />
              <SimpleButton
                text={"Facebook"}
                svg={svgs.facebook}
                title={t("share-on-facebook")}
                action={() => {
                  const url = encodeURIComponent(deployedUrl);
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                    "_blank"
                  );
                }}
              />
            </div>
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

  // const mode = useStore((state) => state.mode);
  // const setMode = useStore((state) => state.setMode);

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
    <div ref={containerRef} className="pos-relative z-index-2">
      <div className="flex-x align-center justify-center">
        {/* <span className={styles.verticalLine}></span> */}
        <SimpleButton
          text={t("share")}
          action={handleToggleDropdown}
          extraClass="svg-white text-white row-reverse padding-small rounded bg-blue-rigo"
          svg={svgs.share}
        />
      </div>

      {dropdownOpen && (
        <div className={styles.menu}>
          <PublishingModal
            onClose={() => {
              setDropdownOpen(false);
            }}
          />
          {/* <SimpleButton
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
          /> */}
          {/* <DeleteButton /> */}
        </div>
      )}
    </div>
  );
};

export default PublishButton;
