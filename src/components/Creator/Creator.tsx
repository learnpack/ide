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
import { Icon } from "../Icon";
import {
  DEV_MODE,
  DEV_URL,
  generateImage,
  getComponentsInfo,
  slugify,
  uploadBlobToBucket,
} from "../../utils/lib";
import { generateCodeChallenge } from "../../utils/creator";

type TPromp = {
  type: "button" | "select" | "input";
  text?: string;
  title?: string;
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
  children?: React.ReactNode;
  tagName: string;
  node: Element | undefined;
}) => {
  const {
    replaceInReadme,
    insertBeforeOrAfter,
    currentContent,
    useConsumable,
    reportEnrichDataLayer,
    isBuildable,
  } = useStore((state) => ({
    replaceInReadme: state.replaceInReadme,
    insertBeforeOrAfter: state.insertBeforeOrAfter,
    currentContent: state.currentContent,
    useConsumable: state.useConsumable,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    isBuildable: state.isBuildable,
  }));

  const [isOpen, setIsOpen] = useState(false);
  const [replacementValue, setReplacementValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [interactions, setInteractions] = useState<TInteraction[]>([]);
  const [isEditingAsMarkdown, setIsEditingAsMarkdown] = useState(false);
  const [containsNewElement, setContainsNewElement] = useState(false);

  const elemRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();

  useEffect(() => {
    if (elemRef.current?.querySelector(".new")) {
      setContainsNewElement(true);
    }
  }, []);

  const simplifyLanguage = () => {
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
      setIsGenerating(true);
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
            useConsumable("ai-generation");
          }
          reportEnrichDataLayer("creator_template_used", {
            template: "simplify-language",
            success: success,
          });
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
      setIsGenerating(true);
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
            useConsumable("ai-generation");
            setIsGenerating(false);
          }
          reportEnrichDataLayer("creator_template_used", {
            template: "explain-further",
            success: success,
          });
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
            useConsumable("ai-generation");
          }
          reportEnrichDataLayer("creator_template_used", {
            template: "summarize-text",
            success: success,
          });
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
            useConsumable("ai-generation");
          }
          reportEnrichDataLayer("creator_template_used", {
            template: "change-tone",
            success: success,
          });
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
      console.log(getComponentsInfo(isBuildable), "COMPONENTS INFO");
      RigoAI.useTemplate({
        slug: "request-changes-in-lesson-v2",
        inputs: {
          prompt: question,
          whole_lesson: currentContent,
          text_selected: tagName === "new" ? "empty" : elementText,
          prev_interactions: JSON.stringify(interactions),
          components_info: getComponentsInfo(isBuildable),
        },
        target: targetRef.current,
        onComplete: (success: boolean, data: any) => {
          if (success) {
            setIsGenerating(false);
            console.log(data, "DATE RETURNED BY RIGOBOT");
            
            setReplacementValue(data.data.parsed.replacement);
            const interaction: TInteraction = {
              initial: elementText,
              prompt: question,
              final: data.ai_response,
            };
            setInteractions((prev) => [...prev, interaction]);
            useConsumable("ai-generation");
          }
          reportEnrichDataLayer("creator_template_used", {
            template: "request-changes-in-lesson",
            success: success,
          });
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
            useConsumable("ai-generation");
          }
          reportEnrichDataLayer("creator_template_used", {
            template: "simplify-code",
            success: success,
          });
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
      reportEnrichDataLayer("creator_result_accepted", {});
    }
  };

  const rejectChanges = () => {
    targetRef.current!.innerHTML = "";
    setReplacementValue("");
    setIsEditingAsMarkdown(false);
    reportEnrichDataLayer("creator_result_rejected", {});
  };

  const promps: TPromp[] = [
    {
      type: "button",
      text: t("simplifyLanguage"),
      title: t("simplify-language-tooltip"),
      action: () => simplifyLanguage(),
      extraClass:
        "text-secondary  rounded padding-small active-on-hover svg-blue",
      svg: svgs.play,
      allowedElements: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul"],
    },
    {
      type: "button",
      text: t("summarize"),
      title: t("summarize-tooltip"),
      action: () => summarize(),
      extraClass:
        "text-secondary  rounded padding-small active-on-hover svg-blue",
      svg: svgs.play,
      allowedElements: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li"],
    },
    {
      type: "button",
      text: t("explainFurther"),
      title: t("explain-further-tooltip"),
      action: () => explainFurther(),
      extraClass:
        "text-secondary  rounded padding-small active-on-hover svg-blue",
      svg: svgs.play,
      allowedElements: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul"],
    },
    {
      type: "button",
      text: t("simplifyCode"),
      title: t("simplify-code-tooltip"),
      action: () => simplifyCode(),
      extraClass:
        "text-secondary  rounded padding-small active-on-hover svg-blue",
      svg: svgs.play,
      allowedElements: ["pre"],
    },

    {
      type: "select",
      text: t("changeTone"),
      title: t("change-tone-tooltip"),
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
      title: t("remove-element-tooltip"),
      action: () => removeThis(),
      extraClass:
        "text-secondary  rounded padding-small danger-on-hover svg-blue",
      svg: svgs.trash,
      allowedElements: ["all"],
    },
  ];

  const getPortion = () => {
    console.log(node?.position?.start?.offset && node?.position?.end?.offset);
    
    if (typeof(node?.position?.start?.offset) === "number" && typeof(node?.position?.end?.offset) === "number") {
      return getPortionFromText(
        currentContent,
        node?.position?.start.offset,
        node?.position?.end.offset
      );
    }
    return "";
  };

  const handleEditAsMarkdown = () => {
    setIsEditingAsMarkdown(!isEditingAsMarkdown);
    setReplacementValue(getPortion());
    setIsOpen(false);
    reportEnrichDataLayer("creator_edit_as_markdown_clicked", {
      next_state: isEditingAsMarkdown ? "html" : "markdown",
    });
  };

  return (
    <div className={`creator-wrapper  ${tagName}`}>
      <SimpleButton
        svg={svgs.plus}
        extraClass="top-centered display-on-hover above-all"
        title={t("insert-before-tooltip")}
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
      {isOpen && tagName !== "new" && (
        <RigoInput
          onClose={() => setIsOpen(false)}
          inside={true}
          onEditAsMarkdown={handleEditAsMarkdown}
          tagName={tagName}
          node={node}
          promps={promps}
          onSubmit={askAIAnything}
          isBuildable={isBuildable}
        />
      )}

      <SimpleButton
        svg={svgs.plus}
        extraClass="bottom-centered display-on-hover above-all"
        title={t("insert-after-tooltip")}
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
        {tagName === "new" && (
          <RigoInput
            onClose={() => setIsOpen(false)}
            inside={false}
            onSubmit={askAIAnything}
            promps={promps}
            tagName={tagName}
            node={node}
            onEditAsMarkdown={handleEditAsMarkdown}
            isBuildable={isBuildable}
          />
        )}
        {tagName !== "new" && !containsNewElement && (
          <SimpleButton
            svg={svgs.edit}
            extraClass="creator-options-opener svg-blue active-on-hover"
            title={t("edit-element-tooltip")}
            action={() => setIsOpen(!isOpen)}
          />
        )}
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

export const makeReplacement = (imgID: string, alt: string) => {
  return `![GENERATING: ${alt}](/.learn/assets/${imgID})`;
};

const ImageGenerator = ({
  onFinish,
}: {
  onFinish: (replacement: string) => void;
}) => {
  const token = useStore((state) => state.token);
  const config = useStore((state) => state.configObject);
  const useConsumable = useStore((state) => state.useConsumable);
  const reportEnrichDataLayer = useStore(
    (state) => state.reportEnrichDataLayer
  );
  const currentContent = useStore((state) => state.currentContent);
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // "/webhooks/:courseSlug/images/:imageId",
  const buttonAction = async () => {
    if (isOpen) {
      const prompt = inputRef.current?.value;
      if (prompt) {
        const randomID = Math.random().toString(36).substring(2, 15);
        await generateImage(token, {
          prompt,
          context: `The image to generate is part of a lesson in a tutorial, this is the content of the lesson: ${currentContent}`,
          callbackUrl: `${
            DEV_MODE
              ? DEV_URL
              : window.location.origin
          }/webhooks/${config.config?.slug}/images/${randomID}`,
        });

        const replacement = makeReplacement(randomID, prompt);
        onFinish(replacement);
        reportEnrichDataLayer("creator_image_generation_started", {
          prompt,
          image_id: randomID,
        });
        try {
          await useConsumable("ai-generation");
        } catch (error) {
          console.error("Error using consumable", error);
        }
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
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              buttonAction();
            }
          }}
        />
      )}
    </div>
  );
};

const CodeChallengeGenerator = ({
  onFinish,
  isBuildable,
}: {
  onFinish: (replacement: string) => void;
  isBuildable: boolean;
}) => {
  const token = useStore((state) => state.token);
  const config = useStore((state) => state.configObject);
  const currentContent = useStore((state) => state.currentContent);
  const currentExercisePosition = useStore((state) => state.currentExercisePosition);
  const useConsumable = useStore((state) => state.useConsumable);
  const reportEnrichDataLayer = useStore(
    (state) => state.reportEnrichDataLayer
  );
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const buttonAction = async () => {
    if (isOpen) {
      const promptText = prompt.trim();
      if (!promptText) {
        toast.error(t("missing-required-content"));
        return;
      }

      if (!token) {
        toast.error(t("authentication-required"));
        return;
      }

      const courseSlug = config?.config?.slug;
      if (!courseSlug) {
        toast.error(t("course-slug-not-found"));
        return;
      }

      setIsGenerating(true);
      const tid = toast.loading(t("generating-code-challenge"));

      try {
        const result = await generateCodeChallenge(
          promptText,
          currentContent,
          Number(currentExercisePosition),
          token,
          courseSlug
        );

        if (result.status === "QUEUED") {
          // Create the block with GENERATING status
          const generatingContent = `\`\`\`code_challenge_proposal\nGENERATING(${result.id}) ${promptText}\n\`\`\``;
          onFinish(generatingContent);
          
          toast.success(t("code-challenge-generation-started"), { id: tid });
          reportEnrichDataLayer("creator_code_challenge_generation_started", {
            prompt: promptText,
            completion_id: result.id,
          });
          
          try {
            await useConsumable("ai-generation");
          } catch (error) {
            console.error("Error using consumable", error);
          }
        } else {
          toast.error(t("failed-to-start-code-challenge-generation"), { id: tid });
        }
      } catch (error) {
        console.error("Error generating code challenge:", error);
        toast.error(t("error-generating-code-challenge-files"), { id: tid });
        // On error, create the block with the prompt so user can edit and retry
        const errorContent = `\`\`\`code_challenge_proposal\n${promptText}\n\`\`\``;
        onFinish(errorContent);
      } finally {
        setIsGenerating(false);
        setIsOpen(false);
        setPrompt("");
      }
    } else {
      setIsOpen(true);
    }
  };

  const isDisabled = isBuildable === true;

  return (
    <div className="d-flex gap-small align-center w-full active-on-hover rounded padding-small svg-blue text-secondary">
      <SimpleButton
        extraClass="text-secondary active-on-hover"
        text={isOpen ? "" : t("add-code-challenge")}
        action={buttonAction}
        svg={<Icon name="Code" />}
        disabled={isGenerating || isDisabled}
        title={isDisabled ? t("add-code-challenge-disabled-tooltip") : t("add-code-challenge-tooltip")}
      />
      {isOpen && (
        <div className="flex-y gap-small w-full code-challenge-input-wrapper">
          <AutoResizeTextarea
            defaultValue={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-100 input"
            minHeight="120px"
            placeholder={t("code-challenge-prompt-placeholder")}
          />
          <div className="d-flex gap-small justify-end">
            <SimpleButton
              action={() => {
                setIsOpen(false);
                setPrompt("");
              }}
              extraClass="bg-gray padding-small rounded"
              text={t("cancel")}
              svg={<Icon name="X" />}
              disabled={isGenerating}
            />
            <SimpleButton
              action={buttonAction}
              extraClass="bg-blue-rigo text-white padding-small rounded"
              text={isGenerating ? t("generating-code-challenge") : t("generate")}
              svg={isGenerating ? <Loader size="sm" svg={svgs.rigoSvg} /> : <Icon name="Check" />}
              disabled={isGenerating || !prompt.trim()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const RigoInput = ({
  onSubmit,
  inside,
  promps,
  tagName,
  node,
  onEditAsMarkdown,
  onClose,
  isBuildable,
}: {
  onSubmit: (prompt: string) => void;
  inside: boolean;
  promps: TPromp[];
  tagName: string;
  node: Element | undefined;
  onEditAsMarkdown: () => void;
  onClose: () => void;
  isBuildable: boolean;
}) => {
  const [prompt, setPrompt] = useState("");
  const replaceInReadme = useStore((state) => state.replaceInReadme);
  const [showPrompts, setShowPrompts] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toneRef = useRef<HTMLSelectElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  return (
    <div ref={containerRef} className={` ${inside ? "creator-options" : ""}`}>
      <div className={`rigo-input ${inside ? "" : "w-100"}`}>
        <SimpleButton
          svg={svgs.rigoSoftBlue}
          action={() => onSubmit(prompt)}
          extraClass={"big-circle rigo-button mr-12"}
        />
        <AutoResizeTextarea
          onFocus={() => setShowPrompts(true)}
          onBlur={() => {
            setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                setShowPrompts(false);
              }
            }, 100);
          }}
          placeholder={t("editWithRigobotPlaceholder")}
          autoFocus
          className="rigo-textarea"
          onKeyUp={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(prompt);
              setPrompt("");
            }
          }}
          minHeight={60}
          defaultValue={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
          }}
        />
      </div>
      {showPrompts && (
        <div className="flex-y gap-small creator-options-buttons">
          {promps
            .filter((prompt) => {
              if (prompt.allowedElements?.includes("all")) return true;
              if (prompt.allowedElements?.includes(tagName)) return true;
              return false;
            })
            .map((prompt, index) => {
              // Check if this is the code challenge button
              // We identify it by checking multiple criteria to be sure:
              // 1. tagName must be "new"
              // 2. allowedElements must be exactly ["new"]
              // 3. type must be "button"
              // 4. text must match the translation key
              const isCodeChallengeButton = tagName === "new" && 
                Array.isArray(prompt.allowedElements) &&
                prompt.allowedElements.length === 1 && 
                prompt.allowedElements[0] === "new" &&
                prompt.type === "button" &&
                prompt.text === t("add-code-challenge");
              
              // Only disable if:
              // 1. This is definitely the code challenge button
              // 2. AND isBuildable is true (meaning the lesson has interactive exercises - entry file or files for cloud compilation)
              // isBuildable comes from the store and indicates if the exercise can be built/executed
              const isDisabled = isCodeChallengeButton && isBuildable === true;
              
              const tooltipTitle = isDisabled ? t("add-code-challenge-disabled-tooltip") : prompt.title;

              return prompt.type === "button" ? (
                <SimpleButton
                  svg={prompt.svg}
                  key={`${prompt.text}-${index}`}
                  title={tooltipTitle}
                  action={prompt.action}
                  extraClass={prompt.extraClass}
                  text={prompt.text}
                  disabled={isDisabled}
                />
              ) : prompt.type === "select" ? (
                <div
                  className={`flex-x gap-small `}
                  key={`${prompt.text}-${index}`}
                >
                  <SimpleButton
                    key={`${prompt.text}-${index}`}
                    svg={prompt.svg}
                    title={prompt.title}
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
            })}
          {tagName !== "new" && (
            <SimpleButton
              extraClass=" text-secondary  rounded padding-small active-on-hover svg-blue"
              action={onEditAsMarkdown}
              svg={svgs.edit}
              text={t("editAsMarkdown")}
            />
          )}
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
          {tagName === "new" && (
            <CodeChallengeGenerator
              onFinish={async (replacement) => {
                if (node?.position?.start && node?.position?.end) {
                  await replaceInReadme(
                    replacement,
                    node?.position?.start,
                    node?.position?.end
                  );
                }
              }}
              isBuildable={isBuildable}
            />
          )}
        </div>
      )}
    </div>
  );
};
