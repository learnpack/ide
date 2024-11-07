import useStore from "../../../utils/store";
import { useState, useEffect, useRef } from "react";
import { convertMarkdownToHTML } from "../../../utils/lib";
import { svgs } from "../../../assets/svgs";
import { removeSpecialCharacters } from "../../../utils/lib";
import { useTranslation } from "react-i18next";
import TagManager from "react-gtm-module";
import SimpleButton from "../../mockups/SimpleButton";

type TAIInteraction = {
  student_message?: string;
  starting_at?: number;
  context?: string;
  ai_response?: string;
  ending_at?: number;
};

let aiInteraction: TAIInteraction = {};

export default function Chat() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  const {
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

    isTesteable,
    runExerciseTests,
    compilerSocket,
    shouldBeTested,
    registerAIInteraction,
    setListeners,
    getCurrentExercise,
    user_id,
    openLink,
    bc_token,
    isRigoOpened,
    toggleRigo,
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
    setListeners: state.setListeners,
    getCurrentExercise: state.getCurrentExercise,
    user_id: state.user_id,
    isRigoOpened: state.isRigoOpened,
    bc_token: state.bc_token,
    openLink: state.openLink,
    toggleRigo: state.toggleRigo,
  }));

  const fakeMessages = [{ type: "bot", text: t(chatInitialMessage) }];

  const [isGenerating, setIsGenerating] = useState(false);
  const [waitingTestResult, setWaitingTestResult] = useState(false);
  const [messages, setMessages] = useState(
    exerciseMessages[Number(currentExercisePosition)] || fakeMessages
  );
  const [userMessage, setUserMessage] = useState("");
  const [userMessageCache, setUserMessageCache] = useState("");
  // const [chatIsOpen, setChatIsOpen] = useState(false);

  useEffect(() => {
    if (conversationIdsCache[Number(currentExercisePosition)] == undefined) {
      startConversation(Number(currentExercisePosition));
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (inputRef.current) {
      inputRef.current.focus();
    }
    return () => {};
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
        registerAIInteraction(Number(currentExercisePosition), aiInteraction);

        TagManager.dataLayer({
          dataLayer: {
            event: "ai_interaction",
            interaction: aiInteraction,
            slug: getCurrentExercise().slug,
            user_id: user_id,
          },
        });

        aiInteraction = {};
        setExerciseMessages(messages, Number(currentExercisePosition));
      }
    });

    const chatMessagesContainer = document.querySelector(".chat-messages");
    if (chatMessagesContainer) {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    if (!chatMessagesContainer) return;
    const anchors = chatMessagesContainer.getElementsByTagName("a");

    const handleClick = (event: any) => {
      event.preventDefault();
      openLink(event.target.href);
    };

    for (let anchor of anchors) {
      anchor.addEventListener("click", handleClick);
    }

    return () => {
      chatSocket.off("response");
      chatSocket.off("responseFinished");

      if (!chatMessagesContainer) return;
      for (let anchor of anchors) {
        anchor.removeEventListener("click", handleClick);
      }
    };
  }, [messages]);

  useEffect(() => {
    // if (!waitingTestResult) return;

    compilerSocket.onStatus("testing-success", (data: any) => {
      console.log("Receiving  testing-success error in chat");

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

      setListeners();
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

      setListeners();
    });
  }, [waitingTestResult]);

  const trackUserMessage = (e: any) => {
    setUserMessage(e.target.value);
    setUserMessageCache(e.target.value);
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
    sendUserMessage();
  };

  const handleKeyUp = (event: any) => {
    if (event.key === "Enter" && !event.ctrlKey) {
      event.preventDefault();

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
      conversation: {
        id: conversationIdsCache[Number(currentExercisePosition)],
        purpose: learnpackPurposeId,
        token: token,
      },
      breathecode: {
        token: bc_token,
      },
    };
    return data;
  };

  return (
    <>
      <div onClick={toggleRigo} className="rigo-thumbnail">
        {svgs.rigoSvg}
      </div>
      {isRigoOpened && (
        <div className="chat-modal chat-bubble">
          <section className="chat-header">
            <h3>{t("Rigobot AI-Tutor")}</h3>
          </section>
          <section className="chat-messages">
            {messages.map((message, index) => (
              <Message key={index} {...message} />
            ))}
          </section>
          <section className="chat-input">
            <textarea
              ref={inputRef}
              value={userMessage}
              placeholder={t("Ask me something here")}
              onChange={trackUserMessage}
              onKeyUp={handleKeyUp}
            />
            <button onClick={handleSubmit}>{svgs.sendSvg}</button>
          </section>
          <section className="chat-footer">
            <SimpleButton
              extraClass="informative-opener bg-secondary d-flex justify-center align-center circle-small"
              text={"?"}
            />

            <div className="informative-message">
              <p>
                {t(
                  "This AI, currently in beta, serves as an educational tutor. It is not a substitute for professional instruction. Use at your own risk and confirm details with authoritative educational resources."
                )}
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

interface IMessage {
  type: string;
  text: string;
  extraClass?: string;
}

const Message = ({ type, text, extraClass }: IMessage) => {
  const { currentExercisePosition, handlePositionChange, toggleRigo } =
    useStore((state) => ({
      toggleRigo: state.toggleRigo,
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
    handlePositionChange(Number(currentExercisePosition) + 1);
    toggleRigo();
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
