import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import ProgressBar from "../composites/ProgressBar/ProgressBar";
import { DEV_MODE, slugify } from "../../utils/lib";
import SimpleButton from "../mockups/SimpleButton";
import {
  continueGenerating,
  isLessonAlreadyGenerating,
} from "../../utils/creator";
import toast from "react-hot-toast";
import "./RealtimeLesson.css";
import { svgs } from "../../assets/svgs";
import { Lesson, TGenerationMode } from "../../utils/storeTypes";
import CustomDropdown from "../CustomDropdown";
const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

const BigRigoMessage = ({
  message,
  svg,
}: {
  message: string;
  svg: React.ReactNode;
}) => {
  return (
    <div className="rigo-message">
      <p className="extra-big-svg">{svg}</p>
      <p className="bg-1 rounded padding-small text-heavy-blue border-light-blue">
        {message}
      </p>
    </div>
  );
};

export default function RealtimeLesson() {
  const { t } = useTranslation();
  const getCurrentExercise = useStore((state) => state.getCurrentExercise);
  const config = useStore((state) => state.configObject);
  const fetchReadme = useStore((state) => state.fetchReadme);
  const syllabus = useStore((state) => state.syllabus);
  const getSyllabus = useStore((state) => state.getSyllabus);
  const [updates, setUpdates] = useState<string[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null); 


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


    
  const currentSlug = getCurrentExercise()?.slug;
  const currentLesson = syllabus.lessons?.find((lesson) => {
    const slug = slugify(lesson.id + "-" + lesson.title);
    return slug === currentSlug;
  });
    const lesson = currentLesson || null; 

    setLesson(lesson);
  }, [syllabus]);

  console.log("LESSON", lesson);
  

  return (
    <div className="flex-y gap-big padding-big lesson-loader">
      {/* {lesson && <h3>{lesson.title}</h3>} */}

      <ContinueGenerationButton
        status={lesson?.status || "PENDING"}
        title={lesson?.title || ""}
        lessonId={lesson?.uid || ""}
        description={lesson?.description || ""}
        generationMode={syllabus.generationMode}
        activity={updates.length}
        onGenerate={async () => {
          setUpdates((prev) => [
            ...prev,
            "🚀 " + t("lesson-generation-started"),
          ]);
          await getSyllabus();
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
  lessonId,
  status,
  title,
  generationMode,
  activity,
}: {
  onGenerate: () => Promise<void>;
  description: string;
  lessonId: string;
  status: "PENDING" | "GENERATING" | "DONE" | "ERROR";
  title: string;
  generationMode?: TGenerationMode;
  activity: number;
}) => {
  const { t } = useTranslation();

  const token = useStore((state) => state.token);
  const config = useStore((state) => state.configObject);
  const getSyllabus = useStore((state) => state.getSyllabus);
  // While a request is on its way, another click would start a second job.
  const [starting, setStarting] = useState(false);

  // The retry buttons offer no mode, so they keep the one the user picked.
  const handleContinue = async (mode?: TGenerationMode) => {
    if (starting) return;
    setStarting(true);
    const statusBefore = status;

    try {
      await continueGenerating(
        config.config.slug,
        lessonId,
        "",
        mode || generationMode || "next-three",
        token
      );
      toast.success(t("lesson-generation-started"));
      await onGenerate();
    } catch (error) {
      console.log("error continue lesson", error);

      if (isLessonAlreadyGenerating(error)) {
        toast(t("lesson-already-generating"));
        await getSyllabus();
        return;
      }

      // The request can fail while the server keeps working. If the lesson
      // was not generating before and is now, the generation did start.
      await getSyllabus();
      const lessonNow = useStore
        .getState()
        .syllabus.lessons?.find((lesson) => lesson.uid === lessonId);
      if (statusBefore !== "GENERATING" && lessonNow?.status === "GENERATING") {
        toast.success(t("lesson-generation-started"));
        await onGenerate();
        return;
      }

      toast.error(t("error-generating-lesson"));
    } finally {
      setStarting(false);
    }
  };

  if (status === "GENERATING") {
    return (
      <div className="flex-y gap-small align-center justify-center">
        <ProgressBar duration={60} height={2} />
        <BigRigoMessage
          svg={svgs.rigoWait}
          message={t("waitImGeneratingTheLesson", { step: title })}
        />
        <TimeOutButton
          handleContinue={() => handleContinue()}
          timeoutSeconds={DEV_MODE ? 5 : 120}
          activity={activity}
        />
      </div>
    );
  }

  if (status === "ERROR") {
    return (
      <div className="flex-y gap-small align-center justify-center">
        <BigRigoMessage
          svg={svgs.rigoWait}
          message={`❌ Error generating lesson: ${title}`}
        />
        <div className="flex-x gap-small justify-center">
          <SimpleButton
            svg={"🔄"}
            extraClass="border-red rounded padding-small text-red flex-x align-center gap-small bg-red-50"
            action={() => handleContinue()}
            disabled={starting}
            text="Retry Generation"
          />
          <SimpleButton
            svg={"🤔"}
            extraClass="border-blue rounded padding-small text-blue flex-x align-center gap-small svg-blue"
            action={() => {
              const { toggleRigo, setRigoContext } = useStore.getState();
              setRigoContext({
                context: `Current lesson in generation: ${title}\nDescription: ${description}\nStatus: ${status}`,
                aiMessage: t("explainMeWhichChangesYouWantToMake"),
                performTests: false,
                allowedFunctions: ["continueGeneration"],
              });
              toggleRigo({ ensure: "open" });
            }}
            text={t("IHaveSomeFeedback")}
          />
        </div>
      </div>
    );
  }

  if (status === "DONE") {
    return null;
  }

  return (
    <>
      <div className="flex-y gap-small">
        <BigRigoMessage
          svg={svgs.happyRigo}
          message={t("thisStepWillBeAbout") + description}
        />
      </div>

      <div className="flex-x gap-small justify-end wrap-wrap">
        <ContinueWithOptions
          handleContinue={handleContinue}
          disabled={starting}
        />
        <SimpleButton
          svg={"🤔"}
          extraClass=" border-blue rounded padding-small text-blue flex-x align-center gap-small svg-blue"
          action={() => {
            // Open agent with lesson modification context
            const { toggleRigo, setRigoContext } = useStore.getState();
            toggleRigo({ ensure: "open" });
            setRigoContext({
              context: `Current lesson in generation: ${title}\nDescription: ${description}\nStatus: ${status}`,
              aiMessage: t("explainMeWhichChangesYouWantToMake"),
              performTests: false,
              allowedFunctions: ["continueGeneration"],
            });
          }}
          text={t("IHaveSomeFeedback")}
        />
      </div>
    </>
  );
};

const ContinueWithOptions = ({
  handleContinue,
  disabled,
}: {
  handleContinue: (mode: TGenerationMode) => void;
  disabled: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <CustomDropdown
      menuClassName="w-250px flex-y gap-small"
      position="center"
      trigger={
        <SimpleButton
          svg={"😀"}
          extraClass=" border-blue rounded padding-small text-blue flex-x align-center gap-small svg-blue bg-blue-rigo text-white"
          text={t("iLikeItContinue")}
        />
      }
    >
      <SimpleButton
        extraClass=" border-blue rounded padding-small text-blue flex-x align-center gap-small bg-blue-rigo text-white w-100"
        action={() => handleContinue("next-three")}
        disabled={disabled}
        text={t("generateNextThree")}
        svg={svgs.next}
      />
      <SimpleButton
        extraClass=" border-blue rounded padding-small text-blue flex-x align-center gap-small  bg-blue-rigo text-white w-100"
        action={() => handleContinue("continue-with-all")}
        disabled={disabled}
        text={t("continueWithAll")}
        svg={svgs.fastForward}
      />
    </CustomDropdown>
  );
};

// Offers a retry only after a while without news. A lesson often takes more
// than the timeout in total, so the count restarts with every update.
const TimeOutButton = ({
  handleContinue,
  timeoutSeconds = 10,
  activity,
}: {
  handleContinue: () => Promise<void>;
  timeoutSeconds?: number;
  activity: number;
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  // Bumped after each retry, so the button waits the full time again.
  const [round, setRound] = useState(0);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, timeoutSeconds * 1000);

    return () => clearTimeout(timer);
  }, [timeoutSeconds, round, activity]);

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
        disabled={loading}
        action={async () => {
          setLoading(true);
          try {
            await handleContinue();
          } finally {
            setLoading(false);
            setIsVisible(false);
            setRound((value) => value + 1);
          }
        }}
        extraClass="bg-blue-rigo text-white padding-small w-fit-content rounded"
      />
    </div>
  );
};
