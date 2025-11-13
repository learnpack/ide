import toast from "react-hot-toast";
import { FASTAPI_HOST } from "../../utils/lib";
import { getCompletionJob } from "@/utils/apiCalls";

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

type TRigoTemplateParams = {
  templateSlug: string;
  payload?: Record<string, any>;
  format?: "html" | "markdown";
  target?: HTMLElement;
  onComplete?: (success: boolean, data: any) => void;
  onStart?: (data: { when: string; url: string }) => void;
  userToken: string;
  apiHost?: string;
  pusherKey?: string;
  pusherCluster?: string;
};

const rigoTemplateDefaults = {
  apiHost: "https://rigobot.herokuapp.com",
  pusherKey: "085fabde5864ef790a61",
  pusherCluster: "mt1",
};

const rigoTemplateState = {
  userToken: "",
  apiHost: rigoTemplateDefaults.apiHost,
  pusherKey: rigoTemplateDefaults.pusherKey,
  pusherCluster: rigoTemplateDefaults.pusherCluster,
};

export const RigoTemplate = {
  use: ({
    templateSlug,
    payload = {},
    format = "html",
    target,
    onComplete,
    onStart,
    userToken,
    apiHost,
    pusherKey,
    pusherCluster,
  }: TRigoTemplateParams): TAgentJob | undefined => {
    if (!templateSlug) {
      onComplete?.(false, { error: "No template slug provided" });
      return;
    }
    if (!userToken) {
      onComplete?.(false, { error: "No user token provided" });
      return;
    }
    if (!payload) {
      onComplete?.(false, { error: "No payload provided" });
      return;
    }
    if (target && !(target instanceof HTMLElement)) {
      onComplete?.(false, { error: "Target is not an HTMLElement" });
      return;
    }
    if (!["html", "markdown"].includes(format)) {
      onComplete?.(false, { error: `Invalid format ${format} provided` });
      return;
    }
    let pusherClient: any = null;
    let channel: any = null;
    let started = false;
    const resolvedApiHost = apiHost ?? rigoTemplateDefaults.apiHost;
    const resolvedPusherKey = pusherKey ?? rigoTemplateDefaults.pusherKey;
    const resolvedPusherCluster = pusherCluster ?? rigoTemplateDefaults.pusherCluster;
    return {
      stop: () => {
        if (channel) {
          channel.unbind_all();
          channel.unsubscribe();
        }
        if (pusherClient) {
          pusherClient.disconnect();
        }
      },
      run: async () => {
        try {
          const { default: Pusher } = await import("pusher-js");
          pusherClient = new Pusher(resolvedPusherKey, {
            cluster: resolvedPusherCluster,
          });
          const response = await fetch(
            `${resolvedApiHost}/v1/prompting/use-template/${templateSlug}/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${userToken}`,
              },
              body: JSON.stringify({
                inputs: payload,
                include_purpose_objective: false,
              }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log("Error using template errorData", errorData);
            onComplete?.(false, {
              error: errorData.detail || `HTTP error! status: ${response.status}`,
          });
            return;
          }
          const data = await response.json();
          const jobId = data.id;
          if (!jobId) {
            onComplete?.(false, { error: "No job ID returned from API" });
            return;
          }
          if (data.data) {
            onStart?.({
              when: new Date().toISOString(),
              url: window.location.href,
            });
            started = true;
            if (target) {
              target.innerHTML = data.data.answer || "";
            }
            console.log("data FROM INITIAL USE TEMPLATE CALL", data);
            onComplete?.(true, data);
            return;
          }
          const channelName = `completion-job-${jobId}`;
          channel = pusherClient.subscribe(channelName);
          channel.bind("completion", async (eventData: any) => {
            if (!started) {
              started = true;
            }
            const completionJob = await getCompletionJob(userToken, jobId, resolvedApiHost);
            if (completionJob.status === "SUCCESS" || completionJob.status === "ERROR") {
              if (target) {
                target.innerHTML = eventData.answer || "";
              }
              const success = completionJob.status === "SUCCESS";
              onComplete?.(success, {
                data: completionJob
              });
              try {
                channel.unbind_all();
              channel.unsubscribe();
              pusherClient.disconnect();
              } catch (error: any) {
                console.debug("Error unbinding pusher client", error);
              }
            }
          });
          pusherClient.connection.bind("error", (err: any) => {
            onComplete?.(false, { error: err?.error?.message || "Pusher connection error" });
          });
        } catch (error: any) {
          onComplete?.(false, {
            error: error?.message || "Unknown error occurred",
          });
          if (pusherClient) {
            pusherClient.disconnect();
          }
        }
      },
    };
  },
};

export const RigoAI = {
  started: false,
  load: () => {
    // @ts-ignore
    if (window.rigo) {
      console.log("RigoAI already started, skipping load");
      return;
    }
    const rigoAI = document.createElement("script");
    rigoAI.src = "https://unpkg.com/rigo-ai@0.1.17/dist/main.js";
    rigoAI.type = "text/javascript";
    rigoAI.async = true;
    document.head.appendChild(rigoAI);
    RigoAI.started = true;
    // @ts-ignore
    console.log("RigoAI loaded successfully", window.rigo);
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
        rigoTemplateState.userToken = userToken;
      } else {

        console.error(
          `No window.rigo found, initializing RigoAI failed, retrying in ${1000 * (retries + 1)
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

    const job = RigoTemplate.use({
      templateSlug: slug,
      payload: {
        ...inputs,
      },
      target,
      format: "markdown",
      onComplete: (success: boolean, data: any) => {
        if (onComplete) onComplete(success, data);
      },
      userToken: rigoTemplateState.userToken,
      // userToken: "bf535a2d08e685f5d2dbd810d3f509a90c63cfe3",
      apiHost: rigoTemplateState.apiHost,
      // apiHost: "https://rigobot-test-cca7d841c9d8.herokuapp.com",
      pusherKey: rigoTemplateState.pusherKey,
      pusherCluster: rigoTemplateState.pusherCluster,
    });

    if (job) {
      job.run();
    }
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
