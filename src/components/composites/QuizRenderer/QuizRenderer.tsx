import { useCallback, useEffect, useRef, useState } from "react";
import SimpleButton from "../../mockups/SimpleButton";
import { AskForHint } from "../AskForHint/AskForHint";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { asyncHashText, playEffect } from "../../../utils/lib";
import useStore from "../../../utils/store";
import { Notifier } from "../../../managers/Notifier";
import { svgs } from "../../../assets/svgs";
import TelemetryManager, { TQuizSubmission } from "../../../managers/telemetry";

type TQuizGroup = {
  title: string;
  checkboxes: {
    text: string;
    isCorrect: boolean;
  }[];
  correctAnswer: string;
  currentSelection: string;
};

type TQuiz = {
  hash: string;
  attempts: TQuizSubmission[];
  groups: {
    [key: string]: TQuizGroup;
  };
  renderedGroups: string[];
};

export const makeQuizSubmission = (
  groups: TQuizGroup[],
  quizHash: string
): TQuizSubmission => {
  const correctAnswers = Object.values(groups).filter(
    (group) => group.correctAnswer === group.currentSelection
  );
  const percentage = (correctAnswers.length / groups.length) * 100;
  return {
    submitted_at: Date.now(),
    status: percentage === 100 ? "SUCCESS" : "ERROR",
    percentage,
    quiz_hash: quizHash,
    selections: groups.map((group) => ({
      question: group.title,
      answer: group.currentSelection,
      isCorrect: group.correctAnswer === group.currentSelection,
    })),
  };
};

export const QuizRenderer = ({ children }: { children: any }) => {
  const { t } = useTranslation();
  const [showResults, setShowResults] = useState<boolean>(false);
  const [readyToSubmit, setReadyToSubmit] = useState<boolean>(false);

  const {
    registerTelemetryEvent,
    maxQuizRetries,
    toastFromStatus,
    getTelemetryStep,
    currentExercisePosition,
  } = useStore((state) => ({
    registerTelemetryEvent: state.registerTelemetryEvent,
    maxQuizRetries: state.maxQuizRetries,
    toastFromStatus: state.toastFromStatus,
    getTelemetryStep: state.getTelemetryStep,
    currentExercisePosition: state.currentExercisePosition,
  }));

  const liChildren = children.filter((child: any) => child.type === "li");

  const quiz = useRef<TQuiz>({
    hash: "",
    attempts: [],
    groups: {},
    renderedGroups: [],
  });

  const onGroupReady = (group: TQuizGroup) => {
    quiz.current.groups[group.title] = group;
    setShowResults(false);

    Object.values(quiz.current.groups).length === liChildren.length &&
      setReadyToSubmit(true);
  };

  const onGroupRendered = async (title: string) => {
    // console.log("onGroupRendered", title);
    quiz.current.renderedGroups.push(title);

    if (quiz.current.renderedGroups.length === liChildren.length) {
      quiz.current.hash = await asyncHashText(
        quiz.current.renderedGroups.join(" ")
      );

      TelemetryManager.registerTesteableElement(
        Number(currentExercisePosition),
        {
          type: "quiz",
          hash: quiz.current.hash,
        }
      );
    }
  };

  const onSubmitQuiz = async () => {
    if (Object.keys(quiz.current.groups).length === liChildren.length) {
      const hash = await asyncHashText(
        Object.values(quiz.current.groups)
          .map((group) => group.title)
          .join(" ")
      );
      quiz.current.hash = hash;

      const currentStep = await getTelemetryStep(
        Number(currentExercisePosition)
      );

      if (
        currentStep?.quiz_submissions &&
        currentStep.quiz_submissions.length > 0
      ) {
        // find the submissions with the same hash
        const submissions = currentStep.quiz_submissions.filter(
          (submission) => submission.quiz_hash === quiz.current.hash
        );
        if (submissions.length > 0) {
          quiz.current.attempts = submissions;
        }
      }

      if (quiz.current.attempts.length >= maxQuizRetries) {
        toast.error(t("max-quiz-retries-reached"));
        return;
      }

      const submission = makeQuizSubmission(
        Object.values(quiz.current.groups),
        quiz.current.hash
      );
      quiz.current.attempts.push(submission);

      registerTelemetryEvent("quiz_submission", submission);
      setShowResults(true);
      if (submission.status === "SUCCESS") {
        toastFromStatus("quiz-success");
        TelemetryManager.registerTesteableElement(
          Number(currentExercisePosition),
          {
            type: "quiz",
            hash: quiz.current.hash,
            is_completed: true,
          }
        );
        Notifier.confetti();
        playEffect("success");
      } else {
        toastFromStatus("quiz-error");
        playEffect("error");
      }
    } else {
      toast.error(t("answer-all-questions-before"));
    }
  };

  const handleRigoClick = useCallback(() => {
    return JSON.stringify(quiz.current);
  }, []);

  return (
    <div className="quiz-container">
      {liChildren.map((child: any, index: number) => {
        return (
          <QuizQuestion
            key={index}
            onGroupReady={onGroupReady}
            onGroupRendered={onGroupRendered}
            showResults={showResults}
          >
            {child.props.children}
          </QuizQuestion>
        );
      })}
      <div className="flex-x justify-center align-center gap-small button-wrapper">
        {readyToSubmit && (
          <>
            <SimpleButton
              extraClass=""
              action={() => {
                TelemetryManager.registerTesteableElement(
                  Number(currentExercisePosition),
                  {
                    type: "quiz",
                    hash: quiz.current.hash,
                    is_completed: true,
                  }
                );
              }}
              svg={svgs.toolIcon}
              text={t("remake-metrics")}
            />
            <SimpleButton
              extraClass="quiz-button active-on-hover bg-blue-rigo text-white"
              action={onSubmitQuiz}
              svg={svgs.send}
              text={t("submit-quiz")}
            />
          </>
        )}
        <AskForHint getContext={handleRigoClick} from={"quiz"} />
      </div>
    </div>
  );
};

const QuizQuestion = ({
  children,
  onGroupReady,
  onGroupRendered,
  showResults,
}: {
  children: any;
  onGroupReady: (group: TQuizGroup) => void;
  onGroupRendered: (title: string) => void;
  showResults: boolean;
}) => {
  if (!children) {
    console.log("No children found for quiz question");
    return null;
  }

  const [currentAnswer, setCurrentAnswer] = useState<string>("");

  const p = children.find((child: any) => {
    return child.key && child.key.startsWith("p-");
  });
  const ul = children.find((child: any) => {
    return child.key && child.key.startsWith("ul-");
  });

  if (!p || !ul) {
    console.log("No p or ul found for quiz question");
    return null;
  }

  const groupRef = useRef<TQuizGroup>({
    title: "",
    checkboxes: [],
    correctAnswer: "",
    currentSelection: "",
  });

  const liChildren = ul.props.children.filter(
    (child: any) => child.type === "li"
  );

  const onAnswerClick = (answer: string) => {
    groupRef.current.currentSelection = answer;
    setCurrentAnswer(answer);
    onGroupReady(groupRef.current);
  };

  const onAnswerReady = (answer: string, isCorrect: boolean) => {
    if (groupRef.current) {
      if (isCorrect) {
        groupRef.current.correctAnswer = answer;
      }
      groupRef.current.checkboxes.push({
        text: answer,
        isCorrect: isCorrect,
      });
    } else {
      console.error("No group ref found");
    }
  };

  const onTitleReady = (title: string) => {
    groupRef.current.title = title;
    onGroupRendered(title);
  };

  return (
    <div className="flex-y gap-small">
      <QuizTitle onTitleReady={onTitleReady}>{p}</QuizTitle>
      {liChildren.map((child: any, index: number) => {
        return (
          <QuizAnswer
            key={child.type + index}
            showResults={showResults}
            currentAnswer={currentAnswer}
            onAnswerReady={onAnswerReady}
            onAnswer={onAnswerClick}
            children={child.props.children}
          />
        );
      })}
    </div>
  );
};

const QuizTitle = ({
  children,
  onTitleReady,
}: {
  children: any;
  onTitleReady: (title: string) => void;
}) => {
  const h3Ref = useRef<HTMLHRElement>(null);

  useEffect(() => {
    if (h3Ref.current) {
      onTitleReady(h3Ref.current.textContent?.trim() || "");
    }
  }, [h3Ref.current]);

  return <h3 ref={h3Ref}>{children}</h3>;
};

const QuizAnswer = ({
  children,
  onAnswer,
  onAnswerReady,
  currentAnswer,
  showResults,
}: {
  children: any;
  onAnswer: (answer: string) => void;
  onAnswerReady: (answer: string, isCorrect: boolean) => void;
  currentAnswer: string;
  showResults: boolean;
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  if (!children) {
    return null;
  }

  if (typeof children.find !== "function") {
    return children;
  }
  const input = children.find((child: any) => child.type === "input");

  if (!input) {
    const paragraph = children.find((child: any) => {
      return child?.key && child?.key.startsWith("p-");
    });
    if (paragraph) {
      return (
        <QuizAnswer
          children={paragraph.props.children}
          onAnswer={onAnswer}
          onAnswerReady={onAnswerReady}
          currentAnswer={currentAnswer}
          showResults={showResults}
        />
      );
    }
    return null;
  }
  const isCorrect = input.props.checked;
  const [isSelected, setIsSelected] = useState<boolean>(false);

  const restChildren = children.filter((child: any) => child.type !== "input");

  useEffect(() => {
    if (divRef.current) {
      onAnswerReady(divRef.current.textContent?.trim() || "", isCorrect);
    }
  }, [divRef.current]);

  useEffect(() => {
    setIsSelected(currentAnswer === divRef.current?.textContent?.trim());
  }, [currentAnswer]);

  return (
    <div
      ref={divRef}
      className={`quiz-answer  ${
        showResults && isSelected && isCorrect && "bg-soft-green "
      } ${showResults && isSelected && !isCorrect && "bg-soft-red "}`}
      onClick={() => {
        if (divRef.current) {
          onAnswer(divRef.current.textContent?.trim() || "");
        }
      }}
    >
      <div className={`quiz-answer-checkbox ${isSelected ? "selected" : ""}`}>
        {isSelected && isCorrect && showResults && svgs.iconCheck}
        {isSelected && !isCorrect && showResults && svgs.iconClose}
      </div>
      {restChildren}
    </div>
  );
};
