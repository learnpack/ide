import toast from "react-hot-toast";
import { FASTAPI_HOST } from "../../utils/lib";

export type TRigoMessage = {
  text: string;
  type: "assistant" | "user";
};

export const RigoAI = {
  started: false,
  load: () => {
    if (RigoAI.started) {
      console.log("RigoAI already started, skipping load");
      return;
    }
    const rigoAI = document.createElement("script");
    rigoAI.src = "https://unpkg.com/rigo-ai@0.1.11/dist/main.js";
    rigoAI.type = "text/javascript";
    rigoAI.async = true;
    document.head.appendChild(rigoAI);
    RigoAI.started = true;
    console.log("RigoAI loaded successfully");
  },
  init: ({
    chatHash,
    purposeSlug,
    userToken,
    context,
  }: {
    chatHash: string;
    purposeSlug: string;
    userToken: string;
    context?: string;
  }) => {
    console.table({
      "Initilizing RigoAI with": "",
      chatHash,
      purposeSlug,
      userToken,
      context,
    });

    if (!RigoAI.started) {
      RigoAI.load();
    }

    // @ts-ignore
    if (window.rigo) {
      // @ts-ignore
      window.rigo.init(chatHash, {
        purposeSlug,
        user: {
          token: userToken,
        },
        context: context || "",
        sockethost: FASTAPI_HOST,
        // sockethost: "http://127.0.0.1:8003",
      });
      // @ts-ignore
      window.rigo.show({
        showBubble: false,
        collapsed: true,
      });
    } else {
      console.error("No window.rigo found, initializing RigoAI failed");
    }
  },
  useTemplate: ({
    slug,
    inputs,
    target,
    onComplete,
  }: {
    slug: string;
    inputs: Record<string, string>;
    target?: HTMLElement;
    onComplete?: (success: boolean, data: any) => void;
  }) => {
    // @ts-ignore
    if (!window.rigo) {
      console.error("RIGOBOT AI NOT LOADED");
      return;
    }

    // @ts-ignore
    const job = window.rigo.complete({
      templateSlug: slug,
      payload: {
        ...inputs,
      },
      target: target,
      format: "markdown",
      onComplete: (success: boolean, data: any) => {
        if (onComplete) onComplete(success, data);
      },
    });

    job.run();
  },

  ask: (
    question: string,
    target: HTMLElement,
    previousMessages: TRigoMessage[] = []
  ) => {
    // @ts-ignore
    const job = window.rigo.ask({
      prompt: question,
      target,
      previousMessages,
      format: "markdown",
      useVectorStore: false,
      onStart: () => {
        toast.success("AI is starting...");
      },
      onComplete: (success: boolean, data: any) => {
        console.log("success", success);
        console.log("data", data);
      },
    });

    if (job) {
      job.run();
    }
  },
};
