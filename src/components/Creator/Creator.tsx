import { useEffect, useRef, useState } from "react";
import useStore from "../../utils/store";
import { useTranslation } from "react-i18next";
import { RigoAI } from "../Rigobot/AI";
import { Element } from "hast";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";
import { Markdowner } from "../composites/Markdowner/Markdowner";
import { Loader } from "../composites/Loader/Loader";

type TPromp = {
  type: "button" | "select" | "input";
  text?: string;
  options?: string[];
  action: (value: string) => void;
  extraClass: string;
  placeholder?: string;
  svg?: React.ReactNode;
  allowedElements?: string[];
};

const getPortionFromText = (text: string, start: number, end: number) => {
  return text.slice(start, end);
};

export const CreatorWrapper = ({
  children,
  tagName,
  node,
}: {
  children: React.ReactNode;
  tagName: string;
  node: Element | undefined;
}) => {
  const { currentContent } = useStore((state) => ({
    currentContent: state.currentContent,
  }));
  const { replaceInReadme, insertBeforeOrAfter } = useStore((state) => ({
    replaceInReadme: state.replaceInReadme,
    insertBeforeOrAfter: state.insertBeforeOrAfter,
  }));

  const [isOpen, setIsOpen] = useState(false);
  // const [showButtons, setShowButtons] = useState(false);
  const [replacementValue, setReplacementValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [insertPosition, setInsertPosition] = useState<
    "before" | "after" | "current"
  >("current");

  const elemRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const toneRef = useRef<HTMLSelectElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsRef]);

  const simplifyLanguage = () => {
    setIsGenerating(true);
    let text = elemRef.current?.innerHTML;
    if (node?.position?.start?.offset && node?.position?.end?.offset) {
      const textPortion = getPortionFromText(
        currentContent.body,
        node?.position?.start.offset || 0,
        node?.position?.end.offset || 0
      );
      text = textPortion;
    }

    if (text && targetRef.current) {
      RigoAI.useTemplate({
        slug: "simplify-language",
        inputs: {
          text_to_simplify: text,
          whole_lesson: currentContent.body,
        },
        target: targetRef.current,

        onComplete: (success: boolean, data: any) => {
          if (success) {
            setReplacementValue(data.ai_response);
            setIsGenerating(false);
            // setShowButtons(true);
          }
        },
      });
    }
    setIsOpen(false);
  };

  const explainFurther = () => {
    let text = elemRef.current?.innerHTML;

    if (node?.position?.start?.offset && node?.position?.end?.offset) {
      text = getPortionFromText(
        currentContent.body,
        node?.position?.start.offset || 0,
        node?.position?.end.offset || 0
      );
    }
    if (text && targetRef.current) {
      RigoAI.useTemplate({
        slug: "explain-further",
        inputs: {
          text_to_explain: text,
          whole_lesson: currentContent.body,
        },
        target: targetRef.current,
        onComplete: (success: boolean, data: any) => {
          if (success) {
            setReplacementValue(data.ai_response);
            // setShowButtons(true);
          }
        },
      });
    }
    setIsOpen(false);
  };

  const summarize = () => {
    setIsGenerating(true);
    let text = elemRef.current?.innerHTML;

    if (node?.position?.start?.offset && node?.position?.end?.offset) {
      text = getPortionFromText(
        currentContent.body,
        node?.position?.start.offset || 0,
        node?.position?.end.offset || 0
      );
    }

    if (text && targetRef.current) {
      RigoAI.useTemplate({
        slug: "summarize-text",
        inputs: {
          text_to_summarize: text,
        },
        target: targetRef.current,
        onComplete: (success: boolean, data: any) => {
          if (success) {
            setIsGenerating(false);
            setReplacementValue(data.ai_response);
            // setShowButtons(true);
          }
        },
      });
    }
    setIsOpen(false);
  };

  const changeTone = (tone: string) => {
    let text = elemRef.current?.innerHTML;

    if (node?.position?.start?.offset && node?.position?.end?.offset) {
      text = getPortionFromText(
        currentContent.body,
        node?.position?.start.offset || 0,
        node?.position?.end.offset || 0
      );
    }

    if (text && targetRef.current) {
      RigoAI.useTemplate({
        slug: "change-tone",
        inputs: {
          text_to_change: text,
          tone: tone,
          whole_lesson: currentContent.body,
        },
        target: targetRef.current,
        onComplete: (success: boolean, data: any) => {
          if (success) {
            setReplacementValue(data.ai_response);
            // setShowButtons(true);
          }
        },
      });
    }
    setIsOpen(false);
  };

  const askAIAnything = (question: string) => {
    setIsGenerating(true);
    let elementText = elemRef.current?.innerHTML;

    if (node?.position?.start?.offset && node?.position?.end?.offset) {
      elementText = getPortionFromText(
        currentContent.body,
        node?.position?.start.offset || 0,
        node?.position?.end.offset || 0
      );
    }
    if (elementText && targetRef.current && question) {
      let extraParams = {};
      if (insertPosition !== "current") {
        extraParams = {
          before_or_after: insertPosition,
        };
      }
      RigoAI.useTemplate({
        slug:
          insertPosition === "current"
            ? "ask-anything-in-lesson"
            : "insert-before-or-after",
        inputs: {
          prompt: question,
          whole_lesson: currentContent.body,
          text_selected: elementText,
          ...extraParams,
        },
        target: targetRef.current,
        onComplete: (success: boolean, data: any) => {
          if (success) {
            setIsGenerating(false);
            setReplacementValue(data.ai_response);
            // setShowButtons(true);
          }
        },
      });
    }
    setIsOpen(false);
  };

  const removeThis = async () => {
    if (node?.position?.start && node?.position?.end) {
      await replaceInReadme("", node?.position?.start, node?.position?.end);
    }
    setIsOpen(false);
  };

  const simplifyCode = () => {
    setReplacementValue("");
    setIsGenerating(true);
    let text = elemRef.current?.innerHTML;
    if (node?.position?.start?.offset && node?.position?.end?.offset) {
      text = getPortionFromText(
        currentContent.body,
        node?.position?.start.offset || 0,
        node?.position?.end.offset || 0
      );
    }
    if (text && targetRef.current) {
      RigoAI.useTemplate({
        slug: "simplify-code",
        inputs: {
          code_to_simplify: text,
        },
        target: targetRef.current,
        onComplete: (success: boolean, data: any) => {
          if (success) {
            setReplacementValue(data.ai_response);
            setIsGenerating(false);
            // setShowButtons(true);
          }
        },
      });
    }
    setIsOpen(false);
  };

  const promps: TPromp[] = [
    {
      type: "button",
      text: t("simplifyLanguage"),
      action: () => simplifyLanguage(),
      extraClass:
        "text-secondary  rounded padding-small active-on-hover svg-blue",
      svg: svgs.play,
      allowedElements: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul"],
    },
    {
      type: "button",
      text: t("summarize"),
      action: () => summarize(),
      extraClass:
        "text-secondary  rounded padding-small active-on-hover svg-blue",
      svg: svgs.play,
      allowedElements: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li"],
    },
    {
      type: "button",
      text: t("explainFurther"),
      action: () => explainFurther(),
      extraClass:
        "text-secondary  rounded padding-small active-on-hover svg-blue",
      svg: svgs.play,
      allowedElements: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul"],
    },
    {
      type: "button",
      text: t("simplifyCode"),
      action: () => simplifyCode(),
      extraClass:
        "text-secondary  rounded padding-small active-on-hover svg-blue",
      svg: svgs.play,
      allowedElements: ["pre"],
    },

    {
      type: "select",
      text: t("changeTone"),
      options: [
        "professional",
        "casual",
        "straightforward",
        "confidence",
        "friendly",
      ],

      action: (tone: string) => changeTone(tone),
      extraClass:
        "text-secondary  rounded padding-small active-on-hover svg-blue",
      svg: svgs.play,
      allowedElements: ["p", "h1", "h2", "h3", "h4", "h5", "h6"],
    },
    {
      type: "button",
      text: t("removeThis"),
      action: () => removeThis(),
      extraClass:
        "text-secondary  rounded padding-small danger-on-hover svg-blue",
      svg: svgs.trash,
      allowedElements: ["all"],
    },
  ];

  return (
    <div
      className={`creator-wrapper ${
        insertPosition === "before" ? "inverted" : ""
      } ${tagName}`}
    >
      {isOpen && (
        <div ref={optionsRef} className="creator-options">
          <div className={` rigo-input`}>
            <SimpleButton
              svg={svgs.rigoSoftBlue}
              action={() => askAIAnything(inputRef.current?.value || "")}
              extraClass={"big-circle rigo-button"}
            />
            <textarea
              placeholder={t("editWithRigobotPlaceholder")}
              ref={inputRef}
              rows={2}
              autoFocus
              onKeyUp={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  askAIAnything(inputRef.current?.value || "");
                }
              }}
              className="rigo-textarea"
            ></textarea>
          </div>
          <div className="flex-y gap-small creator-options-buttons">
            {insertPosition !== "after" && (
              <SimpleButton
                svg={svgs.upArrow}
                text={t("insertBefore")}
                action={() => {
                  if (insertPosition === "before") {
                    setInsertPosition("current");
                  } else {
                    setInsertPosition("before");
                    inputRef.current!.focus();
                  }
                }}
                extraClass={`${
                  insertPosition === "before"
                    ? "bg-blue-rigo text-white"
                    : "svg-blue"
                } text-secondary  rounded padding-small active-on-hover `}
              />
            )}
            {insertPosition === "current" &&
              promps
                .filter((prompt) => {
                  if (prompt.allowedElements?.includes("all")) return true;
                  if (prompt.allowedElements?.includes(tagName)) return true;
                  return false;
                })
                .map((prompt, index) =>
                  prompt.type === "button" ? (
                    <SimpleButton
                      svg={prompt.svg}
                      key={`${prompt.text}-${index}`}
                      action={prompt.action}
                      extraClass={prompt.extraClass}
                      text={prompt.text}
                    />
                  ) : prompt.type === "select" ? (
                    <div
                      className={`flex-x gap-small `}
                      key={`${prompt.text}-${index}`}
                    >
                      <SimpleButton
                        key={`${prompt.text}-${index}`}
                        svg={prompt.svg}
                        action={() =>
                          prompt.action(toneRef.current?.value || "")
                        }
                        extraClass={prompt.extraClass}
                        text={prompt.text}
                      />
                      <select
                        ref={toneRef}
                        key={prompt.text}
                        className={`rounded `}
                        // onChange={(e) => prompt.action(e.target.value)}
                      >
                        {prompt.options?.map((option) => (
                          <option key={option} value={option}>
                            {t(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null
                )}

            {insertPosition !== "before" && (
              <SimpleButton
                svg={svgs.downArrow}
                text={t("insertAfter")}
                action={() => {
                  if (insertPosition === "after") {
                    setInsertPosition("current");
                  } else {
                    setInsertPosition("after");
                    inputRef.current!.focus();
                  }
                }}
                extraClass={`${
                  insertPosition === "after"
                    ? "text-white bg-blue-rigo"
                    : "text-secondary svg-blue"
                }   rounded padding-small active-on-hover `}
              />
            )}
          </div>
        </div>
      )}

      <div className="text-in-editor" ref={elemRef}>
        <SimpleButton
          svg={svgs.optionsGrid}
          extraClass="creator-options-opener"
          action={() => setIsOpen(!isOpen)}
        />
        {children}
      </div>
      <div
        className={`creator-target  ${
          replacementValue ? "border-blue padding-medium" : ""
        }`}
      >
        <div
          contentEditable
          className="creator-target-content hidden"
          ref={targetRef}
        ></div>
        <Markdowner allowCreate={false} markdown={replacementValue} />
        {isGenerating && (
          <Loader text={t("thinking")} svg={svgs.rigoSoftBlue} />
        )}
        {replacementValue && (
          <div className="flex-x gap-small target-buttons justify-center">
            <SimpleButton
              action={async () => {
                if (
                  node?.position?.start &&
                  node?.position?.end &&
                  insertPosition === "current"
                ) {
                  await replaceInReadme(
                    replacementValue,
                    node?.position?.start,
                    node?.position?.end
                  );
                  setReplacementValue("");
                }
                if (insertPosition === "before" && node?.position?.start) {
                  await insertBeforeOrAfter(
                    replacementValue,
                    "before",
                    node?.position?.start.offset || 0
                  );
                  setReplacementValue("");
                }
                if (insertPosition === "after" && node?.position?.end) {
                  await insertBeforeOrAfter(
                    replacementValue,
                    "after",
                    node?.position?.end.offset || 0
                  );
                  setReplacementValue("");
                }
              }}
              extraClass="padding-small border-gray rounded scale-on-hover"
              svg={svgs.iconCheck}
              text={t("acceptChanges")}
            />
            <SimpleButton
              action={() => {
                targetRef.current!.innerHTML = "";
                setReplacementValue("");
              }}
              extraClass="padding-small border-gray rounded  scale-on-hover"
              svg={svgs.iconClose}
              text={t("rejectChanges")}
            />
          </div>
        )}
      </div>
    </div>
  );
};
