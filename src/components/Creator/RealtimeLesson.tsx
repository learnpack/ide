import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import ProgressBar from "../composites/ProgressBar/ProgressBar";
import { DEV_MODE } from "../../utils/lib";
import SimpleButton from "../mockups/SimpleButton";
import { continueGenerating } from "../../utils/creator";
import toast from "react-hot-toast";
import { svgs } from "../../assets/svgs";
import { Modal } from "../mockups/Modal";
import "./RealtimeLesson.css";
const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

const statusToTextKeyMap = {
  GENERATING: "this-lesson-is-being-processed-and-will-be-ready-soon",
  PENDING: "this-lesson-has-not-been-generated-yet",
  ERROR: "this-lesson-has-an-error",
  DONE: "this-lesson-has-been-generated-successfully",
};

export default function RealtimeLesson() {
  const { t } = useTranslation();
  const getCurrentExercise = useStore((state) => state.getCurrentExercise);
  const currentExercisePosition = useStore(
    (state) => state.currentExercisePosition
  );
  const config = useStore((state) => state.configObject);
  const fetchReadme = useStore((state) => state.fetchReadme);
  const syllabus = useStore((state) => state.syllabus);
  const getSyllabus = useStore((state) => state.getSyllabus);
  const [updates, setUpdates] = useState<string[]>([]);

  const handleUpdate = (data: any) => {
    if (data && data.status === "done") {
      setTimeout(async () => {
        await fetchReadme();
      }, 1000);
    }
    if (data.lesson === getCurrentExercise()?.slug) {
      setUpdates((prev) => [...prev, data.log]);
    }
  };

  useEffect(() => {
    if (!config?.config?.slug) return;

    socketClient.connect();
    socketClient.on("course-creation", handleUpdate);

    socketClient.emit("register", { courseSlug: config.config.slug });

    return () => {
      socketClient.off("course-creation", handleUpdate);
      socketClient.disconnect();
    };
  }, []);

  const previousLesson = syllabus.lessons[Number(currentExercisePosition) - 1];

  const lesson = syllabus.lessons[Number(currentExercisePosition)];

  return (
    <div className="flex-y gap-big padding-big lesson-loader">
      {lesson && <h3>{lesson.title}</h3>}
      <div className=" d-flex align-center gap-small justify-between">
        <span>{t(statusToTextKeyMap[lesson?.status || "PENDING"])}</span>
        <div
          style={{
            background: "#9FBDD0",
            color: "01455E",
            width: "fit-content",
            borderRadius: "50vh",
            padding: "2px 10px",
            fontSize: "16px",
          }}
        >
          {lesson?.status}
        </div>
      </div>
      {previousLesson &&
        previousLesson.status === "DONE" &&
        ["PENDING", "ERROR"].includes(lesson?.status || "") && (
          <ContinueGenerationButton
            onGenerate={() => {
              getSyllabus();
              setUpdates((prev) => [
                ...prev,
                "🚀 " + t("lesson-generation-started"),
              ]);
            }}
          />
        )}

      {lesson?.status === "GENERATING" && (
        <ProgressBar duration={20} height={4} />
      )}

      <div className="bg-gray padding-big rounded">
        {syllabus.lessons[Number(currentExercisePosition)]?.description}
      </div>

      {updates.length > 0 && (
        <div
          style={{ background: "#FAFDFF", border: "1px solidrgb(6, 10, 15)" }}
          className=" rounded padding-small"
        >
          {updates.map((update) => (
            <p key={update}>{update}</p>
          ))}
        </div>
      )}
    </div>
  );
}

const ContinueGenerationButton = ({
  onGenerate,
}: {
  onGenerate: () => void;
}) => {
  const { t } = useTranslation();

  const currentExercisePosition = useStore(
    (state) => state.currentExercisePosition
  );
  const token = useStore((state) => state.token);
  const config = useStore((state) => state.configObject);

  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <SimpleButton
        svg={svgs.nextArrowButton}
        extraClass="continue-generation-btn border-blue rounded padding-small text-blue flex-x align-center gap-small svg-blue"
        action={() => setIsOpen(true)}
        text={t("continue")}
      />
      {isOpen && (
        <Modal
          addPadding={false}
          showCloseButton={false}
          outsideClickHandler={() => setIsOpen(false)}
        >
          <div className="chat-feedback-modal">
            <div className="chat-header">
              <div className="chat-avatar">
                <div className="avatar-icon">{svgs.rigoSvg}</div>
              </div>
              <div className="chat-info">
                <h3 className="chat-title">{t("rigobot-is-ready-to-help")}</h3>
              </div>
            </div>

            <div className="chat-message-area">
              <div className="message-bubble user-message">
                <div className="message-content">
                  <textarea
                    ref={textareaRef}
                    className="chat-textarea"
                    placeholder={t("give-feedback-to-rigobot")}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="chat-actions">
              <SimpleButton
                svg={svgs.nextArrowButton}
                extraClass="chat-send-button svg-blue"
                text={t("continue")}
                action={async () => {
                  try {
                    const feedback = textareaRef.current?.value || "";
                    console.log("feedback", feedback);
                    await continueGenerating(
                      config.config.slug,
                      Number(currentExercisePosition),
                      feedback,
                      token
                    );
                    toast.success(t("lesson-generation-started"));
                    onGenerate();
                    setIsOpen(false);
                  } catch (error) {
                    console.log("error continue lesson", error);
                    toast.error(t("error-generating-lesson"));
                  }
                }}
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
