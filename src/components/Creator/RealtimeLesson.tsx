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
      {previousLesson && previousLesson.status === "DONE" && (
        <ContinueGenerationButton
          status={lesson?.status || "PENDING"}
          description={lesson?.description}
          onGenerate={() => {
            getSyllabus();
            setUpdates((prev) => [
              ...prev,
              "🚀 " + t("lesson-generation-started"),
            ]);
          }}
        />
      )}

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

type Message = {
  type: "user" | "assistant";
  text: string;
};

const ContinueGenerationButton = ({
  onGenerate,
  description,
  status,
}: {
  onGenerate: () => void;
  description: string;
  status: "PENDING" | "GENERATING" | "DONE" | "ERROR";
}) => {
  const { t } = useTranslation();

  const currentExercisePosition = useStore(
    (state) => state.currentExercisePosition
  );
  const token = useStore((state) => state.token);
  const config = useStore((state) => state.configObject);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages([
      { type: "assistant", text: t("thisStepWillBeAbout") + description },
    ]);
  }, []);

  const handleContinue = async () => {
    try {
      const feedback = messages
        .filter((msg) => msg.type === "user")
        .map((msg) => msg.text)
        .join("\n");

      console.log("Feedback to Rigo", feedback);

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
  };

  const handleAddUserMessage = () => {
    const value = textareaRef.current!.value || "";
    setMessages((prev) => [
      ...prev,
      { type: "user", text: value },
      {
        type: "assistant",
        text: t("okIllIncorporateThat"),
      },
    ]);
    textareaRef.current!.value = "";
    setIsOpen(false);
  };

  if (status === "GENERATING") {
    return <ProgressBar duration={20} height={4} />;
  }
  if (status === "DONE") {
    return null;
  }

  return (
    <>
      <div className="flex-y gap-small padding-big">
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              flexDirection: message.type === "user" ? "row-reverse" : "row",
            }}
            className="flex-x gap-small align-center"
          >
            {message.type === "assistant" && (
              <div className="big-svg rigo-button">{svgs.rigoSoftBlue}</div>
            )}
            {message.type === "user" && (
              <div
                style={{
                  border: "1px solid var(--color-blue-rigo)",
                  borderRadius: "50%",
                  width: "50px",
                  height: "50px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                }}
                className=" border-blue align-center justify-center bg-1 text-blue"
              >
                <span>{t("you")}</span>
              </div>
            )}
            <p className="bg-2 padding-small rounded text-heavy-blue border-heavy-blue w-100">
              {message.text}
            </p>
          </div>
        ))}
      </div>

      {isOpen ? (
        <div className="">
          <div className=" flex-x gap-small padding-small rounded">
            <textarea
              ref={textareaRef}
              className=" textarea border-gray w-100"
              onKeyUp={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddUserMessage();
                }
              }}
              placeholder={t("give-feedback-to-rigobot")}
              rows={2}
            />
            <SimpleButton
              svg={svgs.nextArrowButton}
              extraClass="svg-blue"
              title={t("send")}
              action={handleAddUserMessage}
            />
          </div>
        </div>
      ) : (
        <div className="flex-x gap-small justify-end">
          <SimpleButton
            svg={"😀"}
            extraClass=" border-blue rounded padding-small text-blue flex-x align-center gap-small svg-blue bg-blue-rigo text-white"
            action={handleContinue}
            text={t("iLikeItContinue")}
          />
          <SimpleButton
            svg={"🤔"}
            extraClass=" border-blue rounded padding-small text-blue flex-x align-center gap-small svg-blue"
            action={() => setIsOpen(true)}
            text={t("IHaveSomeFeedback")}
          />
        </div>
      )}
    </>
  );
};
