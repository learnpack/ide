import { TStep, TStepEvent } from "../managers/telemetry";
import { Tab } from "../types/editor";
import { Point } from "unist";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface IBuildProps {
  text: string;
  className: string;
}

export type TPossibleParams = {
  language?: string;
  token?: string;
  iframe?: string;
  currentExercise?: string;
  theme?: string;
  purpose?: string;
  autoclose?: string;
};

export type TParamsActions = {
  [key: string]: (param: string) => void;
};

interface ILanguageMap {
  [key: string]: string;
}

type TTitle = {
  [key: string]: string;
};

type TTelemetryUrls = {
  batch?: string;
  stream?: string;
};

interface IConfig {
  slug: string;
  title: TTitle;
  intro: any;
  editor: any;
  grading: string;
  warnings: TWarnings;
  telemetry?: TTelemetryUrls;
}

type TWarnings = {
  agent?: string | null;
  extension?: string | null;
};

interface IConfigObject {
  config: IConfig;
  exercises: TExercise[];
  currentExercise: string;
}

type IMessage = {
  extraClass?: string;
  type: string;
  text: string;
};

interface IExerciseMessages {
  [key: number]: IMessage[];
}

export type TExercise = {
  path: any;
  files: any;
  slug: string;
  translations: object;
  done: boolean;
  graded: boolean;
  position: number;
};

export type TNumberCache = {
  [key: number]: number;
};

type TCheckParamsOptions = {
  justReturn: boolean;
};

type TOpenedModals = {
  [key: string]: boolean;
};

type TCheckLoggedStatusOptions = {
  startConversation: boolean;
};

type TLoginInfo = {
  email: string;
  password: string;
  messages: {
    error: string;
    success: string;
  };
};
type TTestStatus = "successful" | "failed" | "";

type TTestResult = {
  status: TTestStatus;
  logs: string;
};
type TTranslations = {
  testButtonSuccess: string;
  testButtonFailed: string;
  testButtonRunning: string;
};

type TSessionActionsOpts = {
  action: "new" | "continue";
};

type TResetExerciseOpts = {
  exerciseSlug: string;
};

type TOpenLinkOptions = {
  redirect?: boolean;
};

type TRefreshData = {
  newToken: string;
  newTabHash: string;
  newBCToken: string;
};

type ToggleRigoOpts = {
  ensure: "open" | "close";
};

type TAssessmentConfig = {
  maxRetries: number;
};

export type TUser = {
  id: number;
  email: string;
  first_name: string;
  // last_name: string;
};

type TUserConsumables = {
  ai_compilation: number;
  ai_conversation_message: number;
  ai_generation: number;
};

type TRigoContext = {
  context: string;
  userMessage: string;
  performTests: boolean;
};

export type TAgent = "vscode" | "cloud" | "os";

type TContent = {
  body: string;
  bodyBegin: number;
};
export interface IStore {
  exercises: any[];
  chatInitialMessage: string;
  currentContent: TContent;
  currentExercisePosition: number | string;
  language: string;
  agent: TAgent;
  learnpackPurposeId: number | string;
  status: string;
  environment: "localhost" | "localStorage";
  dialogData: TDialog;
  lessonTitle: string;
  lastStartedAt: Date | null;
  showFeedback: boolean;
  buildbuttonText: IBuildProps;
  feedbackbuttonProps: IBuildProps;
  compilerSocket: any;
  user_id: number | null;
  user: TUser;
  token: string;
  bc_token: string;
  assessmentConfig: TAssessmentConfig;
  languageMap: ILanguageMap;
  configObject: IConfigObject;
  allowedActions: string[];
  videoTutorial: string;
  showVideoTutorial: boolean;
  exerciseMessages: IExerciseMessages;
  host: string;
  isTesteable: boolean;
  isBuildable: boolean;
  hasSolution: boolean;
  currentSolution: string;
  chatSocket: any;
  conversationIdsCache: TNumberCache;
  openedModals: TOpenedModals;
  lastTestResult: TTestResult;
  tabHash: string;
  sessionKey: string;
  translations: TTranslations;
  shouldBeTested: boolean;
  targetButtonForFeedback: "build" | "feedback";
  editorTabs: TEditorTab[];
  isIframe: boolean;
  isRigoOpened: boolean;
  theme: string;
  authentication: {
    mandatory: boolean;
  };
  lastState: "success" | "error" | string;
  terminalShouldShow: boolean;
  rigoContext: TRigoContext;
  showSidebar: boolean;
  userConsumables: TUserConsumables;
  maxQuizRetries: number;
  useConsumable: (
    consumableSlug: "ai-conversation-message" | "ai-compilation"
  ) => Promise<boolean>;
  setUser: (user: TUser) => void;
  getUserConsumables: () => Promise<any>;
  setShowSidebar: (show: boolean) => void;
  setRigoContext: (context: Partial<TRigoContext>) => void;
  toggleRigo: (opts?: ToggleRigoOpts) => void;
  setTerminalShouldShow: (shouldShow: boolean) => void;
  start: () => void;
  handleEnvironmentChange: (event: any) => void;
  setListeners: () => void;
  checkRigobotInvitation: (messages: {
    error: string;
  }) => Promise<boolean | string>;
  openLink: (url: string, opts?: TOpenLinkOptions) => void;
  setTestResult: (status: TTestStatus, logs: string) => void;
  checkParams: (opts: TCheckParamsOptions) => TPossibleParams;
  handlePositionChange: (desiredPosition: number) => void;
  setOpenedModals: (modals: Partial<TOpenedModals>) => void;
  startConversation: (exercisePosition: number) => void;
  getContextFilesContent: () => Promise<string>;
  loginToRigo: (loginInfo: TLoginInfo) => Promise<void | false>;
  getCurrentExercise: () => TExercise;
  refreshDataFromAnotherTab: (data: TRefreshData) => void;
  setExerciseMessages: (messages: IMessage[], position: number) => void;
  setShowVideoTutorial: (show: boolean) => void;
  setAllowedActions: (actions: string[]) => void;
  registerTelemetryEvent: (event: TStepEvent, data: object) => void;
  getTelemetryStep: (stepPosition: number) => Promise<TStep | null>;
  setLanguage: (language: string, fetchExercise?: boolean) => void;
  checkLoggedStatus: (opts?: TCheckLoggedStatusOptions) => void;
  setToken: (newToken: string) => void;
  setBuildButtonPrompt: (t: string, c: string) => void;
  setFeedbackButtonProps: (t: string, c: string) => void;
  fetchSingleExerciseInfo: (index: number) => Promise<TExercise>;
  toggleFeedback: () => void;
  fetchExercises: () => void;
  updateEditorTabs: () => void;
  startTelemetry: () => Promise<void>;
  build: (buildText: string, submittedInputs?: string[]) => void;
  setPosition: (position: number) => void;
  handleNext: () => void;
  fetchReadme: () => void;
  updateFileContent: (
    exerciseSlug: string,
    tab: Tab,
    updateTabs?: boolean
  ) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  toastFromStatus: (status: string) => void;
  setShouldBeTested: (value: boolean) => void;
  openTerminal: () => void;
  runExerciseTests: (
    opts?: Partial<TRunExerciseTestsOptions>,
    submittedInputs?: string[]
  ) => void;
  resetExercise: (opts: TResetExerciseOpts) => void;
  // registerAIInteraction: (setPosition: number, interaction: object) => void;
  sessionActions: (opts: TSessionActionsOpts) => void;
  displayTestButton: boolean;
  getOrCreateActiveSession: () => void;
  updateDBSession: () => void;
  test: () => void;
  figureEnvironment: () => Promise<object>;
  cleanTerminal: () => void;
  setEditorTabs: (tabs: TEditorTab[]) => void;
  reportEnrichDataLayer: (event: string, extraData: object) => void;
  replaceInReadme: (
    newText: string,
    startPosition: Point,
    endPosition: Point
  ) => Promise<void>;
}

export type TEditorTab = {
  from?: "build" | "test";
  id: number;
  name: string;
  content: string;
  isActive: boolean;
  isHTML?: boolean;
  isReact?: boolean;
  status?: "ready" | "error" | "loading";
};

export type TDialog = {
  message: string;
  format: "md" | "txt";
};

type TRunExerciseTestsOptions = {
  toast: boolean;
  setFeedbackButton: boolean;
  feedbackButtonText: string;
  targetButton: "build" | "feedback";
};
