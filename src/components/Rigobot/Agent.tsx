import { useState, useEffect, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import SimpleButton from "../mockups/SimpleButton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  debounce,
  getComponentsInfo,
  getSlugFromPath,
  slugify,
  TokenExpiredError,
} from "../../utils/lib";
import { svgs } from "../../assets/svgs";
import useStore from "../../utils/store";
import { Loader } from "../composites/Loader/Loader";
import { Markdowner } from "../composites/Markdowner/Markdowner";
import { formatInitialMessage, slugToTitle } from "./utils";
import toast from "react-hot-toast";
import {
  validateRigobotToken,
  FetchManager,
} from "../../managers/fetchManager";
import { TAIInteraction } from "../../managers/telemetry";
import { RigoAI, TAgentJob, TTool } from "./AI";
import {
  ConversationManager,
  type Message,
} from "../../managers/conversationManager";
import { Icon } from "../Icon";

export const DIFF_SEPARATOR = "---SEPARATOR---";

let aiInteraction: TAIInteraction = {
  student_message: "",
  source_code: "",
  ai_response: "",
  started_at: 0,
  ended_at: 0,
};

export const AgentTab = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const userMessage = useRef("");
  const { t } = useTranslation();
  const agentJobRef = useRef<TAgentJob | null>(null);

  const {
    currentExercisePosition,
    exerciseMessages,
    setExerciseMessages,
    getContextFilesContent,
    token,
    isRigoOpened,
    toggleRigo,
    configObject,
    getSyllabus,
    user,
    getCurrentExercise,
    chatInitialMessage,
    hasSolution,
    videoTutorial,
    reportEnrichDataLayer,
    currentContent,
    registerTelemetryEvent,
    editingContent,

    environment,
    setEditingContent,
    rigoContext,
    mode,
    // isBuildable,
  } = useStore((state) => ({
    currentExercisePosition: state.currentExercisePosition,
    exerciseMessages: state.exerciseMessages,
    setExerciseMessages: state.setExerciseMessages,
    getContextFilesContent: state.getContextFilesContent,
    token: state.token,
    isRigoOpened: state.isRigoOpened,
    toggleRigo: state.toggleRigo,
    user: state.user,
    currentContent: state.currentContent,
    getCurrentExercise: state.getCurrentExercise,
    getSyllabus: state.getSyllabus,
    chatInitialMessage: state.chatInitialMessage,
    configObject: state.configObject,
    environment: state.environment,
    hasSolution: state.hasSolution,
    videoTutorial: state.videoTutorial,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    registerTelemetryEvent: state.registerTelemetryEvent,
    editingContent: state.editingContent,
    setEditingContent: state.setEditingContent,
    rigoContext: state.rigoContext,
    mode: state.mode,
    // isBuildable: state.isBuildable,
  }));

  const initialMessages: Message[] = [
    {
      type: "bot",
      text: formatInitialMessage(
        t("chat-initial-message"),
        user,
        slugToTitle(getCurrentExercise().slug),
        chatInitialMessage
      ),
      timestamp: Date.now(),
    },
  ];

  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const autoScrollRef = useRef(true);
  const messagesRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef(0);

  // Initialize messages from the best available source
  useEffect(() => {
    const initializeMessages = () => {
      let messagesToLoad: Message[] = [];

      // Try localStorage first (if available and not localhost)
      if (environment !== "localhost") {
        try {
          const conversationKey = ConversationManager.generateKey(
            getSlugFromPath() || "",
            getCurrentExercise().slug,
            "en"
          );
          const savedConversation =
            ConversationManager.getConversation(conversationKey);
          if (savedConversation && savedConversation.messages.length > 0) {
            messagesToLoad = savedConversation.messages;
          }
          console.log("SAVED CONVERSATION", savedConversation);
        } catch (error) {
          console.log("localStorage not available, falling back to store");
        }
      }

      // Fallback to exerciseMessages from store
      if (messagesToLoad.length === 0) {
        const storeMessages = exerciseMessages[Number(currentExercisePosition)];
        if (storeMessages && storeMessages.length > 0) {
          console.log("STORE MESSAGES", storeMessages);
          messagesToLoad = storeMessages.map((msg) => ({
            type: msg.type as "user" | "bot",
            text: msg.text,
            timestamp: (msg as any).timestamp || Date.now(),
          }));
        }
      }

      // Final fallback to initial messages
      if (messagesToLoad.length === 0) {
        messagesToLoad = [
          {
            type: "bot",
            text: formatInitialMessage(
              t("chat-initial-message"),
              user,
              slugToTitle(getCurrentExercise().slug),
              chatInitialMessage
            ),
            timestamp: Date.now(),
          },
        ];
      }

      setMessages(messagesToLoad);
      setIsInitialized(true);
    };

    initializeMessages();
  }, [currentExercisePosition, environment]);

  // Save conversation to both localStorage and store
  useEffect(() => {
    if (!isInitialized || messages.length === 0) return;

    // Save to store
    setExerciseMessages(
      messages.map((msg) => ({
        type: msg.type,
        text: msg.text,
        timestamp: msg.timestamp,
      })),
      Number(currentExercisePosition)
    );

    // Save to localStorage (if available and not localhost)
    if (environment !== "localhost") {
      try {
        const conversationKey = ConversationManager.generateKey(
          getSlugFromPath() || "",
          getCurrentExercise().slug,
          "en"
        );
        ConversationManager.saveConversation(conversationKey, messages);
      } catch (error) {
        console.log("Failed to save to localStorage:", error);
      }
    }
  }, [messages, currentExercisePosition, environment, isInitialized]);

  useEffect(() => {
    scrollPosition.current = messagesRef.current?.scrollTop || 0;
    window.scrollTo({ top: scrollPosition.current, behavior: "smooth" });

    reportEnrichDataLayer("rigobot_open_bubble", {});

    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Check if there's a userMessage in rigoContext and send it automatically
    if (rigoContext.userMessage && rigoContext.userMessage.trim() !== "") {
      userMessage.current = rigoContext.userMessage;
      // Clear the context message after using it
      useStore.getState().setRigoContext({ userMessage: "" });
      // Send the message automatically after a short delay
      setTimeout(() => {
        processUserMessage();
      }, 500);
    }

    if (rigoContext.aiMessage && rigoContext.aiMessage.trim() !== "") {
      setTimeout(() => {
        setMessages((prev) => {
          // Get the last message
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.type === "bot" && lastMessage.text === rigoContext.aiMessage) {
            return prev;
          }

          return [
            ...prev,
            { type: "bot", text: rigoContext.aiMessage, timestamp: Date.now() },
          ]
        });
      }, 500);

      useStore.getState().setRigoContext({ aiMessage: "" });
    }

    return () => {
      if (agentJobRef.current) {
        agentJobRef.current.stop();
      }
    };
  }, [rigoContext]);

  // Cleanup: Save conversation when component unmounts
  useEffect(() => {
    return () => {
      if (messages.length > 0) {
        // Save to store
        setExerciseMessages(
          messages.map((msg) => ({
            type: msg.type,
            text: msg.text,
            timestamp: msg.timestamp,
          })),
          Number(currentExercisePosition)
        );

        // Save to localStorage (if available)
        if (environment !== "localhost") {
          try {
            const conversationKey = ConversationManager.generateKey(
              getSlugFromPath() || "",
              getCurrentExercise().slug,
              "en"
            );
            ConversationManager.saveConversation(conversationKey, messages);
          } catch (error) {
            console.log("Failed to save to localStorage on cleanup:", error);
          }
        }
      }
    };
  }, [messages, currentExercisePosition, environment]);

  const replaceReadmeContentTool = RigoAI.convertTool(
    async (args: {
      message: string;
      lineStart: number;
      lineEnd: number;
      content: string;
    }) => {
      console.log(args, "args");
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: args.message, timestamp: Date.now() },
      ]);

      try {
        // Initialize editingContent if it's empty
        if (!editingContent) {
          setEditingContent(currentContent);
        }

        const currentEditingContent = editingContent || currentContent;
        const lines = currentEditingContent.split("\n");

        // Validate line range
        if (
          args.lineStart < 1 ||
          args.lineEnd > lines.length ||
          args.lineStart > args.lineEnd
        ) {
          return `Invalid line range. Content has ${lines.length} lines. Please provide valid lineStart (1-${lines.length}) and lineEnd (${args.lineStart}-${lines.length}) values.`;
        }

        // Validate content parameter
        if (!args.content || args.content.trim() === "" || args.content === "undefined") {
          return `Invalid content parameter. Please provide valid replacement content. Do not pass undefined, null, or empty strings.`;
        }

        // Get the original lines that will be replaced
        const originalLines = lines.slice(args.lineStart - 1, args.lineEnd);
        const originalContent = originalLines.join("\n");

        // Create the changesDiff block
        const changesDiff = `\`\`\`changesDiff
${originalContent}
${DIFF_SEPARATOR}
${args.content}
\`\`\``;

        // Replace the lines with the changesDiff block
        const beforeLines = lines.slice(0, args.lineStart - 1);
        const afterLines = lines.slice(args.lineEnd);
        const updatedEditingContent = [
          ...beforeLines,
          changesDiff,
          ...afterLines,
        ].join("\n");

        setEditingContent(updatedEditingContent);

        return `Lesson content updated from line ${args.lineStart} to ${args.lineEnd}. The changes are now visible in the editing area.`;
      } catch (error) {
        console.log("error modifying readme content", error);
        return (
          "There was an error modifying the content. the error was: " + error
        );
      }
    },
    "replaceReadmeContent",
    "Replace specific lines in the readme content. The content is provided with line numbers for reference. IMPORTANT: Line numbers are for orientation only and should NOT be included in the replacement content. NEVER make more than one change at a time, understand what to change and then call this tool a SINGLE time during your response.",
    {
      lineStart: {
        type: "number",
        description:
          "Starting line number (1-based). Line numbers are for orientation only and should NOT be included in replacement content.",
      },
      lineEnd: {
        type: "number",
        description:
          "Ending line number (1-based). Line numbers are for orientation only and should NOT be included in replacement content.",
      },
      content: {
        type: "string",
        description: "The new content to replace the specified line range.",
      },
      message: {
        type: "string",
        description:
          "The message to say to the user while doing the replacement",
      },
    }
  );

  const saveToMemoryBankTool = RigoAI.convertTool(
    async (args: { content: string }) => {
      console.log("Agent is saving to memory bank", args.content);

      try {
        const result = await FetchManager.saveMemoryBank(args.content, token);

        if (result.success) {
          return `Successfully saved to memory bank: ${args.content}`;
        } else {
          return "Failed to save to memory bank";
        }
      } catch (error) {
        console.log("error saving to memory bank", error);
        return (
          "There was an error saving to memory bank. the error was: " + error
        );
      }
    },
    "saveToMemoryBank",
    "Save information to the course memory bank for future reference. You must detect the user's intent and save the information to the memory bank accordingly when needed. Call this function everytime the user provides relevant information about rules on how to create the content, things he like, things he doesn't like, etc.",
    {
      content: {
        type: "string",
        description: "The content to save to the memory bank",
      },
    }
  );

  const startLessonGenerationTool = RigoAI.convertTool(
    async (args: {
      feedback: string;
      mode?: "next-three" | "continue-with-all";
    }) => {
      try {
        const { continueGenerating } = await import("../../utils/creator");

        const currentExercise = useStore.getState().getCurrentExercise();
        const syllabus = useStore.getState().syllabus;

        const lesson = syllabus?.lessons?.find((lesson) => {
          const slug = slugify(lesson.id + "-" + lesson.title);
          return slug === currentExercise.slug;
        });

        console.log("ARGS", args);

        if (
          lesson &&
          lesson.status &&
          !["PENDING", "ERROR"].includes(lesson.status)
        ) {
          return `Cannot start lesson generation. Current lesson status is "${lesson.status}". This tool is only available when lesson status is PENDING or ERROR.`;
        }

        await continueGenerating(
          configObject.config.slug,
          lesson?.uid || "",
          args.feedback,
          args.mode || "next-three",
          token
        );
        toast.success(t("lesson-generation-started"));
        getSyllabus();

        return `Successfully started lesson generation with feedback: "${args.feedback}". The lesson will be generated in the background.`;
      } catch (error) {
        console.log("error starting lesson generation", error);
        return (
          "There was an error starting lesson generation. The error was: " +
          error
        );
      }
    },
    "startLessonGeneration",
    "Start generating the current lesson with the provided feedback, the ideas of this function is to improve the quality of the lesson to generate, the lesson has not been generated yet, so you need to provide feedback to improve the lesson based in the interactions with the user, only call this function if you already understand the user requirements and have user confirmation to generate the lesson",
    {
      feedback: {
        type: "string",
        description:
          "The feedback or instructions for generating the lesson content, this will be passed to an AI to improve the lesson generation",
      },
      mode: {
        type: "string",
        description:
          "Generation mode: 'next-three' to generate next 3 lessons, or 'continue-with-all' to generate all remaining lessons",
        enum: ["next-three", "continue-with-all"],
      },
    }
  );

  const decideTools = () => {
    const _tools: TTool[] = [];
    // return _tools
    if (environment !== "creatorWeb") {
      return _tools;
    }
    _tools.push(saveToMemoryBankTool);
    
    // If we're in feedback pre-generation mode, only allow startLessonGenerationTool
    if (rigoContext.allowedFunctions?.includes("continueGeneration")) {
      _tools.push(startLessonGenerationTool);
      // Don't add replaceReadmeContentTool when in feedback pre-generation mode
      return _tools;
    }
    
    // In normal creator mode, allow replaceReadmeContentTool
    if (mode === "creator") {
      _tools.push(replaceReadmeContentTool);
    }
    
    return _tools;
  };

  const getTask = (message: string) => {
    let components = getComponentsInfo();

    if (environment === "creatorWeb") {
      return `You are a helpful teacher assistant. Your task is to help the teacher craft a meaning full course, with  Please provide your responses always in MARKDOWN. Keep your message short and concise. This is the user message: ${message}
      
      
      <COMPONENTS desc="List of all possible interactive components you can add to the lesson, do not mention this in any way to the user, but if the asks for example to add a quiz, you should use this information to understand how to do it, the same for the rest of components. ">
      ${components}
      </COMPONENTS>

      <RULES>
      Try to understand the teacher requirement and call the right tool is appropiate, do not make anything the user is not requesting. But highly adher to the user requirements.
      </RULES>

      `;
    }
    return `You are a helpful tutor with many years of experience teaching students. Keep your messages short and concise. Help the user when needed, but don't provide direct answer, try to make the user think about the problem and how to solve it. This is the user message: ${message}`;
  };

  const processUserMessage = debounce(async () => {
    const message = userMessage.current;

    inputRef.current!.value = "";

    if (!message) return;

    if (Boolean(message?.trim() == "")) return;
    if (isGenerating) return;

    try {
      await validateRigobotToken(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        toast.error(t("token_expired"));
        toggleRigo();
      }
    }
    autoScrollRef.current = true;

    setMessages((prev) => [
      ...prev,
      { type: "user", text: message, timestamp: Date.now() },
    ]);

    const contextFilesContent = await getContextFilesContent();
    let context = contextFilesContent;

    // Add rigoContext.context if available
    if (rigoContext.context && rigoContext.context.trim() !== "") {
      context += `\n\nSPECIFIC CONTEXT FOR THIS QUERY:\n${rigoContext.context}`;
      // Clear the context after using it
      useStore.getState().setRigoContext({ context: "" });
    }

    // Add line-numbered content for better AI understanding
    const lines = currentContent.split("\n");
    const numberedContent = lines
      .map((line, index) => `${index + 1}: ${line}`)
      .join("\n");
    context += `\n\nCURRENT LESSON CONTENT (with line numbers for reference):\n${numberedContent}`;

    // Add memory bank content to context
    try {
      const memoryBankResult = await FetchManager.getMemoryBank(token);
      console.log("MEMORY BANK RESULT", memoryBankResult);

      if (memoryBankResult.content) {
        context += `\n\nMEMORY BANK (Previous context and rules):\n${memoryBankResult.content}`;
      }
    } catch (error) {
      console.log("Error getting memory bank for context:", error);
    }

    if (hasSolution) {
      context += `\n This exercise has solution file, the user can click the solution button at the top of LearnPack near Rigobot icon to see the solution.`;
    }

    if (videoTutorial) {
      context += `\n This exercise has a video tutorial, the user can click the video button at the top of LearnPack near Rigobot icon to see the video`;
    }

    aiInteraction.started_at = Date.now();
    aiInteraction.student_message = message;
    aiInteraction.source_code = context;

    setMessages((prev) => [
      ...prev,
      { type: "bot", text: "", timestamp: Date.now() },
    ]);
    setIsGenerating(true);

    const toolsToUse = decideTools();

    // ADd the message to the context
    context += messages.map((msg) => `${msg.type}: ${msg.text}`).join("\n");

    try {
      const agentJob = RigoAI.agentLoop({
        task: getTask(message),
        context: context,
        tools: toolsToUse,
        onMessage: (message: any) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.type === "bot") {
              lastMessage.text = message.content;
              lastMessage.timestamp = Date.now();
            }
            return newMessages;
          });
        },
        onComplete: (success: boolean, data: any) => {
          console.log("Agent completed:", success, data);
          setIsGenerating(false);

          if (success) {
            aiInteraction.ended_at = Date.now();
            aiInteraction.ai_response = messages[messages.length - 1].text;

            reportEnrichDataLayer("ai_interaction", {
              interaction: aiInteraction,
            });
            registerTelemetryEvent("ai_interaction", aiInteraction);

            aiInteraction = {
              student_message: "",
              source_code: "",
              ai_response: "",
              started_at: 0,
              ended_at: 0,
            };
          }
        },
      });

      agentJobRef.current = agentJob;
      agentJob.run();
    } catch (error) {
      console.error("Error starting agent loop:", error);
      setIsGenerating(false);
      toast.error("Error starting agent conversation");
    }
  }, 200);

  const handleKeyUp = (event: any) => {
    if (
      (event.key === "Enter" && !event.ctrlKey) ||
      (event.key === "Enter" && !event.shiftKey)
    ) {
      event.preventDefault();
      processUserMessage();
    }
  };

  const handleScroll = () => {
    if (
      messagesRef.current?.scrollTop &&
      messagesRef.current?.scrollTop < scrollPosition.current
    ) {
      autoScrollRef.current = false;
    } else if (
      messagesRef.current?.scrollTop &&
      messagesRef.current?.scrollTop > scrollPosition.current
    ) {
      scrollPosition.current = messagesRef.current?.scrollTop || 0;
      if (!autoScrollRef.current) {
        autoScrollRef.current = true;
      }
    }
  };

  const clearConversation = () => {
    // Reset messages to initial state
    setMessages(initialMessages);

    // Clear from store
    setExerciseMessages([], Number(currentExercisePosition));

    // Clear from localStorage if available
    if (environment !== "localhost") {
      try {
        const conversationKey = ConversationManager.generateKey(
          getCurrentExercise().slug,
          getCurrentExercise().slug,
          "en"
        );
        ConversationManager.deleteConversation(conversationKey);
      } catch (error) {
        console.log("Failed to clear localStorage conversation:", error);
      }
    }

    toast.success(t("conversation-cleared"));
  };

  return (
    isRigoOpened && (
      <div className="chat-tab">
        <div>
          <section className="chat-tab-header">
            <p className="m-0 text-white">{t("Rigobot")}</p>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={clearConversation}
                    className="text-white hover:text-gray-300 transition-colors p-1"
                  >
                    <Icon name="MessageSquarePlus" size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("Start new chat")}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleRigo()}
                    className="text-white hover:text-gray-300 transition-colors p-1"
                  >
                    <Icon name="X" size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("Close chat")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </section>
          <section
            onScroll={handleScroll}
            className="chat-messages"
            ref={messagesRef}
          >
            {messages.map((message, index) => (
              <Message key={index} {...message} />
            ))}
          </section>
        </div>

        <section className="chat-footer">
          <section className="chat-input">
            <input
              className="text-big"
              ref={inputRef}
              placeholder={t("Ask me something here")}
              onChange={(e) => {
                userMessage.current = e.target.value;
              }}
              onKeyUp={handleKeyUp}
            />
            <button onClick={processUserMessage}>{svgs.send}</button>
          </section>
          <SimpleButton
            extraClass="informative-opener bg-secondary d-flex justify-center align-center circle-small pos-absolute"
            text={"?"}
          />

          <div className="informative-message">
            <p>
              {t(
                "This AI Agent can help you with tasks and has access to tools like changing the background color. Use at your own risk and confirm details with authoritative educational resources."
              )}
            </p>
          </div>
        </section>
      </div>
    )
  );
};

interface IMessage {
  type: "user" | "bot" | "loader";
  text: string;
  timestamp?: number;
  extraClass?: string;
}

const Message = memo(({ type, text, extraClass }: IMessage) => {
  const { t } = useTranslation();
  if (type === "loader") {
    return <Loader text={text} svg={svgs.rigoSvg} />;
  }

  return (
    <div className={`message ${type} ${extraClass ? extraClass : ""}`}>
      {type === "bot" && !text && (
        <Loader text={t("thinking")} svg={svgs.rigoSvg} />
      )}
      <Markdowner markdown={text} allowCreate={false} />
    </div>
  );
});
