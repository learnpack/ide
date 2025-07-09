import { svgs } from "../../../assets/svgs";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { checkAnswer, suggestExamples } from "../../../managers/EventProxy";
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
import TelemetryManager from "../../../managers/telemetry";
import { makeQuizSubmission } from "../QuizRenderer/QuizRenderer";

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
    token,
    replaceInReadme,
    mode,
    currentExercisePosition,
    registerTelemetryEvent,
  } = useStore((state) => ({
    token: state.token,
    replaceInReadme: state.replaceInReadme,
    mode: state.mode,
    currentExercisePosition: state.currentExercisePosition,
    registerTelemetryEvent: state.registerTelemetryEvent,
    // currentContent: state.currentContent,
  }));

  const [feedback, setFeedback] = useState<TFeedback | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [examples, setExamples] = useState<string[]>(splitInLines(code));
  const [answer, setAnswer] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const hashRef = useRef<string>("");

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
  }, [metadata.eval]);

  const register = async () => {
    const hash = await asyncHashText(metadata.eval as string);
    hashRef.current = hash;
    TelemetryManager.registerTesteableElement(Number(currentExercisePosition), {
      type: "quiz",
      hash: hash,
    });
  };
  const debouncedRegister = debounce(register, 2000);

  const evaluateAnswer = async () => {
    if (!answer) {
      toast.error(t("pleaseEnterAnAnswer"));
      return;
    }
    setIsLoading(true);
    const result = await checkAnswer(token, {
      eval: metadata.eval as string,
      lesson_content: wholeMD,
      student_response: answer,
      examples: examples.join("\n"),
    });
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
      hashRef.current
    );

    registerTelemetryEvent("quiz_submission", submission);
    if (result.exit_code === 0) {
      Notifier.confetti();
      TelemetryManager.registerTesteableElement(
        Number(currentExercisePosition),
        {
          type: "quiz",
          hash: hashRef.current,
          is_completed: true,
        }
      );
      playEffect("success");
    } else {
      playEffect("error");
    }

    setIsLoading(false);
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
          onChange={(e) => setAnswer(e.target.value)}
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
            className={`flex-y gap-small padding-medium rounded  ${
              feedback.exit_code === 0 && "bg-soft-green text-dark-green"
            } ${feedback.exit_code === 1 && "bg-soft-red text-dark-red"}`}
          >
            {feedback.exit_code > 0 && (
              <div className="d-flex gap-small align-center">
                <SimpleButton
                  extraClass="text-red"
                  svg={svgs.closeIcon}
                  action={() => {}}
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
  const evaluationRef = useRef<HTMLParagraphElement>(null);
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
    if (isOpen && suggestions.length === 0) {
      makeSuggestions();
    }
  }, [isOpen]);

  return (
    <>
      <SimpleButton
        extraClass={`rounded padding-small ${
          examples.length < 3 ? "bg-warning" : "border-gray"
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
            <p
              className="m-0"
              contentEditable
              suppressContentEditableWarning
              ref={evaluationRef}
            >
              {evaluation}
            </p>
          </div>
          <div className="separator">
            <div></div>
            <h4></h4>
            <div></div>
          </div>
          {/* <p>{t("missingExamplesExplanation")}</p> */}
          <div className="flex-y gap-small">
            <h4>{t("examples")}</h4>
            <WriteSuggestion
              submit={(answer) => {
                setAcceptedSuggestions([...acceptedSuggestions, answer]);
              }}
            />
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
            {/* Only show the first suggestion */}
            {suggestions.length > 1 && (
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
                  convertToSingleLine(evaluationRef.current?.innerText || "")
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
  const textRef = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="d-flex gap-small">
      <textarea
        ref={textRef}
        className="textarea w-100 rounded padding-small"
        placeholder={t("writeAnExampleCorrectAnswer")}
        rows={2}
      />
      <SimpleButton
        title={t("add")}
        text={t("add")}
        svg={svgs.iconCheck}
        action={() => {
          if (textRef.current) {
            submit(textRef.current.value);
          }
        }}
      />
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
  return (
    <div
      key={suggestion}
      className={`rounded padding-small border-gray ${
        accepted ? "bg-blue-opaque" : "bg-transparent"
      }`}
    >
      <p>{suggestion}</p>
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
