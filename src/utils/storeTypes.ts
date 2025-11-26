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
  slug?: string;
  mode?: "teacher" | "student";
  cohort_id?: string;
  academy_id?: string;
};

export type TParamsActions = {
  [key: string]: (param: string) => void;
};

type TTitle = {
  [key: string]: string;
};

type TTelemetryUrls = {
  batch?: string;
  stream?: string;
};

interface IConfig {
  testingEnvironment: "auto" | "cloud" | "local";
  slug: string;
  title: TTitle;
  intro: any;
  editor: any;
  grading: string;
  warnings: TWarnings;
  telemetry?: TTelemetryUrls;
  repository?: string;
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

type TFile = {
  hidden: boolean;
  name: string;
  path: string;
};
export type TExercise = {
  path: any;
  files: TFile[];
  slug: string;
  title: string;
  translations: Record<string, string>;
  done: boolean;
  graded: boolean;
  position: number;
  language: string;
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
  last_name: string;
  profile?: {
    avatar_url: string;
  };
};

type TUserConsumables = {
  [key: string]: number;
};

type TRigoContext = {
  context: string;
  userMessage: string;
  aiMessage: string;
  performTests: boolean;
  allowedFunctions?: string[];
};

export type TAgent = "vscode" | "cloud" | "os";

type TContent = string;

export type TMode = "creator" | "student";

type TTitleTranslations = {
  [key: string]: string;
};

export interface Lesson {
  id: string;
  uid: string;
  title: string;
  type: "READ" | "CODE" | "QUIZ";
  description: string;
  duration?: number;
  generated?: boolean;
  status?: "PENDING" | "GENERATING" | "DONE" | "ERROR";
}

export interface ParsedLink {
  name: string;
  text: string;
}
export type FormState = {
  description: string;
  duration: number;
  hasContentIndex: boolean;
  contentIndex: string;
  language?: string;
  technologies?: string[];
  isCompleted: boolean;
  variables: string[];
  currentStep: string;
  title: string;
  purpose: string;
};

export type Syllabus = {
  lessons?: Lesson[];
  // courseInfo: FormState;
  // sources: ParsedLink[]
};

export type TSidebar = {
  [key: string]: TTitleTranslations;
};

export type TConsumableSlug =
  | "ai-conversation-message"
  | "ai-compilation"
  | "ai-generation";

export type TSyncNotificationStatus = "pending" | "processing" | "completed" | "error";

export type TSyncNotification = {
  id: string;
  lessonSlug: string;
  lessonTitle: string;
  sourceLanguage: string;
  targetLanguages: string[];    // Calculated dynamically
  createdAt: number;
  updatedAt: number;
  status: TSyncNotificationStatus;
  syncProgress?: {
    totalLanguages: number;
    completedLanguages: number;
    currentLanguage?: string;
    failedLanguages?: Array<{
      code: string;
      error: string;
    }>;
  };
  error?: {
    message: string;
    code: string;
  };
};

export interface IStore {
  exercises: TExercise[];
  teacherOnboardingClosed: boolean;
  chatInitialMessage: string;
  currentContent: TContent;
  currentExercisePosition: number | string;
  language: string;
  agent: TAgent;
  learnpackPurposeId: number | string;
  status: string;
  environment: "localhost" | "localStorage" | "creatorWeb";
  testingEnvironment: "auto" | "cloud" | "local";
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
  configObject: IConfigObject;
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
  editingContent: string;
  authentication: {
    mandatory: boolean;
  };
  lastState: "success" | "error" | string;
  terminalShouldShow: boolean;
  rigoContext: TRigoContext;
  isCompiling: boolean;
  showSidebar: boolean;
  userConsumables: TUserConsumables;
  maxQuizRetries: number;
  mode: TMode;
  mustLoginMessageKey: string;
  isCreator: boolean;
  sidebar: TSidebar;
  syllabus: Syllabus;
  syncNotifications: TSyncNotification[];
  pendingTranslations: TLanguageTranslation[];
  getSidebar: () => Promise<TSidebar>;
  getSyllabus: () => Promise<void>;
  getSyncNotifications: () => Promise<void>;
  dismissSyncNotification: (notificationId: string, lessonSlug: string) => Promise<void>;
  acceptSyncNotification: (notification: TSyncNotification) => Promise<void>;
  setPendingTranslations: (translations: TLanguageTranslation[] | ((prev: TLanguageTranslation[]) => TLanguageTranslation[])) => void;
  updateTranslationStatus: (languageCode: string, status: TTranslationStatus, error?: string) => void;
  setMode: (mode: TMode) => void;
  addVideoTutorial: (videoTutorial: string) => Promise<void>;
  removeVideoTutorial: () => Promise<void>;
  useConsumable: (consumableSlug: TConsumableSlug) => Promise<boolean>;
  setUser: (user: TUser) => void;
  getUserConsumables: () => Promise<any>;
  setShowSidebar: (show: boolean) => void;
  setRigoContext: (context: Partial<TRigoContext>) => void;
  toggleRigo: (opts?: ToggleRigoOpts) => void;
  setEditingContent: (content: string) => void;
  setTerminalShouldShow: (shouldShow: boolean) => void;
  start: () => void;
  handleEnvironmentChange: (event: any) => void;
  setListeners: () => void;
  initCompilerSocket: ( testingEnvironment?: "auto" | "cloud" | "local" ) => Promise<void>;
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
  fetchReadme: () => void;
  renameFileInExercise: (
    exerciseSlug: string,
    oldFilename: string,
    newFilename: string
  ) => Promise<void>;
  updateFileContent: (
    exerciseSlug: string,
    tab: Tab,
    updateTabs?: boolean
  ) => void;
  createNewFile: (filename: string, content?: string) => Promise<void>;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  toastFromStatus: (status: string) => void;
  setShouldBeTested: (value: boolean) => void;
  // openTerminal: () => void;
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
  uploadFileToCourse: (file: File, destination: string) => Promise<string>;
  figureEnvironment: () => Promise<object>;
  cleanTerminal: () => void;
  setEditorTabs: (tabs: TEditorTab[]) => void;
  reportEnrichDataLayer: (event: string, extraData: object) => void;
  insertBeforeOrAfter: (
    newMarkdown: string,
    position: "before" | "after",
    cutPosition: number
  ) => Promise<void>;
  replaceInReadme: (
    newText: string,
    startPosition: Point,
    endPosition: Point
  ) => Promise<void>;
  getPortion: (startPoint: number, endPoint: number) => string;
  initRigoAI: () => void;
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

export type TTranslationStatus = "pending" | "translating" | "completed" | "error";

export type TLanguageTranslation = {
  code: string;
  status: TTranslationStatus;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  totalExercises?: number; // Total exercises being translated for this language
  completedExercises?: number; // Number of exercises completed for this language
};