import { useState, useEffect, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import SimpleButton from "../mockups/SimpleButton";
import { debounce, TokenExpiredError } from "../../utils/lib";
import { svgs } from "../../assets/svgs";
import useStore from "../../utils/store";
import { Loader } from "../composites/Loader/Loader";
import { Markdowner } from "../composites/Markdowner/Markdowner";
import { formatInitialMessage, slugToTitle } from "./utils";
import toast from "react-hot-toast";
import { validateRigobotToken, FetchManager } from "../../managers/fetchManager";
import { TAIInteraction } from "../../managers/telemetry";
import { RigoAI, TAgentJob, TTool } from "./AI";
import { ConversationManager, type Message } from "../../managers/conversationManager";

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
    resetEditingContent,
    rigoContext,
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
    resetEditingContent: state.resetEditingContent,
    rigoContext: state.rigoContext,
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
  const [messages, setMessages] = useState<Message[]>(
    (exerciseMessages[Number(currentExercisePosition)] || initialMessages).map(msg => ({
      type: msg.type as "user" | "bot",
      text: msg.text,
      timestamp: (msg as any).timestamp || Date.now()
    }))
  );

  const autoScrollRef = useRef(true);
  const messagesRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef(0);

  // Load conversation from localStorage
  useEffect(() => {
    if (environment === "localhost") return;

    const conversationKey = ConversationManager.generateKey(
      getCurrentExercise().slug,
      getCurrentExercise().slug,
      "en" // You might want to get this from store
    );

    const savedConversation = ConversationManager.getConversation(conversationKey);
    if (savedConversation && savedConversation.messages.length > 0) {
      setMessages(savedConversation.messages);
    }
  }, [currentExercisePosition, environment]);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    if (environment === "localhost") return;

    if (messages.length > 0) {
      const conversationKey = ConversationManager.generateKey(
        getCurrentExercise().slug,
        getCurrentExercise().slug,
        "en" // You might want to get this from store
      );

      ConversationManager.saveConversation(conversationKey, messages);
    }
  }, [messages, currentExercisePosition, environment]);

  useEffect(() => {
    scrollPosition.current = messagesRef.current?.scrollTop || 0;
    window.scrollTo({ top: scrollPosition.current, behavior: "smooth" });

    reportEnrichDataLayer("rigobot_open_bubble", {});

    if (inputRef.current) {
      inputRef.current.focus();
    }
    return () => {
      if (agentJobRef.current) {
        agentJobRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    setMessages(
      (exerciseMessages[Number(currentExercisePosition)] || initialMessages).map(msg => ({
        type: msg.type as "user" | "bot",
        text: msg.text,
        timestamp: (msg as any).timestamp || Date.now()
      }))
    );
  }, [currentExercisePosition]);


  const replaceReadmeContentTool = RigoAI.convertTool(
    async (args: { message: string; lineStart: number; lineEnd: number; content: string }) => {
      console.log("Agent is modifying readme content");
      console.log(args, "args");
      setMessages((prev) => [...prev, { type: "bot", text: args.message, timestamp: Date.now() }]);

      try {
        // Initialize editingContent if it's empty
        if (!editingContent) {
          resetEditingContent();
        }

        const currentEditingContent = editingContent || currentContent;
        const lines = currentEditingContent.split('\n');

        // Validate line range
        if (args.lineStart < 1 || args.lineEnd > lines.length || args.lineStart > args.lineEnd) {
          return `Invalid line range. Content has ${lines.length} lines. Please provide valid lineStart (1-${lines.length}) and lineEnd (${args.lineStart}-${lines.length}) values.`;
        }

        // Get the original lines that will be replaced
        const originalLines = lines.slice(args.lineStart - 1, args.lineEnd);
        const originalContent = originalLines.join('\n');

        // Create the changesDiff block
        const changesDiff = `\`\`\`changesDiff
${originalContent}
${DIFF_SEPARATOR}
${args.content}
\`\`\``;

        console.log("changesDiff", changesDiff);

        // Replace the lines with the changesDiff block
        const beforeLines = lines.slice(0, args.lineStart - 1);
        const afterLines = lines.slice(args.lineEnd);
        const updatedEditingContent = [
          ...beforeLines,
          changesDiff,
          ...afterLines
        ].join('\n');

        console.log("updatedEditingContent", updatedEditingContent);

        setEditingContent(updatedEditingContent);

        return `Lesson content updated from line ${args.lineStart} to ${args.lineEnd}. The changes are now visible in the editing area.`;
      } catch (error) {
        console.log("error modifying readme content", error);
        return "There was an error modifying the content. the error was: " + error;
      }
    },
    "replaceReadmeContent",
    "Replace specific lines in the readme content. The content is provided with line numbers for reference. IMPORTANT: Line numbers are for orientation only and should NOT be included in the replacement content. Its better to perform multiple smaller changes instead of one big change.",
    {
      lineStart: {
        type: "number",
        description: "Starting line number (1-based). Line numbers are for orientation only and should NOT be included in replacement content."
      },
      lineEnd: {
        type: "number",
        description: "Ending line number (1-based). Line numbers are for orientation only and should NOT be included in replacement content."
      },
      content: {
        type: "string",
        description: "The new content to replace the specified line range."
      },
      message: {
        type: "string",
        description: "The message to say to the user while doing the replacement"
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
        return "There was an error saving to memory bank. the error was: " + error;
      }
    },
    "saveToMemoryBank",
    "Save information to the course memory bank for future reference. You must detect the user's intent and save the information to the memory bank accordingly when needed. Call this function everytime the user provides relevant information about rules on how to create the content, things he like, things he doesn't like, etc.",
    {
      content: {
        type: "string",
        description: "The content to save to the memory bank"
      },
    }
  );

  const startLessonGenerationTool = RigoAI.convertTool(
    async (args: { feedback: string; mode?: "next-three" | "continue-with-all" }) => {
      console.log("Agent is starting lesson generation");

      try {
        const { continueGenerating } = await import("../../utils/creator");

        const currentExercisePosition = useStore.getState().currentExercisePosition;
        const syllabus = useStore.getState().syllabus;

        console.log("ARGS", args);

        // Check if current lesson status allows generation
        const currentLesson = syllabus.lessons?.[Number(currentExercisePosition)];
        if (currentLesson && currentLesson.status && !["PENDING", "ERROR"].includes(currentLesson.status)) {
          return `Cannot start lesson generation. Current lesson status is "${currentLesson.status}". This tool is only available when lesson status is PENDING or ERROR.`;
        }

        await continueGenerating(
          configObject.config.slug,
          Number(currentExercisePosition),
          args.feedback,
          args.mode || "next-three",
          token
        );
        toast.success(t("lesson-generation-started"));
        getSyllabus();

        return `Successfully started lesson generation with feedback: "${args.feedback}". The lesson will be generated in the background.`;
      } catch (error) {
        console.log("error starting lesson generation", error);
        return "There was an error starting lesson generation. The error was: " + error;
      }
    },
    "startLessonGeneration",
    "Start generating the current lesson with the provided feedback, the ideas of this function is to improve the quality of the lesson to generate, the lesson has not been generated yet, so you need to provide feedback to improve the lesson based in the interactions with the user, only call this function if you already understand the user requirements and have user confirmation to generate the lesson",
    {
      feedback: {
        type: "string",
        description: "The feedback or instructions for generating the lesson content, this will be passed to an AI to improve the lesson generation"
      },
      mode: {
        type: "string",
        description: "Generation mode: 'next-three' to generate next 3 lessons, or 'continue-with-all' to generate all remaining lessons",
        enum: ["next-three", "continue-with-all"]
      },
    }
  );

  const decideTools = () => {
    const _tools: TTool[] = []
    // return _tools
    if (environment !== "creatorWeb") {
      return _tools
    }
    if (rigoContext.allowedFunctions?.includes("continueGeneration")) {
      _tools.push(startLessonGenerationTool, saveToMemoryBankTool)
      setMessages((prev) => [...prev, { type: "bot", text: "Which changes you want to make to the lesson? Please provide feedback to improve the lesson generation", timestamp: Date.now() }]);
      return _tools
    }
    _tools.push(replaceReadmeContentTool, saveToMemoryBankTool)
    return _tools
  }

  const getTask = (message: string) => {
    if (environment === "creatorWeb") {
      return `You are a helpful teacher assistant. Please provide your responses always in MARKDOWN. Keep your message short and concise. This is the user message: ${message}`;
    }
    return `You are a helpful tutor with many years of experience teaching students. Keep your messages short and concise. Help the user when needed, clarify if you don't undestand the requirements. This is the user message: ${message}`;
  }

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

    setMessages((prev) => [...prev, { type: "user", text: message, timestamp: Date.now() }]);

    const contextFilesContent = await getContextFilesContent();
    let context = contextFilesContent;

    // Add line-numbered content for better AI understanding
    const lines = currentContent.split('\n');
    const numberedContent = lines.map((line, index) => `${index + 1}: ${line}`).join('\n');
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

    setMessages((prev) => [...prev, { type: "bot", text: "", timestamp: Date.now() }]);
    setIsGenerating(true);

    const toolsToUse = decideTools()

    console.log("toolsToUse", toolsToUse);

    

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
            setExerciseMessages(messages.map(msg => ({
              type: msg.type,
              text: msg.text,
              timestamp: msg.timestamp
            })), Number(currentExercisePosition));
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



  return (
    isRigoOpened && (
      <div className="chat-tab">
        <div>
          <section className="chat-tab-header">
            <p className="m-0 text-white">{t("Rigobot")}</p>

            <SimpleButton
              extraClass="text-white"
              action={toggleRigo}
              svg={svgs.cancel}
            />
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

