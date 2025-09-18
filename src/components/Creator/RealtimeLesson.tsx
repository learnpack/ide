import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import ProgressBar from "../composites/ProgressBar/ProgressBar";
import { DEV_MODE } from "../../utils/lib";
import SimpleButton from "../mockups/SimpleButton";
import { continueGenerating } from "../../utils/creator";
import toast from "react-hot-toast";
import "./RealtimeLesson.css";
import { svgs } from "../../assets/svgs";
import { Lesson } from "../../utils/storeTypes";
import CustomDropdown from "../CustomDropdown";
const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

const BigRigoMessage = ({ message, svg }: { message: string, svg: React.ReactNode }) => {
  return (
    <div className="rigo-message">
      <p className="extra-big-svg">
        {svg}
      </p>
      <p className="bg-1 rounded padding-small text-heavy-blue border-light-blue">
        {message}
      </p>
    </div>
  );
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
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [previousLesson, setPreviousLesson] = useState<Lesson | null>(null);

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

  useEffect(() => {
    const previousLesson = syllabus.lessons
      ? syllabus.lessons[Number(currentExercisePosition) - 1]
      : null;

    const lesson = syllabus.lessons
      ? syllabus.lessons[Number(currentExercisePosition)]
      : null;

    setLesson(lesson);
    setPreviousLesson(previousLesson);

  }, [syllabus, currentExercisePosition]);

  

  return (
    <div className="flex-y gap-big padding-big lesson-loader">
      {/* {lesson && <h3>{lesson.title}</h3>} */}


      <ContinueGenerationButton
        status={lesson?.status || "PENDING"}
        prevLessonStatus={previousLesson?.status || "PENDING"}
        title={lesson?.title || ""}
        description={lesson?.description || ""}
        onGenerate={() => {
          getSyllabus();
          setUpdates((prev) => [
            ...prev,
            "🚀 " + t("lesson-generation-started"),
          ]);
        }}
      />


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
  description,
  status,
  title,
  prevLessonStatus,
}: {
  onGenerate: () => void;
  description: string;
  status: "PENDING" | "GENERATING" | "DONE" | "ERROR";
  title: string;
  prevLessonStatus: "PENDING" | "GENERATING" | "DONE" | "ERROR";
}) => {
  const { t } = useTranslation();

  const currentExercisePosition = useStore(
    (state) => state.currentExercisePosition
  );
  const token = useStore((state) => state.token);
  const config = useStore((state) => state.configObject);

  const handleContinue = async (mode: "next-three" | "continue-with-all" = "next-three") => {
    try {
      await continueGenerating(
        config.config.slug,
        Number(currentExercisePosition),
        "",
        mode,
        token
      );
      toast.success(t("lesson-generation-started"));
      onGenerate();
    } catch (error) {
      console.log("error continue lesson", error);
      toast.error(t("error-generating-lesson"));
    }
  };

  if (status === "GENERATING") {
    return (
      <div className="flex-y gap-small align-center justify-center">
        <ProgressBar duration={60} height={2} />
        <BigRigoMessage svg={svgs.rigoWait} message={t("waitImGeneratingTheLesson", { step: title })} />
        <TimeOutButton
          handleContinue={handleContinue}
          timeoutSeconds={DEV_MODE ? 5 : 120}
        />
      </div>
    );
  }
  if (status === "DONE") {
    return null;
  }

  return (
    <>
      <div className="flex-y gap-small">
        <BigRigoMessage svg={svgs.happyRigo} message={t("thisStepWillBeAbout") + description} />
      </div>

      {prevLessonStatus === "DONE" && (
          <div className="flex-x gap-small justify-end wrap-wrap">
          <ContinueWithOptions handleContinue={handleContinue} />
          <SimpleButton
            svg={"🤔"}
            extraClass=" border-blue rounded padding-small text-blue flex-x align-center gap-small svg-blue"
            action={() => {
              // Open agent with lesson modification context
              const { toggleRigo, setRigoContext } = useStore.getState();
              setRigoContext({
                context: `Current lesson: ${title}\nDescription: ${description}\nStatus: ${status}`,
                userMessage: `I want to modify the content of this lesson: "${title}". ${description}`,
                performTests: false,
                allowedFunctions: ["continueGeneration"],
              });
              toggleRigo({ ensure: "open" });
            }}
            text={t("IHaveSomeFeedback")}
          />
        </div>
      )}
    </>
  );
};

const ContinueWithOptions = ({ handleContinue }: { handleContinue: (mode: "next-three" | "continue-with-all") => void }) => {
  const { t } = useTranslation()
  return <CustomDropdown menuClassName="w-250px flex-y gap-small" position="center" trigger={
    <SimpleButton
      svg={"😀"}
      extraClass=" border-blue rounded padding-small text-blue flex-x align-center gap-small svg-blue bg-blue-rigo text-white"
      text={t("iLikeItContinue")}
    />
  }>
    <SimpleButton
      extraClass=" border-blue rounded padding-small text-blue flex-x align-center gap-small bg-blue-rigo text-white w-100"
      action={() => handleContinue("next-three")}
      text={t("generateNextThree")}
      svg={svgs.next}
    />
    <SimpleButton
      extraClass=" border-blue rounded padding-small text-blue flex-x align-center gap-small  bg-blue-rigo text-white w-100"
      action={() => handleContinue("continue-with-all")}
      text={t("continueWithAll")}
      svg={svgs.fastForward}
    />
  </CustomDropdown>
};

const TimeOutButton = ({
  handleContinue,
  timeoutSeconds = 10,
}: {
  handleContinue: () => void;
  timeoutSeconds?: number;
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, timeoutSeconds * 1000);

    return () => clearTimeout(timer);
  }, [timeoutSeconds]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex-x gap-small align-center justify-center bg-1 padding-small rounded">
      <p className="w-200px text-small">
        {t("lesson-generation-timeout-description")}
      </p>
      <SimpleButton
        text={loading ? t("loading") : t("retryGeneration")}
        action={async () => {
          setLoading(true);
          await handleContinue();
          setLoading(false);
        }}
        extraClass="bg-blue-rigo text-white padding-small w-fit-content rounded"
      />
    </div>
  );
};
