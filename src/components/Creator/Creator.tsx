import { useEffect, useRef, useState } from "react";
import useStore from "../../utils/store";
import { useTranslation } from "react-i18next";
import { RigoAI } from "../Rigobot/AI";
import { Element } from "hast";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";

type TPromp = {
  type: "button" | "select" | "input";
  text: string;
  options?: string[];
  action: (value: string) => void;
  extraClass: string;
  placeholder?: string;
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
  const { replaceInReadme } = useStore((state) => ({
    replaceInReadme: state.replaceInReadme,
  }));

  const [isOpen, setIsOpen] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const elemRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const toneRef = useRef<HTMLSelectElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        onComplete: () => {
          setShowButtons(true);
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
        onComplete: () => {
          setShowButtons(true);
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
        onComplete: () => {
          setShowButtons(true);
        },
      });
    }
    setIsOpen(false);
  };

  const askAIAnything = (question: string) => {
    let elementText = elemRef.current?.innerHTML;

    if (node?.position?.start?.offset && node?.position?.end?.offset) {
      elementText = getPortionFromText(
        currentContent.body,
        node?.position?.start.offset || 0,
        node?.position?.end.offset || 0
      );
    }
    if (elementText && targetRef.current && question) {
      RigoAI.useTemplate({
        slug: "ask-anything-in-lesson",
        inputs: {
          prompt: question,
          whole_lesson: currentContent.body,
          text_selected: elementText,
        },
        target: targetRef.current,
        onComplete: () => {
          setShowButtons(true);
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
      extraClass: "  rounded padding-small active-on-hover",
    },
    {
      type: "button",
      text: t("explainFurther"),
      action: () => explainFurther(),
      extraClass: "  rounded padding-small active-on-hover",
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
      extraClass: "  rounded padding-small active-on-hover",
    },
    {
      type: "input",
      placeholder: t("writeYourPrompt"),
      text: t("askAI"),
      action: (question: string) => askAIAnything(question),
      extraClass: "  rounded padding-small active-on-hover",
    },
  ];

  return (
    <div className={`creator-wrapper ${tagName}`}>
      {isOpen && (
        <div ref={optionsRef} className="creator-options ">
          {promps.map((prompt) =>
            prompt.type === "button" ? (
              <SimpleButton
                key={prompt.text}
                action={prompt.action}
                extraClass={prompt.extraClass}
                text={prompt.text}
              />
            ) : prompt.type === "select" ? (
              <div className={`flex-x gap-small `} key={prompt.text}>
                <SimpleButton
                  action={() => prompt.action(toneRef.current?.value || "")}
                  extraClass={prompt.extraClass}
                  text={prompt.text}
                />
                <select
                  ref={toneRef}
                  key={prompt.text}
                  className={`rounded`}
                  // onChange={(e) => prompt.action(e.target.value)}
                >
                  {prompt.options?.map((option) => (
                    <option key={option} value={option}>
                      {t(option)}
                    </option>
                  ))}
                </select>
              </div>
            ) : prompt.type === "input" ? (
              <div className={`flex-x gap-small `} key={prompt.text}>
                <input
                  placeholder={prompt.placeholder}
                  ref={inputRef}
                  type="text"
                  className="rounded"
                />
                <SimpleButton
                  action={() => prompt.action(inputRef.current?.value || "")}
                  extraClass={prompt.extraClass}
                  text={prompt.text}
                />
              </div>
            ) : null
          )}
        </div>
      )}

      <div className="text-in-editor" ref={elemRef}>
        <SimpleButton
          svg={svgs.options}
          extraClass="creator-options-opener"
          action={() => setIsOpen(!isOpen)}
        />
        {children}
      </div>
      <div className="creator-target">
        <div
          contentEditable
          className="creator-target-content"
          ref={targetRef}
        ></div>
        {showButtons && (
          <div className="flex-x gap-small target-buttons">
            <SimpleButton
              action={async () => {
                if (node?.position?.start && node?.position?.end) {
                  await replaceInReadme(
                    targetRef.current!.innerHTML,
                    node?.position?.start,
                    node?.position?.end
                  );
                  setShowButtons(false);
                }
              }}
              extraClass="padding-small border-gray rounded w-100 active-on-hover"
              text={t("acceptChanges")}
            />
            <SimpleButton
              action={() => {
                targetRef.current!.innerHTML = "";
                setShowButtons(false);
              }}
              extraClass="padding-small border-gray rounded w-100 active-on-hover"
              text={t("rejectChanges")}
            />
          </div>
        )}
      </div>
    </div>
  );
};
