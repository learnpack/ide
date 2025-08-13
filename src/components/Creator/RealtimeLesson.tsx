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
const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

export default function RealtimeLesson() {
  const { t } = useTranslation();
  const getCurrentExercise = useStore((state) => state.getCurrentExercise);
  const currentExercisePosition = useStore(
    (state) => state.currentExercisePosition
  );
  const config = useStore((state) => state.configObject);
  const fetchReadme = useStore((state) => state.fetchReadme);
  const syllabus = useStore((state) => state.syllabus);
  const fetchExercises = useStore((state) => state.fetchExercises);
  const [updates, setUpdates] = useState<string[]>([
    `🚀 Generating lesson for ${getCurrentExercise()?.slug}`,
  ]);

  const handleUpdate = (data: any) => {
    if (data && data.status === "done") {
      setTimeout(async () => {
        await fetchExercises();
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
  // const isPreviousMultipleOf3 = (Number(currentExercisePosition) - 1) % 3 === 0;

  return (
    <div className="flex-y gap-big padding-big lesson-loader">
      {syllabus.lessons[Number(currentExercisePosition)] && (
        <h3>{syllabus.lessons[Number(currentExercisePosition)].title}</h3>
      )}
      <div className=" d-flex align-center gap-small justify-between">
        <span>
          {t("this-lesson-is-being-processed-and-will-be-ready-soon")}
        </span>
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
          {syllabus.lessons[Number(currentExercisePosition)]?.status ||
            "PENDING"}
        </div>
        {previousLesson && previousLesson.generated && (
          <ContinueGenerationButton />
        )}
        {/* syllabus.lessons[Number(currentExercisePosition)] &&
          ["PENDING", "ERROR", "GENERATING"].includes(
            syllabus.lessons[Number(currentExercisePosition)].status || ""
          ) && <ContinueGenerationButton />} */}
      </div>
      <ProgressBar duration={20} height={4} />

      <div className="bg-gray padding-big rounded">
        {syllabus.lessons[Number(currentExercisePosition)]?.description}
      </div>

      <div
        style={{ background: "#FAFDFF", border: "1px solid #C8DBFC" }}
        className=" rounded padding-small"
      >
        {updates.map((update) => (
          <p key={update}>{update}</p>
        ))}
      </div>
    </div>
  );
}

const ContinueGenerationButton = () => {
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
        extraClass="border-blue rounded padding-small text-blue flex-x align-center gap-small svg-blue"
        action={() => setIsOpen(true)}
        text={
          t("continue")
        }
      />
      {isOpen && (
        <Modal outsideClickHandler={() => setIsOpen(false)}>
          <div>
            <h2>{t("give-feedback-on-the-course-so-far")}</h2>
            <textarea
              ref={textareaRef}
              className="textarea w-100"
              placeholder={t("give-feedback-to-rigobot")}
              rows={5}
            />
            <div className="flex-x justify-center">
              <SimpleButton
                svg={svgs.nextArrowButton}
                extraClass="border-blue rounded padding-small text-blue flex-x align-center gap-small svg-blue"
                text={t("continue")}
                action={async () => {
                  try {
                    toast.success(t("lesson-generation-started"));
                    const feedback = textareaRef.current?.value || "";
                    console.log("feedback", feedback);
                    continueGenerating(
                      config.config.slug,
                      Number(currentExercisePosition),
                      feedback,
                      token
                    );
                    setIsOpen(false);
                  } catch (error) {
                    console.log("error continue lesson", error);
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
