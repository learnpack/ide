import toast from "react-hot-toast";
import { LocalStorage } from "./localStorage";
import axios, { AxiosResponse } from "axios";

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

type TTestAttempt = {
  source_code: string;
  stdout: string;
  exit_code: number;
  starting_at: number;
  ending_at: number;
};

type TAIInteraction = {
  student_message: string;
  source_code: string;
  ai_response: string;
  starting_at: number;
  ending_at: number;
};

type TQuizSelection = {
  question: string;
  answer: string;
  isCorrect: boolean;
};

type TQuizSubmission = {
  // TODO: Build from the concatenated question labels
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
  user_id?: number | string | null;
  slug: string;
  agent?: string;
  tutorial_started_at?: number;
  last_interaction_at?: number;
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

interface ITelemetryManager {
  current: ITelemetryJSONSchema | null;
  //   configPath: string | null;
  started: boolean;
  userToken: string;
  userID: number | null;
  telemetryKey: string;
  urls: TTelemetryUrls;
  salute: (message: string) => void;
  start: (
    agent: string,
    steps: TStep[],
    tutorialSlug: string,
    storageKey: string
  ) => void;
  tutorialSlug: string;
  prevStep?: number;
  registerStepEvent: (
    stepPosition: number,
    event: TStepEvent,
    data: any
  ) => void;
  streamEvent: (stepPosition: number, event: string, data: any) => void;
  submit: () => Promise<void>;
  finishWorkoutSession: () => void;
  setStudent: (student: TStudent) => void;
  save: () => void;
  retrieve: () => Promise<ITelemetryJSONSchema | null>;
}

const TelemetryManager: ITelemetryManager = {
  current: null,
  urls: {},
  telemetryKey: "",
  userToken: "",
  userID: null,
  tutorialSlug: "",
  started: false,
  salute: (message) => {
    console.log(message);
  },

  start: function (agent, steps, tutorialSlug, storageKey) {
    this.telemetryKey = storageKey;
    this.tutorialSlug = tutorialSlug;
    if (!this.current) {
      this.retrieve()
        .then((prevTelemetry) => {
          if (prevTelemetry) {
            this.current = prevTelemetry;
            this.finishWorkoutSession();
          } else {
            this.current = {
              telemetry_id: createUUID(),
              slug: tutorialSlug,
              agent,
              tutorial_started_at: Date.now(),
              steps,
              workout_session: [
                {
                  started_at: Date.now(),
                },
              ],
            };
          }

          this.current.user_id = this.userID;
          this.save();

          this.submit();
          this.started = true;
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

  setStudent: function (student) {
    if (!this.current) {
      return;
    }

    this.current.user_id = student.user_id;
    this.save();
    this.submit();
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

  registerStepEvent: function (stepPosition, event, data) {
    // toast.success(`Registering Event ${event}`);
    console.log(`Registering Event ${event}`);

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

        // data.stdout =
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
        // NOTE: data is not used here
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
      // case "quiz_submission": {
      //   const now = Date.now();

      //   if (!step.completed_at) {
      //     step.completed_at = now;
      //     this.current.steps[stepPosition] = step;
      //   }
      // this.submit();
      // }

      default:
        throw new Error(`Event type ${event} is not supported`);
    }

    this.current.last_interaction_at = Date.now();
    this.streamEvent(stepPosition, event, data);
    this.save();
  },
  retrieve: function () {
    const saved = LocalStorage.get(this.telemetryKey);
    if (saved && saved.slug === this.tutorialSlug) {
      return Promise.resolve(saved);
    } else {
      return Promise.resolve(null);
    }
  },

  submit: async function () {
    if (!this.current || !this.userToken) {
      toast.error("Telemetry and user token are required to send telemetry");
      return Promise.resolve();
    }

    const url = this.urls.batch;
    if (!url) {
      //   toast.error("URL is required to send telemetry");
      return;
    }

    const body = this.current;

    if (!body.user_id && !this.userID) {
      console.error("No user ID found, impossible to submit telemetry");
      return;
    }

    try {
      await sendBatchTelemetry(url, body, this.userToken);
      console.log("Telemetry submitted successfully");
    } catch (error) {
      console.error("Error submitting telemetry", error);
    }
  },
  save: function () {
    LocalStorage.set(this.telemetryKey, this.current);
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

    sendStreamTelemetry(url, body, this.userToken);
  },
};

export default TelemetryManager;
