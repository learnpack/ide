import toast from "react-hot-toast";
import {
  FASTAPI_HOST,
  RIGOBOT_PUSHER_PENDING_MAX_ATTEMPTS,
  RIGOBOT_PUSHER_PENDING_POLL_INTERVAL_MS,
  RIGOBOT_RESCUE_MAX_ATTEMPTS,
  RIGOBOT_RESCUE_POLL_INTERVAL_MS,
} from "../../utils/lib";
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

export type TJobStartedContext = {
  jobId: string;
  attemptRescue: () => Promise<boolean>;
};

type TRigoTemplateParams = {
  templateSlug: string;
  payload?: Record<string, any>;
  format?: "html" | "markdown";
  target?: HTMLElement;
  onComplete?: (success: boolean, data: any) => void;
  onStart?: (data: { when: string; url: string }) => void;
  onJobStarted?: (ctx: TJobStartedContext) => void;
  userToken: string;
  apiHost?: string;
  pusherKey?: string;
  pusherHost?: string;
  pusherPort?: string;
};

const rigoTemplateDefaults = {
  pusherKey: import.meta.env.VITE_SOKETI_KEY,
  pusherHost: import.meta.env.VITE_SOKETI_HOST,
  pusherPort: import.meta.env.VITE_SOKETI_PORT,
  apiHost: import.meta.env.VITE_RIGOBOT_HOST || "https://rigobot.herokuapp.com",
};

const rigoTemplateState = {
  userToken: "",
  apiHost: rigoTemplateDefaults.apiHost,
  pusherKey: rigoTemplateDefaults.pusherKey,
  pusherHost: rigoTemplateDefaults.pusherHost,
};

const isTerminalCompletionStatus = (status: string) =>
  status === "SUCCESS" || status === "ERROR";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const RigoTemplate = {
  use: ({
    templateSlug,
    payload = {},
    format = "html",
    target,
    onComplete,
    onStart,
    onJobStarted,
    userToken,
    apiHost,
    pusherKey,
    pusherHost,
    pusherPort,
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
    let settled = false;
    let jobId = "";
    const resolvedApiHost = apiHost ?? rigoTemplateDefaults.apiHost;
    const resolvedSoketiKey = pusherKey ?? rigoTemplateDefaults.pusherKey;
    const resolvedPusherHost = pusherHost ?? rigoTemplateDefaults.pusherHost;
    const resolvedPusherPort = pusherPort ?? rigoTemplateDefaults.pusherPort;

    const cleanupPusher = () => {
      try {
        if (channel) {
          channel.unbind_all();
          channel.unsubscribe();
          channel = null;
        }
        if (pusherClient) {
          pusherClient.disconnect();
          pusherClient = null;
        }
      } catch (error) {
        console.debug("Error cleaning up pusher client", error);
      }
    };

    const settle = (completionJob: any, eventData?: { answer?: string }) => {
      if (settled) return;
      settled = true;
      if (target && eventData?.answer) {
        target.innerHTML = eventData.answer;
      }
      cleanupPusher();
      const success = completionJob.status === "SUCCESS";
      onComplete?.(success, { data: completionJob });
    };

    const pollCompletionJob = async (
      maxAttempts: number,
      intervalMs: number
    ) => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (settled) return null;
        try {
          const completionJob = await getCompletionJob(
            userToken,
            jobId,
            resolvedApiHost
          );
          if (isTerminalCompletionStatus(completionJob.status)) {
            return completionJob;
          }
        } catch (error) {
          console.warn("Error fetching completion job", error);
        }
        if (attempt < maxAttempts - 1) {
          await sleep(intervalMs);
        }
      }
      return null;
    };

    const attemptRescue = async (): Promise<boolean> => {
      if (settled) return true;
      const completionJob = await pollCompletionJob(
        RIGOBOT_RESCUE_MAX_ATTEMPTS,
        RIGOBOT_RESCUE_POLL_INTERVAL_MS
      );
      if (completionJob) {
        settle(completionJob);
        return true;
      }
      return settled;
    };

    return {
      stop: () => {
        settled = true;
        cleanupPusher();
      },
      run: async () => {
        // TEMP LOCAL: simulate Rigobot 503 to test error UX.
        // const SIMULATE_503 = true;
        // if (SIMULATE_503) {
        //   onComplete?.(false, {
        //     error: "Simulated 503 Service Unavailable",
        //     status: 503,
        //   });
        //   return;
        // }
        try {
          const { default: Pusher } = await import("pusher-js");
          pusherClient = new Pusher(resolvedSoketiKey, {
            wsHost: resolvedPusherHost,
            wsPort: resolvedPusherPort,
            forceTLS: true,
            disableStats: true,
            enabledTransports: ["ws", "wss"],
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
              status: response.status,
            });
            return;
          }
          const data = await response.json();
          jobId = data.id;
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

          onJobStarted?.({ jobId, attemptRescue });

          const channelName = `completion-job-${jobId}`;
          channel = pusherClient.subscribe(channelName);
          channel.bind("completion", async (eventData: any) => {
            if (settled) return;
            if (!started) {
              started = true;
            }
            const completionJob = await pollCompletionJob(
              RIGOBOT_PUSHER_PENDING_MAX_ATTEMPTS,
              RIGOBOT_PUSHER_PENDING_POLL_INTERVAL_MS
            );
            if (completionJob) {
              settle(completionJob, eventData);
            }
          });
          pusherClient.connection.bind("error", (err: any) => {
            if (settled) return;
            settled = true;
            cleanupPusher();
            onComplete?.(false, {
              error: err?.error?.message || "Pusher connection error",
            });
          });
        } catch (error: any) {
          if (!settled) {
            onComplete?.(false, {
              error: error?.message || "Unknown error occurred",
            });
          }
          cleanupPusher();
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
      console.log("RigoAI already started, skipping");
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
    onJobStarted,
  }: {
    slug: string;
    inputs: Record<string, string>;
    target?: HTMLElement;
    onComplete?: (success: boolean, data: any) => void;
    onJobStarted?: (ctx: TJobStartedContext) => void;
  }): TAgentJob | undefined => {
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
      onJobStarted,
      userToken: rigoTemplateState.userToken,
      apiHost: rigoTemplateState.apiHost,
      pusherKey: rigoTemplateState.pusherKey,
      pusherHost: rigoTemplateState.pusherHost,
    });

    if (job) {
      job.run();
      return job;
    }
    return undefined;
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
