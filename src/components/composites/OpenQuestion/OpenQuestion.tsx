import { svgs } from "../../../assets/svgs";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { suggestExamples } from "../../../managers/EventProxy";
import { Element } from "hast";
import { useEffect, useRef, useState } from "react";
import { asyncHashText, debounce, playEffect } from "../../../utils/lib";

import { SpeechToTextButton } from "../SpeechRecognitionButton/SpeechRecognitionButton";

import { Notifier } from "../../../managers/Notifier";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { Modal } from "../../mockups/Modal";
import { TMetadata } from "../Markdowner/types";
import { AutoResizeTextarea } from "../AutoResizeTextarea/AutoResizeTextarea";
import { Markdowner } from "../Markdowner/Markdowner";
import TelemetryManager, { TTesteableElement } from "../../../managers/telemetry";
import { makeQuizSubmission } from "../QuizRenderer/QuizRenderer";
import { RigoAI } from "../../Rigobot/AI";
import CustomDropdown from "../../CustomDropdown";
import { Icon } from "../../Icon"
const splitInLines = (code: string) => {
  return code.split("\n").filter((line) => line.trim() !== "");
};

type TFeedback = {
  exit_code: number;
  feedback: string;
};

export const Question = ({
  metadata,
  wholeMD,
  code,
  isCreator,
  node,
}: {
  metadata: TMetadata;
  wholeMD: string;
  code: string;
  isCreator: boolean;
  node: Element | undefined;
}) => {
  const { t } = useTranslation();
  const {
    replaceInReadme,
    mode,
    currentExercisePosition,
    useConsumable,
    registerTelemetryEvent,
    reportEnrichDataLayer,
    getTelemetryStep,
    token,
    setOpenedModals,
  } = useStore((state) => ({
    replaceInReadme: state.replaceInReadme,
    mode: state.mode,
    token: state.token,
    currentExercisePosition: state.currentExercisePosition,
    useConsumable: state.useConsumable,
    registerTelemetryEvent: state.registerTelemetryEvent,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    getTelemetryStep: state.getTelemetryStep,
    setOpenedModals: state.setOpenedModals,
  }));

  const [feedback, setFeedback] = useState<TFeedback | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [examples, setExamples] = useState<string[]>(splitInLines(code));
  const [answer, setAnswer] = useState("");
  const [questionHash, setQuestionHash] = useState<string>("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const hashRef = useRef<string>("");
  const startedAtRef = useRef<number>(0);
  const isRestoredFeedbackRef = useRef(false);

  // Generate hash immediately when component mounts or metadata.eval changes
  useEffect(() => {
    if (metadata.eval && !questionHash) {
      const generateHash = async () => {
        const hash = await asyncHashText(metadata.eval as string);
        hashRef.current = hash;
        setQuestionHash(hash);
      };
      generateHash();
    }
  }, [metadata.eval, questionHash]);

  const register = async () => {
    if (!questionHash) return;
    
    const elem: TTesteableElement = {
      type: "quiz",
      hash: questionHash,
      searchString: metadata.eval as string,
    }
    TelemetryManager.registerTesteableElement(Number(currentExercisePosition), elem);
  };

  const debouncedRegister = debounce(register, 2000);

  useEffect(() => {
    if (feedbackRef.current && mode !== "creator" && feedback && !isRestoredFeedbackRef.current) {
      feedbackRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
    // Reset the flag after checking
    if (isRestoredFeedbackRef.current) {
      isRestoredFeedbackRef.current = false;
    }
  }, [feedback, mode]);

  useEffect(() => {
    if (questionHash) {
      debouncedRegister();
    }
    return () => {
      debouncedRegister.cancel();
    };
  }, [questionHash]);

  // Recover answer state from telemetry when component mounts
  useEffect(() => {
    if (!questionHash || !metadata.eval) return;

    const recoverState = async () => {
      try {
        const currentStep = await getTelemetryStep(Number(currentExercisePosition));
        
        if (!currentStep?.quiz_submissions) return;

        // Find submissions for this specific question
        const submissions = currentStep.quiz_submissions.filter(
          (submission) => submission.quiz_hash === questionHash
        );

        if (submissions.length === 0) return;

        // Get the last submission (successful or failed)
        const lastSubmission = submissions[submissions.length - 1];

        if (!lastSubmission || !lastSubmission.selections || lastSubmission.selections.length === 0) return;

        // Restore answer from the last submission
        const restoredAnswer = lastSubmission.selections[0].answer;
        const wasCorrect = lastSubmission.selections[0].isCorrect;
        const restoredFeedback = lastSubmission.selections[0].feedback;

        setAnswer(restoredAnswer);
        
        // Mark that feedback is being restored to prevent auto-scroll
        isRestoredFeedbackRef.current = true;
        
        // Show visual feedback based on result
        setFeedback({
          exit_code: wasCorrect ? 0 : 1,
          feedback: restoredFeedback || 
            (wasCorrect 
              ? t("Excellent work!") 
              : t("yourAnswerNeedsImprovement")),
        });
        
      } catch (error) {
        console.error("Error recovering open question state from telemetry:", error);
      }
    };

    recoverState();
  }, [questionHash, metadata.eval, getTelemetryStep, currentExercisePosition, t]);



  const evaluateAnswer = async () => {
    if (!answer) {
      toast.error(t("pleaseEnterAnAnswer"));
      return;
    }
    if (!token) {
      toast.error(t("youMustLoginFirst"));
      setOpenedModals({ mustLogin: true });
      return;
    }
    setIsLoading(true);
    RigoAI.useTemplate({
      slug: "evaluator",
      inputs: {
        eval: metadata.eval as string,
        lesson_content: wholeMD,
        student_response: answer,
        examples: examples.join("\n"),
      },
      onComplete: (success, rigoData) => {
        if (success) {
          const result = rigoData.data.parsed;
          setFeedback({
            exit_code: result.exit_code,
            feedback: result.feedback,
          });

          const submission = makeQuizSubmission(
            [
              {
                title: metadata.eval as string,
                correctAnswer:
                  result.exit_code === 0 ? answer : (metadata.eval as string),
                currentSelection: answer,
                checkboxes: [
                  {
                    text: answer,
                    isCorrect: result.exit_code === 0,
                    feedback: result.feedback,
                  },
                ],
              },
            ],
            hashRef.current,
            startedAtRef.current
          );

          if (result.exit_code === 0) {
            Notifier.confetti();
            reportEnrichDataLayer("quiz_success", {});
            TelemetryManager.registerTesteableElement(
              Number(currentExercisePosition),
              {
                type: "quiz",
                hash: hashRef.current,
                is_completed: true,
                searchString: metadata.eval as string,
              }
            );
            playEffect("success");
          } else {
            playEffect("error");
            reportEnrichDataLayer("quiz_error", {});
          }

          registerTelemetryEvent("quiz_submission", submission);

          setIsLoading(false);
          useConsumable("ai-compilation");
        }
      },
    });
  };

  const handleTranscription = (text: string) => {
    // Clear feedback when user adds transcription
    if (feedback) {
      setFeedback(null);
    }
    setAnswer(answer + " " + text);
  };

  const addExamples = async (newExamples: string[], newEvaluation: string) => {
    // const updatedExamples = [...examples, ...newExamples];
    setExamples(newExamples);

    if (node?.position?.start && node?.position?.end) {
      await replaceInReadme(
        `\`\`\`question eval="${newEvaluation}"
${newExamples.join("\n")}
\`\`\``,
        node?.position?.start,
        node?.position?.end
      );
    }
  };

  return (
    <div>
      <section className="d-flex gap-small align-center pos-relative">
        <AutoResizeTextarea
          className="w-100"
          minHeight={"90px"}
          defaultValue={answer}
          placeholder={t("yourAnswerHere")}
          onChange={(e) => {
            if (!answer) {
              startedAtRef.current = Date.now();
            }
            // Clear feedback when user starts editing
            if (feedback) {
              setFeedback(null);
            }
            setAnswer(e.target.value);
          }}
        />
        <SpeechToTextButton onTranscription={handleTranscription} />
      </section>
      <div className="d-flex gap-small padding-small justify-between row-reverse">
        <SimpleButton
          disabled={isLoading || !answer}
          text={isLoading ? t("evaluating") : t("submitForReview")}
          title={isLoading ? t("evaluating") : t("submitForReview")}
          svg={svgs.rigoSoftBlue}
          action={evaluateAnswer}
          extraClass="active-on-hover padding-small rounded align-self-end bg-blue-rigo text-white"
        />
        {isCreator && mode === "creator" && (
          <AddExampleButton
            wholeMD={wholeMD}
            evaluation={metadata.eval as string}
            addExamples={addExamples}
            examples={examples}
          />
        )}
      </div>
      <div ref={feedbackRef}>
        {feedback && (
          <div
            className={`flex-y gap-small padding-medium rounded  ${feedback.exit_code === 0 && "bg-soft-green text-dark-green"
              } ${feedback.exit_code === 1 && "bg-soft-red text-dark-red"}`}
          >
            {feedback.exit_code > 0 && (
              <div className="d-flex gap-small align-center">
                <SimpleButton
                  extraClass="text-red"
                  svg={svgs.closeIcon}
                  action={() => { }}
                />
                <h3 className="m-0 ">{t("yourAnswerNeedsImprovement")}</h3>
              </div>
            )}
            <div className="margin-left-medium">
              <Markdowner markdown={feedback.feedback} allowCreate={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const convertToSingleLine = (text: string) => {
  return text.replace(/\n/g, " ");
};

const AddExampleButton = ({
  wholeMD,
  evaluation,
  addExamples,
  examples,
}: {
  wholeMD: string;
  evaluation: string;
  addExamples: (examples: string[], evaluation: string) => void;
  examples: string[];
}) => {
  const { t } = useTranslation();
  const [evaluationValue, setEvaluationValue] = useState<string>(evaluation);
  const token = useStore((state) => state.token);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] =
    useState<string[]>(examples);

  const makeSuggestions = async () => {
    const result = await suggestExamples(token, {
      lesson_content: wholeMD,
      evaluation: evaluation,
    });
    setSuggestions(result.examples);
  };

  useEffect(() => {
    if (isOpen && suggestions.length === 0 && examples.length < 3) {
      makeSuggestions();
    }
  }, [isOpen]);


  return (
    <>
      <SimpleButton
        extraClass={`rounded padding-small ${examples.length < 3 ? "bg-warning" : "border-gray"
          }`}
        text={examples.length < 3 ? t("missingExamples") : t("editExamples")}
        svg={examples.length < 3 ? svgs.warning : svgs.edit}
        action={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <Modal
          outsideClickHandler={() => {
            setIsOpen(false);
          }}
        >
          <h2>{t("questionEditor")}</h2>
          <div className="flex-y">
            <h4>{t("evaluationCriteria")}</h4>
            <AutoResizeTextarea
              className="padding-medium"
              defaultValue={evaluationValue}
              onChange={(e) => {

                setEvaluationValue(e.target.value);
              }}
            />

          </div>



  
          <div className="flex-y gap-small mt-10px">
            <div className="flex-x gap-small justify-between">
            <h4 className="mt-10px">{t("examples")}</h4>
            <WriteSuggestion
            submit={(answer) => {
              setAcceptedSuggestions([...acceptedSuggestions, answer]);
            }}
          />
            </div>
            {acceptedSuggestions.map((suggestion) => (
              <Suggestion
                suggestion={suggestion}
                accepted={true}
                onReject={() => {
                  setAcceptedSuggestions(
                    acceptedSuggestions.filter((s) => s !== suggestion)
                  );
                  setSuggestions([...suggestions, suggestion]);
                }}
              />
            ))}
            {/* Show suggestions only if there are less than 3 examples */}
            {examples.length < 3 && suggestions.length > 0 && (
              <Suggestion
                suggestion={suggestions[0]}
                onAccept={() => {
                  setAcceptedSuggestions([
                    ...acceptedSuggestions,
                    suggestions[0],
                  ]);
                  setSuggestions(
                    suggestions.filter((s) => s !== suggestions[0])
                  );
                }}
                onReject={() => {
                  setSuggestions(
                    suggestions.filter((s) => s !== suggestions[0])
                  );
                }}
              />
            )}

            <SimpleButton
              title={t("finish")}
              extraClass="w-100 justify-center bg-blue rounded padding-medium"
              text={t("finish")}
              //   svg={svgs.iconCheck}
              action={() => {
                addExamples(
                  acceptedSuggestions,
                  convertToSingleLine(evaluationValue)
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

const WriteSuggestion = ({ submit }: { submit: (answer: string) => void }) => {
  const { t } = useTranslation();
  const [textValue, setTextValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
    <SimpleButton
      title={t("add-example")}
      svg={<Icon name="Plus" />}
      extraClass="bg-blue-rigo text-white padding-mini rounded flex-x align-center gap-small"
      action={() => setIsOpen(true)}
    />
    {isOpen && (
      <Modal outsideClickHandler={() => setIsOpen(false)}>
      <div className="flex-y gap-small border-gray rounded padding-small mt-10px">
      <h2>{t("writeAnExampleAnswer")}</h2>
      <AutoResizeTextarea
        defaultValue={textValue}
        onChange={(e) => {
          setTextValue(e.target.value);
        }}
        className="w-100 rounded padding-medium"
        placeholder={t("writeAnExampleAnswer")}
        rows={2}
      />
      <div className="d-flex gap-small justify-center">
        <CustomDropdown
          menuClassName="w-200px flex-y gap-small"
          position="center"
          trigger={
            <SimpleButton
              extraClass="bg-blue-rigo text-white padding-small rounded flex-x align-center gap-small"
              text={t("save")}
              svg={svgs.publish}
            />
          }
        >
          <SimpleButton
            extraClass="border-green rounded padding-small text-green flex-x align-center gap-small w-100 active-on-hover"
            action={() => {
              if (textValue) {
                submit("CORRECT: " + textValue);
                setTextValue("");
              } else {
                toast.error(t("pleaseEnterAnAnswer"));
              }
            }}
            text={t("asCorrect")}
            svg={svgs.iconCheck}
          />
          <SimpleButton
            extraClass="border-red rounded padding-small text-red flex-x align-center gap-small w-100 active-on-hover"
            action={() => {
              if (textValue) {
                submit("INCORRECT: " + textValue);
                setTextValue("");
              } else {
                toast.error(t("pleaseEnterAnAnswer"));
              }
            }}
            text={t("asIncorrect")}
            svg={svgs.iconClose}
          />
        </CustomDropdown>
      </div>
    </div>
    </Modal>
    )}
    </>
  );
};

const Suggestion = ({
  suggestion,
  onAccept,
  onReject,
}: {
  suggestion: string;
  onAccept?: () => void;
  onReject: () => void;
  accepted?: boolean;
}) => {
  const { t } = useTranslation();

  const isIncorrect = suggestion.startsWith("INCORRECT: ");
  return (
    <div
      key={suggestion}
      className={`rounded padding-small border-gray pos-relative	d-flex justify-between`}
    >
        <p className="">{suggestion.replace("INCORRECT:", "").replace("CORRECT:", "")}</p>
      <div className="flex-y gap-small align-end">
        <div className={`d-flex align-center justify-center  rounded ${isIncorrect ? "pill-incorrect" : "pill-correct"}`}>
          {isIncorrect ? "✗ Incorrect" : "✓ Correct"}
        </div>
        {onAccept &&
          <SimpleButton
            extraClass="bg-blue-rigo text-white padding-small rounded flex-x align-center gap-small"
            text={t("save")}
            svg={svgs.publish}
            action={onAccept}
          />
        }
        <SimpleButton
          title={t("remove")}
          extraClass="border-gray padding-small rounded danger-on-hover"
          svg={svgs.trash}
          action={onReject}
        />

      </div>

    </div>
  );
};
