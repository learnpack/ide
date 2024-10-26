import { Tab } from "../types/editor";

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

interface IConfig {
  slug: string;
  title: TTitle;
  intro: any;
  editor: any;
  grading: string;
  warnings: TWarnings;
}

type TWarnings = {
  agent?: string | null;
  extension?: string | null;
};

interface IConfigObject {
  config: IConfig;
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

export interface IStore {
  exercises: any[];
  chatInitialMessage: string;
  currentContent: string;
  currentExercisePosition: number | string;
  language: string;
  learnpackPurposeId: number | string;
  status: string;
  environment: "localhost" | "localStorage";
  dialogData: TDialog;
  lessonTitle: string;

  showFeedback: boolean;
  buildbuttonText: IBuildProps;
  feedbackbuttonProps: IBuildProps;
  compilerSocket: any;
  user_id: number | null;
  token: string;
  bc_token: string;
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
  theme: string;
  lastState: "success" | "error" | "";
  terminalShouldShow: boolean;
  setTerminalShouldShow: (shouldShow: boolean) => void;
  start: () => void;
  handleEnvironmentChange: (event: any) => void;
  setListeners: () => void;
  checkRigobotInvitation: () => void;
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

  setLanguage: (language: string, fetchExercise?: boolean) => void;
  checkLoggedStatus: (opts?: TCheckLoggedStatusOptions) => void;
  setToken: (newToken: string) => void;
  setBuildButtonPrompt: (t: string, c: string) => void;
  setFeedbackButtonProps: (t: string, c: string) => void;
  fetchSingleExerciseInfo: (index: number) => Promise<TExercise>;
  toggleFeedback: () => void;
  fetchExercises: () => void;
  getLessonTitle: () => void;
  updateEditorTabs: () => void;
  build: (buildText: string) => void;
  setPosition: (position: number) => void;
  handleNext: () => void;
  fetchReadme: () => void;
  updateFileContent: (exerciseSlug: string, tab: Tab, updateTabs?: boolean) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  toastFromStatus: (status: string) => void;
  setShouldBeTested: (value: boolean) => void;
  openTerminal: () => void;
  runExerciseTests: (opts?: TRunExerciseTestsOptions) => void;
  resetExercise: (opts: TResetExerciseOpts) => void;
  registerAIInteraction: (setPosition: number, interaction: object) => void;
  sessionActions: (opts: TSessionActionsOpts) => void;
  displayTestButton: boolean;
  getOrCreateActiveSession: () => void;
  updateDBSession: () => void;
  test: () => void;
  figureEnvironment: () => Promise<object>;
  cleanTerminal: () => void;
  setEditorTabs: (tabs: TEditorTab[]) => void;
}

type TEditorTab = {
  id: number;
  name: string;
  content: string;
  isActive: boolean;
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
