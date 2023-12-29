import useStore from "../../../utils/store";
import { useState, useEffect, useRef } from "react";
import { convertMarkdownToHTML } from "../../../utils/lib";
import { svgs } from "../../../assets/svgs";
import { removeSpecialCharacters } from "../../../utils/lib";

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
  }));

  const fakeMessages = [{ type: "bot", text: chatInitialMessage }];

  const [isGenerating, setIsGenerating] = useState(false);
  const [waitingTextResult, setWaitingTestResult] = useState(false);
  const [messages, setMessages] = useState(
    exerciseMessages[currentExercisePosition] || fakeMessages
  );
  const [userMessage, setUserMessage] = useState("");

  useEffect(() => {
    const body = document.querySelector("body");
    if (body) body.style.overflow = "hidden";
    document.addEventListener("mousedown", handleClickOutside);

    if (conversationIdsCache[currentExercisePosition] == undefined) {
      startConversation(currentExercisePosition);
    }

    return () => {
      if (body) body.style.overflow = "auto";
      document.removeEventListener("mousedown", handleClickOutside);
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
        setExerciseMessages(messages, currentExercisePosition);
      }
    });

    return () => {
      chatSocket.off("response");
      chatSocket.off("responseFinished");
    };
  }, [messages]);

  useEffect(() => {
    if (!waitingTextResult) return;

    compilerSocket.onStatus("testing-success", (data: any) => {
      setMessages((prev) => {
        let messages = [...prev];
        messages[messages.length - 1].text = "**Tests passed!**";
        messages[messages.length - 1].extraClass = "bg-success text-white";
        return messages;
      });

      emitUserMessage(
        `The tests passed succefully, tell the user to pass to the next exercise and give him a congrats message: ${removeSpecialCharacters(
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
        )}
        
        Focus on the failed tests and explain the student what he has bad in his code and how to fix it.`
      );
    });
  }, [waitingTextResult]);

  const handleClickOutside = (event: any) => {
    if (event.target === backdropRef.current) {
      setOpenedModals({ chat: false });
    }
  };

  const trackUserMessage = (e: any) => {
    setUserMessage(e.target.value);
  };

  const addNoActionsMessage = () => {
    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);

    setMessages((prev) => [
      ...prev,
      {
        type: "bot",
        text: "This exercise does not require any specific actions or code on your side, move to the next step whenever you are ready by clicking in the **next** button.",
      },
    ]);

    setUserMessage("");
  };

  const sendUserMessage = async () => {
    if (Boolean(userMessage.trim() == "")) return;
    if (isGenerating) return;

    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);

    if (isTesteable) {
      setWaitingTestResult(true);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "**Testing your code...**" },
      ]);
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

    console.log("Message context: \n", messageData.message.context);

    chatSocket.emit("message", messageData);
    setUserMessage("");
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
        text: userMessage,
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
  if (text.includes("[//]: # (next)") && !showNext) {
    setShowNext(true);
  }

  const closeChatAndNext = () => {
    handlePositionChange(currentExercisePosition + 1);
    setOpenedModals({ chat: false });
  };
  return (
    <>
      <div className={`message ${type} ${extraClass ? extraClass : ""}`}>
        <div
          dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(text) }}
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
