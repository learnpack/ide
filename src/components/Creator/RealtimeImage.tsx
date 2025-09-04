import { useEffect, useState } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import { DEV_MODE } from "../../utils/lib";
// import { Loader } from "../composites/Loader/Loader";
import { svgs } from "../../assets/svgs";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import SimpleButton from "../mockups/SimpleButton";
import { Markdowner } from "../composites/Markdowner/Markdowner";
import { generateImageLearnPack } from "../../utils/creator";
import { Loader } from "../composites/Loader/Loader";
import { RigoAI } from "../Rigobot/AI";

const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");
type TImageData = {
  status: "ERROR" | "SUCCESS";
};

const RigoBubble = ({ action }: { action: () => void }) => {
  return (
    <SimpleButton
      svg={svgs.rigoSoftBlue}
      action={action}
      extraClass={"big-circle rigo-button"}
    />
  );
};

const RigoMessage = ({ message }: { message: string }) => {
  return (
    <div className="rigo-message">
      <RigoBubble action={() => { }} />
      <div className="markdown-container text-heavy-blue" >
        <Markdowner markdown={message} allowCreate={false} />
      </div>
    </div>
  );
};

export const MessageRenderer = ({
  message,
  role,
}: {
  message: string;
  role: "user" | "assistant";
}) => {
  const { t } = useTranslation();
  if (role === "assistant") {
    return <RigoMessage message={message} />;
  } else {
    return (
      <div className="flex-x gap-small row-reverse ">
        <span className="user-button">{t("you")}</span>
        <p className="m-0 fit-content p-2 rounded-medium padding-small bg-1 ">
          {message}
        </p>
      </div>
    );
  }
};

export const UserTextarea = ({
  defaultValue,
  onChange,
  onSubmit,
  placeholder,
}: {
  defaultValue: string;
  onSubmit: () => void;
  placeholder: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="user-textarea">
      <textarea
        defaultValue={defaultValue}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        className="flex-1 p-2 border border-gray rounded text-sm input w-100"
      />
      <SimpleButton
        extraClass={"action-button"}
        svg={svgs.send2}
        action={onSubmit}
      />
    </div>
  );
};

export default function RealtimeImage({
  imageId,
  onError,
  alt,
  allowCreate,
}: {
  imageId: string;
  onError: () => void;
  alt: string;
  allowCreate: boolean;
}) {
  const { t } = useTranslation();
  const config = useStore((state) => state.configObject);
  const rigoToken = useStore((state) => state.token);
  const fetchReadme = useStore((state) => state.fetchReadme);
  const useConsumable = useStore((state) => state.useConsumable);
  const [innerAlt, setInnerAlt] = useState(alt);
  const [status, setStatus] = useState<
    "PENDING" | "GENERATING" | "ERROR" | "SUCCESS"
  >("PENDING");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      message: string;
    }[]
  >([]);
  const reportEnrichDataLayer = useStore(
    (state) => state.reportEnrichDataLayer
  );

  const handleUpdate = (data: TImageData) => {
    if (data.status === "ERROR") {
      toast.error(t("imageGenerationFailed"));
      onError();
      return;
    }
    fetchReadme();
    reportEnrichDataLayer("creator_image_generation_completed", {
      image_id: imageId,
    });
  };

  useEffect(() => {
    if (!config?.config?.slug) return;

    socketClient.connect();
    socketClient.on(imageId, handleUpdate);

    socketClient.emit("registerNotification", {
      notificationId: imageId,
    });
    return () => {
      socketClient.off(imageId, handleUpdate);
      socketClient.disconnect();
    };
  }, []);

  const handleGeneration = async () => {
    await generateImageLearnPack(
      config?.config?.slug,
      {
        url: imageId,
        alt: innerAlt,
      },
      rigoToken
    );
    setStatus("GENERATING");
  };

  const handleMakeChanges = () => {
    setShowFeedbackInput(true);
  };

  const handleFeedbackSubmit = () => {
    if (feedbackMessage.trim()) {
      setMessages([...messages, { role: "user", message: feedbackMessage }]);
      RigoAI.useTemplate({
        slug: "re-write-image",
        inputs: {
          current: innerAlt,
          context: feedbackMessage,
        },
        onComplete: (success, data) => {
          if (success) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", message: data.data.parsed.aiMessage || "" },
            ]);
            setInnerAlt(data.data.parsed.newImage || "");
            useConsumable("ai-generation");
          } else {
            toast.error(t("imageGenerationFailed"));
          }
        },
      });
      setFeedbackMessage("");
    }
  };

  const handleCancelFeedback = () => {
    setShowFeedbackInput(false);
    setFeedbackMessage("");
  };

  const isGenerating = alt.startsWith("GENERATING");

  return (
    <div className="flex-y padding-medium bg-2 gap-small rounded">
      {(status === "GENERATING" || isGenerating) && (
        <Loader
          size="lg"
          text={t("imageGenerationInProcess")}
          svg={svgs.rigoSvg}
        />
      )}

      {status === "ERROR" ||
        (status === "PENDING" && !isGenerating && (
          <>
            <h3 className="text-center text-blue m-0">
              <div className="text-center">{svgs.imagePlaceholder}</div>
              {t("pendingImageGeneration")}
            </h3>
            <RigoMessage
              message={`
  ${t("rigoIsPropossingTheFollowingPromptDescription")}
  **${innerAlt}**
          `}
            />

            {allowCreate && !showFeedbackInput && (
              <>
                <div className="flex-x gap-small justify-center">
                  <SimpleButton
                    svg={svgs.checkIcon}
                    text={t("accept")}
                    action={handleGeneration}
                    extraClass={
                      "bg-blue-rigo text-white button w-100 justify-center"
                    }
                  />
                  <SimpleButton
                    svg={"✏️"}
                    text={t("makeChanges")}
                    action={handleMakeChanges}
                    extraClass={
                      "button border-2 border-blue text-blue w-100 justify-center"
                    }
                  />
                </div>
              </>
            )}
            {allowCreate && showFeedbackInput && (
              <div className="flex-y gap-medium">
                {messages.map((message) => (
                  <MessageRenderer
                    message={message.message}
                    role={message.role}
                  />
                ))}
                <UserTextarea
                  defaultValue={feedbackMessage}
                  onSubmit={handleFeedbackSubmit}
                  onChange={setFeedbackMessage}
                  placeholder={t("whatchangesWouldYouLikeForTheImage")}
                />
                <div className="flex-x gap-small justify-center">
                  <SimpleButton
                    svg={svgs.checkIcon}
                    text={t("generateImage")}
                    action={handleGeneration}
                    extraClass={
                      "bg-blue-rigo text-white button w-100 justify-center"
                    }
                    disabled={messages.length < 1}
                  />
                  <SimpleButton
                    svg={svgs.redClose}
                    text={t("cancel") || "Cancel"}
                    action={handleCancelFeedback}
                    extraClass={
                      "button border-2 border-blue border-gray text-gray w-100 justify-center"
                    }
                  />
                </div>
              </div>
            )}
          </>
        ))}
    </div>
  );
}
