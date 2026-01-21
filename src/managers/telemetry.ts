import {
  calculateIndicators,
  calculateTestMetrics,
  GlobalMetrics,
  StepMetrics,
  TIndicators,
  TStepIndicators,
  TTesteableElementMetrics,
} from "../utils/metrics";
import packageInfo from "../../package.json";
import { LocalStorage } from "./localStorage";
import axios, { AxiosResponse } from "axios";
import { TAgent } from "../utils/storeTypes";
import { LEARNPACK_LOCAL_URL } from "../utils/creator";
import { RIGOBOT_HOST } from "../utils/lib";
import toast from "react-hot-toast";
import { getPackageInfo } from "../utils/apiCalls";
import i18n from "../utils/i18n";

export interface IFile {
  path: string;
  name: string;
  hidden: boolean;
}

const sendBatchTelemetryBreathecode = async function (
  url: string,
  body: object,
  token: string
): Promise<AxiosResponse<any> | void> {
  if (!url || !token) {
    console.error("URL and token are required");
    return;
  }

  token = token.trim();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Token ${token}`,
  };

  try {
    const response: AxiosResponse<any> = await axios.post(url, body, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("Error while sending batch telemetry", error);

    if (axios.isAxiosError(error) && error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
};

const sendBatchTelemetryRigobot = async function (body: object, token: string) {
  const url = `${RIGOBOT_HOST}/v1/learnpack/telemetry`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Token ${token}`,
  };

  try {
    const response: AxiosResponse<any> = await axios.post(url, body, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("Error while sending batch telemetry", error);
    throw error;
  }
};

const getRigobotPackageIdBySlug = async function (
  packageSlug: string,
  token: string
): Promise<number | string | null> {
  if (!packageSlug || !token) return null;

  const cleanToken = token.trim();
  const url = `${RIGOBOT_HOST}/v1/learnpack/package/${packageSlug}/`;

  try {
    const response: AxiosResponse<any> = await axios.get(url, {
      headers: {
        Authorization: `Token ${cleanToken}`,
      },
    });

    return response?.data?.id ?? null;
  } catch (error) {
    // Best-effort enrichment, never block telemetry start/submit
    console.warn("Unable to resolve Rigobot package_id", {
      packageSlug,
      error,
    });
    return null;
  }
};

const sendStreamTelemetry = async function (
  url: string,
  body: object,
  token: string
) {
  if (!url || !token) {
    return;
  }

  fetch(
    url,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
    // false
  )
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.log("Error while sending stream Telemetry", error);
    });
};

const retrieveFromCLI =
  async function (): Promise<ITelemetryJSONSchema | null> {
    try {
      const response = await axios.get(`${LEARNPACK_LOCAL_URL}/telemetry`);
      // console.debug("Retrieved telemetry from CLI", response.data);
      return response.data;
    } catch (error) {
      console.error("Error while retrieving telemetry from CLI", error);
      return null;
    }
  };

// Transform Rigobot API response to ITelemetryJSONSchema format
const transformRigobotResponse = function (
  rigobotData: any,
  tutorialSlug: string
): ITelemetryJSONSchema | null {
  try {
    // Rigobot returns an array of telemetry objects, we take the first one
    const data = Array.isArray(rigobotData.results) ? rigobotData.results[0] : rigobotData.results;

    if (!data) {
      return null;
    }

    // Map Rigobot structure to ITelemetryJSONSchema
    const transformed: ITelemetryJSONSchema = {
      telemetry_id: data.telemetry_id || data.id?.toString(),
      user_id: data.user_id,
      fullname: data.fullname,
      slug: data.slug || tutorialSlug,
      package_id: data.package_id,
      version: data.version || "CLOUD:0.0.0",
      cohort_id: data.cohort_id || null,
      academy_id: data.academy_id || null,
      agent: data.agent || "cloud",
      tutorial_started_at: data.tutorial_started_at || Date.now(),
      last_interaction_at: data.last_interaction_at || Date.now(),
      steps: (data.steps || []).map((step: any) => ({
        slug: step.slug,
        position: step.position,
        files: step.files || [],
        is_testeable: step.is_testeable || false,
        opened_at: step.opened_at,
        testeable_elements: step.testeable_elements || [],
        completed_at: step.completed_at,
        compilations: step.compilations || [],
        tests: step.tests || [],
        sessions: step.sessions || [],
        ai_interactions: step.ai_interactions || [],
        quiz_submissions: step.quiz_submissions || [],
        is_completed: step.is_completed || false,
        metrics: step.metrics,
        indicators: step.indicators,
      })),
      workout_session: data.workout_session || [
        {
          started_at: data.tutorial_started_at || Date.now(),
        },
      ],
      global_metrics: data.global_metrics,
      global_indicators: data.global_indicators,
    };

    return transformed;
  } catch (error) {
    console.error("Error transforming Rigobot response:", error);
    return null;
  }
};

const retrieveFromRigobot = async function (
  userId: string,
  packageId: string | number,
  rigoToken: string,
  tutorialSlug: string
): Promise<ITelemetryJSONSchema | null> {
  if (!userId || !packageId || !rigoToken) {
    return null;
  }

  const url = `${RIGOBOT_HOST}/v1/learnpack/telemetry?user_ids=${userId}&package_ids=${packageId}&include_steps=true`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${rigoToken}`,
      },
    });

    const transformed = transformRigobotResponse(response.data, tutorialSlug);
    return transformed;
  } catch (error) {
    console.error("Error while retrieving telemetry from Rigobot", error);
    return null;
  }
};

// Handle UX for server-retrieved telemetry
const handleServerTelemetryUX = function (serverData: ITelemetryJSONSchema) {
  // Always log when telemetry is recovered from server
  console.log("[Telemetry] Telemetry recovered from server", serverData);

  // Show toast only first time
  const warningShown = LocalStorage.get("server_data_warning_shown");
  if (!warningShown) {
    toast(
      i18n.t("progress-recovered"),
      {
        duration: 8000,
        icon: "ℹ️",
      }
    );
    LocalStorage.set("server_data_warning_shown", true);
  }
};

const saveInCLI = async function (telemetry: ITelemetryJSONSchema) {
  try {
    const response = await axios.post(
      `${LEARNPACK_LOCAL_URL}/telemetry`,
      telemetry
    );
    console.debug("Saved telemetry in CLI", response.data);
    return response.data;
  } catch (error) {
    console.error("Error while saving telemetry in CLI", error);
    return null;
  }
};

function createUUID(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function stringToBase64(input: string): string {
  if (typeof input !== "string") {
    throw new TypeError("Input must be a string");
  }

  return btoa(encodeURIComponent(input));
}

type TCompilationAttempt = {
  source_code: string;
  stdout: string;
  exit_code: number;
  started_at: number;
  ended_at: number;
};

export type TTestAttempt = {
  source_code: string;
  stdout: string;
  exit_code: number;
  started_at: number;
  ended_at: number;
};

export type TTesteableElementType = "quiz" | "test";

export type TTesteableElement = {
  hash: string;
  searchString: string;
  is_completed?: boolean;
  type: TTesteableElementType;
  metrics?: TTesteableElementMetrics;
};

export type TAIInteraction = {
  student_message: string;
  source_code: string;
  ai_response: string;
  started_at: number;
  ended_at: number;
};

export type TQuizSelection = {
  question: string;
  answer: string;
  isCorrect: boolean;
  feedback?: string;
};

export type TQuizSubmission = {
  status: "SUCCESS" | "ERROR";
  percentage: number;
  quiz_hash: string;
  selections: TQuizSelection[];
  ended_at: number;
  started_at: number;
};

export type TStep = {
  slug: string;
  position: number;
  files: IFile[];
  is_testeable: boolean;
  opened_at?: number;
  testeable_elements?: TTesteableElement[];
  completed_at?: number; // If the step has tests or quizzes, the time when all the tests passed, else, the time when the user opens the next step, if no tests or quizzes, the time when the user opens the next step
  compilations: TCompilationAttempt[];
  tests: TTestAttempt[];
  sessions?: number[];
  ai_interactions: TAIInteraction[];
  quiz_submissions: TQuizSubmission[];
  is_completed: boolean;
  metrics?: StepMetrics;
  indicators?: TIndicators;
};

type TWorkoutSession = {
  started_at: number;
  ended_at?: number;
};

type TStudent = {
  token: string;
  user_id: string;
  fullname: string;
  rigo_token: string;
  academy_id: string;
  cohort_id: string;
};

const fixStepData = (event: string, data: any): any => {
  let fixed = { ...data };

  if (
    typeof fixed.starting_at !== "undefined" &&
    typeof fixed.started_at === "undefined"
  ) {
    fixed.started_at = fixed.starting_at;
    delete fixed.starting_at;
  }
  if (
    typeof fixed.ending_at !== "undefined" &&
    typeof fixed.ended_at === "undefined"
  ) {
    fixed.ended_at = fixed.ending_at;
    delete fixed.ending_at;
  }

  if (typeof fixed.started_at === "undefined" && event !== "open_step")
    fixed.started_at = Date.now();
  if (typeof fixed.ended_at === "undefined" && event !== "open_step")
    fixed.ended_at = Date.now();

  // Codifica en base64 los campos relevantes
  if (fixed.source_code) {
    fixed.source_code = stringToBase64(fixed.source_code);
  }
  if (fixed.stdout) {
    fixed.stdout = stringToBase64(fixed.stdout);
  }
  if (fixed.stderr) {
    fixed.stderr = stringToBase64(fixed.stderr);
  }

  // Corrige exitCode -> exit_code
  if (Object.prototype.hasOwnProperty.call(fixed, "exitCode")) {
    fixed.exit_code = fixed.exitCode;
    fixed.exitCode = undefined;
  }

  return fixed;
};

export interface ITelemetryJSONSchema {
  telemetry_id?: string;
  user_id?: number | string;
  fullname?: string;
  slug: string;
  package_id?: number | string;
  version: string;
  cohort_id: string | null;
  academy_id: string | null;
  agent?: string;
  tutorial_started_at: number;
  last_interaction_at: number;
  steps: Array<TStep>; // The steps should be the same as the exercise
  workout_session: TWorkoutSession[]; // It start when the user starts Learnpack, if the last_interaction_at is available, it automatically fills with that
  // number and start another session
  global_metrics?: GlobalMetrics;
  global_indicators?: TIndicators;
}

export type TStepEvent =
  | "compile"
  | "test"
  | "ai_interaction"
  | "open_step"
  | "quiz_submission";

export type TTelemetryUrls = {
  streaming?: string;
  batch?: string;
};

type TUser = {
  token: string;
  rigo_token: string;
  id: string;
  fullname: string;
};

type TAlerts = "test_struggles" | "compile_struggles";

interface ITelemetryManager {
  current: ITelemetryJSONSchema | null;
  started: boolean;
  agent: TAgent;
  version: string;
  user: TUser;
  telemetryKey: string;
  urls: TTelemetryUrls;
  salute: (message: string) => void;
  start: (
    agent: TAgent,
    steps: TStep[],
    tutorialSlug: string,
    storageKey: string,
    student: TStudent
  ) => void;
  tutorialSlug: string;
  prevStep?: number;
  prevStepStartedAt?: number;
  listeners: Record<string, (data: any) => void>;
  registerListener: (event: TAlerts, callback: (data: any) => void) => void;
  registerStepEvent: (
    stepPosition: number,
    event: TStepEvent,
    data: any,
    retry?: number
  ) => void;
  registerTesteableElement: (
    stepPosition: number,
    testeableElement: TTesteableElement
  ) => void;
  hasTesteableElementByHash: (stepPosition: number, hash: string) => boolean;
  hasPendingTasks: (stepPosition: number) => boolean;
  hasPendingTasksInAnyLesson: () => boolean;
  isTesteable: (stepPosition: number) => boolean;
  getStepIndicators: (stepPosition: number) => TStepIndicators | null;
  streamEvent: (stepPosition: number, event: string, data: any) => void;
  submit: () => Promise<void>;
  finishWorkoutSession: () => void;
  save: () => void;
  retrieve: () => Promise<{ telemetry: ITelemetryJSONSchema | null; fromServer: boolean }>;
  getStep: (stepPosition: number) => TStep | null;
}

const TelemetryManager: ITelemetryManager = {
  current: null,
  urls: {},
  telemetryKey: "",
  listeners: {},
  agent: "cloud",
  prevStep: undefined,
  prevStepStartedAt: undefined,
  user: {
    token: "",
    rigo_token: "",
    id: "",
    fullname: "",
  },
  tutorialSlug: "",
  started: false,
  version: `${packageInfo.version}` || "CLOUD:0.0.0",
  salute: (message) => {
    console.log(message);
  },

  start: function (agent, steps, tutorialSlug, storageKey, student) {
    this.telemetryKey = storageKey;
    this.tutorialSlug = tutorialSlug;
    this.agent = agent;
    this.user.id = student.user_id;
    this.user.token = student.token;
    this.user.rigo_token = student.rigo_token;
    this.user.fullname = student.fullname;
    // Email removed for security - not stored in telemetry

    if (!this.current) {
      this.retrieve()
        .then((result) => {
          const { telemetry: prevTelemetry, fromServer } = result;

          if (prevTelemetry) {
            this.current = prevTelemetry;
            this.finishWorkoutSession();

            // If data came from server, handle UX
            if (fromServer) {
              handleServerTelemetryUX(prevTelemetry);
              // Don't call submit() to avoid redundant re-send to server
            }
          } else {
            console.debug(
              "No previous telemetry found, creating new one. Agent: ",
              agent
            );

            this.current = {
              telemetry_id: createUUID(),
              slug: tutorialSlug,
              version: `${this.version}`,
              agent,
              tutorial_started_at: Date.now(),
              last_interaction_at: Date.now(),
              steps,
              workout_session: [
                {
                  started_at: Date.now(),
                },
              ],
              fullname: this.user.fullname,
              cohort_id: null,
              academy_id: null,
            };
          }

          this.current.user_id = this.user.id;
          this.current.fullname = this.user.fullname;
          this.current.cohort_id = student.cohort_id;
          this.current.academy_id = student.academy_id;

          if (!this.current.version) {
            this.current.version = `CLOUD:${this.version}`;
          }

          // Best-effort: enrich telemetry with Rigobot package_id using current slug.
          if (
            !this.current.package_id &&
            this.current.slug &&
            this.user.rigo_token
          ) {
            getRigobotPackageIdBySlug(this.current.slug, this.user.rigo_token)
              .then((packageId) => {
                if (!packageId || !this.current) return;
                if (this.current.package_id) return;
                this.current.package_id = packageId;
                this.save();
              })
              .catch((error) => {
                // ignore
                console.error("Error getting Rigobot package id by slug", error);
              });
          }

          // Save telemetry (always save after setting user data)
          this.save();

          this.started = true;

          // Only submit if data came from local storage (not from server)
          if (!fromServer) {
            if (!this.user.id) {
              console.warn(
                "No user ID found, impossible to submit telemetry at start"
              );
              return;
            }

            this.submit();
          }
        })
        .catch((error) => {
          console.log("ERROR: There was a problem starting the Telemetry");
          console.error(error);

          throw new Error(
            "There was a problem starting, reload LearnPack\nRun\n$ learnpack start"
          );
        });
    }
  },

  registerListener: function (event: TAlerts, callback: (data: any) => void) {
    this.listeners[event] = callback;
  },

  hasTesteableElementByHash: function (stepPosition: number, hash: string) {
    if (!this.current) {
      return false;
    }
    return this.current.steps[stepPosition]?.testeable_elements?.some((e) => e.hash === hash) || false;
  },

  registerTesteableElement: function (
    stepPosition: number,
    testeableElement: TTesteableElement
  ) {
    if (!this.current) {
      console.log("No current telemetry to register testeable element", stepPosition, testeableElement);
      return
    };

    console.log("Registering testeable element", stepPosition, testeableElement);

    // Chequea si el elemento ya existe en otro step
    const existsInOtherStep = this.current.steps.findIndex(
      (step, idx) =>
        idx !== stepPosition &&
        step.testeable_elements?.some((e) => e.hash === testeableElement.hash)
    );

    if (existsInOtherStep !== -1) {
      console.log(`Testeable element already exists in at ${existsInOtherStep} step, moving on to current step`, stepPosition, testeableElement);
      const otherStep = this.current.steps[existsInOtherStep];
      // remove from other step
      otherStep.testeable_elements = otherStep.testeable_elements?.filter((e) => e.hash !== testeableElement.hash);
      this.current.steps[existsInOtherStep] = otherStep;
    }

    if (!this.current.steps[stepPosition]?.testeable_elements) {
      this.current.steps[stepPosition].testeable_elements = [];
    }

    const step = { ...this.current.steps[stepPosition] };
    let elements = [...(step.testeable_elements || [])];

    const prevElement = elements.find((e) => e.hash === testeableElement.hash);

    elements = elements.filter((e) => e.hash !== testeableElement.hash);
    let newElement = prevElement
      ? { ...prevElement, ...testeableElement }
      : { ...testeableElement };

    if (newElement.is_completed && !newElement.metrics) {
      newElement.metrics = calculateTestMetrics(step, testeableElement.hash);
    }

    elements.push(newElement);

    step.testeable_elements = elements;
    console.log("step.testeable_elements", step.testeable_elements);
    this.current.steps[stepPosition] = step;
    this.save();
  },

  isTesteable: function (stepPosition: number) {
    const step = this.current?.steps[stepPosition];
    if (!step) {
      return false;
    }
    return Boolean(step.is_testeable || (step.testeable_elements && step.testeable_elements.length > 0));
  },

  getStepIndicators: function (stepPosition: number) {
    if (!this.current) {
      return null;
    }
    const indicators = calculateIndicators(this.current);
    const stepIndicators = indicators.steps[stepPosition];
    return stepIndicators;
  },

  finishWorkoutSession: function () {
    if (!this.current) {
      return;
    }

    const lastSession =
      this.current?.workout_session[this.current.workout_session.length - 1];
    if (
      lastSession &&
      !lastSession.ended_at &&
      this.current?.last_interaction_at
    ) {
      lastSession.ended_at = this.current.last_interaction_at;
      this.current.workout_session.push({
        started_at: Date.now(),
      });
    }
  },

  registerStepEvent: function (stepPosition, event, data, retry = 0) {
    if (!this.current) {
      if (retry < 3) {
        setTimeout(() => {
          this.registerStepEvent(stepPosition, event, data, retry + 1);
        }, 2000);
      } else {
        console.error(
          `Telemetry event: ${event} NOT REGISTERED after ${retry} retries`
        );
      }
      return;
    }

    const step = this.current.steps[stepPosition];
    if (!step) {
      //   toast.error(`No step ${stepPosition} found ${event} NOT REGISTERED`);
      console.error(`No step ${stepPosition} found ${event} NOT REGISTERED`);
      return;
    }

    data = fixStepData(event, data);

    switch (event) {
      case "compile":
        if (!step.compilations) {
          step.compilations = [];
        }

        step.compilations.push(data);
        this.current.steps[stepPosition] = step;
        break;
      case "test":
        if (!step.tests) {
          step.tests = [];
        }

        step.tests.push(data);

        const now = Date.now();
        const hasPendingTasks = this.hasPendingTasks(stepPosition);

        if (!hasPendingTasks && !step.completed_at && data.exit_code === 0) {
          step.completed_at = now;
          step.is_completed = true;
        } else {
          console.log("hasPendingTasks", hasPendingTasks);
        }

        this.current.steps[stepPosition] = step;
        this.submit();
        break;
      case "ai_interaction":
        if (!step.ai_interactions) {
          step.ai_interactions = [];
        }

        step.ai_interactions.push(data);
        break;

      case "quiz_submission": {
        if (!step.quiz_submissions) {
          step.quiz_submissions = [];
        }

        step.quiz_submissions.push(data);

        const now = Date.now();
        const hasPendingTasks = this.hasPendingTasks(stepPosition);
        if (!hasPendingTasks && !step.completed_at) {
          step.completed_at = now;
          step.is_completed = true;
        } else {
          console.log("hasPendingTasks", hasPendingTasks);
          console.log("step.testeable_elements", step.testeable_elements);
        }

        this.current.steps[stepPosition] = step;
        this.submit();

        break;
      }
      case "open_step": {
        const now = Date.now();

        if (
          typeof this.prevStep === "number" &&
          typeof this.prevStepStartedAt === "number"
        ) {
          const prevStep = this.current.steps[this.prevStep];
          const delta = now - this.prevStepStartedAt;

          if (!prevStep.sessions) prevStep.sessions = [];
          prevStep.sessions.push(delta);
          this.current.steps[this.prevStep] = prevStep;
        }

        if (typeof this.prevStep === "number") {
          const prevStep = this.current.steps[this.prevStep];

          const hasPendingTasks = this.hasPendingTasks(this.prevStep);
          if (!hasPendingTasks && !prevStep.completed_at) {
            prevStep.completed_at = now;
            prevStep.is_completed = true;
            this.current.steps[this.prevStep] = prevStep;
          }
        }

        if (!step.opened_at) {
          step.opened_at = now;
          this.current.steps[stepPosition] = step;
        }

        this.prevStep = stepPosition;
        this.prevStepStartedAt = now;
        if (stepPosition === this.current.steps.length - 1 && !this.hasPendingTasks(stepPosition)) {
          step.is_completed = true;
          step.completed_at = now;
          this.current.steps[stepPosition] = step;
        }

        this.submit();
        break;
      }

      default:
        throw new Error(`Event type ${event} is not supported`);
    }

    this.current.last_interaction_at = Date.now();
    this.streamEvent(stepPosition, event, data);
    this.save();

    if (
      event === "test" &&
      typeof this.listeners["test_struggles"] === "function"
    ) {
      const indicators = calculateIndicators(this.current);
      const stepIndicators = indicators.steps[stepPosition];
      if (stepIndicators.metrics.streak_test_struggle >= 3) {
        this.listeners["test_struggles"](stepIndicators);
      }
    }
  },
  retrieve: async function () {
    // First try local/CLI storage
    if (this.agent === "os" || this.agent === "vscode") {
      const cliData = await retrieveFromCLI();
      return { telemetry: cliData, fromServer: false };
    }

    const saved = LocalStorage.get(this.telemetryKey);
    if (saved && saved.slug === this.tutorialSlug) {
      return { telemetry: saved, fromServer: false };
    }

    // No local data found, try server fallback
    if (this.user.rigo_token && this.user.id && this.tutorialSlug) {
      try {
        // Get package_id from slug
        const packageInfo = await getPackageInfo(this.user.rigo_token, this.tutorialSlug);
        
        if (packageInfo && packageInfo.id) {
          const serverTelemetry = await retrieveFromRigobot(
            this.user.id,
            packageInfo.id,
            this.user.rigo_token,
            this.tutorialSlug
          );

          if (serverTelemetry) {
            return { telemetry: serverTelemetry, fromServer: true };
          }
        }
      } catch (error) {
        console.error("Error retrieving telemetry from server:", error);
        // Fall through to return null
      }
    }

    // No data found locally or on server
    return { telemetry: null, fromServer: false };
  },

  hasPendingTasks: function (stepPosition: number) {
    const step = this.current?.steps[stepPosition];

    if (!step) {
      return false;
    }
    return Boolean(step.testeable_elements?.some((e) => !e.is_completed));
  },

  hasPendingTasksInAnyLesson: function () {
    if (!this.current || !this.current.steps) {
      return false;
    }
    
    // Verify if any step has pending tasks
    return this.current.steps.some((_, index) => 
      this.hasPendingTasks(index)
    );
  },

  submit: async function () {
    if (!this.current || !this.user.token || !this.user.id) {
      console.warn(
        "Telemetry and user token are required to send telemetry, telemetry was not sent"
      );
      return Promise.resolve();
    }

    const url = this.urls.batch;
    if (!url) {
      console.error("Batch URL is required to send telemetry");
      return;
    }

    if (!this.current.telemetry_id) {
      this.current.telemetry_id = createUUID();
    }

    // Calculate metrics for all steps
    const indicators = calculateIndicators(this.current);
    const withMetricsSteps = this.current.steps.map((step, index) => {
      const telID = this.current?.telemetry_id || createUUID();

      return {
        ...step,
        telemetry_id: telID,
        metrics: indicators.steps[index].metrics,
        indicators: indicators.steps[index].indicators,
      };
    });

    const body = {
      ...this.current,
      steps: withMetricsSteps,
      global_metrics: indicators.global.metrics,
      global_indicators: indicators.global.indicators,
    };

    if (!body.user_id) {
      body.user_id = this.user.id;
    }

    try {
      await sendBatchTelemetryBreathecode(url, body, this.user.token);
      await sendBatchTelemetryRigobot(body, this.user.rigo_token);
    } catch (error) {
      console.error("Error submitting telemetry", error);
    }
  },
  save: function () {
    if (!this.current) {
      console.error("No current telemetry to save");
      return;
    }

    if (this.agent === "os" || this.agent === "vscode") {
      saveInCLI(this.current);
    } else {
      LocalStorage.set(this.telemetryKey, this.current);
    }
  },

  getStep: function (stepPosition: number) {
    return this.current?.steps[stepPosition] || null;
  },

  streamEvent: async function (stepPosition, event, data) {
    if (!this.current) return;

    const url = this.urls.streaming;
    if (!url) {
      return;
    }

    const stepSlug = this.current.steps[stepPosition].slug;

    const body = {
      slug: stepSlug,
      telemetry_id: this.current.telemetry_id,
      user_id: this.current.user_id,
      step_position: stepPosition,
      event,
      data,
    };

    sendStreamTelemetry(url, body, this.user.token);
  },
};

export default TelemetryManager;
