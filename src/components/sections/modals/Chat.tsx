import useStore from "../../../utils/store";
import { useState, useEffect, useRef } from "react";
import { convertMarkdownToHTML } from "../../../utils/lib";
import { svgs } from "../../../assets/svgs";
import { removeSpecialCharacters } from "../../../utils/lib";

const chat_static_text = {
  "en-US": {
    disclaimer:
      "This AI, currently in beta, serves as an educational tutor. It is not a substitute for professional instruction. Use at your own risk and confirm details with authoritative educational resources.",
  },
  "sp-ES": {
    disclaimer:
      "Esta AI, actualmente en beta, sirve como tutor educativo. No es un sustituto de la instrucción profesional. Úselo bajo su propio riesgo y confirme los detalles con recursos educativos autorizados.",
  },
};
type TAIInteraction = {
  student_message?: string;
  starting_at?: number;
  context?: string;
  ai_response?: string;
  ending_at?: number;
};

let aiInteraction: TAIInteraction = {};

export default function Chat() {
  const backdropRef = useRef<HTMLDivElement>(null);

  const {
    setOpenedModals,
    currentExercisePosition,
    exerciseMessages,
    setExerciseMessages,
    chatSocket,
    conversationIdsCache,
    getContextFilesContent,
    learnpackPurposeId,
    token,
    chatInitialMessage,
    startConversation,
    isBuildable,
    isTesteable,
    runExerciseTests,
    compilerSocket,
    shouldBeTested,
    registerAIInteraction,
  } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
    currentExercisePosition: state.currentExercisePosition,
    exerciseMessages: state.exerciseMessages,
    setExerciseMessages: state.setExerciseMessages,
    chatSocket: state.chatSocket,
    compilerSocket: state.compilerSocket,
    conversationIdsCache: state.conversationIdsCache,
    getContextFilesContent: state.getContextFilesContent,
    learnpackPurposeId: state.learnpackPurposeId,
    token: state.token,
    chatInitialMessage: state.chatInitialMessage,
    startConversation: state.startConversation,
    isBuildable: state.isBuildable,
    isTesteable: state.isTesteable,
    runExerciseTests: state.runExerciseTests,
    shouldBeTested: state.shouldBeTested,
    registerAIInteraction: state.registerAIInteraction,
  }));

  const fakeMessages = [{ type: "bot", text: chatInitialMessage }];

  const [isGenerating, setIsGenerating] = useState(false);
  const [waitingTestResult, setWaitingTestResult] = useState(false);
  const [messages, setMessages] = useState(
    exerciseMessages[currentExercisePosition] || fakeMessages
  );
  const [userMessage, setUserMessage] = useState("");
  const [userMessageCache, setUserMessageCache] = useState("");

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    if (conversationIdsCache[currentExercisePosition] == undefined) {
      startConversation(currentExercisePosition);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Re-enable scrolling when the component unmounts
    };
  }, []);

  useEffect(() => {
    // @ts-ignore
    chatSocket.on("response", (message) => {
      let newMessages = [...messages];

      newMessages[newMessages.length - 1].text += message.chunk;
      setMessages(newMessages);
    });

    // @ts-ignore
    chatSocket.on("responseFinished", (data) => {
      if (data.status == "ok") {
        setIsGenerating(false);
        aiInteraction.ending_at = Date.now();
        aiInteraction.ai_response = messages[messages.length - 1].text;
        registerAIInteraction(currentExercisePosition, aiInteraction);
        aiInteraction = {};
        setExerciseMessages(messages, currentExercisePosition);
      }
    });

    const chatMessagesContainer = document.querySelector(".chat-messages");
    if (chatMessagesContainer) {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
    
    return () => {
      chatSocket.off("response");
      chatSocket.off("responseFinished");
    };
  }, [messages]);

  useEffect(() => {
    if (!waitingTestResult) return;

    compilerSocket.onStatus("testing-success", (data: any) => {
      setMessages((prev) => {
        let messages = [...prev];
        messages[messages.length - 1].text = "**Tests passed!**";
        messages[messages.length - 1].extraClass = "bg-success text-white";
        return messages;
      });

      emitUserMessage(
        `The tests passed succesfully, tell the user to pass to the next exercise and give him a congrats message: ${removeSpecialCharacters(
          data.logs[0]
        )}`
      );
    });

    compilerSocket.onStatus("testing-error", (data: any) => {
      setMessages((prev) => {
        let messages = [...prev];
        messages[messages.length - 1].text = "**Tests failed**";
        messages[messages.length - 1].extraClass = "bg-fail text-white";
        return messages;
      });

      emitUserMessage(
        `Some tests didn't passed, these are the tests logs: ${removeSpecialCharacters(
          data.logs[0]
        )}`
      );
    });
  }, [waitingTestResult]);

  const handleClickOutside = (event: any) => {
    if (event.target === backdropRef.current) {
      setOpenedModals({ chat: false });
    }
  };

  const trackUserMessage = (e: any) => {
    setUserMessage(e.target.value);
    setUserMessageCache(e.target.value);
  };

  const addNoActionsMessage = () => {
    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);

    setMessages((prev) => [
      ...prev,
      {
        type: "bot",
        text: "This exercise does not require any specific actions or code on your side, move to the next step whenever you are ready by clicking in the **next** button. [//]: # (next)",
      },
    ]);

    setUserMessage("");
  };

  const sendUserMessage = async () => {
    if (Boolean(userMessage.trim() == "")) return;
    if (isGenerating) return;

    const isFirstInteraction = messages.length === 1;

    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);
    setUserMessage("");

    if (isTesteable && (shouldBeTested || isFirstInteraction)) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "**Wait while I'm testing your code...**" },
      ]);
      setWaitingTestResult(true);
      runExerciseTests();
      return;
    }

    emitUserMessage();
  };

  const emitUserMessage = async (testResult?: string) => {
    setMessages((prev) => [...prev, { type: "bot", text: "" }]);

    const messageData = await getMessageData();

    if (testResult) {
      messageData.message.context += `\n${testResult}`;
    }

    aiInteraction.starting_at = Date.now();
    aiInteraction.student_message = messageData.message.text;
    aiInteraction.context = messageData.message.context;

    chatSocket.emit("message", messageData);
    // setUserMessage("");
    setIsGenerating(true);
  };

  const handleSubmit = () => {
    if (!isBuildable && !isTesteable) {
      addNoActionsMessage();
      return;
    }
    sendUserMessage();
  };

  const handleKeyUp = (event: any) => {
    if (event.key === "Enter" && !event.ctrlKey) {
      event.preventDefault();
      if (!isBuildable && !isTesteable) {
        addNoActionsMessage();
        return;
      }

      sendUserMessage();
    }
  };

  const getMessageData = async () => {
    const contextFilesContent = await getContextFilesContent();

    const data = {
      message: {
        type: "user",
        text: userMessageCache,
        purpose: learnpackPurposeId,
        context: contextFilesContent,
        imageB64: "",
      },
      data: {
        conversationID: conversationIdsCache[currentExercisePosition],
        purpose: learnpackPurposeId,
        token: token,
      },
    };
    return data;
  };

  return (
    <main ref={backdropRef} className="chat-container">
      <div className="chat-modal">
        <section className="chat-header">
          <h3>Learnpack AI-Tutor</h3>
          <button
            onClick={() => {
              setOpenedModals({ chat: false });
            }}
          >
            {svgs.closeIcon}
          </button>
        </section>
        <section className="chat-messages">
          {messages.map((message, index) => (
            <Message key={index} {...message} />
          ))}
        </section>
        <section className="chat-input">
          <textarea
            value={userMessage}
            placeholder="Ask me something here"
            onChange={trackUserMessage}
            onKeyUp={handleKeyUp}
          />
          <button onClick={handleSubmit}>{svgs.sendSvg}</button>
        </section>
        <section className="chat-footer">
          <p>{chat_static_text["en-US"].disclaimer}</p>
        </section>
      </div>
    </main>
  );
}

interface IMessage {
  type: string;
  text: string;
  extraClass?: string;
}

const Message = ({ type, text, extraClass }: IMessage) => {
  const { setOpenedModals, currentExercisePosition, handlePositionChange } =
    useStore((state) => ({
      setOpenedModals: state.setOpenedModals,
      currentExercisePosition: state.currentExercisePosition,
      handlePositionChange: state.handlePositionChange,
    }));

  const [showNext, setShowNext] = useState(false);
  const [messageText, setMessageText] = useState("");

  if (text.includes("[//]: # (next)") && !showNext) {
    setShowNext(true);
    setMessageText(text.replace("[//]: # (next)", ""));
  }

  const closeChatAndNext = () => {
    handlePositionChange(currentExercisePosition + 1);
    setOpenedModals({ chat: false });
  };

  return (
    <>
      <div className={`message ${type} ${extraClass ? extraClass : ""}`}>
        <div
          dangerouslySetInnerHTML={{
            __html: convertMarkdownToHTML(messageText ? messageText : text),
          }}
          //   dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(text) }}
        ></div>
      </div>
      {showNext && (
        <button onClick={closeChatAndNext} className="next-button">
          Next
        </button>
      )}
    </>
  );
};
