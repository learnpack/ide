import { svgs } from "../../../assets/svgs";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
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
  } = useStore((state) => ({
    replaceInReadme: state.replaceInReadme,
    mode: state.mode,
    currentExercisePosition: state.currentExercisePosition,
    useConsumable: state.useConsumable,
    registerTelemetryEvent: state.registerTelemetryEvent,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
  }));

  const [feedback, setFeedback] = useState<TFeedback | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [examples, setExamples] = useState<string[]>(splitInLines(code));
  const [answer, setAnswer] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const hashRef = useRef<string>("");
  const startedAtRef = useRef<number>(0);

  const register = async () => {
    const hash = await asyncHashText(metadata.eval as string);
    hashRef.current = hash;
    const elem: TTesteableElement = {
      type: "quiz",
      hash: hash,
      searchString: metadata.eval as string,
    }
    TelemetryManager.registerTesteableElement(Number(currentExercisePosition), elem);
  };


  const debouncedRegister = debounce(register, 2000);

  useEffect(() => {
    if (feedbackRef.current && mode !== "creator" && feedback) {
      feedbackRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [feedback]);

  useEffect(() => {
    if (metadata.eval) {
      debouncedRegister();
    }
    return () => {
      debouncedRegister.cancel();
    };
  }, [metadata.eval]);



  const evaluateAnswer = async () => {
    if (!answer) {
      toast.error(t("pleaseEnterAnAnswer"));
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
        console.log(success, rigoData);
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

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [acceptedSuggestions, setAcceptedSuggestions] =
    useState<string[]>(examples);


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



          <WriteSuggestion
            submit={(answer) => {
              setAcceptedSuggestions([...acceptedSuggestions, answer]);
            }}
          />
          <div className="flex-y gap-small">
            <h4 className="mt-10px">{t("examples")}</h4>
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
  return (
    <div className="flex-y gap-small border-gray rounded padding-small mt-10px">
      <h4>{t("writeAnExampleAnswer")}</h4>
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
  );
};

const Suggestion = ({
  suggestion,
  onAccept,
  onReject,
  accepted = false,
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
      className={`rounded padding-small border-gray pos-relative	`}
    >
      <div className="d-flex gap-small align-start">
        <p className="w-100">{suggestion.replace("INCORRECT:", "").replace("CORRECT:", "")}</p>
        <div className={`d-flex align-center justify-center  rounded  w-fit-content ${isIncorrect ? "pill-incorrect" : "pill-correct"}`}>
          {isIncorrect ? "✗ Incorrect" : "✓ Correct"}
        </div>

      </div>
      <div className="d-flex gap-small justify-center ">
        {onAccept && (
          <SimpleButton
            title={t("correct")}
            text={t("correct")}
            svg={svgs.iconCheck}
            extraClass="border-gray padding-small rounded success-on-hover"
            action={onAccept}
          />
        )}
        <SimpleButton
          title={accepted ? t("remove") : t("incorrect")}
          text={accepted ? t("remove") : t("incorrect")}
          extraClass="border-gray padding-small rounded danger-on-hover"
          svg={svgs.trash}
          action={onReject}
        />
      </div>
    </div>
  );
};
