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
  MissingRigobotAccountError,
  countConsumables,
  removeParam,
  reportDataLayer,
  remakeMarkdown,
  correctLanguage,
  convertUrlToBase64,
  playEffect,
} from "./lib";
import {
  IStore,
  TAgent,
  TExercise,
  TMode,
  TParamsActions,
  TPossibleParams,
} from "./storeTypes";
import toast from "react-hot-toast";
import { getStatus } from "../managers/socket";
import { DEV_MODE, RIGOBOT_HOST } from "./lib";
import { EventProxy } from "../managers/EventProxy";
import { FetchManager } from "../managers/fetchManager";
import {
  useConsumableCall,
  createSession,
  getConsumables,
  getSession,
  updateSession,
} from "./apiCalls";
import TelemetryManager from "../managers/telemetry";
import { RigoAI } from "../components/Rigobot/AI";
import { svgs } from "../assets/svgs";
import { Notifier } from "../managers/Notifier";

type TFile = {
  name: string;
  hidden: boolean;
};

const HOST = getHost();

const FASTAPI_HOST = "https://ai.4geeks.com";
// const FASTAPI_HOST = "http://localhost:8000";
const chatSocket = io(`${FASTAPI_HOST}`);

chatSocket.on("connect", () => {
  console.debug("connected to chat socket at ", FASTAPI_HOST);
});
chatSocket.on("disconnect", () => {
  console.debug("disconnected from chat socket at ", FASTAPI_HOST);
});

const defaultParams = getParamsObject() as TPossibleParams;

FetchManager.init(ENVIRONMENT, HOST, () => {
  window.location.reload();
});

const useStore = create<IStore>((set, get) => ({
  language: defaultParams.language || "us",
  languageMap: {
    us: "en",
    es: "sp",
  },
  learnpackPurposeId: defaultParams.purpose || 26,
  exercises: [],
  currentContent: {
    body: "",
    bodyBegin: 0,
  },
  targetButtonForFeedback: "feedback" as "feedback",
  dialogData: {
    message: "",
    format: "md" as "md",
  },
  maxQuizRetries: 3,
  userConsumables: {
    ai_compilation: 0,
    ai_conversation_message: 0,
    ai_generation: 0,
  },
  chatSocket: chatSocket,
  currentExercisePosition: defaultParams.currentExercise || 0,
  chatInitialMessage:
    "Hello! I'm **Rigobot**, your friendly **AI Mentor**! \n\n I can help you if you feel stuck, ask me anything about this exercise!",
  conversationIdsCache: {},
  lessonTitle: "",
  rigoContext: {
    context: "",
    userMessage: "",
    performTests: false,
  },
  showSidebar: false,
  user_id: null,
  hasSolution: false,
  shouldBeTested: false,
  status: "",
  agent: "vscode" as TAgent,
  showFeedback: false,
  token: "",
  bc_token: "",
  buildbuttonText: {
    text: "execute-my-code",
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
  assessmentConfig: {
    maxRetries: 3,
  },
  mode: "student" as TMode,
  configObject: {
    currentExercise: "",
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
    rigobotInvite: false,
  },
  activeTab: 0,
  lastTestResult: {
    // @ts-ignore
    status: "",
    logs: "",
  },
  authentication: {
    mandatory: false,
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
      getUserConsumables,
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
            return fetchReadme();
          }
        })
        .then(() => {
          return checkLoggedStatus({ startConversation: true });
        })
        .then(() => {
          return setListeners();
        })
        .then(() => {
          getUserConsumables();
        })
        .then(() => {
          RigoAI.load();
        })
    );
  },
  setListeners: async () => {
    const {
      compilerSocket,
      toastFromStatus,
      setTestResult,
      setFeedbackButtonProps,
      setOpenedModals,
      setBuildButtonPrompt,
      registerTelemetryEvent,
      environment,
      useConsumable,
    } = get();

    const debounceTestingSuccess = debounce((data: any) => {
      const stdout = removeSpecialCharacters(data.logs[0]);

      setTestResult("successful", stdout);
      set({ lastState: "success", terminalShouldShow: true });
      toastFromStatus("testing-success");

      if (environment === "localStorage") {
        registerTelemetryEvent("test", data.result);
      }

      if (data.ai_required) {
        useConsumable("ai-compilation");
      }

      if (get().targetButtonForFeedback === "feedback") {
        setFeedbackButtonProps("test-my-code", "bg-success text-white");
      } else {
        setBuildButtonPrompt("execute-my-code", "bg-success text-white");
      }
      playEffect("success");
      Notifier.confetti();
    }, 100);

    const debounceTestingError = debounce((data: any) => {
      const stdout = removeSpecialCharacters(data.logs[0]);
      setTestResult("failed", stdout);
      set({ lastState: "error", terminalShouldShow: true });
      toastFromStatus("testing-error");

      if (environment === "localStorage") {
        registerTelemetryEvent("test", data.result);
      }
      if (data.ai_required) {
        useConsumable("ai-compilation");
      }

      if (get().targetButtonForFeedback === "feedback") {
        setFeedbackButtonProps("Try again", "bg-fail text-white");
      } else {
        setBuildButtonPrompt("Try again", "bg-fail text-white");
      }
      playEffect("error");
    }, 100);

    let compilerErrorHandler = debounce(async (data: any) => {
      data;

      set({ lastState: "error", terminalShouldShow: true });

      setBuildButtonPrompt("try-again", "bg-fail");
      setFeedbackButtonProps("test-my-code", "bg-white ");
      toastFromStatus("compiler-error");
      if (environment === "localStorage") {
        registerTelemetryEvent("compile", data);
      }
      if (data.ai_required) {
        useConsumable("ai-compilation");
      }
      // playEffect("error");
    }, 100);

    let compilerSuccessHandler = debounce(async (data: any) => {
      data;
      set({ lastState: "success", terminalShouldShow: true });

      toastFromStatus("compiler-success");

      setBuildButtonPrompt("execute-my-code", "bg-success");
      if (environment === "localStorage") {
        registerTelemetryEvent("compile", data);
      }
      if (data.ai_required) {
        useConsumable("ai-compilation");
      }
      // playEffect("success");
    }, 100);

    compilerSocket.onStatus("testing-success", debounceTestingSuccess);
    compilerSocket.onStatus("testing-error", debounceTestingError);
    compilerSocket.onStatus("compiler-error", compilerErrorHandler);
    compilerSocket.onStatus("compiler-success", compilerSuccessHandler);

    compilerSocket.onStatus("open_window", () => {
      toastFromStatus("open_window");
    });
    compilerSocket.on("dialog", (data: any) => {
      set({ dialogData: data.data });
      setOpenedModals({ dialog: true });
    });

    return true;
  },

  figureEnvironment: async () => {
    const { setOpenedModals } = get();
    const env = await getEnvironment();
    FetchManager.init(env, HOST, () => {
      setOpenedModals({ login: true });
    });
    set({ compilerSocket: EventProxy.getEmitter(env) });
    if (env === "localStorage") {
      set({ agent: "cloud" });
    }

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
      environment,
    } = get();

    const params = checkParams({ justReturn: true });

    try {
      let json = null;
      if (params.token) {
        set({ bc_token: params.token });
        json = await FetchManager.loginWithToken(params.token);
        set({ token: json.rigoToken });
        set({ user: json.user });
        setTimeout(() => {
          removeParam("token");
        }, 10000);
      } else {
        json = await FetchManager.checkLoggedStatus();
        set({ token: json.rigoToken });
        set({ bc_token: json.payload.token });
        set({ user: json.user });
      }

      if (opts && opts.startConversation) {
        startConversation(Number(currentExercisePosition));
      }
      getOrCreateActiveSession();

      if (environment === "localStorage") {
        await startTelemetry();
      }

      return true;
    } catch (err) {
      if (err instanceof MissingRigobotAccountError) {
        setOpenedModals({ login: false, rigobotInvite: true });
        return false;
      }
      console.log("ERROR WHILE TRYING TO CHECK LOGGED STATUS", err);

      set({ token: "" });
      setOpenedModals({ login: true });
      return false;
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
\`\`\`${file.name}
${fileContent}
\`\`\`
      `;
    });

    return Promise.all(filePromises).then((filesContext) => {
      context += filesContext.join("\n");
      context += `
### These are the given to the student for this exercise:
\`\`\`INSTRUCTIONS.md
${currentContent.body}
\`\`\`

### NOTES FOR AI: 
The user's set up the application in "${language}" language, give your feedback in "${language}" language, please.\`\`\`

      `;

      return context;
    });
  },

  fetchExercises: async () => {
    const { user_id, setOpenedModals, environment } = get();

    try {
      const config = await FetchManager.getExercises();

      if (!config) return;

      // console.debug("AUTHENTICATION", config.config.authentication);

      if (
        config.config.authentication &&
        config.config.authentication.mandatory
      ) {
        set({ authentication: { mandatory: true } });
      }

      if (config.config.assessment && config.config.assessment.maxQuizRetries) {
        set({ maxQuizRetries: config.config.assessment.maxQuizRetries });
      }

      if (config.config.warnings.agent && environment !== "localStorage") {
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
      if (config.exercises && config.exercises.length > 0) {
        set({ exercises: config.exercises });
      }

      if (config.currentExercise) {
        const foundExercise = config.exercises.findIndex(
          (exercise: TExercise) => exercise.slug === config.currentExercise
        );
        if (foundExercise !== -1) {
          set({ currentExercisePosition: foundExercise });
        }
      }

      set({ lessonTitle: config.config.title.us });
      set({ configObject: config });

      if (config.config.editor.agent && environment !== "localStorage") {
        set({ agent: config.config.editor.agent });
      }

      return true;
    } catch (err) {
      console.log(err, "ERROR");
      disconnected();
      return false;
    }
  },
  checkParams: ({ justReturn }) => {
    const { setLanguage, setPosition, language, setOpenedModals } = get();

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
      autoclose: (value: string) => {
        if (value.toLowerCase() === "true") {
          // Close the tab
          setOpenedModals({ closeWindow: true });
        }
      },
      token: (value: string) => {
        set({ token: value });
      },
    };

    const entries = Object.entries(paramsObject);

    for (let [key, value] of entries) {
      if (key in paramsActions) {
        paramsActions[key](value);
      } else {
        console.debug(`Unknown param passed: ${key}`);
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

      // configObject,
    } = get();

    let params = checkParams({ justReturn: true });
    setWindowHash({ ...params, currentExercise: String(newPosition) });

    set({ currentExercisePosition: newPosition });

    if (token) {
      startConversation(newPosition);
    }
    setBuildButtonPrompt("execute-my-code", "");
    setFeedbackButtonProps("test-my-code", "");
    set({ lastState: "" });

    registerTelemetryEvent("open_step", {
      step_position: newPosition,
    });
    fetchReadme();

    // set({ configObject: { ...configObject } });

    // if (exercise) {
    //   set({
    //     configObject: { ...configObject, currentExercise: exercise.slug },
    //   });
    // }
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
      language,
      reportEnrichDataLayer,
      getOrCreateActiveSession,
    } = get();

    try {
      const json = await FetchManager.login(loginInfo);

      set({
        bc_token: json.token,
        user_id: json.user_id,
        user: json.user,
      });

      if (json.rigobot == null) {
        throw new MissingRigobotAccountError(
          "No rigobot user found, did you already accept Rigobot's invitation?"
        );
      }
      setToken(json.rigobot.key);

      toast.success(loginInfo.messages.success, {
        icon: "✅",
      });
      reportEnrichDataLayer("session_load", {
        method: "native",
        user_id: json.user_id,
        language: language,
        path: window.location.href,
        agent: "cloud",
      });
    } catch (error) {
      if (error instanceof MissingRigobotAccountError) {
        setOpenedModals({ login: false, rigobotInvite: true });
        return false;
      } else {
        toast.error(loginInfo.messages.error);
        return false;
      }
    }
    // @ts-ignore
    startConversation(currentExercisePosition);
    setOpenedModals({ login: false });
    getOrCreateActiveSession();
    return true;
  },

  checkRigobotInvitation: async (messages) => {
    try {
      const { bc_token, setToken, openLink, language, environment } = get();

      const acceptRigobot = () => {
        const inviteUrl =
          "https://rigobot.herokuapp.com/invite?referer=4geeks&lang=" +
          correctLanguage(language) +
          "&token=" +
          bc_token +
          "&callback=" +
          convertUrlToBase64(window.location.href + "?autoclose=true");

        openLink(inviteUrl);
      };

      const rigoAcceptedUrl = `${RIGOBOT_HOST}/v1/auth/me/token?breathecode_token=${bc_token}`;
      const res = await fetch(rigoAcceptedUrl);

      if (res.status != 200) {
        toast.error(messages.error, {
          icon: svgs.rigoSvg,
        });
        acceptRigobot();
        return false;
      }
      const data = await res.json();
      console.log("DATA FROM RIGOBOT INVITATION", data);

      setToken(data.key);

      if (environment === "localhost") {
        const payload = { token: data.key };

        const config = {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        };
        await fetch(`${HOST}/set-rigobot-token`, config);
      }
      return data.key;
    } catch (error) {
      console.log(error, "ERROR");
      return false;
    }
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
    const { getCurrentExercise, editorTabs, setAllowedActions, environment } =
      get();

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

      if (editorTabsCopy.length > 0 && environment === "localStorage") {
        setAllowedActions(["tutorial", "test", "build"]);
      }
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

    if (exercise.attributes && exercise.attributes.tutorial) {
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

    set({ currentContent: { body: readme, bodyBegin: exercise.bodyBegin } });
    set({ editorTabs: [] });
    // @ts-ignore
    fetchSingleExerciseInfo(currentExercisePosition);
    updateEditorTabs();
    return true;
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

    if (!configObject || !configObject.config) {
      console.log("Impossible to continue, the configuration is not ready!");
      return;
    }

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
    logs;
    const { exercises, currentExercisePosition, updateDBSession } = get();
    const copy = [...exercises];

    copy[Number(currentExercisePosition)].done = status === "successful";

    set({ exercises: copy });

    updateDBSession();
  },

  setShouldBeTested: (value) => {
    set({ shouldBeTested: value });
  },
  build: async (buildText, submittedInputs = []) => {
    const {
      setBuildButtonPrompt,
      compilerSocket,
      getCurrentExercise,
      editorTabs,
      token,
      updateEditorTabs,
      setOpenedModals,
      setEditorTabs,
      environment,
      userConsumables,
      bc_token,
      toastFromStatus,
      reportEnrichDataLayer,
    } = get();

    if (!Boolean(bc_token) || !Boolean(token)) {
      setOpenedModals({ mustLogin: true });
      return;
    }

    if (
      environment === "localStorage" &&
      !(
        userConsumables.ai_compilation > 0 ||
        userConsumables.ai_compilation === -1
      )
    ) {
      setOpenedModals({ limitReached: true });
      reportEnrichDataLayer("learnpack_consumable_depleted ", {
        service_slug: "ai_compilation",
      });
      return;
    }

    if (editorTabs.find((tab) => tab.name === "terminal")) {
      // change the  content of the terminal tab to a empty string
      setEditorTabs(
        editorTabs.map((tab) =>
          tab.name === "terminal" ? { ...tab, content: "" } : tab
        )
      );
    }

    setBuildButtonPrompt(buildText, "");

    toastFromStatus("compiling");

    const data = {
      exerciseSlug: getCurrentExercise().slug,
      token,
      updateEditorTabs,
      editorTabs,
      submittedInputs,
    };

    compilerSocket.emit("build", data);
    set({ lastStartedAt: new Date() });
    reportEnrichDataLayer("learnpack_run", {});
  },
  setEditorTabs: (tabs) => {
    set({ editorTabs: tabs });
  },
  runExerciseTests: async (opts, submittedInputs = []) => {
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
      setEditorTabs,
      bc_token,
      environment,
      userConsumables,
      currentContent,
    } = get();

    if (!Boolean(token) || !Boolean(bc_token)) {
      setOpenedModals({ mustLogin: true });
      return;
    }

    if (
      environment === "localStorage" &&
      !(
        userConsumables.ai_compilation > 0 ||
        userConsumables.ai_compilation === -1
      )
    ) {
      setOpenedModals({ limitReached: true });
      return;
    }

    if (editorTabs.find((tab) => tab.name === "terminal")) {
      // change the  content of the terminal tab to a empty string
      setEditorTabs(
        editorTabs.map((tab) =>
          tab.name === "terminal" ? { ...tab, content: "" } : tab
        )
      );
    }

    const data = {
      exerciseSlug: getCurrentExercise().slug,
      token: token,
      updateEditorTabs,
      editorTabs,
      submittedInputs,
      language,
      instructions: currentContent.body,
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

  getOrCreateActiveSession: async () => {
    const {
      token,
      configObject,
      setOpenedModals,
      updateEditorTabs,
      tabHash,
      checkParams,
    } = get();
    let storedTabHash = tabHash;
    let params = checkParams({ justReturn: true });

    if (params.autoclose) {
      return;
    }

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
        return;
      } else if (session.tab_hash && session.tab_hash === storedTabHash) {
        set({
          configObject: session.config_json,
          exercises: session.config_json.exercises,
        });
        set({ sessionKey: session.key });

        await FetchManager.setSessionKey(session.key);
        updateEditorTabs();
      } else {
        console.log("NO SESSION ACTIVE PREVIOUSLY");

        set({ sessionKey: session.key });
        return;
      }
    } catch (e) {
      console.error(e);
      console.log("Error trying to get session");
    }
  },
  updateDBSession: async () => {
    const {
      configObject,
      exercises,
      token,
      tabHash,
      sessionKey,
      // currentExercisePosition,
      getCurrentExercise,
    } = get();

    const exercise = getCurrentExercise();

    const configCopy = {
      ...configObject,
      exercises,
      currentExercise: exercise.slug,
    };

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
    const { exercises, updateEditorTabs, setShouldBeTested } = get();

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
    setShouldBeTested(true);
    if (updateTabs) {
      updateEditorTabs();
    }
  },
  resetExercise: ({ exerciseSlug }) => {
    const {
      updateEditorTabs,
      exercises,
      compilerSocket,
      updateDBSession,
      setEditorTabs,
      editorTabs,
      reportEnrichDataLayer,
    } = get();

    if (editorTabs.find((tab) => tab.name === "terminal")) {
      setEditorTabs(editorTabs.filter((tab) => tab.name !== "terminal"));
    }

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
    reportEnrichDataLayer("learnpack_reset", {});
  },
  sessionActions: async ({ action = "new" }) => {
    const {
      configObject,
      token,
      updateEditorTabs,
      tabHash,
      handlePositionChange,
    } = get();
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
        sessionKey: session.key,
      });
      if (
        session.config_json.exercises &&
        session.config_json.exercises.length > 0
      ) {
        set({ exercises: session.config_json.exercises });

        if (session.config_json.currentExercise) {
          const exIndex = session.config_json.exercises.findIndex(
            (e: TExercise) => e.slug === session.config_json.currentExercise
          );
          handlePositionChange(exIndex);
        }
      }
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
  toggleRigo: (opts) => {
    const {
      token,
      isRigoOpened,
      setOpenedModals,
      showSidebar,
      setShowSidebar,
    } = get();
    if (!token) {
      setOpenedModals({ mustLogin: true });
      return;
    }

    if (showSidebar) {
      setShowSidebar(false);
    }
    if (opts && opts.ensure === "open") {
      set({ isRigoOpened: true });
      return;
    }
    if (opts && opts.ensure === "close") {
      set({ isRigoOpened: false });
      return;
    }
    set({ isRigoOpened: !isRigoOpened });
  },
  registerTelemetryEvent: (event, data) => {
    const { currentExercisePosition, compilerSocket, getCurrentExercise } =
      get();

    console.debug(
      "Registering telemetry event",
      event,
      "Socket emitting event: ",
      compilerSocket
    );
    compilerSocket.emit("telemetry_event", {
      event,
      exerciseSlug: getCurrentExercise().slug,
      eventData: data,
      stepPosition: Number(currentExercisePosition),
    });
  },
  startTelemetry: async () => {
    const {
      configObject,
      bc_token,
      user,
      registerTelemetryEvent,
      environment,
      // setRigoContext,
      // toggleRigo,
    } = get();
    if (!bc_token || !configObject) {
      console.error("No token or config found, impossible to start telemetry");
      return;
    }

    if (!user || !user.id) {
      console.error("No user found, impossible to start telemetry");
      console.log(user, "User");
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
        is_completed: false,
        quiz_submissions: [],
      }));
      const agent =
        environment === "localhost"
          ? configObject.config?.editor.agent
          : "cloud";
      const tutorialSlug = configObject.config?.slug || "";
      const STORAGE_KEY = "TELEMETRY";

      if (!configObject.config.telemetry) {
        console.error("No telemetry urls found in config");
        return;
      }

      if (!steps || steps.length === 0) {
        console.error("No steps found in config, telemetry will not start");
        return;
      }

      TelemetryManager.urls = configObject.config.telemetry;

      TelemetryManager.start(agent, steps, tutorialSlug, STORAGE_KEY, {
        token: bc_token,
        user_id: String(user.id),
        email: user.email,
      });
      TelemetryManager.registerListener("compile_struggles", (data) => {
        // toast.error("Compile struggles alert");
        console.log(data, "Data");
      });
      TelemetryManager.registerListener("test_struggles", (data) => {
        console.debug(data, "TEST STRUGGLES ALERT");
        // setRigoContext({
        //   userMessage: "Help!",
        //   performTests: true,
        //   context:
        //     "The student is struggling with the tests. It has failed 3 times in a row. Please help him.",
        // });
        // toggleRigo({ ensure: "open" });
      });
      registerTelemetryEvent("open_step", {
        step_slug: steps[0].slug,
        step_position: steps[0].position,
      });
    }
  },
  setRigoContext: (context) => {
    const { rigoContext } = get();
    set({ rigoContext: { ...rigoContext, ...context } });
  },
  setShowSidebar: (show) => {
    const { isRigoOpened, toggleRigo } = get();
    if (isRigoOpened) {
      toggleRigo({ ensure: "close" });
    }
    set({ showSidebar: show });
  },
  setUser: (user) => {
    set({ user });
  },
  useConsumable: async (consumableSlug): Promise<boolean> => {
    const { bc_token, userConsumables } = get();
    if (!bc_token) {
      return false;
    }

    const consumableKey =
      consumableSlug === "ai-conversation-message"
        ? "ai_conversation_message"
        : "ai_compilation";

    if (userConsumables[consumableKey] === 0) {
      return false;
    }

    if (userConsumables[consumableKey] === undefined) {
      return false;
    }

    if (userConsumables[consumableKey] < 0) {
      console.log(
        "User consumable is less than 0, it should be a bootcamp student"
      );

      return false;
    }

    const result = await useConsumableCall(bc_token, consumableSlug);

    if (result) {
      set({
        userConsumables: {
          ...userConsumables,
          [consumableKey]: userConsumables[consumableKey] - 1,
        },
      });
    }
    return result;
  },
  getUserConsumables: async () => {
    const { bc_token, token, environment } = get();

    if (!bc_token) {
      return;
    }
    const consumables = await getConsumables(bc_token);
    const ai_compilation = countConsumables(consumables, "ai-compilation");
    const ai_conversation_message = countConsumables(
      consumables,
      "ai-conversation-message"
    );
    const ai_generation = countConsumables(consumables, "ai-generation");

    // const ai_generation = 1;

    set({
      userConsumables: {
        ai_compilation,
        ai_conversation_message,
        ai_generation,
      },
    });

    console.table({ ai_compilation, ai_conversation_message, ai_generation });

    const isCreator =
      (ai_generation > 0 || ai_generation === -1) &&
      environment !== "localStorage";

    if (isCreator) {
      RigoAI.init({
        chatHash: "529ca5a219084bc7b93c172ad78ef92a",
        purposeSlug: "learnpack-lesson-writer",
        userToken: token,
        context:
          "You are a helpful lesson writer assistant. Please provide your response always in MARKDOWN. ",
      });
    }
    return { ai_compilation, ai_conversation_message, ai_generation };
  },
  reportEnrichDataLayer: (event: string, extraData: object) => {
    const {
      configObject,
      agent,
      isIframe,
      user,
      language,
      currentExercisePosition,
      getCurrentExercise,
    } = get();
    reportDataLayer({
      dataLayer: {
        event,
        method: "learnpack",
        asset_slug: configObject.config.slug,
        path: window.location.href,
        iframe: isIframe,
        user_id: user.id,
        content_type: "exercise",
        current_step_index: Number(currentExercisePosition),
        current_step_slug: getCurrentExercise().slug,
        agent,
        language,
        ...extraData,
      },
    });
  },
  displayTestButton: DEV_MODE,
  getTelemetryStep: async (stepPosition: number) => {
    return await FetchManager.getTelemetryStep(stepPosition);
  },

  setMode: (mode) => {
    set({ mode });
  },
  test: async () => {
    // Notifier.success("Succesfully tested");
    // const { token, setOpenedModals } = get();
    // console.log(token, "Token");
    // set({ token: "123456" });
    // toast.success("Token fucked");
    // setOpenedModals({ session: true });
    await FetchManager.logout();
    // try {
    //   await validateRigobotToken(token);
    //   toast.success("Token is valid");
    // } catch (error) {
    //   if (error instanceof TokenExpiredError) {
    //     toast.error("Token expired, please login again!");
    //   }
    // }
    // console.log(TelemetryManager.current);
    // setOpenedModals({ limitReached: true });
  },

  addVideoTutorial: async (videoTutorial: string) => {
    const { getCurrentExercise, language } = get();
    const readme = await FetchManager.getReadme(
      getCurrentExercise().slug,
      language
    );
    let newAttributes = readme.attributes;
    newAttributes.tutorial = videoTutorial;

    const newReadme = remakeMarkdown(newAttributes, readme.body);

    await FetchManager.replaceReadme(
      getCurrentExercise().slug,
      language,
      newReadme
    );

    set({
      videoTutorial: videoTutorial,
      showVideoTutorial: true,
    });
  },

  replaceInReadme: async (newText: string, startPosition, endPosition) => {
    const { getCurrentExercise, language } = get();
    const readme = await FetchManager.getReadme(
      getCurrentExercise().slug,
      language
    );

    let body: string = readme.body;

    body =
      body.slice(0, startPosition.offset) +
      newText +
      body.slice(endPosition.offset);

    const newReadme = remakeMarkdown(readme.attributes, body);

    await FetchManager.replaceReadme(
      getCurrentExercise().slug,
      language,
      newReadme
    );

    const editedReadme = await FetchManager.getReadme(
      getCurrentExercise().slug,
      language
    );

    set({
      currentContent: {
        body: editedReadme.body,
        bodyBegin: editedReadme.bodyBegin,
      },
    });
  },
}));

export default useStore;
