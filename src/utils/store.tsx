// @ts-nocheck
import io from "socket.io-client";
import TagManager from "react-gtm-module";
import { create } from "zustand";
import {
  convertMarkdownToHTML,
  changeSidebarVisibility,
  getExercise,
  getFileContent,
  startChat,
  disconnected,
  onConnectCli,
  getHost,
  getParamsObject,
  replaceSlot,
  debounce,
  removeSpecialCharacters,
  ENVIRONMENT,
  getEnvironment,
} from "./lib";
import Socket from "../managers/socket";
import { IStore, TDialog } from "./storeTypes";
import toast from "react-hot-toast";
import { getStatus } from "../managers/socket";
import { DEV_MODE, RIGOBOT_HOST } from "./lib";
import { EventProxy, TEnvironment } from "../managers/EventProxy";
import { FetchManager } from "../managers/fetchManager";
import { LocalStorage } from "../managers/localStorage";

type TFile = {
  name: string;
  hidden: boolean;
};

class MissingRigobotAccountError extends Error {
  constructor(message) {
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

const defaultParams = getParamsObject();

FetchManager.init(ENVIRONMENT, HOST);

const useStore = create<IStore>((set, get) => ({
  language: defaultParams.language || "us",
  languageMap: {
    us: "en",
    es: "sp",
  },
  showTutorial: true,
  learnpackPurposeId: defaultParams.purpose || 26,
  exercises: [],
  currentContent: "",
  targetButtonForFeedback: "feedback",
  dialogData: {},
  chatSocket: chatSocket,
  currentExercisePosition: defaultParams.currentExercise || 0,
  chatInitialMessage:
    "Hello! I'm **Rigobot**, your friendly **AI Mentor**! \n\n I can help you if you feel stuck, ask me anything about this exercise!",
  conversationIdsCache: {},
  lessonTitle: "",
  numberOfExercises: 0,
  user_id: null,
  solvedExercises: 0,
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
  editorTabs: [],
  feedbackbuttonProps: {
    text: "Get feedback",
    className: "",
  },
  configObject: {
    config: {
      intro: "",
      grading: "",
      editor: {
        agent: "",
      },
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
  },
  activeTab: 0,
  lastTestResult: {
    status: "",
    logs: "",
  },

  // setters
  start: () => {
    const {
      fetchExercises,
      fetchReadme,
      checkParams,
      startConversation,
      token,
      checkLoggedStatus,
      currentExercisePosition,
      setListeners,
      figureEnvironment,
    } = get();
    figureEnvironment().then(() =>
      fetchExercises()
        .then(() => {
          return checkParams({ justReturn: false });
        })
        .then((params) => {
          if (Object.keys(params).length === 0) {
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
      editorTabs,
    } = get();

    let debounceSuccess = debounce((data: any) => {
      const stdout = removeSpecialCharacters(data.logs[0]);
      setTestResult("successful", stdout);
      toastFromStatus("testing-success");

      if (get().targetButtonForFeedback === "feedback") {
        setFeedbackButtonProps("Succeded", "bg-success text-white");
      } else {
        setBuildButtonPrompt("Succeded", "bg-success text-white");
      }
    }, 100);

    let debounceError = debounce((data: any) => {
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
    compilerSocket.onStatus("open_window", (data) => {
      toastFromStatus("open_window");
    });
    compilerSocket.on("dialog", (data: TDialog) => {
      set({ dialogData: data.data });
      setOpenedModals({ dialog: true });
    });
  },

  figureEnvironment: async () => {
    const env = await getEnvironment();
    set({compilerSocket: EventProxy.getEmitter(env)})
    FetchManager.init(env, HOST)
  },

  getCurrentExercise: () => {
    const { exercises, currentExercisePosition } = get();
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
    set({ openedModals: { ...openedModals, ...modals } });
  },

  setToken: (newToken) => {
    set({ token: newToken });
  },
  checkLoggedStatus: async (opts) => {
    const { startConversation, currentExercisePosition, setOpenedModals } =
      get();

    try {
      const json = await FetchManager.checkLoggedStatus();

      set({ token: json.rigoToken });
      set({ bc_token: json.payload.token });
      if (opts.startConversation) {
        startConversation(currentExercisePosition);
      }
    } catch (err) {
      set({ token: "" });
      setOpenedModals({ login: true });
    }
  },
  getContextFilesContent: async () => {
    const {
      getCurrentExercise,
      currentContent,
      isBuildable,
      isTesteable,
      configObject,
      language,
    } = get();
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

      return modeToExtractor[mode];
    };

    let currentExercise = getCurrentExercise();
    const slug = currentExercise.slug;
    let mode = configObject.config.grading;

    if (!["incremental", "isolated"].includes(mode)) mode = "incremental";

    let extractor = getExtractor(mode);

    let contextFiles = currentExercise.files.filter(extractor);

    let filePromises = contextFiles.map(async (file, index) => {
      let fileContent = await FetchManager.getFileContent(slug, file.name);
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
    const { getLessonTitle, fetchReadme, user_id, setOpenedModals } = get();

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
      set({ numberOfExercises: config.exercises.length });
      set({ lessonTitle: config.config.title.us });
      set({ configObject: config });
    } catch (err) {
      disconnected();
    }
  },
  checkParams: ({ justReturn }) => {
    const { setLanguage, setPosition, currentExercisePosition, language } =
      get();

    let params = window.location.hash.substring(1);
    const paramsUrlSeaerch = new URLSearchParams(params);

    let paramsObject = {};
    for (const [key, value] of paramsUrlSeaerch.entries()) {
      paramsObject[key] = value;
    }

    if (justReturn) {
      return paramsObject;
    }

    const languageParam = paramsObject.language;
    const position = paramsObject.currentExercise;

    if (languageParam) {
      setLanguage(language, false);
    }

    if (position) {
      setPosition(Number(position));
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

    const solutionFile = exercise.files.find((file) =>
      file.name.includes("solution.hide")
    );

    if (solutionFile) {
      hasSolution = true;
      let solution = await FetchManager.getFileContent(slug, solutionFile.name);
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

    let hash = `currentExercise=${newPosition}${
      params.language ? "&language=" + params.language : ""
    }`;

    window.location.hash = hash;

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

  loginToRigo: async (loginInfo) => {
    const {
      host,
      setToken,
      startConversation,
      currentExercisePosition,
      setOpenedModals,
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
    startConversation(currentExercisePosition);
    setOpenedModals({ login: false, chat: true });
    return true;
  },

  checkRigobotInvitation: async () => {
    const { bc_token, setToken, openLink, setOpenedModals } = get();
    const rigoAcceptedUrl = `${RIGOBOT_HOST}/v1/auth/me/token?breathecode_token=${bc_token}`;
    const res = await fetch(rigoAcceptedUrl);
    if (res.status != 200) {
      toast.error("You have not accepted Rigobot's invitation yet!");
      openLink(
        "https://rigobot.herokuapp.com/invite?referer=4geeks&token=" + bc_token
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
    const resServer = await fetch(`${HOST}/set-rigobot-token`, config);
    setOpenedModals({ chat: true });
  },

  openLink: (url) => {
    const { compilerSocket, getCurrentExercise } = get();
    const data = {
      url,
      exerciseSlug: getCurrentExercise().slug,
    };
    compilerSocket.openWindow(data);
  },
  updateEditorTabs: (newTab = null) => {
    const { getCurrentExercise, editorTabs } = get();

    const exercise = getCurrentExercise();
    const notHidden = exercise.files.filter((f) => !f.hidden);
    let editorTabsCopy = [...editorTabs];

    const terminalIndex = editorTabsCopy.findIndex(
      (t) => t.name === "terminal"
    );

    if (newTab) {
      const tabExists = editorTabsCopy.some((tab) => tab.name === newTab.name);
      if (tabExists) {
        const tabIndex = editorTabsCopy.findIndex(
          (t) => t.name === newTab.name
        );
        editorTabsCopy[tabIndex] = { ...newTab, isActive: true };
      } else {
        editorTabsCopy = editorTabsCopy.map((tab) => ({
          ...tab,
          isActive: false,
        }));
        editorTabsCopy.push({ ...newTab, isActive: true });
      }
    }

    const updateTabs = async () => {
      for (const [index, element] of notHidden.entries()) {
        const content = await FetchManager.getFileContent(
          exercise.slug,
          element.name
        );

        const tabExists = editorTabsCopy.some(
          (tab) => tab.name === element.name
        );

        const tab = {
          id: index,
          content: content,
          name: element.name,
          isActive: index === 0 && !newTab, // Only the first file is active if no newTab
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

  cleanEditorTabs: (slug: string) => {
    LocalStorage.cleanEditorTabs(slug);
    set({ editorTabs: [] });
  },

  fetchReadme: async () => {
    const {
      language,
      exercises,
      currentExercisePosition,
      setShowVideoTutorial,
      fetchSingleExerciseInfo,
      configObject,
      openLink,
      updateEditorTabs,
    } = get();

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

    if (typeof configObject.config.variables === "object") {
      for (let v in configObject.config.variables) {
        readme = replaceSlot(
          readme,
          `{{${v}}}`,
          configObject.config.variables[v]
        );
      }
    }

    set({ currentContent: readme });
    set({ editorTabs: [] });

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
    let hash = `language=${language}${
      params.currentExercise ? "&currentExercise=" + params.currentExercise : ""
    }`;
    window.location.hash = hash;

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

    if (desiredPosition > currentExercisePosition) {
      letPass =
        !isTesteable ||
        gradingMode === "isolated" ||
        (gradingMode === "incremental" &&
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
    const { exercises } = get();
    const copy = [...exercises];
    copy[get().currentExercisePosition].done = status === "successful";
    set({ exercises: copy });
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
    } = get();
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
      isTesteable,
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
  test: async () => {
    const { openTerminal, getContextFilesContent } = get();
    // disconnected();
    toast.success("Test button pressed, implement something");
    await FetchManager.logout();
  },
}));

export default useStore;
