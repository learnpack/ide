import { useState, useEffect, useRef } from "react";

import { useTranslation } from "react-i18next";
import SimpleButton from "../mockups/SimpleButton";
import {
  convertMarkdownToHTML,
  removeSpecialCharacters,
} from "../../utils/lib";
import { svgs } from "../../assets/svgs";

import useStore from "../../utils/store";
import { TUser } from "../../utils/storeTypes";
import toast from "react-hot-toast";
// import TagManager from "react-gtm-module";

function removeHiddenContent(text: string) {
  // Use a regular expression to match and remove the hidden section
  const regex = /<!--hide[\s\S]*?endhide-->/g;
  const textWithoutHidden = text.replace(regex, "").trim();
  return textWithoutHidden;
}

type TAIInteraction = {
  student_message?: string;
  starting_at?: number;
  context?: string;
  ai_response?: string;
  ending_at?: number;
};

let aiInteraction: TAIInteraction = {};

const formatInitialMessage = (
  message: string,
  user: TUser,
  stepSlug: string,
  fallbackMessage: string
) => {
  if (!message) return fallbackMessage;

  toast.loading(`USER: ${JSON.stringify(user)}`);

  if (!user || !user.first_name || !stepSlug || !message) return message;
  return message
    .replace("{userName}", user.first_name)
    .replace("{stepSlug}", stepSlug);
};

const slugToTitle = (slug: string) => {
  // Replace all - and _ with spaces and capitalize the first letter of each word
  return slug
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const ChatTab = () => {
  const inputRef = useRef<HTMLInputElement>(null);
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

    startConversation,

    isTesteable,
    runExerciseTests,
    compilerSocket,
    shouldBeTested,
    registerAIInteraction,
    setListeners,

    openLink,
    bc_token,
    isRigoOpened,
    toggleRigo,
    rigoContext,
    setRigoContext,
    user,
    getCurrentExercise,
    chatInitialMessage,
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
    isRigoOpened: state.isRigoOpened,
    bc_token: state.bc_token,
    openLink: state.openLink,
    toggleRigo: state.toggleRigo,
    rigoContext: state.rigoContext,
    setRigoContext: state.setRigoContext,
    user: state.user,
    getCurrentExercise: state.getCurrentExercise,
  }));

  const initialMessages = [
    {
      type: "bot",
      text: formatInitialMessage(
        t("chat-initial-message"),
        user,
        slugToTitle(getCurrentExercise().slug),
        chatInitialMessage
      ),
    },
  ];

  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState(
    exerciseMessages[Number(currentExercisePosition)] || initialMessages
  );
  const [userMessage, setUserMessage] = useState("");
  const [userMessageCache, setUserMessageCache] = useState("");

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
    if (!rigoContext) return;

    const askForHelp = t("can-you-give-me-a-hint");

    const userMessageWithContext = `${askForHelp} \n<!--hide You must give a hint to the user based in the context provided below: \nCONTEXT\n ${rigoContext} \n

    END_OF_CONTEXT: provide hints on failed answers or tests and provide a congratulations for correct ones. endhide-->`;

    setUserMessageCache(userMessageWithContext);
    setUserMessage(userMessageWithContext);
    if (!isRigoOpened) {
      toggleRigo();
    }
  }, [rigoContext]);

  useEffect(() => {
    if (!rigoContext || !userMessageCache || !userMessage) return;

    sendUserMessage();
    setRigoContext("");
  }, [rigoContext, userMessageCache, userMessage]);

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

  const setChatListeners = () => {
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
  };

  useEffect(() => {
    setMessages(
      exerciseMessages[Number(currentExercisePosition)] || initialMessages
    );
  }, [currentExercisePosition]);

  const trackUserMessage = (e: any) => {
    setUserMessage(e.target.value);
    setUserMessageCache(e.target.value);
  };

  const sendUserMessage = async () => {
    if (Boolean(userMessage.trim() == "")) return;
    if (isGenerating) return;

    const isFirstInteraction = messages.length === 1;

    setMessages((prev) => [
      ...prev,
      { type: "user", text: removeHiddenContent(userMessage) },
    ]);
    setUserMessage("");

    if (isTesteable && (shouldBeTested || isFirstInteraction)) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "**Wait while I'm testing your code...**" },
      ]);
      setChatListeners();
      runExerciseTests();
      return;
    }

    emitUserMessage();
  };

  const emitUserMessage = async (testResult?: string) => {
    setMessages((prev) => [...prev, { type: "bot", text: "" }]);

    const messageData = await getMessageData();

    if (testResult) {
      messageData.message.context += `\n <test_result>${testResult}</test_result>`;
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
          <section className="chat-messages">
            {messages.map((message, index) => (
              <Message key={index} {...message} />
            ))}
          </section>
        </div>

        <section className="chat-footer">
          <section className="chat-input">
            <input
              ref={inputRef}
              value={userMessage}
              placeholder={t("Ask me something here")}
              onChange={trackUserMessage}
              onKeyUp={handleKeyUp}
            />
            <button onClick={handleSubmit}>{svgs.send}</button>
          </section>
          <SimpleButton
            extraClass="informative-opener bg-secondary d-flex justify-center align-center circle-small pos-absolute"
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
    )
  );
};

interface IMessage {
  type: string;
  text: string;
  extraClass?: string;
}

const Message = ({ type, text, extraClass }: IMessage) => {
  const [messageText, setMessageText] = useState("");

  if (text.includes("[//]: # (next)")) {
    setMessageText(text.replace("[//]: # (next)", ""));
  }

  return (
    <>
      <div className={`message ${type} ${extraClass ? extraClass : ""}`}>
        <div
          dangerouslySetInnerHTML={{
            __html: convertMarkdownToHTML(messageText ? messageText : text),
          }}
        ></div>
      </div>
    </>
  );
};

export const RigoToggler = () => {
  const { toggleRigo, isRigoOpened } = useStore((state) => ({
    toggleRigo: state.toggleRigo,
    isRigoOpened: state.isRigoOpened,
  }));

  return (
    <div
      onClick={() => toggleRigo()}
      className={`rigo-toggle 
         ${isRigoOpened ? "conector-blue bg-rigo" : ""}`}
    >
      {isRigoOpened ? svgs.rigoSvg : svgs.blueRigoSvg}
    </div>
  );
};
