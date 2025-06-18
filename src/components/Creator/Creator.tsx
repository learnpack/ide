import { useEffect, useRef, useState } from "react";
import useStore from "../../utils/store";
import { useTranslation } from "react-i18next";
import { RigoAI } from "../Rigobot/AI";
import { Element } from "hast";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";
import { Markdowner } from "../composites/Markdowner/Markdowner";
import { Loader } from "../composites/Loader/Loader";
import { AutoResizeTextarea } from "../composites/AutoResizeTextarea/AutoResizeTextarea";
import toast from "react-hot-toast";
import {
  DEV_MODE,
  generateImage,
  slugify,
  uploadBlobToBucket,
} from "../../utils/lib";

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

type TInteraction = {
  initial: string;
  prompt: string;
  final: string;
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
  const { replaceInReadme, insertBeforeOrAfter, currentContent } = useStore(
    (state) => ({
      replaceInReadme: state.replaceInReadme,
      insertBeforeOrAfter: state.insertBeforeOrAfter,
      currentContent: state.currentContent,
    })
  );

  const [isOpen, setIsOpen] = useState(false);
  // const [showButtons, setShowButtons] = useState(false);
  const [replacementValue, setReplacementValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [interactions, setInteractions] = useState<TInteraction[]>([]);
  const [isEditingAsMarkdown, setIsEditingAsMarkdown] = useState(false);

  const elemRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const toneRef = useRef<HTMLSelectElement>(null);

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
        currentContent,
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
          whole_lesson: currentContent,
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
        currentContent,
        node?.position?.start.offset || 0,
        node?.position?.end.offset || 0
      );
    }
    if (text && targetRef.current) {
      RigoAI.useTemplate({
        slug: "explain-further",
        inputs: {
          text_to_explain: text,
          whole_lesson: currentContent,
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
        currentContent,
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
        currentContent,
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
          whole_lesson: currentContent,
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
        currentContent,
        node?.position?.start.offset || 0,
        node?.position?.end.offset || 0
      );
    }
    if (elementText && targetRef.current && question) {
      RigoAI.useTemplate({
        slug: "request-changes-in-lesson",
        inputs: {
          prompt: question,
          whole_lesson: currentContent,
          text_selected: elementText,
          prev_interactions: JSON.stringify(interactions),
        },
        target: targetRef.current,
        onComplete: (success: boolean, data: any) => {
          if (success) {
            setIsGenerating(false);
            setReplacementValue(data.ai_response);
            const interaction: TInteraction = {
              initial: elementText,
              prompt: question,
              final: data.ai_response,
            };
            setInteractions((prev) => [...prev, interaction]);
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
        currentContent,
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

  const acceptChanges = async () => {
    if (node?.position?.start && node?.position?.end) {
      await replaceInReadme(
        replacementValue,
        node?.position?.start,
        node?.position?.end
      );
      setReplacementValue("");
    }
  };

  const rejectChanges = () => {
    targetRef.current!.innerHTML = "";
    setReplacementValue("");
    setIsEditingAsMarkdown(false);
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

  const getPortion = () => {
    if (node?.position?.start?.offset && node?.position?.end?.offset) {
      return getPortionFromText(
        currentContent,
        node?.position?.start.offset || 0,
        node?.position?.end.offset || 0
      );
    }
    return "";
  };

  return (
    <div className={`creator-wrapper  ${tagName}`}>
      <SimpleButton
        svg={svgs.plus}
        extraClass="top-centered display-on-hover"
        action={async () => {
          if (node?.position?.start && node?.position?.end) {
            await insertBeforeOrAfter(
              t("thisIsANewElement"),
              "before",
              node?.position?.start.offset || 0
            );
          }
          setIsOpen(!isOpen);
        }}
      />
      {isOpen && (
        <div ref={optionsRef} className="creator-options">
          <div className={`rigo-input`}>
            <SimpleButton
              svg={svgs.rigoSoftBlue}
              action={() => askAIAnything(prompt)}
              extraClass={"big-circle rigo-button"}
            />
            <AutoResizeTextarea
              placeholder={t("editWithRigobotPlaceholder")}
              autoFocus
              className="rigo-textarea"
              onKeyUp={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  askAIAnything(prompt);
                }
              }}
              minHeight={60}
              defaultValue={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
              }}
            />
          </div>
          <div className="flex-y gap-small creator-options-buttons">
            {promps
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
                      action={() => prompt.action(toneRef.current?.value || "")}
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
            <SimpleButton
              extraClass=" text-secondary  rounded padding-small active-on-hover svg-blue"
              action={() => {
                setIsEditingAsMarkdown(!isEditingAsMarkdown);
                setReplacementValue(getPortion());
                setIsOpen(false);
              }}
              svg={svgs.edit}
              text={t("editAsMarkdown")}
            />
            {tagName !== "img" && (
              <SimpleButton
                extraClass="text-secondary  rounded padding-small active-on-hover svg-blue"
                svg={svgs.image}
                action={async () => {
                  if (node?.position?.start && node?.position?.end) {
                    await replaceInReadme(
                      `![Your image description](https://placehold.co/200x200)`,
                      node?.position?.start,
                      node?.position?.end
                    );
                  } else {
                    toast.error(t("selectedTextNotValid"));
                  }
                }}
                text={t("convertInImg")}
              />
            )}
            {tagName === "img" && (
              <>
                <ImageUploader
                  onFinish={async (imgRelPath) => {
                    if (node?.position?.start && node?.position?.end) {
                      await replaceInReadme(
                        `![${imgRelPath}](${imgRelPath})`,
                        node?.position?.start,
                        node?.position?.end
                      );
                    }
                  }}
                />
                <ImageGenerator
                  onFinish={async (replacement) => {
                    if (node?.position?.start && node?.position?.end) {
                      await replaceInReadme(
                        replacement,
                        node?.position?.start,
                        node?.position?.end
                      );
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>
      )}

      <SimpleButton
        svg={svgs.plus}
        extraClass="bottom-centered display-on-hover"
        action={async () => {
          if (node?.position?.start && node?.position?.end) {
            await insertBeforeOrAfter(
              t("thisIsANewElement"),
              "after",
              node?.position?.end.offset || 0
            );
          }
          setIsOpen(!isOpen);
        }}
      />

      <div className="text-in-editor" ref={elemRef}>
        <SimpleButton
          svg={svgs.edit}
          extraClass="creator-options-opener svg-blue active-on-hover"
          action={() => setIsOpen(!isOpen)}
        />
        {isEditingAsMarkdown ? (
          <AutoResizeTextarea
            defaultValue={getPortion()}
            onChange={(e) => setReplacementValue(e.target.value)}
            className="w-100"
            minHeight={"100px"}
          />
        ) : (
          children
        )}
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
        {replacementValue && !isGenerating && (
          <div className="flex-x gap-small target-buttons justify-center">
            <ChangesRequester
              sendPrompt={askAIAnything}
              acceptChanges={acceptChanges}
              rejectChanges={rejectChanges}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ChangesRequester = ({
  sendPrompt,

  acceptChanges,
  rejectChanges,
}: {
  sendPrompt: (prompt: string) => void;
  acceptChanges: () => void;
  rejectChanges: () => void;
}) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="changes-requester">
      {isOpen ? (
        <div className="rigo-input pos-relative">
          <SimpleButton
            action={() => {
              sendPrompt(prompt);
              setPrompt("");
              setIsOpen(!isOpen);
            }}
            extraClass="big-circle rigo-button"
            svg={svgs.rigoSoftBlue}
          />
          <SimpleButton
            action={() => {
              setPrompt("");
              setIsOpen(!isOpen);
            }}
            extraClass=" float-right text-dark-red"
            svg={svgs.closeX}
          />
          <AutoResizeTextarea
            placeholder={t("requestChangesPlaceholder")}
            defaultValue={prompt}
            minHeight={"60px"}
            className="rigo-textarea"
            onChange={(e) => setPrompt(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                sendPrompt(prompt);
                setPrompt("");
                setIsOpen(false);
              }
            }}
          />
        </div>
      ) : (
        <div className="flex-x gap-small">
          <SimpleButton
            action={acceptChanges}
            extraClass="padding-small border-gray rounded scale-on-hover"
            svg={svgs.iconCheck}
            text={t("acceptChanges")}
          />

          <SimpleButton
            action={() => {
              if (isOpen) {
                sendPrompt(prompt);
                setPrompt("");
              }
              setIsOpen(!isOpen);
            }}
            extraClass="padding-small border-gray rounded scale-on-hover"
            svg={svgs.rigoSoftBlue}
            text={isOpen ? undefined : t("requestChanges")}
          />
          <SimpleButton
            action={rejectChanges}
            extraClass="padding-small border-gray rounded  scale-on-hover"
            svg={svgs.iconClose}
            text={t("rejectChanges")}
          />
        </div>
      )}
    </div>
  );
};

const ImageUploader = ({
  onFinish,
}: {
  onFinish: (imgSlug: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const config = useStore((state) => state.configObject);

  const uploadImage = async (file: File) => {
    const blob = new Blob([file]);

    if (!config.config?.slug) {
      toast.error(t("theCourseIsNotSaved"));
      return;
    }

    const imgSlug = slugify(file.name);
    const imgPath = `courses/${config.config?.slug}/.learn/assets/${imgSlug}`;
    const relativePath = `/.learn/assets/${imgSlug}`;
    try {
      await uploadBlobToBucket(blob, imgPath);
      toast.success(t("imageUploadedSuccessfully"));
      onFinish(relativePath);
    } catch (error) {
      console.error("Error uploading image to bucket", error);
      toast.error(t("errorUploadingImage"));
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="d-none"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            uploadImage(e.target.files[0]);
          }
        }}
        ref={inputRef}
      />

      <SimpleButton
        text={t("uploadImage")}
        extraClass="text-secondary  rounded padding-small active-on-hover svg-blue"
        action={() => {
          if (inputRef.current) {
            inputRef.current.click();
          }
        }}
        svg={svgs.image}
      />
    </>
  );
};

const makeReplacement = (imgID: string, alt: string) => {
  return `![${alt}](/.learn/assets/${imgID})`;
};

const ImageGenerator = ({
  onFinish,
}: {
  onFinish: (replacement: string) => void;
}) => {
  const token = useStore((state) => state.token);
  const config = useStore((state) => state.configObject);
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // "/webhooks/:courseSlug/images/:imageId",
  const buttonAction = async () => {
    if (isOpen) {
      const prompt = inputRef.current?.value;
      if (prompt) {
        const tid = toast.loading(t("imageInProcess"));
        const randomID = Math.random().toString(36).substring(2, 15);
        await generateImage(token, {
          prompt,
          callbackUrl: `${
            DEV_MODE
              ? "https://9cw5zmww-3000.use2.devtunnels.ms"
              : window.location.origin
          }/webhooks/${config.config?.slug}/images/${randomID}`,
        });
        toast.success(t("imageInProcess"), { id: tid });
        const replacement = makeReplacement(randomID, prompt);
        onFinish(replacement);
      }

      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };
  return (
    <div className="d-flex gap-small align-center w-full active-on-hover rounded padding-small svg-blue text-secondary">
      <SimpleButton
        extraClass="text-secondary active-on-hover"
        text={isOpen ? "" : t("generateImage")}
        action={buttonAction}
        svg={svgs.image}
      />
      {isOpen && (
        <input
          type="text"
          placeholder={t("describeImage")}
          className="input"
          ref={inputRef}
        />
      )}
    </div>
  );
};
