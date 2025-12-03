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
  // slugify,
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
import {
  ConversationManager,
  type Message,
} from "../../managers/conversationManager";
import { Icon } from "../Icon";

export const DIFF_SEPARATOR = "---SEPARATOR---";

// Pusher configuration - adjust these values
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "609743b48b8ed073d67f";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "https://rigobot.herokuapp.com";

// Types
type AgentRunResponse = {
  agent_run_id: string;
  agent_session_id: string;
};

type AgentRunDetail = {
  run_id: string;
  session_id: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "ERROR";
  iteration: number;
  error_message: string | null;
  inputs: {
    messages: Array<{ role: string; content: string }>;
  };
  outputs: Array<{
    iteration: number;
    type: "llm" | "tool";
    content?: string;
    tool?: string;
    arguments?: any;
    output?: any;
    call_id?: string;
  }>;
  started_at: string | null;
  ended_at: string | null;
  agent: {
    id: number;
    name: string;
    slug: string;
  };
  mode: {
    id: number;
    name: string;
    slug: string;
    enabled_tools: string[];
  };
};

type PusherToolCallEvent = {
  run_id: string;
  tool_name: string;
  iteration: number;
  timestamp: string;
};

type PusherCompletionEvent = {
  run_id: string;
  status: "SUCCESS" | "ERROR";
  final_message: string | null;
  iteration: number;
  timestamp: string;
  error_message?: string;
};

let aiInteraction: TAIInteraction = {
  student_message: "",
  source_code: "",
  ai_response: "",
  started_at: 0,
  ended_at: 0,
};

// Helper function to start agent run
async function startAgentRun(
  agentSlug: string,
  mode: string,
  messages: Array<{ role: string; content: string }>,
  token: string
): Promise<AgentRunResponse> {
  const response = await fetch(`${API_HOST}/v1/prompting/agent/run/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      agent: agentSlug,
      mode: mode,
      inputs: {
        messages: messages,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Helper function to get agent run details
async function getAgentRunDetails(
  runId: string,
  token: string
): Promise<AgentRunDetail> {
  const response = await fetch(`${API_HOST}/v1/prompting/agent/run/${runId}/`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Helper function to setup Pusher and subscribe to events
function setupPusherSubscription(
  runId: string,
  callbacks: {
    onToolCall?: (data: PusherToolCallEvent) => void;
    onCompletion?: (data: PusherCompletionEvent) => void;
    onError?: (error: any) => void;
  }
): { channel: any; pusher: any; cleanup: () => void } {
  let pusherClient: any = null;
  let channel: any = null;

  const cleanup = () => {
    if (channel) {
      channel.unbind_all();
      channel.unsubscribe();
    }
    if (pusherClient) {
      pusherClient.disconnect();
    }
  };

  // Dynamically import Pusher
  import("pusher-js").then((PusherModule) => {
    const Pusher = PusherModule.default;
    pusherClient = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });

    const channelName = `agent-run-${runId}`;
    channel = pusherClient.subscribe(channelName);

    channel.bind("tool-call", (data: PusherToolCallEvent) => {
      console.log("Tool call event:", data);
      callbacks.onToolCall?.(data);
    });

    channel.bind("agent-completed", (data: PusherCompletionEvent) => {
      console.log("Agent completed event:", data);
      callbacks.onCompletion?.(data);
      cleanup(); // Clean up after completion
    });

    pusherClient.connection.bind("error", (err: any) => {
      console.error("Pusher connection error:", err);
      callbacks.onError?.(err);
    });

    pusherClient.connection.bind("disconnected", () => {
      console.log("Pusher disconnected");
    });
  }).catch((error) => {
    console.error("Failed to load Pusher:", error);
    callbacks.onError?.(error);
  });

  return { channel, pusher: pusherClient, cleanup };
}

export const AgentTab = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const userMessage = useRef("");
  const { t } = useTranslation();
  const pusherSubscriptionRef = useRef<{ cleanup: () => void } | null>(null);
  const currentRunIdRef = useRef<string | null>(null);

  const {
    currentExercisePosition,
    exerciseMessages,
    setExerciseMessages,
    getContextFilesContent,
    token,
    isRigoOpened,
    toggleRigo,
    // configObject,
    // getSyllabus,
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

  // Determine agent slug and mode based on environment
  const getAgentConfig = () => {
    // TODO: Configure these values based on your setup
    const agentSlug = "lesson-assistant"
    const agentMode = mode;
    return { agentSlug, agentMode };
  };

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
          const savedConversation = ConversationManager.getConversation(conversationKey);
          if (savedConversation && savedConversation.messages.length > 0) {
            messagesToLoad = savedConversation.messages;
          }
        } catch (error) {
          console.log("localStorage not available, falling back to store");
        }
      }

      // Fallback to exerciseMessages from store
      if (messagesToLoad.length === 0) {
        const storeMessages = exerciseMessages[Number(currentExercisePosition)];
        if (storeMessages && storeMessages.length > 0) {
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

    setExerciseMessages(
      messages.map((msg) => ({
        type: msg.type,
        text: msg.text,
        timestamp: msg.timestamp,
      })),
      Number(currentExercisePosition)
    );

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
      useStore.getState().setRigoContext({ userMessage: "" });
      setTimeout(() => {
        processUserMessage();
      }, 500);
    }

    if (rigoContext.aiMessage && rigoContext.aiMessage.trim() !== "") {
      setTimeout(() => {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.type === "bot" && lastMessage.text === rigoContext.aiMessage) {
            return prev;
          }
          return [
            ...prev,
            { type: "bot", text: rigoContext.aiMessage, timestamp: Date.now() },
          ];
        });
      }, 500);
      useStore.getState().setRigoContext({ aiMessage: "" });
    }

    return () => {
      // Cleanup Pusher subscription on unmount
      if (pusherSubscriptionRef.current) {
        pusherSubscriptionRef.current.cleanup();
        pusherSubscriptionRef.current = null;
      }
    };
  }, [rigoContext]);

  // Cleanup: Save conversation when component unmounts
  useEffect(() => {
    return () => {
      if (messages.length > 0) {
        setExerciseMessages(
          messages.map((msg) => ({
            type: msg.type,
            text: msg.text,
            timestamp: msg.timestamp,
          })),
          Number(currentExercisePosition)
        );

        if (environment !== "localhost") {
          try {
            const conversationKey = ConversationManager.generateKey(
              getCurrentExercise().slug,
              getCurrentExercise().slug,
              "en"
            );
            ConversationManager.saveConversation(conversationKey, messages);
          } catch (error) {
            console.log("Failed to save to localStorage on cleanup:", error);
          }
        }
      }

      // Cleanup Pusher
      if (pusherSubscriptionRef.current) {
        pusherSubscriptionRef.current.cleanup();
      }
    };
  }, [messages, currentExercisePosition, environment]);

  // Handle tool calls - specifically propose_changes_in_lesson
  const handleToolCall = async (runId: string, toolData: PusherToolCallEvent) => {
    try {
      // Get full details from API
      const agentRun = await getAgentRunDetails(runId, token);

      // Find the latest tool call matching this tool name
      const toolCalls = agentRun.outputs.filter(
        (output) => output.type === "tool" && output.tool === toolData.tool_name
      );
      const lastToolCall = toolCalls[toolCalls.length - 1];

      if (lastToolCall && lastToolCall.tool === "propose_changes_in_lesson") {
        const { text_to_replace, replacement_value, message } = lastToolCall.output || {};

        if (text_to_replace && replacement_value) {
          // Apply the change in the frontend
          if (!editingContent) {
            setEditingContent(currentContent);
          }

          const currentEditingContent = editingContent || currentContent;
          const updatedContent = currentEditingContent.replace(
            text_to_replace,
            replacement_value
          );

          setEditingContent(updatedContent);

          // Show message to user
          if (message) {
            setMessages((prev) => [
              ...prev,
              { type: "bot", text: message, timestamp: Date.now() },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Error handling tool call:", error);
    }
  };

  // Handle agent completion
  const handleAgentCompletion = async (data: PusherCompletionEvent) => {
    setIsGenerating(false);

    try {
      if (data.status === "SUCCESS") {
        // Get final results
        const agentRun = await getAgentRunDetails(data.run_id, token);

        // Process all outputs to update messages
        agentRun.outputs.forEach((output) => {
          if (output.type === "llm" && output.content) {
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              // Update last message if it's empty or add new one
              if (lastMessage && lastMessage.type === "bot" && !lastMessage.text) {
                return prev.map((msg, idx) =>
                  idx === prev.length - 1
                    ? { ...msg, text: output.content || "", timestamp: Date.now() }
                    : msg
                );
              }
              // Check if this message already exists
              const exists = prev.some(
                (msg) => msg.type === "bot" && msg.text === output.content
              );
              if (!exists) {
                return [
                  ...prev,
                  { type: "bot", text: output.content || "", timestamp: Date.now() },
                ];
              }
              return prev;
            });
          }
        });

        // Telemetry
        aiInteraction.ended_at = Date.now();
        const lastMessage = messages[messages.length - 1];
        aiInteraction.ai_response = lastMessage?.text || "";

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
      } else {
        toast.error(data.error_message || "Error en el agente");
        console.error("Agent error:", data.error_message);
      }
    } catch (error) {
      console.error("Error handling completion:", error);
      toast.error("Error obteniendo resultados del agente");
    }
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
        return;
      }
    }

    autoScrollRef.current = true;
    setMessages((prev) => [
      ...prev,
      { type: "user", text: message, timestamp: Date.now() },
    ]);

    // Build context
    const contextFilesContent = await getContextFilesContent();
    let context = contextFilesContent;

    if (rigoContext.context && rigoContext.context.trim() !== "") {
      context += `\n\nSPECIFIC CONTEXT FOR THIS QUERY:\n${rigoContext.context}`;
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

    // Build messages array for API
    const apiMessages: Array<{ role: string; content: string }> = [];

    // Add system message if in creator mode
    if (environment === "creatorWeb") {
      let components = getComponentsInfo();
      apiMessages.push({
        role: "system",
        content: `You are a helpful teacher assistant. Your task is to help the teacher craft a meaningful course. Please provide your responses always in MARKDOWN. Keep your message short and concise.

<COMPONENTS desc="List of all possible interactive components you can add to the lesson, do not mention this in any way to the user, but if the asks for example to add a quiz, you should use this information to understand how to do it, the same for the rest of components.">
${components}
</COMPONENTS>

<RULES>
Try to understand the teacher requirement and call the right tool is appropriate, do not make anything the user is not requesting. But highly adhere to the user requirements.
</RULES>

This is the general context about the application or environment:
---
${context}
---`,
      });
    } else {
      apiMessages.push({
        role: "system",
        content: `You are a helpful tutor with many years of experience teaching students. Keep your messages short and concise. Help the user when needed, but don't provide direct answer, try to make the user think about the problem and how to solve it.

This is the general context about the application or environment:
---
${context}
---`,
      });
    }

    // Add conversation history (last few messages for context)
    const recentMessages = messages.slice(-5); // Last 5 messages for context
    recentMessages.forEach((msg) => {
      if (msg.type === "user") {
        apiMessages.push({ role: "user", content: msg.text });
      } else if (msg.type === "bot" && msg.text) {
        apiMessages.push({ role: "assistant", content: msg.text });
      }
    });

    // Add current user message
    apiMessages.push({ role: "user", content: message });

    try {
      const { agentSlug, agentMode } = getAgentConfig();

      // Start agent run
      const response = await startAgentRun(agentSlug, agentMode, apiMessages, token);
      currentRunIdRef.current = response.agent_run_id;

      // Setup Pusher subscription
      const subscription = setupPusherSubscription(response.agent_run_id, {
        onToolCall: async (toolData) => {
          await handleToolCall(toolData.run_id, toolData);
        },
        onCompletion: async (completionData) => {
          await handleAgentCompletion(completionData);
        },
        onError: (error) => {
          console.error("Pusher error:", error);
          toast.error("Error en la conexión en tiempo real");
        },
      });

      pusherSubscriptionRef.current = subscription;

      // Poll for updates as fallback (optional, if Pusher fails)
      // You can implement polling here if needed
    } catch (error: any) {
      console.error("Error starting agent run:", error);
      setIsGenerating(false);
      toast.error(error.message || "Error iniciando la conversación con el agente");
      
      // Cleanup on error
      if (pusherSubscriptionRef.current) {
        pusherSubscriptionRef.current.cleanup();
        pusherSubscriptionRef.current = null;
      }
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
    // Cleanup Pusher before clearing
    if (pusherSubscriptionRef.current) {
      pusherSubscriptionRef.current.cleanup();
      pusherSubscriptionRef.current = null;
    }
    currentRunIdRef.current = null;

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