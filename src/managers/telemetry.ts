import { calculateIndicators, TStepIndicators } from "../utils/metrics";
import packageInfo from "../../package.json";
import { LocalStorage } from "./localStorage";
import axios, { AxiosResponse } from "axios";
import { TAgent } from "../utils/storeTypes";
import { LEARNPACK_LOCAL_URL } from "../utils/creator";

export interface IFile {
  path: string;
  name: string;
  hidden: boolean;
}

const sendBatchTelemetry = async function (
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
  starting_at: number;
  ending_at: number;
};

export type TTestAttempt = {
  source_code: string;
  stdout: string;
  exit_code: number;
  starting_at: number;
  ended_at: number;
};

type TAIInteraction = {
  student_message: string;
  source_code: string;
  ai_response: string;
  starting_at: number;
  ending_at: number;
};

export type TQuizSelection = {
  question: string;
  answer: string;
  isCorrect: boolean;
};

export type TQuizSubmission = {
  status: "SUCCESS" | "ERROR";
  percentage: number;
  quiz_hash: string;
  selections: TQuizSelection[];
  submitted_at: number;
};

export type TStep = {
  slug: string;
  position: number;
  files: IFile[];
  is_testeable: boolean;
  opened_at?: number; // The time when the step was opened
  completed_at?: number; // If the step has tests, the time when all the tests passed, else, the time when the user opens the next step
  compilations: TCompilationAttempt[]; // Everytime the user tries to compile the code
  tests: TTestAttempt[]; // Everytime the user tries to run the tests
  ai_interactions: TAIInteraction[]; // Everytime the user interacts with the AI
  quiz_submissions: TQuizSubmission[];
  is_completed: boolean;
};

type TWorkoutSession = {
  started_at: number;
  ended_at?: number;
};

type TStudent = {
  token: string;
  user_id: string;
  email: string;
};

export interface ITelemetryJSONSchema {
  telemetry_id?: string;
  user_id?: number | string;
  slug: string;
  version: string;
  agent?: string;
  tutorial_started_at: number;
  last_interaction_at: number;
  steps: Array<TStep>; // The steps should be the same as the exercise
  workout_session: TWorkoutSession[]; // It start when the user starts Learnpack, if the last_interaction_at is available, it automatically fills with that
  // number and start another session
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
  id: string;
  email: string;
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
  listeners: Record<string, (data: any) => void>;
  registerListener: (event: TAlerts, callback: (data: any) => void) => void;
  registerStepEvent: (
    stepPosition: number,
    event: TStepEvent,
    data: any
  ) => void;
  getStepIndicators: (stepPosition: number) => TStepIndicators | null;
  streamEvent: (stepPosition: number, event: string, data: any) => void;
  submit: () => Promise<void>;
  finishWorkoutSession: () => void;
  // setStudent: (student: TStudent) => void;
  save: () => void;
  retrieve: () => Promise<ITelemetryJSONSchema | null>;
  getStep: (stepPosition: number) => TStep | null;
}

// function isMultipleOfThree(number: number): boolean {
//   if (number === 0) {
//     return false;
//   }
//   return number % 3 === 0;
// }

const TelemetryManager: ITelemetryManager = {
  current: null,
  urls: {},
  telemetryKey: "",
  listeners: {},
  agent: "cloud",
  // userToken: "",
  // userID: undefined,
  user: {
    token: "",
    id: "",
    email: "",
  },
  tutorialSlug: "",
  started: false,
  version: `CLOUD:${packageInfo.version}` || "CLOUD:0.0.0",
  salute: (message) => {
    console.log(message);
  },

  start: function (agent, steps, tutorialSlug, storageKey, student) {
    this.telemetryKey = storageKey;
    this.tutorialSlug = tutorialSlug;
    this.agent = agent;
    this.user.id = student.user_id;
    this.user.token = student.token;

    if (!this.current) {
      this.retrieve()
        .then((prevTelemetry) => {
          if (prevTelemetry) {
            this.current = prevTelemetry;
            this.finishWorkoutSession();
          } else {
            console.debug(
              "No previous telemetry found, creating new one. Agent: ",
              agent
            );

            this.current = {
              telemetry_id: createUUID(),
              slug: tutorialSlug,
              version: `CLOUD:${this.version}`,
              agent,
              tutorial_started_at: Date.now(),
              last_interaction_at: Date.now(),
              steps,
              workout_session: [
                {
                  started_at: Date.now(),
                },
              ],
            };
          }

          this.current.user_id = this.user.id;

          if (!this.current.version) {
            this.current.version = `CLOUD:${this.version}`;
          }

          this.save();

          this.started = true;

          if (!this.user.id) {
            console.warn(
              "No user ID found, impossible to submit telemetry at start"
            );
            return;
          }

          this.submit();
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

    console.log("Finishing workout session", this.current);

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

  registerStepEvent: function (stepPosition, event, data) {
    console.debug(
      `Registering Telemetry Event ${event} for user ${this.user.id}`
    );

    if (!this.current) {
      //   toast.error(`Telemetry has not been started, ${event} NOT REGISTERED`);
      console.error(`Telemetry has not been started, ${event} NOT REGISTERED`);
      return;
    }

    const step = this.current.steps[stepPosition];
    if (!step) {
      //   toast.error(`No step ${stepPosition} found ${event} NOT REGISTERED`);
      console.error(`No step ${stepPosition} found ${event} NOT REGISTERED`);
      return;
    }

    if (data.source_code) {
      data.source_code = stringToBase64(data.source_code);
    }

    if (data.stdout) {
      data.stdout = stringToBase64(data.stdout);
    }

    if (data.stderr) {
      data.stderr = stringToBase64(data.stderr);
    }

    if (Object.prototype.hasOwnProperty.call(data, "exitCode")) {
      data.exit_code = data.exitCode;
      data.exitCode = undefined;
    }

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
        if (data.exit_code === 0) {
          step.completed_at = Date.now();
        }

        this.current.steps[stepPosition] = step;
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
        break;
      }
      case "open_step": {
        const now = Date.now();

        if (!step.opened_at) {
          step.opened_at = now;
          this.current.steps[stepPosition] = step;
        }

        if (this.prevStep || this.prevStep === 0) {
          const prevStep = this.current.steps[this.prevStep];
          if (!prevStep.is_testeable && !prevStep.completed_at) {
            prevStep.completed_at = now;
            this.current.steps[this.prevStep] = prevStep;
          }
        }

        this.prevStep = stepPosition;

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
  retrieve: function () {
    if (this.agent === "os" || this.agent === "vscode") {
      return retrieveFromCLI();
    }

    const saved = LocalStorage.get(this.telemetryKey);
    if (saved && saved.slug === this.tutorialSlug) {
      return Promise.resolve(saved);
    } else {
      return Promise.resolve(null);
    }
  },

  submit: async function () {
    if (!this.current || !this.user.token || !this.user.id) {
      console.warn(
        "Telemetry and user token are required to send telemetry, telemetry was not sent"
      );
      console.warn({
        current: Boolean(this.current),
        id: Boolean(this.user.id),
        token: Boolean(this.user.token),
      });
      return Promise.resolve();
    }

    const url = this.urls.batch;
    if (!url) {
      console.error("Batch URL is required to send telemetry");
      return;
    }

    const body = this.current;

    if (!body.user_id) {
      body.user_id = this.user.id;
    }

    try {
      await sendBatchTelemetry(url, body, this.user.token);
      console.debug("Telemetry submitted successfully for user", this.user.id);
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
