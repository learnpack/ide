/* eslint-disable @typescript-eslint/no-explicit-any */

import io from "socket.io-client";
import TagManager from "react-gtm-module";
import { create } from "zustand";
import {
  changeSidebarVisibility,
  startChat,
  disconnected,
  getHost,
  getParamsObject,
  replaceSlot,
  debounce,
  removeSpecialCharacters,
  ENVIRONMENT,
  getEnvironment,
  setWindowHash,
} from "./lib";
import { IStore, TParamsActions, TPossibleParams } from "./storeTypes";
import toast from "react-hot-toast";
import { getStatus } from "../managers/socket";
import { DEV_MODE, RIGOBOT_HOST } from "./lib";
import { EventProxy } from "../managers/EventProxy";
import { FetchManager } from "../managers/fetchManager";
import { createSession, getSession, updateSession } from "./apiCalls";
import TelemetryManager from "../managers/telemetry";

type TFile = {
  name: string;
  hidden: boolean;
};

class MissingRigobotAccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingRigobotAccountError";
  }
}

const HOST = getHost();

const FASTAPI_HOST = "https://ai.4geeks.com";
// const FASTAPI_HOST = "http://localhost:8000";
const chatSocket = io(`${FASTAPI_HOST}`);

chatSocket.on("connect", () => {
  console.log("connected to chat socket at ", FASTAPI_HOST);
});
chatSocket.on("disconnect", () => {
  console.log("disconnected from chat socket at ", FASTAPI_HOST);
});

const defaultParams = getParamsObject() as TPossibleParams;

FetchManager.init(ENVIRONMENT, HOST);

const useStore = create<IStore>((set, get) => ({
  language: defaultParams.language || "us",
  languageMap: {
    us: "en",
    es: "sp",
  },
  learnpackPurposeId: defaultParams.purpose || 26,
  exercises: [],
  currentContent: "",
  targetButtonForFeedback: "feedback" as "feedback",
  dialogData: {
    message: "",
    format: "md" as "md",
  },
  chatSocket: chatSocket,
  currentExercisePosition: defaultParams.currentExercise || 0,
  chatInitialMessage:
    "Hello! I'm **Rigobot**, your friendly **AI Mentor**! \n\n I can help you if you feel stuck, ask me anything about this exercise!",
  conversationIdsCache: {},
  lessonTitle: "",
  rigoContext: "",
  user_id: null,
  hasSolution: false,
  shouldBeTested: false,
  status: "",
  showFeedback: false,
  token: "",
  bc_token: "",
  buildbuttonText: {
    text: "Run",
    className: "",
  },
  theme: "light",
  isIframe: false,
  tabHash: "",
  sessionKey: "",
  lastState: "",
  isRigoOpened: false,
  editorTabs: [],
  feedbackbuttonProps: {
    text: "execute-my-code",
    className: "",
  },
  configObject: {
    config: {
      intro: "",
      grading: "",
      slug: "",
      editor: {
        agent: "",
      },
      title: {},
      warnings: {},
    },
    exercises: [],
  },
  terminalShouldShow: false,
  videoTutorial: "",
  allowedActions: [],
  compilerSocket: EventProxy.getEmitter(ENVIRONMENT),
  showVideoTutorial: false,
  exerciseMessages: {},
  host: HOST,
  openedModals: {
    chat: true,
    login: false,
    video: false,
    reset: false,
    session: false,
  },
  activeTab: 0,
  lastTestResult: {
    // @ts-ignore
    status: "",
    logs: "",
  },
  // @ts-ignore
  environment: "localhost",

  // setters
  start: () => {
    const {
      fetchExercises,
      fetchReadme,
      checkParams,
      checkLoggedStatus,
      setListeners,
      figureEnvironment,
      // startTelemetry,
    } = get();
    figureEnvironment().then(() =>
      fetchExercises()
        // @ts-ignore
        .then(() => {
          return checkParams({ justReturn: false });
        })
        .then((params: TPossibleParams) => {
          if (!params.currentExercise) {
            fetchReadme();
          }
        })
        .then(() => {
          checkLoggedStatus({ startConversation: true });
        })
        .then(() => {
          setListeners();
        })
    );
  },
  setListeners: () => {
    const {
      compilerSocket,
      setTestResult,
      toastFromStatus,
      setFeedbackButtonProps,
      setOpenedModals,
      // lastStartedAt,
      setBuildButtonPrompt,
      registerTelemetryEvent,
    } = get();

    const debounceTestingSuccess = debounce((data: any) => {
      console.log(data, "DATA IN DEBOUCE TEST SUCCESFF");
      // Get the timestamp in milliseconds
      // @ts-ignore

      const stdout = removeSpecialCharacters(data.logs[0]);

      registerTelemetryEvent("test", data);
      setTestResult("successful", stdout);
      set({ lastState: "success", terminalShouldShow: true });
      toastFromStatus("testing-success");

      if (get().targetButtonForFeedback === "feedback") {
        setFeedbackButtonProps("Succeded", "bg-success text-white");
      } else {
        setBuildButtonPrompt("Succeded", "bg-success text-white");
      }
    }, 100);

    const debounceError = debounce((data: any) => {
      const stdout = removeSpecialCharacters(data.logs[0]);
      setTestResult("failed", stdout);
      set({ lastState: "error", terminalShouldShow: true });
      toastFromStatus("testing-error");

      registerTelemetryEvent("test", data);
      if (get().targetButtonForFeedback === "feedback") {
        setFeedbackButtonProps("Try again", "bg-fail text-white");
      } else {
        setBuildButtonPrompt("Try again", "bg-fail text-white");
      }
    }, 100);

    let compilerErrorHandler = debounce((data: any) => {
      data;

      set({ lastState: "error", terminalShouldShow: true });
      if (data.recommendations) {
        toast.error(data.recommendations);
      }
      setBuildButtonPrompt("Try again", "bg-fail");
      const [icon, message] = getStatus("compiler-error");
      toast.error(message, { icon: icon });
      registerTelemetryEvent("compile", data);
    }, 100);

    let compilerSuccessHandler = debounce((data: any) => {
      data;
      set({ lastState: "success", terminalShouldShow: true });
      const [icon, message] = getStatus("compiler-success");
      toast.success(message, { icon: icon });
      setBuildButtonPrompt("Run", "bg-success");
      registerTelemetryEvent("compile", data);
    }, 100);

    compilerSocket.onStatus("testing-success", debounceTestingSuccess);
    compilerSocket.onStatus("testing-error", debounceError);
    compilerSocket.onStatus("compiler-error", compilerErrorHandler);
    compilerSocket.onStatus("compiler-success", compilerSuccessHandler);

    compilerSocket.onStatus("open_window", () => {
      toastFromStatus("open_window");
    });
    compilerSocket.on("dialog", (data: any) => {
      set({ dialogData: data.data });
      setOpenedModals({ dialog: true });
    });
  },

  figureEnvironment: async () => {
    const env = await getEnvironment();

    set({ compilerSocket: EventProxy.getEmitter(env) });
    FetchManager.init(env, HOST);

    return { message: "Environment figured out!" };
  },
  handleEnvironmentChange: (event: any) => {
    set({ environment: event.detail.environment });
  },

  getCurrentExercise: () => {
    const { exercises, currentExercisePosition } = get();
    if (!exercises || exercises.length === 0) {
      return {};
    }
    // @ts-ignore
    return exercises[currentExercisePosition];
  },

  setExerciseMessages: (messages, position) => {
    set({
      exerciseMessages: { ...get().exerciseMessages, [position]: messages },
    });
  },

  setShowVideoTutorial: (show: boolean) => {
    set({ showVideoTutorial: show });
  },
  // TODO: This is not being used implement or delete
  setAllowedActions: (actions) => {
    set({ allowedActions: actions });
  },

  // functions
  setBuildButtonPrompt: (t, c = "") => {
    set({ buildbuttonText: { text: t, className: c } });
  },

  setFeedbackButtonProps: (t, c = "") => {
    set({ feedbackbuttonProps: { text: t, className: c } });
  },

  setOpenedModals: (modals) => {
    const { openedModals } = get();
    // @ts-ignore
    set({ openedModals: { ...openedModals, ...modals } });
  },

  setToken: (newToken) => {
    set({ token: newToken });
  },
  setTerminalShouldShow: (shouldShow) => {
    set({ terminalShouldShow: shouldShow });
  },
  checkLoggedStatus: async (opts) => {
    const {
      startConversation,
      currentExercisePosition,
      setOpenedModals,
      checkParams,
      getOrCreateActiveSession,
      startTelemetry,
    } = get();

    const params = checkParams({ justReturn: true });

    try {
      if (params.token) {
        const json = await FetchManager.loginWithToken(params.token);
        set({ token: json.rigoToken });
        set({ bc_token: params.token });
      } else {
        const json = await FetchManager.checkLoggedStatus();
        set({ token: json.rigoToken });
        set({ bc_token: json.payload.token });
      }

      if (opts && opts.startConversation) {
        startConversation(Number(currentExercisePosition));
      }
      getOrCreateActiveSession();
      await startTelemetry();
    } catch (err) {
      console.log("ERROR WHILE TRYING TO CHECK LOGGED STATUS", err);

      set({ token: "" });
      setOpenedModals({ login: true });
    }
  },
  getContextFilesContent: async () => {
    const { getCurrentExercise, currentContent, configObject, language } =
      get();
    let context = "";

    const getExtractor = (mode = "isolated") => {
      // Must return a boolean
      const modeToExtractor = {
        isolated: (file: TFile) => {
          return (
            !file.hidden &&
            !file.name.toLowerCase().includes("readme") &&
            !file.name.toLowerCase().includes("pycache")
          );
        },
        incremental: (file: TFile) => {
          return (
            (file && !file.name.toLowerCase().includes("readme")) ||
            !file.name.toLowerCase().includes("pycache")
          );
        },
      };
      // @ts-ignore
      return modeToExtractor[mode];
    };

    const currentExercise = getCurrentExercise();
    const slug = currentExercise.slug;
    let mode = configObject.config.grading;

    if (!["incremental", "isolated"].includes(mode)) mode = "incremental";

    const extractor = getExtractor(mode);

    const contextFiles = currentExercise.files.filter(extractor);
    // @ts-ignore
    const filePromises = contextFiles.map(async (file) => {
      const { fileContent } = await FetchManager.getFileContent(
        slug,
        file.name,
        {
          cached: true,
        }
      );

      return `
< File name: ${file.name} \n
  Content: 
\`${fileContent}\`
>
      `;
    });

    return Promise.all(filePromises).then((filesContext) => {
      context += filesContext.join("\n");
      context += `
<
This is the current exercise instructions:
${currentContent}
>

<MANDATORY FOR AI: The user's set up the application in "${language}" language, give your feedback in "${language}" language, please.>

      `;

      return context;
    });
  },

  fetchExercises: async () => {
    const { user_id, setOpenedModals } = get();

    try {
      const config = await FetchManager.getExercises();

      if (!config) return;

      if (config.config.warnings.agent) {
        set({
          dialogData: { message: config.config.warnings.agent, format: "md" },
        });
        setOpenedModals({ dialog: true });
      }

      if (config.config.warnings.extension) {
        set({
          dialogData: {
            message: config.config.warnings.extension,
            format: "md",
          },
        });
        setOpenedModals({ dialog: true });
      }

      const slug = config.config.slug;
      TagManager.dataLayer({
        dataLayer: {
          event: "start_exercise",
          slug: slug,
          user_id: user_id,
        },
      });
      set({ exercises: config.exercises });

      set({ lessonTitle: config.config.title.us });
      set({ configObject: config });
    } catch (err) {
      disconnected();
    }
  },
  checkParams: ({ justReturn }) => {
    const { setLanguage, setPosition, language } = get();

    let paramsObject = getParamsObject();

    if (justReturn) {
      return paramsObject;
    }

    const paramsActions: TParamsActions = {
      language: (value: string) => {
        // console.log("Language found in params");
        if (!(language === value)) {
          setLanguage(value, false);
        }
      },
      currentExercise: (value: string) => {
        setPosition(Number(value));
      },
      iframe: (value: string) => {
        if (value.toLowerCase() === "true") {
          set({ isIframe: true });
        }
        if (value.toLowerCase() === "false") {
          set({ isIframe: false });
        }
      },
      theme: (value: string) => {
        if (["light", "dark"].includes(value.toLowerCase().trim())) {
          set({ theme: value });
        }
      },
    };

    const entries = Object.entries(paramsObject);
    for (let [key, value] of entries) {
      if (key in paramsActions) {
        paramsActions[key](value);
      }
    }

    return paramsObject;
  },

  fetchSingleExerciseInfo: async (index) => {
    const { exercises } = get();

    if (exercises.length <= 0) {
      return;
    }

    const slug = exercises[index]?.slug;

    if (!slug) {
      return;
    }

    const exercise = await FetchManager.getExerciseInfo(slug);

    let isTesteable = exercise.graded;
    let isBuildable;
    let hasSolution = false;

    if (exercise.entry) isBuildable = true;
    if (!exercise.language) isBuildable = false;
    // @ts-ignore
    const solutionFiles = exercise.files.filter((file) =>
      file.name.includes("solution.hide")
    );

    if (solutionFiles.length > 0) {
      hasSolution = true;
      let solution = await FetchManager.getFileContent(
        slug,
        solutionFiles[0].name
      );
      set({ currentSolution: solution.fileContent });
    }
    set({
      isTesteable: isTesteable,
      isBuildable: isBuildable,
      hasSolution: hasSolution,
    });
    return exercise;
  },

  setPosition: (newPosition) => {
    const {
      startConversation,
      fetchReadme,
      token,
      setBuildButtonPrompt,
      setFeedbackButtonProps,
      checkParams,
      registerTelemetryEvent,
    } = get();

    let params = checkParams({ justReturn: true });
    setWindowHash({ ...params, currentExercise: String(newPosition) });

    set({ currentExercisePosition: newPosition });

    if (token) {
      startConversation(newPosition);
    }
    setBuildButtonPrompt("execute-my-code", "");
    setFeedbackButtonProps("test-my-code", "");
    // registerTelemetryEvent("open_step", )
    set({ lastState: "" });
    registerTelemetryEvent("open_step", {});
    fetchReadme();
  },
  startConversation: async (exercisePosition) => {
    const { token, learnpackPurposeId, conversationIdsCache } = get();

    let conversationId = null;
    let initialData = null;

    if (!token) {
      return;
    }

    try {
      conversationId = conversationIdsCache[exercisePosition];
      if (!conversationId) {
        throw new Error("ConversationID not found in cache");
      }
    } catch (err) {
      initialData = await startChat(learnpackPurposeId, token);
      conversationId = initialData.conversation_id;
    }

    if (initialData && initialData.salute) {
      set({ chatInitialMessage: initialData.salute });
    }

    set({
      conversationIdsCache: {
        ...conversationIdsCache,
        [exercisePosition]: conversationId,
      },
    });

    chatSocket.emit("start", {
      token: token,
      purpose: learnpackPurposeId,
      conversationId: conversationId,
    });
  },
  // @ts-ignore
  loginToRigo: async (loginInfo) => {
    const {
      setToken,
      startConversation,
      currentExercisePosition,
      setOpenedModals,
      getOrCreateActiveSession,
    } = get();

    try {
      const json = await FetchManager.login(loginInfo);

      set({ bc_token: json.token, user_id: json.user_id });

      if (json.rigobot == null) {
        throw new MissingRigobotAccountError(
          "No rigobot user found, did you already accept Rigobot's invitation?"
        );
      }
      setToken(json.rigobot.key);

      toast.success("Successfully logged in");
    } catch (error) {
      if (error instanceof MissingRigobotAccountError) {
        setOpenedModals({ login: false, rigobotInvite: true });
        return false;
      } else {
        const errorMessage = `It appears that something was wrong with your 4Geeks credentials, please try again`;
        toast.error(errorMessage);
        return false;
      }
    }
    // @ts-ignore
    startConversation(currentExercisePosition);
    setOpenedModals({ login: false });
    getOrCreateActiveSession();
    return true;
  },

  checkRigobotInvitation: async () => {
    const { bc_token, setToken, openLink } = get();
    const rigoAcceptedUrl = `${RIGOBOT_HOST}/v1/auth/me/token?breathecode_token=${bc_token}`;
    const res = await fetch(rigoAcceptedUrl);
    if (res.status != 200) {
      toast.error("You have not accepted Rigobot's invitation yet!");
      openLink(
        "https://rigobot.herokuapp.com/invite?referer=4geeks&token=" + bc_token,
        { redirect: false }
      );
      return;
    }
    const data = await res.json();
    setToken(data.key);

    const payload = { token: data.key };

    const config = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };
    await fetch(`${HOST}/set-rigobot-token`, config);
    // setOpenedModals({ chat: true });
  },

  openLink: (url, opts = { redirect: false }) => {
    const { compilerSocket, getCurrentExercise } = get();
    const options = { ...opts };
    const data = {
      url,
      exerciseSlug: getCurrentExercise().slug,
      options,
    };
    compilerSocket.openWindow(data);
  },
  updateEditorTabs: (newTab = null) => {
    const { getCurrentExercise, editorTabs } = get();

    const exercise = getCurrentExercise();
    // @ts-ignore
    const notHidden = exercise.files.filter((f) => !f.hidden);
    let editorTabsCopy = [...editorTabs];

    if (newTab) {
      // @ts-ignore
      const tabExists = editorTabsCopy.some((tab) => tab.name === newTab.name);

      if (tabExists) {
        const tabIndex = editorTabsCopy.findIndex(
          // @ts-ignore
          (t) => t.name === newTab.name
        );
        editorTabsCopy[tabIndex] = {
          // @ts-ignore
          ...newTab,
          // @ts-ignore
          isActive: newTab.name === "terminal" ? false : true,
        };
      } else {
        // @ts-ignore
        if (newTab.name === "terminal") {
          editorTabsCopy.push({
            // @ts-ignore
            ...newTab,
            isActive: false,
          });
        } else {
          editorTabsCopy = editorTabsCopy.map((tab) => ({
            ...tab,
            isActive: false,
          }));

          editorTabsCopy.push({
            // @ts-ignore
            ...newTab,
            isActive: true,
          });
        }
      }
    }

    const updateTabs = async () => {
      for (const [index, element] of notHidden.entries()) {
        let content = "";

        const { fileContent, edited } = await FetchManager.getFileContent(
          exercise.slug,
          element.name,
          { cached: true }
        );
        content = fileContent;

        if ("content" in element && element.content !== content) {
          await FetchManager.saveFileContent(
            exercise.slug,
            element.name,
            content
          );
        }

        const tabExists = editorTabsCopy.some(
          (tab) => tab.name === element.name
        );

        const tab = {
          id: index,
          content: content,
          name: element.name,
          isActive: index === 0 && !newTab,
          modified: edited,
        };

        if (!tabExists) {
          editorTabsCopy = [...editorTabsCopy, tab];
        } else {
          const tabIndex = editorTabsCopy.findIndex(
            (t) => t.name === element.name
          );
          editorTabsCopy[tabIndex] = tab;
        }
      }
      const someActive = editorTabsCopy.some((tab) => tab.isActive);
      if (!someActive && editorTabsCopy.length > 0) {
        editorTabsCopy[0].isActive = true;
      }
      set({ editorTabs: [...editorTabsCopy] });
    };
    updateTabs();
  },

  cleanTerminal: () => {
    const { editorTabs } = get();
    const newTabs = editorTabs.filter((t) => t.name !== "terminal");
    set({ editorTabs: [...newTabs] });
  },

  fetchReadme: async () => {
    const {
      language,
      exercises,
      currentExercisePosition,
      fetchSingleExerciseInfo,
      configObject,
      updateEditorTabs,
    } = get();
    // @ts-ignore
    const slug = exercises[currentExercisePosition]?.slug;
    if (!slug) {
      return;
    }

    const exercise = await FetchManager.getReadme(slug, language);

    if (!exercise) return;

    if (exercise.attributes.tutorial) {
      set({ videoTutorial: exercise.attributes.tutorial });
    } else if (exercise.attributes.intro) {
      // openLink(exercise.attributes.intro);
      set({
        videoTutorial: exercise.attributes.intro,
        showVideoTutorial: true,
      });
    } else {
      set({ videoTutorial: "", showVideoTutorial: false });
    }

    let readme = replaceSlot(exercise.body, "{{publicUrl}}", HOST);
    // @ts-ignore
    if (typeof configObject.config.variables === "object") {
      // @ts-ignore
      for (let v in configObject.config.variables) {
        readme = replaceSlot(
          readme,
          `{{${v}}}`,
          // @ts-ignore
          configObject.config.variables[v]
        );
      }
    }

    set({ currentContent: readme });
    set({ editorTabs: [] });
    // @ts-ignore
    fetchSingleExerciseInfo(currentExercisePosition);
    updateEditorTabs();
  },

  toggleSidebar: () => {
    changeSidebarVisibility();
  },

  setLanguage: (language, fetchExercise = true) => {
    const { fetchReadme, checkParams } = get();
    set({ language: language });

    let params = checkParams({ justReturn: true });
    setWindowHash({ ...params, language: language });

    if (fetchExercise) {
      fetchReadme();
    }
  },

  openTerminal: () => {
    const { compilerSocket, getCurrentExercise } = get();
    const data = {
      exerciseSlug: getCurrentExercise().slug,
    };
    compilerSocket.emit("open_terminal", data);
  },
  handleNext: () => {
    const { currentExercisePosition, handlePositionChange } = get();
    handlePositionChange(Number(currentExercisePosition) + 1);
  },

  handlePositionChange: async (desiredPosition) => {
    const {
      configObject,
      currentExercisePosition,
      exercises,
      setPosition,
      isTesteable,
      runExerciseTests,
    } = get();

    const gradingMode = configObject.config.grading;
    const lastExercise = exercises.length - 1;

    if (desiredPosition > lastExercise || desiredPosition < 0) {
      toast.error("The exercise you are looking for does not exist!");
      return;
    }

    if (desiredPosition == currentExercisePosition) {
      return;
    }

    let letPass = true;

    if (desiredPosition > Number(currentExercisePosition)) {
      letPass =
        !isTesteable ||
        gradingMode === "isolated" ||
        (gradingMode === "incremental" &&
          // @ts-ignore
          exercises[currentExercisePosition].done);
    }

    if (!letPass) {
      runExerciseTests({
        toast: true,
        setFeedbackButton: true,
        feedbackButtonText: "Running...",
        targetButton: "feedback",
      });
      return;
    }
    setPosition(Number(desiredPosition));
  },

  toastFromStatus: (status) => {
    const { language } = get();
    const [icon, message] = getStatus(status, language);
    let duration = 1500;
    if (status === "testing-error") {
      duration = 3000;
    }
    toast.success(message, { icon: icon, duration: duration });
  },

  setTestResult: (status, logs) => {
    console.log(logs);

    const { exercises, currentExercisePosition, updateDBSession } = get();
    const copy = [...exercises];

    copy[Number(currentExercisePosition)].done = status === "successful";

    set({ exercises: copy });

    updateDBSession();
  },

  setShouldBeTested: (value) => {
    set({ shouldBeTested: value });
  },
  build: (buildText, submittedInputs = []) => {
    const {
      setBuildButtonPrompt,
      compilerSocket,
      getCurrentExercise,
      editorTabs,
      token,
      updateEditorTabs,
      setOpenedModals,
    } = get();

    if (!Boolean(token)) {
      setOpenedModals({ mustLogin: true });
      return;
    }

    setBuildButtonPrompt(buildText, "");

    const [icon, message] = getStatus("compiling");
    toast.success(message, { icon: icon });

    const data = {
      exerciseSlug: getCurrentExercise().slug,
      token,
      updateEditorTabs,
      editorTabs,
      submittedInputs,
    };

    compilerSocket.emit("build", data);
    set({ lastStartedAt: new Date() });
  },
  setEditorTabs: (tabs) => {
    set({ editorTabs: tabs });
  },
  runExerciseTests: (opts, submittedInputs = []) => {
    const {
      compilerSocket,
      getCurrentExercise,
      setFeedbackButtonProps,
      toastFromStatus,
      token,
      updateEditorTabs,
      setOpenedModals,
      editorTabs,
      language,
    } = get();

    if (!Boolean(token)) {
      setOpenedModals({ mustLogin: true });
      return;
    }

    const data = {
      exerciseSlug: getCurrentExercise().slug,
      token: token,
      updateEditorTabs,
      editorTabs,
      submittedInputs,
      language,
    };
    compilerSocket.emit("test", data);

    set({ shouldBeTested: false });
    if (opts?.targetButton) {
      set({ targetButtonForFeedback: opts.targetButton });
    }

    if (
      opts &&
      opts.setFeedbackButton &&
      opts.targetButton === "feedback" &&
      opts.feedbackButtonText
    ) {
      setFeedbackButtonProps(opts.feedbackButtonText, "palpitate");
    }

    if (opts && opts.toast) toastFromStatus("testing");
  },
  registerAIInteraction: (stepPosition, interaction) => {
    const { compilerSocket, getCurrentExercise, user_id } = get();

    TagManager.dataLayer({
      dataLayer: {
        event: "ai_interaction",
        interaction: interaction,
        slug: getCurrentExercise().slug,
        user_id,
      },
    });
    const telemetryData = {
      exerciseSlug: getCurrentExercise().slug,
      stepPosition,
      event: "ai_interaction",
      eventData: interaction,
    };
    compilerSocket.emit("ai_interaction", telemetryData);
  },
  // Leave this empty for development purposes
  displayTestButton: DEV_MODE,
  getOrCreateActiveSession: async () => {
    const { token, configObject, setOpenedModals, updateEditorTabs, tabHash } =
      get();
    let storedTabHash = tabHash;

    if (!token) return;

    if (!storedTabHash) {
      storedTabHash = await FetchManager.getTabHash();
      set({ tabHash: storedTabHash });
    }

    try {
      const session = await getSession(token, configObject.config.slug);

      if (!session.tab_hash) {
        await updateSession(
          token,
          storedTabHash,
          configObject.config.slug,
          configObject,
          session.key
        );
        set({ sessionKey: session.key });
      }

      if (session.tab_hash && session.tab_hash !== storedTabHash) {
        setOpenedModals({ session: true });
      } else {
        set({
          configObject: session.config_json,
          exercises: session.config_json.exercises,
        });
        set({ sessionKey: session.key });

        await FetchManager.setSessionKey(session.key);
        updateEditorTabs();
      }
    } catch (e) {
      console.log("Error trying to get session");
    }
  },
  updateDBSession: async () => {
    const { configObject, exercises, token, tabHash, sessionKey } = get();

    const configCopy = { ...configObject, exercises };

    let cachedSessionKey = "";
    if (!sessionKey) {
      cachedSessionKey = await FetchManager.getSessionKey();
    }
    await updateSession(
      token,
      tabHash,
      configObject.config.slug,
      configCopy,
      sessionKey || cachedSessionKey
    );
  },
  updateFileContent: async (exerciseSlug, tab, updateTabs = false) => {
    const { exercises, updateEditorTabs } = get();

    let newExercises = exercises.map((e) => {
      if (e.slug === exerciseSlug) {
        return {
          ...e,
          files: e.files.map((f: any) => {
            return f.name === tab.name
              ? {
                  ...f,
                  content: tab.content,
                  modified: true,
                }
              : f;
          }),
        };
      } else {
        return e;
      }
    });

    await FetchManager.saveFileContent(exerciseSlug, tab.name, tab.content);
    set({ exercises: newExercises });
    if (updateTabs) {
      updateEditorTabs();
    }
  },
  resetExercise: ({ exerciseSlug }) => {
    const { updateEditorTabs, exercises, compilerSocket, updateDBSession } =
      get();

    let newExercises = exercises.map((e) => {
      if (e.slug === exerciseSlug) {
        return {
          ...e,
          files: e.files.map((f: any) => {
            delete f.content;
            delete f.modified;
            return f;
          }),
        };
      } else {
        return e;
      }
    });

    set({ exercises: newExercises, lastState: "" });

    updateDBSession();

    const data = {
      exerciseSlug: exerciseSlug,
      updateEditorTabs: updateEditorTabs,
    };
    compilerSocket.emit("reset", data);
  },
  sessionActions: async ({ action = "new" }) => {
    const { configObject, token, updateEditorTabs, tabHash } = get();
    let storedTabHash = tabHash;
    if (!storedTabHash) {
      storedTabHash = await FetchManager.getTabHash();
    }
    if (action === "new") {
      const session = await createSession(
        token,
        tabHash,
        configObject.config.slug,
        configObject
      );
      await FetchManager.setSessionKey(session.key);
      set({
        sessionKey: session.key,
      });
    }

    if (action === "continue") {
      const session = await getSession(token, configObject.config.slug);
      await updateSession(
        token,
        tabHash,
        configObject.config.slug,
        null,
        session.key
      );

      set({
        configObject: session.config_json,
        exercises: session.config_json.exercises,
        sessionKey: session.key,
      });
      await FetchManager.setSessionKey(session.key);
      updateEditorTabs();
    }
  },

  refreshDataFromAnotherTab: ({ newToken, newTabHash, newBCToken }) => {
    const { token, bc_token, tabHash, getOrCreateActiveSession } = get();

    if (!(token === newToken)) {
      set({ token: newToken });
    }
    if (!(bc_token === newBCToken)) {
      set({ bc_token: newBCToken });
    }
    if (!(tabHash === newTabHash)) {
      set({ tabHash: newTabHash });
    }
    getOrCreateActiveSession();
  },
  toggleTheme: () => {
    const { theme, checkParams } = get();
    let params = checkParams({ justReturn: true });
    if (theme === "dark") {
      setWindowHash({ ...params, theme: "light" });
      set({ theme: "light" });
    } else {
      setWindowHash({ ...params, theme: "dark" });
      set({ theme: "dark" });
    }
  },
  toggleRigo: () => {
    const { token, isRigoOpened, setOpenedModals } = get();
    if (!token) {
      setOpenedModals({ mustLogin: true });
      return;
    }
    set({ isRigoOpened: !isRigoOpened });
  },
  registerTelemetryEvent: (event, data) => {
    const { currentExercisePosition } = get();
    TelemetryManager.registerStepEvent(
      Number(currentExercisePosition),
      event,
      data
    );
  },
  startTelemetry: async () => {
    const { configObject, bc_token } = get();
    console.log(" starting telemetry", configObject, bc_token);
    if (!bc_token || !configObject) {
      console.log("No token or config found");
      return;
    }

    if (configObject.exercises && configObject.exercises.length > 0) {
      const steps = configObject.exercises.map((e, index) => ({
        slug: e.slug,
        position: e.position || index,
        files: e.files,
        ai_interactions: [],
        compilations: [],
        tests: [],
        is_testeable: e.graded || false,
      }));
      const agent = configObject.config?.editor.agent || "";
      const tutorialSlug = configObject.config?.slug || "";
      const STORAGE_KEY = "TELEMETRY";

      if (!configObject.config.telemetry) {
        console.error("No telemetry urls found in config");
        return;
      }

      TelemetryManager.urls = configObject.config.telemetry;
      TelemetryManager.userToken = bc_token;
      TelemetryManager.start(agent, steps, tutorialSlug, STORAGE_KEY);
    }
  },
  setRigoContext: (context) => {
    set({ rigoContext: context });
  },
  test: async () => {
    // Notifier.success("Succesfully tested");
    FetchManager.logout();
  },
}));

export default useStore;
