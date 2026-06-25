import React, { useEffect, useMemo, useRef, useState } from "react";
import useStore from "../../utils/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { RigoAI } from "../Rigobot/AI";
import { Element } from "hast";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";
import { Markdowner } from "../composites/Markdowner/Markdowner";
import { Loader } from "../composites/Loader/Loader";
import { AutoResizeTextarea } from "../composites/AutoResizeTextarea/AutoResizeTextarea";
import toast from "react-hot-toast";
import { Icon, IconName } from "../Icon";
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
  getImageStyles,
  getMenuComponents,
  slugify,
  TImageStyle,
  TMenuComponent,
  uploadBlobToBucket,
} from "../../utils/lib";
import { generateCodeChallenge } from "../../utils/creator";

type TPromp = {
  type: "button" | "select";
  text?: string;
  title?: string;
  options?: string[];
  action: (value: string) => void;
  extraClass: string;
  placeholder?: string;
  svg?: React.ReactNode;
  allowedElements?: string[];
};

// Lucide icon per menu component id (see getMenuComponents in utils/lib).
const COMPONENT_ICONS: Record<string, IconName> = {
  image: "Image",
  mermaid_diagram: "Workflow",
  ask_rigo_button: "Sparkles",
  multiple_choice_question: "ListChecks",
  select_the_blank: "SquareChevronDown",
  ordering: "ArrowUpDown",
  open_text_question: "MessageSquare",
  code_challenge_proposal: "Code",
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
  } = useStore(useShallow((state) => ({
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
  })));

  const [isOpen, setIsOpen] = useState(false);
  const [replacementValue, setReplacementValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [interactions, setInteractions] = useState<TInteraction[]>([]);
  const [isEditingAsMarkdown, setIsEditingAsMarkdown] = useState(false);
  // const [containsNewElement, setContainsNewElement] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const elemRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { t } = useTranslation();

  // Component catalog and image styles are derived from the YAML files (parsed once).
  const menuComponents = useMemo(() => getMenuComponents(), []);
  const imageStyles = useMemo(() => getImageStyles(), []);

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

  const handleImageGenerate = async (prompt: string, styleId?: string) => {
    if (!prompt.trim()) return;

    // The style only shapes the generated image; it must NOT pollute the alt text.
    const visualStyle = getImageStyles().find((s) => s.id === styleId)?.visualStyle;
    const generationPrompt = visualStyle
      ? `${prompt}\n\nVisual style: ${visualStyle}`
      : prompt;

    const randomID = Math.random().toString(36).substring(2, 15);
    await generateImage(token, {
      prompt: generationPrompt,
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
      style: styleId || "free",
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

  // Transform actions for the "Edit" menu. Content-adding actions live in the
  // "Add" menu and are driven by getMenuComponents() instead.
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
  ];

  // Generate a component (assessment/explanatory) via the AI template, routing
  // the result through the existing preview/accept flow (same path as askAIAnything).
  const generateComponent = (componentId: string, instruction: string) => {
    const question = `Add a new "${componentId}" component to the lesson, strictly following its required format and rules. ${instruction
      ? `Topic / requirement from the author: ${instruction}`
      : "Infer an appropriate topic from the lesson context."
      }`;
    askAIAnything(question);
  };

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
          menuContext="edit"
          onClose={() => setIsOpen(false)}
          inside={true}
          onEditAsMarkdown={handleEditAsMarkdown}
          tagName={tagName}
          node={node}
          promps={promps}
          menuComponents={menuComponents}
          imageStyles={imageStyles}
          onSubmit={askAIAnything}
          onImageGenerate={handleImageGenerate}
          onCodeChallenge={handleCodeChallenge}
          onGenerateComponent={generateComponent}
          onRemove={removeThis}
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
            menuContext="add"
            onClose={() => setIsOpen(false)}
            inside={false}
            onSubmit={askAIAnything}
            promps={promps}
            menuComponents={menuComponents}
            imageStyles={imageStyles}
            tagName={tagName}
            node={node}
            onEditAsMarkdown={handleEditAsMarkdown}
            onImageGenerate={handleImageGenerate}
            onCodeChallenge={handleCodeChallenge}
            onGenerateComponent={generateComponent}
            onRemove={removeThis}
            isBuildable={isBuildable}
          />
        )}
        {/* {tagName !== "new" && !containsNewElement && ( */}
        {tagName !== "new" && (
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
        svg={<Icon name="ImageUp" color="var(--read-font-color)" />}
      />
    </>
  );
};

export const makeReplacement = (imgID: string, alt: string) => {
  return `![GENERATING: ${alt}](/.learn/assets/${imgID})`;
};

// Label/description/placeholder resolvers for a menu component. The "image"
// entry reuses the legacy keys; the rest come from the menuComponents.* namespace.
const componentLabel = (t: TFunction, id: string) =>
  id === "image" ? t("generateImage") : t(`menuComponents.${id}.label`);

const componentDescription = (t: TFunction, id: string) =>
  id === "image" ? t("generate-image-tooltip") : t(`menuComponents.${id}.description`);

const componentPlaceholder = (t: TFunction, id: string) => {
  if (id === "image") return t("describeImage");
  if (id === "code_challenge_proposal") return t("code-challenge-prompt-placeholder");
  return t(`menuComponents.${id}.placeholder`);
};

const RigoInput = ({
  menuContext,
  onSubmit,
  inside,
  promps,
  menuComponents,
  imageStyles,
  tagName,
  node,
  onEditAsMarkdown,
  onClose,
  isBuildable,
  onImageGenerate,
  onCodeChallenge,
  onGenerateComponent,
  onRemove,
}: {
  menuContext: "add" | "edit";
  onSubmit: (prompt: string) => void;
  inside: boolean;
  promps: TPromp[];
  menuComponents: TMenuComponent[];
  imageStyles: TImageStyle[];
  tagName: string;
  node: Element | undefined;
  onEditAsMarkdown: () => void;
  onClose: () => void;
  isBuildable: boolean;
  onImageGenerate?: (prompt: string, styleId?: string) => void;
  onCodeChallenge?: (prompt: string) => void;
  onGenerateComponent?: (componentId: string, prompt: string) => void;
  onRemove?: () => void;
}) => {
  const [prompt, setPrompt] = useState("");
  // When a component is selected from the "Add" menu we enter its sub-input.
  const [activeComponent, setActiveComponent] = useState<TMenuComponent | null>(null);
  const [imageStyle, setImageStyle] = useState("free");
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  // Icon for the circular submit button: the active component's icon, else Rigo.
  const getIconForMode = () => {
    if (!activeComponent) return svgs.rigoSoftBlue;
    const iconName = COMPONENT_ICONS[activeComponent.id];
    if (iconName) return <Icon name={iconName} color="var(--white)" />;
    return svgs.rigoSoftBlue;
  };

  const resetSubInput = () => {
    setActiveComponent(null);
    setPrompt("");
    setImageStyle("free");
  };

  const selectComponent = (component: TMenuComponent) => {
    if (component.id === "code_challenge_proposal" && isBuildable) return;
    setActiveComponent(component);
    setPrompt("");
    setImageStyle("free");
  };

  const handleSubmit = () => {
    if (activeComponent) {
      if (activeComponent.generation === "image" && onImageGenerate) {
        onImageGenerate(prompt, imageStyle);
      } else if (activeComponent.generation === "code-challenge" && onCodeChallenge) {
        onCodeChallenge(prompt);
      } else if (onGenerateComponent) {
        onGenerateComponent(activeComponent.id, prompt);
      }
      resetSubInput();
      return;
    }
    onSubmit(prompt);
    setPrompt("");
  };

  const currentPlaceholder = activeComponent
    ? componentPlaceholder(t, activeComponent.id)
    : t("editWithRigobotPlaceholder");

  const explanatory = menuComponents.filter((c) => c.group === "explanatory");
  const assessment = menuComponents.filter((c) => c.group === "assessment");

  const renderComponentEntry = (component: TMenuComponent) => {
    const isDisabled = component.id === "code_challenge_proposal" && isBuildable;
    const iconName = COMPONENT_ICONS[component.id] || "Plus";
    return (
      <SimpleButton
        key={component.id}
        svg={<Icon name={iconName} color="var(--read-font-color)" />}
        title={isDisabled ? t("add-code-challenge-disabled-tooltip") : componentDescription(t, component.id)}
        text={componentLabel(t, component.id)}
        disabled={isDisabled}
        extraClass="text-secondary rounded padding-small active-on-hover svg-blue menu-component-entry"
        action={() => selectComponent(component)}
      />
    );
  };

  const removeButton = onRemove && (
    <SimpleButton
      svg={svgs.trash}
      text={menuContext === "add" ? t("discardElement") : t("removeThis")}
      title={t("remove-element-tooltip")}
      confirmationMessage={t("confirmRemove")}
      action={onRemove}
      extraClass="text-secondary rounded padding-small danger-on-hover svg-blue menu-destructive-btn"
    />
  );

  return (
    <div ref={containerRef} className={` ${inside ? "creator-options" : ""}`}>
      {activeComponent && (
        <div className="sub-input-header flex-x align-center gap-small">
          <SimpleButton
            svg={<Icon name="ArrowLeft" size={16} />}
            title={t("back")}
            action={resetSubInput}
            extraClass="text-secondary rounded padding-small active-on-hover svg-blue"
          />
          <span className="text-bold">{componentLabel(t, activeComponent.id)}</span>
        </div>
      )}
      <div className={`rigo-input ${inside ? "" : "w-100"}`}>
        <SimpleButton
          svg={getIconForMode()}
          action={handleSubmit}
          extraClass={"big-circle rigo-button mr-12"}
        />
        <AutoResizeTextarea
          key={activeComponent?.id || "default"}
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
          minHeight={activeComponent?.id === "code_challenge_proposal" ? 120 : 60}
          defaultValue=""
          onChange={(e) => {
            setPrompt(e.target.value);
          }}
        />
      </div>

      {activeComponent?.generation === "image" && (
        <div className="image-style-select flex-x align-center gap-small">
          <label className="text-secondary">{t("imageStyle.label")}</label>
          <select
            className="rounded"
            value={imageStyle}
            onChange={(e) => setImageStyle(e.target.value)}
          >
            {imageStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {t(`imageStyle.${style.id}`)}
              </option>
            ))}
          </select>
        </div>
      )}

      {showPrompts && !activeComponent && menuContext === "edit" && (
        <div className="flex-y gap-small creator-options-buttons">
          {promps
            .filter((p) => {
              if (p.allowedElements?.includes("all")) return true;
              if (p.allowedElements?.includes(tagName)) return true;
              return false;
            })
            .map((p, index) =>
              p.type === "button" ? (
                <SimpleButton
                  svg={p.svg}
                  key={`${p.text}-${index}`}
                  title={p.title}
                  action={p.action}
                  extraClass={p.extraClass}
                  text={p.text}
                />
              ) : p.type === "select" ? (
                <div className="flex-x gap-small" key={`${p.text}-${index}`}>
                  <SimpleButton
                    svg={p.svg}
                    title={p.title}
                    action={() => p.action(toneRef.current?.value || "")}
                    extraClass={p.extraClass}
                    text={p.text}
                  />
                  <select ref={toneRef} className="rounded">
                    {p.options?.map((option) => (
                      <option key={option} value={option}>
                        {t(option)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null
            )}
          {tagName !== "new" && (
            <SimpleButton
              extraClass=" text-secondary  rounded padding-small active-on-hover svg-blue"
              action={onEditAsMarkdown}
              svg={svgs.edit}
              text={t("editAsMarkdown")}
            />
          )}
          {removeButton && <div className="menu-destructive">{removeButton}</div>}
        </div>
      )}

      {showPrompts && !activeComponent && menuContext === "add" && (
        <div className="flex-y gap-small creator-options-buttons">
          <div className="menu-section flex-y gap-small">
            <span className="menu-section-header">{t("menu.explanatory")}</span>
            {explanatory.map(renderComponentEntry)}
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
          <div className="menu-section flex-y gap-small">
            <span className="menu-section-header">{t("menu.assessment")}</span>
            {assessment.map(renderComponentEntry)}
          </div>
          {removeButton && <div className="menu-destructive">{removeButton}</div>}
        </div>
      )}
    </div>
  );
};
