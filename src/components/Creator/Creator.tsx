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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DOMPurify from "dompurify";
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
  type: "button" | "select" | "input" | "image-generate" | "code-challenge";
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
    moveBlock,
    token,
    configObject,
    currentExercisePosition,
  } = useStore((state) => ({
    replaceInReadme: state.replaceInReadme,
    insertBeforeOrAfter: state.insertBeforeOrAfter,
    currentContent: state.currentContent,
    useConsumable: state.useConsumable,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    isBuildable: state.isBuildable,
    moveBlock: state.moveBlock,
    token: state.token,
    configObject: state.configObject,
    currentExercisePosition: state.currentExercisePosition,
  }));

  const [isOpen, setIsOpen] = useState(false);
  const [replacementValue, setReplacementValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [interactions, setInteractions] = useState<TInteraction[]>([]);
  const [isEditingAsMarkdown, setIsEditingAsMarkdown] = useState(false);
  const [containsNewElement, setContainsNewElement] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const elemRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
            setReplacementValue(data.data.answer);
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
            setReplacementValue(data.data.answer);
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
          console.log(data, "DATA FROM SUMMARIZE TEXT");
          if (success) {

            setIsGenerating(false);
            setReplacementValue(data.data.answer);
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
        slug: "change-tone",
        inputs: {
          text_to_change: text,
          tone: tone,
          whole_lesson: currentContent,
        },
        target: targetRef.current,
        onComplete: (success: boolean, data: any) => {
          if (success) {
            setIsGenerating(false);
            setReplacementValue(data.data.answer);
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
      console.log(getComponentsInfo());
      RigoAI.useTemplate({
        slug: "request-changes-in-lesson-v2",
        inputs: {
          prompt: question,
          whole_lesson: currentContent,
          text_selected: tagName === "new" ? "empty" : elementText,
          prev_interactions: JSON.stringify(interactions),
          components_info: getComponentsInfo(),
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
              final: data.data.answer,
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
            setReplacementValue(data.data.answer);
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

  const handleImageGenerate = async (prompt: string) => {
    if (!prompt.trim()) return;

    const randomID = Math.random().toString(36).substring(2, 15);
    await generateImage(token, {
      prompt,
      context: `The image to generate is part of a lesson in a tutorial, this is the content of the lesson: ${currentContent}`,
      callbackUrl: `${DEV_MODE
        ? DEV_URL
        : window.location.origin
        }/webhooks/${configObject.config?.slug}/images/${randomID}`,
    });

    const replacement = makeReplacement(randomID, prompt);
    if (node?.position?.start && node?.position?.end) {
      await replaceInReadme(
        replacement,
        node?.position?.start,
        node?.position?.end
      );
    }
    reportEnrichDataLayer("creator_image_generation_started", {
      prompt,
      image_id: randomID,
    });
    try {
      await useConsumable("ai-generation");
    } catch (error) {
      console.error("Error using consumable", error);
    }
    setIsOpen(false);
  };

  const handleCodeChallenge = async (promptText: string) => {
    const trimmedPrompt = promptText.trim();
    if (!trimmedPrompt) {
      toast.error(t("missing-required-content"));
      return;
    }

    if (!token) {
      toast.error(t("authentication-required"));
      return;
    }

    const courseSlug = configObject?.config?.slug;
    if (!courseSlug) {
      toast.error(t("course-slug-not-found"));
      return;
    }

    const tid = toast.loading(t("generating-code-challenge"));

    try {
      const result = await generateCodeChallenge(
        trimmedPrompt,
        currentContent,
        Number(currentExercisePosition),
        token,
        courseSlug
      );

      if (result.status === "QUEUED") {
        const generatingContent = `\`\`\`code_challenge_proposal\nGENERATING(${result.id}) ${trimmedPrompt}\n\`\`\``;
        if (node?.position?.start && node?.position?.end) {
          await replaceInReadme(
            generatingContent,
            node?.position?.start,
            node?.position?.end
          );
        }

        toast.success(t("code-challenge-generation-started"), { id: tid });
        reportEnrichDataLayer("creator_code_challenge_generation_started", {
          prompt: trimmedPrompt,
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
      const errorContent = `\`\`\`code_challenge_proposal\n${trimmedPrompt}\n\`\`\``;
      if (node?.position?.start && node?.position?.end) {
        await replaceInReadme(
          errorContent,
          node?.position?.start,
          node?.position?.end
        );
      }
    }
    setIsOpen(false);
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
    {
      type: "image-generate",
      text: t("generateImage"),
      title: t("generate-image-tooltip"),
      action: () => {},
      extraClass: "text-secondary  rounded padding-small active-on-hover svg-blue",
      svg: svgs.image,
      allowedElements: ["all"],
      placeholder: t("describeImage"),
    },
    {
      type: "code-challenge",
      text: t("add-code-challenge"),
      title: isBuildable ? t("add-code-challenge-disabled-tooltip") : t("add-code-challenge-tooltip"),
      action: () => {},
      extraClass: "text-secondary  rounded padding-small active-on-hover svg-blue ",
      svg: <Icon name="Code" />,
      allowedElements: ["new"],
      placeholder: t("code-challenge-prompt-placeholder"),
    },
  ];

  const getPortion = () => {
    console.log(node?.position?.start?.offset && node?.position?.end?.offset);

    if (typeof (node?.position?.start?.offset) === "number" && typeof (node?.position?.end?.offset) === "number") {
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

  const findScrollableContainer = (element: HTMLElement | null): HTMLElement | null => {
    if (!element) return null;

    let current: HTMLElement | null = element;
    while (current) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY || style.overflow;
      const hasScrollableContent = current.scrollHeight > current.clientHeight;

      if ((overflowY === 'auto' || overflowY === 'scroll') && hasScrollableContent) {
        return current;
      }

      current = current.parentElement;
    }

    return document.documentElement;
  };

  const handleAutoScroll = (clientY: number) => {
    const scrollableContainer = findScrollableContainer(elemRef.current);
    if (!scrollableContainer) return;

    const containerRect = scrollableContainer.getBoundingClientRect();
    const scrollThreshold = 100;
    const scrollSpeed = 15;

    const distanceFromTop = clientY - containerRect.top;
    const distanceFromBottom = containerRect.bottom - clientY;

    if (distanceFromTop < scrollThreshold && scrollableContainer.scrollTop > 0) {
      const scrollAmount = Math.max(1, scrollSpeed * (1 - distanceFromTop / scrollThreshold));
      scrollableContainer.scrollTop -= scrollAmount;
    } else if (distanceFromBottom < scrollThreshold &&
      scrollableContainer.scrollTop < scrollableContainer.scrollHeight - scrollableContainer.clientHeight) {
      const scrollAmount = Math.max(1, scrollSpeed * (1 - distanceFromBottom / scrollThreshold));
      scrollableContainer.scrollTop += scrollAmount;
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (node?.position?.start?.offset && node?.position?.end?.offset) {
      const markdownContent = getPortion();
      if (markdownContent) {
        e.dataTransfer.setData('text/plain', markdownContent);
        e.dataTransfer.setData('source-start', node.position.start.offset.toString());
        e.dataTransfer.setData('source-end', node.position.end.offset.toString());
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);

        scrollIntervalRef.current = setInterval(() => {
          const lastY = (window as any).__lastDragY;
          if (lastY !== undefined) {
            handleAutoScroll(lastY);
          }
        }, 16) as any;

        (window as any).__dragCleanup = () => {
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
          delete (window as any).__lastDragY;
          delete (window as any).__dragCleanup;
        };
      }
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);

    if ((window as any).__dragCleanup) {
      (window as any).__dragCleanup();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    (window as any).__lastDragY = e.clientY;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!elemRef.current?.contains(relatedTarget) && !elemRef.current?.contains(relatedTarget?.parentElement)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const sourceStartStr = e.dataTransfer.getData('source-start');
    const sourceEndStr = e.dataTransfer.getData('source-end');

    if (!sourceStartStr || !sourceEndStr || !node?.position?.start?.offset) {
      return;
    }

    const sourceStart = parseInt(sourceStartStr);
    const sourceEnd = parseInt(sourceEndStr);
    const targetStart = node.position.start.offset;

    if (sourceStart === targetStart) {
      return;
    }

    try {
      await moveBlock(sourceStart, sourceEnd, targetStart);

      reportEnrichDataLayer("creator_block_moved", {
        source_start: sourceStart,
        source_end: sourceEnd,
        target_start: targetStart,
      });
    } catch (error) {
      console.error("Error moving block:", error);
    }
  };

  const canDrag = node?.position?.start?.offset !== undefined && node?.position?.end?.offset !== undefined && tagName !== "new";

  console.log(canDrag, "CAN DRAG");


  return (
    <div
      className={`creator-wrapper  ${tagName} ${isDragOver ? 'drag-over' : ''} ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative' }}
    >
      {isDragOver && (
        <div
          className="drag-indicator-line"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'var(--blue-rigo, #3b82f6)',
            zIndex: 1000,
            borderRadius: '2px'
          }}
        />
      )}
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
          onImageGenerate={handleImageGenerate}
          onCodeChallenge={handleCodeChallenge}
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
            onImageGenerate={handleImageGenerate}
            onCodeChallenge={handleCodeChallenge}
            isBuildable={isBuildable}
          />
        )}
        {tagName !== "new" && !containsNewElement && (
          <div className="creator-controls">
            {canDrag && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="creator-drag-handle svg-blue active-on-hover"
                    draggable={true}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: 'grab' }}
                  >
                    <Icon name="Move" size={16} />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px]">
                  <p>{t("drag-to-reorder")}</p>
                </TooltipContent>
              </Tooltip>
            )}
            <SimpleButton
              svg={svgs.edit}
              extraClass="creator-options-opener svg-blue active-on-hover"
              title={t("edit-element-tooltip")}
              action={() => setIsOpen(!isOpen)}
            />
          </div>
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
        className={`creator-target  ${replacementValue ? "border-blue padding-medium" : ""
          }`}
      >
        <div
          contentEditable
          className="creator-target-content hidden"
          ref={targetRef}
        ></div>

        {isEditingAsMarkdown ? (
          replacementValue && (
            <div className="flex-x gap-small target-buttons justify-center">
              <SimpleButton
                action={acceptChanges}
                extraClass="padding-small border-gray rounded scale-on-hover"
                svg={svgs.iconCheck}
                text={t("save")}
              />
              <SimpleButton
                action={rejectChanges}
                extraClass="padding-small border-gray rounded scale-on-hover"
                svg={svgs.iconClose}
                text={t("cancel")}
              />
            </div>
          )
        ) : (
          <>
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
          </>
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

  const sanitizeSVG = (svgContent: string): string => {
    // Specific configuration for sanitizing SVG
    const purifyConfig = {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'iframe', 'embed', 'object', 'foreignObject'],
      FORBID_ATTR: [
        'onerror',
        'onload',
        'onclick',
        'onmouseover',
        'onmouseout',
        'onanimationend',
        'onanimationstart',
        'ontransitionend',
        'onfocus',
        'onblur',
      ],
      ALLOW_DATA_ATTR: false, // Block data-* attributes that might contain code
    };

    return DOMPurify.sanitize(svgContent, purifyConfig);
  };

  const uploadImage = async (file: File) => {
    let fileToUpload = file;

    // Sanitize if it's SVG
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      try {
        const svgContent = await file.text();
        const sanitizedSVG = sanitizeSVG(svgContent);

        // Verify that the sanitization has not removed all the content
        if (!sanitizedSVG || sanitizedSVG.trim().length === 0) {
          toast.error(t("errorSanitizingSVG") || "SVG file is invalid or empty after sanitization");
          return;
        }

        // Create a new file with sanitized content
        fileToUpload = new File([sanitizedSVG], file.name, {
          type: 'image/svg+xml',
        });
      } catch (error) {
        console.error('Error sanitizing SVG:', error);
        toast.error(t("errorSanitizingSVG") || "Error processing SVG file");
        return;
      }
    }

    if (!config.config?.slug) {
      toast.error(t("theCourseIsNotSaved"));
      return;
    }

    const imgSlug = slugify(fileToUpload.name);
    const imgPath = `courses/${config.config?.slug}/.learn/assets/${imgSlug}`;
    const relativePath = `/.learn/assets/${imgSlug}`;

    try {
      const blob = new Blob([fileToUpload]);
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
        accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
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

const RigoInput = ({
  onSubmit,
  inside,
  promps,
  tagName,
  node,
  onEditAsMarkdown,
  onClose,
  isBuildable,
  onImageGenerate,
  onCodeChallenge,
}: {
  onSubmit: (prompt: string) => void;
  inside: boolean;
  promps: TPromp[];
  tagName: string;
  node: Element | undefined;
  onEditAsMarkdown: () => void;
  onClose: () => void;
  isBuildable: boolean;
  onImageGenerate?: (prompt: string) => void;
  onCodeChallenge?: (prompt: string) => void;
}) => {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"default" | "image-generate" | "code-challenge">("default");
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

  const handleSubmit = () => {
    if (mode === "image-generate" && onImageGenerate) {
      onImageGenerate(prompt);
      setPrompt("");
      setMode("default");
    } else if (mode === "code-challenge" && onCodeChallenge) {
      onCodeChallenge(prompt);
      setPrompt("");
      setMode("default");
    } else {
      onSubmit(prompt);
      setPrompt("");
    }
  };

  const currentPlaceholder = mode === "image-generate" 
    ? t("describeImage")
    : mode === "code-challenge"
    ? t("code-challenge-prompt-placeholder")
    : t("editWithRigobotPlaceholder");

  return (
    <div ref={containerRef} className={` ${inside ? "creator-options" : ""}`}>
      <div className={`rigo-input ${inside ? "" : "w-100"}`}>
        <SimpleButton
          svg={svgs.rigoSoftBlue}
          action={handleSubmit}
          extraClass={"big-circle rigo-button mr-12"}
        />
        <AutoResizeTextarea
          key={mode}
          onFocus={() => setShowPrompts(true)}
          onBlur={() => {
            setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                setShowPrompts(false);
              }
            }, 100);
          }}
          placeholder={currentPlaceholder}
          autoFocus
          className="rigo-textarea"
          onKeyUp={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          minHeight={mode === "code-challenge" ? 120 : 60}
          defaultValue=""
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
              const isCodeChallengeButton = prompt.type === "code-challenge";
              const isDisabled = isCodeChallengeButton && isBuildable === true;
              const tooltipTitle = isDisabled ? t("add-code-challenge-disabled-tooltip") : prompt.title;

              if (prompt.type === "image-generate") {
                return (
                  <SimpleButton
                    svg={prompt.svg}
                    key={`${prompt.text}-${index}`}
                    title={tooltipTitle}
                    action={() => {
                      setMode("image-generate");
                      setPrompt("");
                    }}
                    extraClass={prompt.extraClass}
                    text={prompt.text}
                    disabled={isDisabled}
                  />
                );
              }
              
              if (prompt.type === "code-challenge") {
                return (
                  <SimpleButton
                    svg={prompt.svg}
                    key={`${prompt.text}-${index}`}
                    title={tooltipTitle}
                    action={() => {
                      setMode("code-challenge");
                      setPrompt("");
                    }}
                    extraClass={prompt.extraClass}
                    text={prompt.text}
                    disabled={isDisabled}
                  />
                );
              }

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
        </div>
      )}
    </div>
  );
};
