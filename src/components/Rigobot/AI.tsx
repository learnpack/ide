import toast from "react-hot-toast";
import { FASTAPI_HOST } from "../../utils/lib";

export type TRigoMessage = {
  text: string;
  type: "assistant" | "user";
};

export type TTool = {
  schema: {
    function: {
      name: string;
      description: string;
      parameters: any;
    };
  };
  function: (args: any) => Promise<any>;
};

export type TAgentLoop = {
  task: string;
  context: string;
  tools: TTool[];
  onMessage?: (message: string) => void;
  onComplete?: (success: boolean, data: any) => void;
};

export type TAgentJob = {
  stop: () => void;
  run: () => void;
};

export const RigoAI = {
  started: false,
  load: () => {
    if (RigoAI.started) {
      console.log("RigoAI already started, skipping load");
      return;
    }
    const rigoAI = document.createElement("script");
    rigoAI.src = "https://unpkg.com/rigo-ai@0.1.15/dist/main.js";
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

    const initialize = (retries = 0) => {
      if (retries > 5) {
        console.error("Failed to initialize RigoAI after 5 retries");
        return;
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

        console.error(
          `No window.rigo found, initializing RigoAI failed, retrying in ${
            1000 * (retries + 1)
          }ms`
        );
        // @ts-ignore
        console.log("WINDOWS RIGO", window.rigo);
        
        setTimeout(() => {
          initialize(retries + 1);
        }, 1000 * (retries + 1));
      }
    };

    initialize();
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

  agentLoop: function ({
    task,
    context,
    tools,
    onMessage,
    onComplete,
  }: TAgentLoop): TAgentJob {
    // @ts-ignore
    if (!window.rigo) {
      console.error("RIGOBOT AI NOT LOADED");
      throw new Error("RigoAI not loaded");
    }

    console.log("Starting Agent loop", task, context, tools, onMessage, onComplete);

    // @ts-ignore
    return window.rigo.agentLoop({
      task,
      context,
      tools,
      onMessage,
      onComplete,
    });
  },

  convertTool: function (func: any, name: string, description: string, parameters: any): TTool {
    // @ts-ignore
    if (!window.rigo) {
      console.error("RIGOBOT AI NOT LOADED");
      throw new Error("RigoAI not loaded");
    }

    // @ts-ignore
    return window.rigo.convertTool(func, name, description, parameters);
  },
};
