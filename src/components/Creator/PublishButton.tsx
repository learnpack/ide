import { useState, useRef, useEffect, FC } from "react";
import { useTranslation } from "react-i18next";
import styles from "./PublishButton.module.css";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";
import { Modal } from "../mockups/Modal";
import ProgressBar from "../composites/ProgressBar/ProgressBar";
import useStore from "../../utils/store";
import { publishTutorial, changeSlug } from "../../utils/creator";
import { toast } from "react-hot-toast";
import { playEffect, getSlugFromPath, slugify } from "../../utils/lib";
import { Notifier } from "../../managers/Notifier";
import { FetchManager } from "../../managers/fetchManager";
import { isSlugAvailable } from "../../utils/lib";

const PublishConfirmationModal: FC<{
  onClose: () => void;
  onPublish: (slug: string) => Promise<void>;
}> = ({ onClose, onPublish }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const getUserConsumables = useStore((state) => state.getUserConsumables);
  const bcToken = useStore((state) => state.bc_token);
  const openLink = useStore((state) => state.openLink);
  const syllabus = useStore((state) => state.syllabus);
  const [hasEnoughConsumables, setHasEnoughConsumables] = useState(false);
  const [needToReviewAll, setNeedToReviewAll] = useState(false);
  const [editableSlug, setEditableSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"checking" | "available" | "taken" | null>(null);

  useEffect(() => {
    checkConsumables();
    // Initialize slug from current path
    const currentSlug = getSlugFromPath();
    if (currentSlug) {
      setEditableSlug(currentSlug);
    }
  }, []);

  useEffect(() => {
    if (!syllabus || !syllabus.lessons) {
      setNeedToReviewAll(false);
      return;
    }
    const anyNotGenerated = syllabus.lessons.some(
      (lesson) => !lesson.generated
    );
    if (anyNotGenerated) {
      setNeedToReviewAll(true);
    } else {
      setNeedToReviewAll(false);
    }
  }, [syllabus]);

  // Debounced slug validation
  useEffect(() => {
    if (!editableSlug || editableSlug === getSlugFromPath()) {
      setSlugStatus(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSlugStatus("checking");
      
      try {
        const isAvailable = await isSlugAvailable(editableSlug);
        setSlugStatus(isAvailable ? "available" : "taken");
      } catch (error) {
        console.error("Error checking slug availability:", error);
        setSlugStatus("taken");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [editableSlug]);

  const checkConsumables = async () => {
    const consumables = await getUserConsumables();
    console.log(consumables, "CONSUMABLES");
    if (consumables.ai_generation > 0 || consumables.ai_generation === -1) {
      setHasEnoughConsumables(true);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // replace spaces with hyphens
    const valueWithHyphens = value.replace(/\s+/g, "-");
    const slugified = slugify(valueWithHyphens, false);
    setEditableSlug(slugified);
  };

  return (
    <>
      <SimpleButton
        text={t("publishMyTutorial")}
        action={() => setIsOpen(true)}
        svg={svgs.publish}
        extraClass="svg-blue text-blue active-on-hover w-100 rounded padding-small"
      />
      {isOpen && needToReviewAll && (
        <Modal outsideClickHandler={() => setIsOpen(false)} extraClass="bg-2">
          <div className="flex-y gap-big padding-small">
            <h2 className="text-center big-svg m-0 flex-y align-center justify-center">
              {svgs.sadRigo}
              <span>{t("oops-not-so-fast")}</span>
            </h2>
            <p className="padding-smll text-blue bg-soft-blue rounded padding-small text-big text-center">
              {t("please-review-all-lessons-before-publishing")}
            </p>
            <SimpleButton
              extraClass="text-blue row-reverse padding-medium rounded"
              text={t("cancel")}
              action={onClose}
            />
          </div>
        </Modal>
      )}
      {isOpen && hasEnoughConsumables && !needToReviewAll && (
        <Modal outsideClickHandler={() => setIsOpen(false)} extraClass="bg-2">
          <div className="flex-y gap-big padding-small">
            <h2 className="text-center big-svg m-0 flex-y align-center justify-center">
              {svgs.happyRigo}
              <span>{t("almost-there")}</span>
            </h2>
            <p className="padding-smll text-blue bg-soft-blue rounded padding-small text-big text-center">
              {t("share-it-with-your-audience")}
            </p>

            <div className="flex-y gap-small padding-small">
              <label className="text-blue font-medium">{t("tutorial-slug")}</label>
              <input 
                className="padding-small rounded border"
                maxLength={47}
                value={editableSlug}
                onClick={(e) => e.stopPropagation()}
                onChange={handleSlugChange}
                placeholder={t("tutorial-slug")}
              />
              <div className="flex-x justify-between align-center">
                <span className="text-small text-gray-600">{editableSlug.length}/47</span>
                {slugStatus === "checking" && (
                  <span className="text-small text-blue">{t("checking-slug")}</span>
                )}
                {slugStatus === "available" && (
                  <span className="text-small text-success">{t("slug-available")}</span>
                )}
                {slugStatus === "taken" && (
                  <span className="text-small text-danger">{t("slug-taken")}</span>
                )}
              </div>
            </div>

            <div className="flex-x gap-small justify-center align-center">
              <SimpleButton
                extraClass="text-blue row-reverse padding-medium rounded"
                text={t("cancel")}
                action={onClose}
              />
              <SimpleButton
                extraClass=" row-reverse bg-blue-rigo teFxt-white padding-medium rounded"
                disabled={!editableSlug || (slugStatus === "taken" || slugStatus === "checking")}
                svg={"🚀"}
                text={t("publish")}
                action={() => onPublish(editableSlug)}
              />
            </div>
          </div>
        </Modal>
      )}
      {isOpen && !hasEnoughConsumables && !needToReviewAll && (
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
                  `https://learn.learnpack.co/my-learning-packages?token=${bcToken}`
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

const EmbedCodeModal: FC<{ deployedUrl: string }> = ({ deployedUrl }) => {
  const { t } = useTranslation();
  const embedCodeRef = useRef<HTMLTextAreaElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const embedCode = useRef(
    `<iframe src="${deployedUrl}?iframe=true&lang=en&theme=dark" style="border:0px #ffffff none;" name="myiFrame" scrolling="no" frameborder="0" marginheight="0px" marginwidth="0px" height="800px" width="600px" allowfullscreen></iframe>`
  );
  return (
    <>
      <SimpleButton
        title={t("import-to-your-lms")}
        svg={svgs.html}
        action={() => setIsOpen(true)}
        extraClass=""
      />
      {isOpen && (
        <Modal outsideClickHandler={() => setIsOpen(false)} extraClass="bg-2">
          <div className="flex-y gap-medium ">
            <h3 className="text-center">{t("import-to-your-lms")}</h3>
            <p>{t("import-to-your-lms-description")}</p>

            <textarea
              ref={embedCodeRef}
              readOnly
              rows={6}
              className="w-100 textarea"
              value={embedCode.current}
            />
            <SimpleButton
              extraClass="row-reverse border-blue bg-blue-rigo text-white padding-medium rounded align-center justify-center"
              text={t("copy")}
              svg={svgs.copy}
              action={() => {
                navigator.clipboard.writeText(embedCode.current);
                toast.success(t("embed-code-copied"));
              }}
            />
            <div className="justify-center align-center flex-x rounded padding-small gap-small ">
              {svgs.congratsRigo}
              <p className="bg-1 rounded padding-medium">
                {t("as-your-students-interact-with-the-tutor")}{" "}
                <a
                  href="https://learnpack.co/revenue-sharing-program"
                  target="_blank"
                >
                  {t("revenue-sharing-program")}
                </a>
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

const PublishingModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const embedCodeRef = useRef<HTMLTextAreaElement>(null);
  const [publishing, setPublishing] = useState(false);
  const token = useStore((state) => state.token);
  const bctoken = useStore((state) => state.bc_token);
  const openLink = useStore((state) => state.openLink);
  const fetchExercises = useStore((state) => state.fetchExercises);
  // const fetchReadme = useStore((state) => state.fetchReadme);
  // const getSyllabus = useStore((state) => state.getSyllabus);
  const currentSlug = useStore((state) => state.configObject.config.slug);
  const [deployedUrl, setDeployedUrl] = useState("");

  const handlePublish = async (slug: string) => {
    try {
      setPublishing(true);
      
      // Check if slug changed
      if (slug && currentSlug && slug !== currentSlug) {
        try {
          // Change slug first
          await changeSlug(currentSlug, slug, token);
          
          // Update URL without page reload
          const queryString = window.location.search;
          const newUrl = `/preview/${slug}${queryString}`;
          window.history.pushState(null, '', newUrl);
          

          // await fetchReadme();
          // await getSyllabus();
        } catch (slugError) {
          console.error("Error changing slug:", slugError);
          toast.error(t("error-changing-slug"));
          setPublishing(false);
          return;
        }
      }
      const res = await publishTutorial(bctoken, token);
      toast.success(t("tutorial-published-successfully"));
      Notifier.confetti();
      playEffect("success");
      setDeployedUrl(res.url);
      setPublishing(false);
      await fetchExercises();
    } catch (error) {
      toast.error(t("error-publishing-tutorial"));
      console.error(error, "ERROR FROM PUBLISH BUTTON");
      setPublishing(false);
    }
  };
  useEffect(() => {
    if (embedCodeRef.current) {
      // Adjust the height of the textarea to fit the content
      embedCodeRef.current.style.height = "auto";
      embedCodeRef.current.style.height =
        embedCodeRef.current.scrollHeight + "px";
    }
  }, [deployedUrl, embedCodeRef.current]);

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
            <h3 className="text-center m-0">{t("share-your-tutorial")}</h3>
            <p className="text-center m-0">
              {t("congratulations-your-tutorial-is-published")}
            </p>
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
          <div className="flex-y gap-medium">
            <p className="text-center">{t("you-can-also-share-via")}</p>
            <div className="flex-x justify-center align-center gap-big wrap-wrap">
              <SimpleButton
                // text={"X"}
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
                // text={"Linkedin"}
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
                // text={"Facebook"}
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
              <SimpleButton
                // text={"Reddit"}
                svg={svgs.reddit}
                title={t("share-on-reddit")}
                action={() => {
                  const url = encodeURIComponent(deployedUrl);
                  window.open(
                    `https://www.reddit.com/submit?url=${url}&title=${encodeURIComponent(
                      t("check-out-my-tutorial")
                    )}`,
                    "_blank"
                  );
                }}
              />

              <SimpleButton
                // text={"WhatsApp"}
                svg={svgs.whatsapp}
                title={t("share-on-whatsapp")}
                action={() => {
                  const url = encodeURIComponent(deployedUrl);
                  window.open(
                    `https://api.whatsapp.com/send?text=${url}`,
                    "_blank"
                  );
                }}
              />

              <SimpleButton
                // text={"Email"}
                svg={svgs.email}
                title={t("share-via-email")}
                action={() => {
                  const url = encodeURIComponent(deployedUrl);
                  window.open(`mailto:?body=${url}`, "_blank");
                }}
              />
              <EmbedCodeModal deployedUrl={deployedUrl} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export const ExportModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const courseSlug = useStore((state) => state.configObject.config.slug);
  const language = useStore((state) => state.language);
  const courseTitle = useStore((state) => state.configObject.config.title[language]);
  const user = useStore((state) => state.user);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showEpubForm, setShowEpubForm] = useState(false);
  const [epubMetadata, setEpubMetadata] = useState({
    creator: user?.first_name + " " + user?.last_name || "",
    publisher: "LearnPack LLC",
    title: courseTitle || "",
    rights: "Copyright 2025 LearnPack LLC. All rights reserved."
  });

  const exportToFormat = async (format: string, metadata?: typeof epubMetadata) => {
    const tid = toast.loading(t("exporting-course"));
    try {
      const url = `${FetchManager.HOST}/export/${courseSlug}/${format}`;
      const body = {
        language: language,
        metadata: {
          creator: metadata?.creator || user?.first_name + " " + user?.last_name,
          publisher: metadata?.publisher || "LearnPack LLC",
          title: metadata?.title || courseTitle,
          rights: metadata?.rights || "LearnPack LLC",
          lang: language,
        }
      }
      const getExtension = () => {
        if (format === "scorm") {
          return "zip";
        } else if (format === "epub") {
          return "epub";
        } else if (format === "zip") {
          return "zip";
        }
      }
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.blob();
      const downloadUrl = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${courseSlug}.${getExtension()}`;
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(t("course-exported-successfully"), { id: tid });
    }
    catch (error) {
      toast.error(t("error-exporting-course"), { id: tid });
      console.error(error, "ERROR FROM EXPORT ACTION");
    }
    finally {
      toast.dismiss(tid);
    }
  }

  const handleClose = () => {
    setExportModalOpen(false);
    setShowEpubForm(false);
    onClose();
  };

  const handleEpubExport = () => {
    setShowEpubForm(true);
  };

  const handleEpubFormSubmit = () => {
    exportToFormat("epub", epubMetadata);
    handleClose();
  };

  const handleEpubFormCancel = () => {
    setShowEpubForm(false);
  };

  const handleMetadataChange = (field: keyof typeof epubMetadata, value: string) => {
    setEpubMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div onMouseDown={(e) => e.stopPropagation()}>
      <SimpleButton
        text={t("export")}
        action={() => setExportModalOpen(true)}
        extraClass="svg-blue text-blue padding-small rounded "
        svg={svgs.export}
      />
      {exportModalOpen && !showEpubForm && (
        <Modal
          showCloseButton={true}
          outsideClickHandler={handleClose}
          minWidth="500px"
        >
          <div className="flex-y gap-big">
            {/* Modal Header */}
            <div className="text-center">
              <h2 className="text-blue m-0 text-big">{t("export-course")}</h2>

            </div>

            {/* Export Options */}
            <div className="flex-y gap-medium">
              {/* EPUB Option */}
              <div className={styles.exportOptionCard}>
                <div className="flex-x align-center gap-medium">
                  <div className={`${styles.exportIcon} ${styles.epubIcon}`}>
                    {svgs.epubExport}
                  </div>
                  <div className="flex-y gap-small flex-1">
                    <h3 className="text-blue m-0 text-medium">{t("export-to-epub")}</h3>
                    <p className="text-gray m-0 text-small">{t("epub-description")}</p>
                  </div>
                </div>
                <SimpleButton
                  text={t("export-to-epub")}
                  action={handleEpubExport}
                  extraClass={`${styles.exportButton} ${styles.epubButton}`}
                />
              </div>

              {/* ZIP Option */}
              <div className={styles.exportOptionCard}>
                <div className="flex-x align-center gap-medium">
                  <div className={`${styles.exportIcon} ${styles.zipIcon}`}>
                    {svgs.zipExport}
                  </div>
                  <div className="flex-y gap-small flex-1">
                    <h3 className="text-blue m-0 text-medium">{t("export-to-zip")}</h3>
                    <p className="text-gray m-0 text-small">{t("zip-description")}</p>
                  </div>
                </div>
                <SimpleButton
                  text={t("export-to-zip")}
                  action={() => {
                    exportToFormat("zip");
                    handleClose();
                  }}
                  extraClass={`${styles.exportButton} ${styles.zipButton}`}
                />
              </div>

              {/* SCORM Option */}
              <div className={styles.exportOptionCard}>
                <div className="flex-x align-center gap-medium">
                  <div className={`${styles.exportIcon} ${styles.scormIcon}`}>
                    {svgs.scormExport}
                  </div>
                  <div className="flex-y gap-small flex-1">
                    <h3 className="text-blue m-0 text-medium">{t("export-to-scorm")}</h3>
                    <p className="text-gray m-0 text-small">{t("scorm-description")}</p>
                  </div>
                </div>
                <SimpleButton
                  text={t("export-to-scorm")}
                  action={() => {
                    exportToFormat("scorm");
                    handleClose();
                  }}
                  extraClass={`${styles.exportButton} ${styles.scormButton}`}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {exportModalOpen && showEpubForm && (
        <Modal
          showCloseButton={true}
          outsideClickHandler={handleClose}
          minWidth="600px"
        >
          <div className="flex-y gap-big">
            {/* Modal Header */}
            <div className="text-center">
              <h2 className="text-blue m-0 text-big">{t("configure-epub-metadata")}</h2>
            </div>

            <div className={styles.metadataForm}>


              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t("author")}</label>j
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder={t("creator-placeholder")}
                  value={epubMetadata.creator}
                  onChange={(e) => handleMetadataChange("creator", e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t("publisher")}</label>
                <input
                  type="text"
                  readOnly
                  className={styles.formInput}
                  placeholder={t("publisher-placeholder")}
                  value={epubMetadata.publisher}
                  onChange={(e) => handleMetadataChange("publisher", e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t("title")}</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder={t("title-placeholder")}
                  value={epubMetadata.title}
                  onChange={(e) => handleMetadataChange("title", e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t("rights")}</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder={t("rights-placeholder")}
                  value={epubMetadata.rights}
                  onChange={(e) => handleMetadataChange("rights", e.target.value)}
                />
              </div>

              <div className="flex-x gap-small justify-center align-center mt-30px">
                <button
                  className="bg-1 text-blue-rigo  rounded border-gray  padding-medium bg-white"
                  onClick={handleEpubFormCancel}
                >
                  {t("cancel")}
                </button>
                <button
                  className="bg-blue-rigo text-white rounded padding-medium"
                  onClick={handleEpubFormSubmit}
                >
                  {t("export-epub")} 📖
                </button>
              </div>
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

  const getSyllabus = useStore((state) => state.getSyllabus);
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

  const handleToggleDropdown = () => {
    getSyllabus();
    setDropdownOpen((v) => !v);
  };

  return (
    <div ref={containerRef} className="pos-relative z-index-2">
      <div className="flex-x align-center justify-center">
        {/* <span className={styles.verticalLine}></span> */}
        <SimpleButton
          text={t("share")}
          action={handleToggleDropdown}
          title={t("share-publish-tooltip")}
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
          <ExportModal onClose={() => {}} />
        </div>
      )}
    </div>
  );
};

export default PublishButton;
