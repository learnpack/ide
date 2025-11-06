import { useEffect, useRef, useState } from "react";
import SimpleButton from "../../mockups/SimpleButton";
import { AskForHint } from "../AskForHint/AskForHint";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { asyncHashText, debounce, playEffect } from "../../../utils/lib";
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
  started_at: number;
};

export const makeQuizSubmission = (
  groups: TQuizGroup[],
  quizHash: string,
  started_at: number
): TQuizSubmission => {
  const correctAnswers = Object.values(groups).filter(
    (group) => group.correctAnswer === group.currentSelection
  );
  const percentage = (correctAnswers.length / groups.length) * 100;
  return {
    started_at,
    ended_at: Date.now(),
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
  const [quizRendered, setQuizRendered] = useState<boolean>(false);
  const [restoredSelections, setRestoredSelections] = useState<Record<string, string>>({});

  const {
    registerTelemetryEvent,
    maxQuizRetries,
    toastFromStatus,
    getTelemetryStep,
    currentExercisePosition,
    useConsumable,
    reportEnrichDataLayer,
  } = useStore((state) => ({
    registerTelemetryEvent: state.registerTelemetryEvent,
    maxQuizRetries: state.maxQuizRetries,
    toastFromStatus: state.toastFromStatus,
    getTelemetryStep: state.getTelemetryStep,
    currentExercisePosition: state.currentExercisePosition,
    useConsumable: state.useConsumable,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
  }));



  const liChildren = children.filter((child: any) => child.type === "li");

  const quiz = useRef<TQuiz>({
    hash: "",
    attempts: [],
    groups: {},
    renderedGroups: [],
    started_at: 0,
  });

  const hasRestoredData = useRef(false);

  const register = async () => {
    TelemetryManager.registerTesteableElement(
      Number(currentExercisePosition),
      {
        type: "quiz",
        hash: quiz.current.hash,
        searchString: quiz.current.renderedGroups[0] || "",
      }
    );
  };


  const debouncedRegister = debounce(register, 2000);

  useEffect(() => {
    if (quiz.current.hash && quizRendered) {
      debouncedRegister();
    }
    return () => {
      debouncedRegister.cancel();
    };
  }, [quizRendered]);

  // Recover quiz state from telemetry when component mounts
  useEffect(() => {
    // Only attempt recovery after quiz is fully rendered and has a hash
    if (!quiz.current.hash || !quizRendered) return;

    const recoverState = async () => {
      try {
        const currentStep = await getTelemetryStep(Number(currentExercisePosition));
        
        if (!currentStep?.quiz_submissions) return;

        // Find submissions for this specific quiz
        const submissions = currentStep.quiz_submissions.filter(
          (submission) => submission.quiz_hash === quiz.current.hash
        );

        if (submissions.length === 0) return;

        // Get the last submission (successful or failed)
        const lastSubmission = submissions[submissions.length - 1];

        if (!lastSubmission) return;
       
        // Restore attempts history
        quiz.current.attempts = submissions;

        // Create an object with restored selections for React state
        const restored: Record<string, string> = {};
        
        // Restore selections from telemetry
        lastSubmission.selections?.forEach((selection) => {
          // Store directly in state for React to render
          restored[selection.question] = selection.answer;
          
          // Also update in groups if they exist (for ref consistency)
          const groupKey = Object.keys(quiz.current.groups).find(
            (key) => quiz.current.groups[key].title === selection.question
          );
          
          if (groupKey) {
            quiz.current.groups[groupKey].currentSelection = selection.answer;
          }
        });

        // Update state to trigger re-render with restored selections
        setRestoredSelections(restored);
        setShowResults(true);
        hasRestoredData.current = true; // Mark that we restored data from telemetry
        
      } catch (error) {
        console.error("Error recovering quiz state from telemetry:", error);
        // Fail silently - doesn't affect core functionality
      }
    };

    recoverState();
  }, [quiz.current.hash, quizRendered, getTelemetryStep, currentExercisePosition]);


  const onGroupReady = (group: TQuizGroup) => {
    if (quiz.current.started_at === 0) quiz.current.started_at = Date.now();

    // If user interacts after restore, clear all other questions
    if (hasRestoredData.current && Object.keys(restoredSelections).length > 0) {
      // Signal to clear all questions except the one being clicked
      setRestoredSelections({});
      setShowResults(false);
      hasRestoredData.current = false;
    }

    quiz.current.groups[group.title] = group;
    setShowResults(false);

    Object.values(quiz.current.groups).length === liChildren.length &&
      setReadyToSubmit(true);
  };

  const onGroupRendered = async (title: string) => {
    quiz.current.renderedGroups.push(title);
    
    if (quiz.current.renderedGroups.length === liChildren.length) {
      quiz.current.hash = await asyncHashText(
        quiz.current.renderedGroups.join(" ")
      );
      setQuizRendered(true);
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
        currentStep &&
        currentStep.quiz_submissions &&
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
        quiz.current.hash,
        quiz.current.started_at
      );
      quiz.current.attempts.push(submission);

      registerTelemetryEvent("quiz_submission", submission);
      setShowResults(true);
      if (submission.status === "SUCCESS") {
        toastFromStatus("quiz-success");
        Notifier.confetti();
        playEffect("success");
        reportEnrichDataLayer("quiz_success", {});
      } else {
        toastFromStatus("quiz-error");
        playEffect("error");
        reportEnrichDataLayer("quiz_error", {});
      }
      TelemetryManager.registerTesteableElement(
        Number(currentExercisePosition),
        {
          type: "quiz",
          hash: quiz.current.hash,
          is_completed: true,
          searchString: quiz.current.renderedGroups[0] || "",
        }
      );
      useConsumable("ai-compilation");
      quiz.current.started_at = 0;
    } else {
      toast.error(t("answer-all-questions-before"));
    }
  };

  const handleRigoClick = () => {
    return JSON.stringify(quiz.current);
  };

  return (
    <div className="quiz-container">
      {liChildren.map((child: any, index: number) => {
        return (
          <QuizQuestion
            key={index}
            onGroupReady={onGroupReady}
            onGroupRendered={onGroupRendered}
            showResults={showResults}
            restoredSelections={restoredSelections}
          >
            {child.props.children}
          </QuizQuestion>
        );
      })}
      <div className="flex-x justify-center align-center gap-small button-wrapper">
        {readyToSubmit && (
          <>
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
  restoredSelections,
}: {
  children: any;
  onGroupReady: (group: TQuizGroup) => void;
  onGroupRendered: (title: string) => void;
  showResults: boolean;
  restoredSelections: Record<string, string>;
}) => {
  if (!children) {
    console.log("No children found for quiz question");
    return null;
  }

  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [questionTitle, setQuestionTitle] = useState<string>("");
  const restoredAnswer = useRef<string>(""); // Track what was restored from telemetry

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
    // Prevent clearing if user clicks the same answer they already have
    if (currentAnswer === answer) return;
    
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
    setQuestionTitle(title);
    onGroupRendered(title);
  };

  // Restore selection when title is ready and there's a restored selection
  useEffect(() => {
    if (questionTitle && restoredSelections[questionTitle]) {
      // Restore from telemetry
      const restored = restoredSelections[questionTitle];
      setCurrentAnswer(restored);
      groupRef.current.currentSelection = restored;
      restoredAnswer.current = restored; // Remember what we restored
    } else if (questionTitle && Object.keys(restoredSelections).length === 0 && restoredAnswer.current) {
      // restoredSelections was cleared (user clicked), clear this question if it still has the restored value
      if (currentAnswer === restoredAnswer.current) {
        setCurrentAnswer("");
        groupRef.current.currentSelection = "";
      }
      restoredAnswer.current = ""; // Reset
    }
  }, [questionTitle, restoredSelections, currentAnswer]);

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
      className={`quiz-answer  ${showResults && isSelected && isCorrect && "bg-soft-green "
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
