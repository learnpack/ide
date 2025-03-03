import { useState, useEffect, useRef, memo } from "react";

import { useTranslation } from "react-i18next";
import SimpleButton from "../mockups/SimpleButton";
import {
  debounce,
  removeSpecialCharacters,
  TokenExpiredError,
} from "../../utils/lib";
import { svgs } from "../../assets/svgs";

import useStore from "../../utils/store";
import { Loader } from "../composites/Loader/Loader";
import { Markdowner } from "../composites/Markdowner/Markdowner";
import { formatInitialMessage, slugToTitle } from "./utils";
import toast from "react-hot-toast";
import { validateRigobotToken } from "../../managers/fetchManager";

type TAIInteraction = {
  student_message?: string;
  starting_at?: number;
  context?: string;
  ai_response?: string;
  ending_at?: number;
};

let aiInteraction: TAIInteraction = {};

export const ChatTab = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const userMessage = useRef("");
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
    setListeners,

    bc_token,
    isRigoOpened,
    toggleRigo,
    rigoContext,
    setRigoContext,
    user,
    getCurrentExercise,
    chatInitialMessage,
    hasSolution,
    videoTutorial,
    reportEnrichDataLayer,
    registerTelemetryEvent,
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
    setListeners: state.setListeners,
    isRigoOpened: state.isRigoOpened,

    bc_token: state.bc_token,
    toggleRigo: state.toggleRigo,
    rigoContext: state.rigoContext,
    setRigoContext: state.setRigoContext,
    user: state.user,
    getCurrentExercise: state.getCurrentExercise,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    hasSolution: state.hasSolution,
    videoTutorial: state.videoTutorial,
    registerTelemetryEvent: state.registerTelemetryEvent,
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

  const autoScrollRef = useRef(true);
  const messagesRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef(0);

  useEffect(() => {
    if (conversationIdsCache[Number(currentExercisePosition)] == undefined) {
      startConversation(Number(currentExercisePosition));
    }

    scrollPosition.current = messagesRef.current?.scrollTop || 0;

    window.scrollTo({ top: scrollPosition.current, behavior: "smooth" });

    reportEnrichDataLayer("rigobot_open_bubble", {});

    if (inputRef.current) {
      inputRef.current.focus();
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (!rigoContext.context) return;

    const userMessageWithContext = `${rigoContext.userMessage} \n<!-- You must give a hint to the user based in the context provided below: \nCONTEXT\n ${rigoContext.context} \n
    
    END_OF_CONTEXT: provide hints on failed answers or tests and provide a congratulations for correct ones. Explain in simple words what is the user doing wrong and how to fix it. -->`;

    userMessage.current = userMessageWithContext;

    processUserMessage();
    setRigoContext({
      context: "",
      userMessage: "",
    });
    return;
  }, [rigoContext]);

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
        aiInteraction.ending_at = Date.now();
        aiInteraction.ai_response = messages[messages.length - 1].text;

        reportEnrichDataLayer("ai_interaction", {
          interaction: aiInteraction,
        });
        registerTelemetryEvent("ai_interaction", aiInteraction);

        aiInteraction = {};
        setExerciseMessages(messages, Number(currentExercisePosition));
      }
      if (data.finish_reason == "not_enough_ai_interactions") {
        setMessages((prev) => {
          let messages = [...prev];
          messages[messages.length - 1].text = t(
            "learnpack_consumable_depleted",
            { bc_token }
          );
          return messages;
        });
        reportEnrichDataLayer("learnpack_consumable_depleted", {
          service_slug: "ai_interaction",
        });
      }
      setIsGenerating(false);
    });

    if (messagesRef.current && autoScrollRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }

    return () => {
      chatSocket.off("response");
      chatSocket.off("responseFinished");
    };
  }, [messages]);

  useEffect(() => {
    setMessages(
      exerciseMessages[Number(currentExercisePosition)] || initialMessages
    );
  }, [currentExercisePosition]);

  const setChatListeners = () => {
    compilerSocket.onStatus("testing-success", (data: any) => {
      console.log("Receiving  testing-success error in chat");

      setMessages((prev) => {
        let messages = [...prev];
        const filtered = messages.filter(
          (message) => message.type !== "loader"
        );
        // filtered.push({
        //   type: "bot",
        //   text: "**Tests passed!**",
        //   extraClass: "bg-success text-white",
        // });
        return filtered;
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
        const filtered = messages.filter(
          (message) => message.type !== "loader"
        );
        // filtered.push({
        //   type: "bot",
        //   text: "**Tests failed**",
        //   extraClass: "bg-fail text-white",
        // });
        return filtered;
      });

      emitUserMessage(
        `Some tests didn't passed, these are the tests logs: ${removeSpecialCharacters(
          data.logs[0]
        )}`
      );

      setListeners();
    });
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

    const isFirstInteraction = messages.length === 1;

    setMessages((prev) => [...prev, { type: "user", text: message }]);

    if (isTesteable && (shouldBeTested || isFirstInteraction)) {
      setMessages((prev) => [...prev, { type: "loader", text: t("thinking") }]);
      setChatListeners();
      runExerciseTests();
      return;
    }

    emitUserMessage();
  }, 200);

  const emitUserMessage = async (testResult?: string) => {
    setMessages((prev) => [...prev, { type: "bot", text: "" }]);

    const messageData = await getMessageData();

    if (testResult) {
      messageData.message.context += `\n <test_result>${testResult}</test_result>`;
    }

    if (hasSolution) {
      messageData.message.context += `\n This exercise has solution file, the user can click the solution button at the top of LearnPack near Rigobot icon to see the solution. There are the steps to open `;
    }

    if (videoTutorial) {
      messageData.message.context += `\n This exercise has a video tutorial, the user can click the video button at the top of LearnPack near Rigobot icon to see the video`;
    }

    aiInteraction.starting_at = Date.now();
    aiInteraction.student_message = messageData.message.text;
    aiInteraction.context = messageData.message.context;

    chatSocket.emit("message", messageData);
    reportEnrichDataLayer("rigobot_send_message", {});

    setIsGenerating(true);
  };

  const handleKeyUp = (event: any) => {
    if (
      (event.key === "Enter" && !event.ctrlKey) ||
      (event.key === "Enter" && !event.shiftKey)
    ) {
      event.preventDefault();

      processUserMessage();
    }
  };

  const getMessageData = async () => {
    const contextFilesContent = await getContextFilesContent();

    const data = {
      message: {
        type: "user",
        text: userMessage.current,
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

const Message = memo(({ type, text, extraClass }: IMessage) => {
  if (type === "loader") {
    return <Loader text={text} svg={svgs.rigoSvg} />;
  }

  return (
    <div className={`message ${type} ${extraClass ? extraClass : ""}`}>
      <Markdowner markdown={text} />
    </div>
  );
});

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
