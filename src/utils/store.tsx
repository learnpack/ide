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
  console.log("connected to chat socket in ", FASTAPI_HOST);
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

  editorTabs: [],
  feedbackbuttonProps: {
    text: "Get feedback",
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
  },
  videoTutorial: "",
  allowedActions: [],
  compilerSocket: EventProxy.getEmitter(ENVIRONMENT),
  showVideoTutorial: false,
  exerciseMessages: {},
  host: HOST,
  openedModals: {
    chat: false,
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
      setBuildButtonPrompt,
    } = get();

    const debounceSuccess = debounce((data: any) => {
      const stdout = removeSpecialCharacters(data.logs[0]);
      setTestResult("successful", stdout);
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
      toastFromStatus("testing-error");

      if (get().targetButtonForFeedback === "feedback") {
        setFeedbackButtonProps("Try again", "bg-fail text-white");
      } else {
        setBuildButtonPrompt("Try again", "bg-fail text-white");
      }
    }, 100);

    compilerSocket.onStatus("testing-success", debounceSuccess);
    compilerSocket.onStatus("testing-error", debounceError);
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
  checkLoggedStatus: async (opts) => {
    const {
      startConversation,
      currentExercisePosition,
      setOpenedModals,
      checkParams,
      getOrCreateActiveSession,
    } = get();

    const params = checkParams({ justReturn: true });

    try {
      if (params.token) {
        const json = await FetchManager.loginWithToken(params.token);
        set({ token: json.rigoToken });
        set({ bc_token: json.payload.token });
      } else {
        const json = await FetchManager.checkLoggedStatus();
        set({ token: json.rigoToken });
        set({ bc_token: json.payload.token });
      }

      if (opts && opts.startConversation) {
        startConversation(Number(currentExercisePosition));
      }
      getOrCreateActiveSession();
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
      const fileContent = await FetchManager.getFileContent(slug, file.name, {
        cached: true,
      });

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
      console.log(context);

      return context;
    });
  },

  fetchExercises: async () => {
    const { user_id, setOpenedModals } = get();

    try {
      const config = await FetchManager.getExercises();

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
      set({ currentSolution: solution });
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
    } = get();

    let params = checkParams({ justReturn: true });
    setWindowHash({ ...params, currentExercise: String(newPosition) });

    set({ currentExercisePosition: newPosition });

    if (token) {
      startConversation(newPosition);
    }
    setBuildButtonPrompt("Run", "");
    setFeedbackButtonProps("Get feedback", "");

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

  openLink: (url, opts) => {
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
            // @ts-ignore
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
            // @ts-ignore
            isActive: true,
          });
        }
      }
    }

    const updateTabs = async () => {
      for (const [index, element] of notHidden.entries()) {
        let content = "";
        if ("content" in element) {
          content = element.content;

          await FetchManager.saveFileContent(
            exercise.slug,
            element.name,
            content
          );
        } else {
          content = await FetchManager.getFileContent(
            exercise.slug,
            element.name,
            { cached: true }
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
  build: (buildText) => {
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
    };

    compilerSocket.emit("build", data);
  },
  runExerciseTests: (opts) => {
    // This function will run the exercises tests and store the results in the state
    const {
      compilerSocket,
      getCurrentExercise,
      setFeedbackButtonProps,
      // isTesteable,
      toastFromStatus,
      token,
      updateEditorTabs,
    } = get();

    const data = {
      exerciseSlug: getCurrentExercise().slug,
      token: token,
      updateEditorTabs,
    };
    compilerSocket.emit("test", data);

    set({ shouldBeTested: false });

    if (opts?.targetButton) {
      set({ targetButtonForFeedback: opts.targetButton });
    }

    if (opts && opts.setFeedbackButton && opts.targetButton === "feedback")
      setFeedbackButtonProps(opts.feedbackButtonText, "palpitate");
    if (opts && opts.toast) toastFromStatus("testing");
  },
  registerAIInteraction: (stepPosition, interaction) => {
    const { compilerSocket, getCurrentExercise } = get();

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
  updateFileContent: (exerciseSlug, tab) => {
    const { exercises, updateDBSession } = get();

    let newExercises = exercises.map((e) => {
      if (e.slug === exerciseSlug) {
        return {
          ...e,
          files: e.files.map((f: any) => {
            return f.name === tab.name
              ? {
                  ...f,
                  content: tab.content,
                }
              : f;
          }),
        };
      } else {
        return e;
      }
    });
    set({ exercises: newExercises });
    updateDBSession();
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
            return f;
          }),
        };
      } else {
        return e;
      }
    });

    set({ exercises: newExercises });

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
  test: async () => {
    // const { theme } = get();
    // disconnected();
    // const session = await getSession(token, configObject.config.slug);
    // LocalStorage.set("LEARNPACK_SESSION_KEY", session.key);
    // console.log(session.key);
    // await FetchManager.logout();
    set({ token: "somethatisnotatoken" });

    toast.success("Succesfully tested");
  },
}));

export default useStore;
