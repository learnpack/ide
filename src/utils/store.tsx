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
  startRecording,
  debounce,
  removeSpecialCharacters,
} from "./lib";
import Socket from "./socket";
import { IStore } from "./storeTypes";
import toast from "react-hot-toast";
import { getStatus } from "./socket";
import { DEV_MODE, RIGOBOT_API_URL } from "./lib";




class MissingRigobotAccountError extends Error {
  constructor(message) {
    super(message);
    this.name = "MissingRigobotAccountError";
  }
}

const HOST = getHost();
Socket.start(HOST, disconnected, onConnectCli);

const FASTAPI_HOST = "https://chat.4geeks.com";
// const FASTAPI_HOST = "http://localhost:8000";
const chatSocket = io(`${FASTAPI_HOST}`);

chatSocket.on("connect", () => {
  // console.log("connected to chat socket in ", FASTAPI_HOST);
});

const defaultParams = getParamsObject();
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
  promptMode: false,
  promptInstructions: "",
  token: "",
  bc_token: "",
  buildbuttonText: {
    text: "Run",
    className: "",
  },
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
  compilerSocket: Socket.createScope("compiler"),
  showVideoTutorial: false,
  exerciseMessages: {},
  host: HOST,
  openedModals: {
    chat: false,
    login: false,
    video: false,
    reset: false,
  },
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
    } = get();
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
      });
  },
  setListeners: () => {
    const {
      compilerSocket,
      setTestResult,
      toastFromStatus,
      setFeedbackButtonProps,
      setOpenedModals,
      setBuildButtonText
      
    } = get();

    let debounceSuccess = debounce((data: any) => {
      const stdout = removeSpecialCharacters(data.logs[0]);
      setTestResult("successful", stdout);
      toastFromStatus("testing-success");
      
      if (get().targetButtonForFeedback === "feedback") {
        setFeedbackButtonProps("Succeded", "bg-success text-white");
      }
      else {
        setBuildButtonText("Succeded", "bg-success text-white");
      }
    }, 100);
    
    let debounceError = debounce((data: any) => {
      const stdout = removeSpecialCharacters(data.logs[0]);
      setTestResult("failed", stdout);
      toastFromStatus("testing-error");

      if (get().targetButtonForFeedback === "feedback") {
        setFeedbackButtonProps("Try again", "bg-fail text-white");
      }
      else {
        setBuildButtonText("Try again", "bg-fail text-white");
      }
    }, 100);

    compilerSocket.onStatus("testing-success", debounceSuccess);
    compilerSocket.onStatus("testing-error", debounceError);
    compilerSocket.onStatus("open_window", (data) => {
      toastFromStatus("open_window");
    });
    compilerSocket.on("dialog", (data) => {
      set({ dialogData: data.data });
      setOpenedModals({ dialog: true });
    });
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
  setAllowedActions: (actions) => {
    set({ allowedActions: actions });
  },

  // functions
  setBuildButtonText: (t, c = "") => {
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
    const { startConversation, currentExercisePosition } = get();
    try {
      const res = await fetch(`${HOST}/check/rigo/status`);
      const json = await res.json();
      set({ token: json.rigoToken });

      if (opts.startConversation) {
        startConversation(currentExercisePosition);
      }
    } catch (err) {
      set({ token: "" });
      console.log("error in checkLoggedStatus", err);
    }
  },
  getContextFilesContent: async () => {
    const {
      getCurrentExercise,
      currentReadme,
      isBuildable,
      isTesteable,
      configObject,
      language
    } = get();
    let context = "";

    
    let currentExercise = getCurrentExercise();
    const slug = currentExercise.slug;
    let mode = configObject.config.grading;

    let extractor = (file) => !file.hidden && !file.name.toLowerCase().includes("readme") && !file.name.toLowerCase().includes("pycache");

    if (mode == "incremental" && isTesteable) extractor = (file) => file && !file.toLowerCase().includes("readme") || !file.name.toLowerCase().includes("pycache");


    let contextFiles = currentExercise.files.filter(extractor);

    let filePromises = contextFiles.map(async (file, index) => {
      let fileContent = await getFileContent(slug, file.name);
      return `---
      # File name: ${file.name}. Content: 
      \`${fileContent}\`
      ---
      `;
    });

    return Promise.all(filePromises).then((filesContext) => {
      context += filesContext.join("\n");
      context += `
      ---This is the current exercise instructions:
      ${currentReadme}
      ---
      
      <MANDATORY FOR AI: The user's set up the application in "${language}" language, give your feedback in "${language}" language, please.>

      `;
            
      return context;
    });
  },

  getConfigObject: async () => {
    if (!HOST) {
      return;
    }
    try {
      const res = await fetch(`${HOST}/config`);
      const config = await res.json();
      set({ configObject: config });
    } catch (err) {
      disconnected();
    }
  },

  fetchExercises: async () => {
    const { getLessonTitle, fetchReadme, user_id } = get();

    try {
      const res = await fetch(`${HOST}/config`);
      const config = await res.json();

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

    const respose = await getExercise(slug);
    const exercise = await respose.json();

    let isTesteable = exercise.graded;
    let isBuildable;
    let hasSolution = false;

    if (exercise.entry) isBuildable = true;
    if (!exercise.language) isBuildable = false;
    // TODO: check if the exercise is buildable based in the language and the entry file
    const solutionFile = exercise.files.find((file) =>
      file.name.includes("solution.hide")
    );

    if (solutionFile) {
      hasSolution = true;
      let solution = await getFileContent(slug, solutionFile.name);
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
      setBuildButtonText,
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
    setBuildButtonText("Run", "");
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

    // if (initialData && initialData.salute) {
    //   set({ chatInitialMessage: initialData.salute });
    // }

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

    const config = {
      method: "post",
      body: JSON.stringify(loginInfo),
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const res = await fetch(host + "/login", config);
      const json = await res.json();

      console.log(json, "json response");

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
    const rigoAcceptedUrl = `${RIGOBOT_API_URL}/v1/auth/me/token?breathecode_token=${bc_token}`;
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

  clearBcToken: () => {
    set({ bc_token: "" });
  },
  fetchReadme: async () => {
    const {
      language,
      exercises,
      currentExercisePosition,
      getConfigObject,
      setShowVideoTutorial,
      fetchSingleExerciseInfo,
      configObject,
      openLink,
    } = get();

    const slug = exercises[currentExercisePosition]?.slug;
    if (!slug) {
      return;
    }

    const response = await fetch(
      `${HOST}/exercise/${slug}/readme?lang=${language}`
    );
    const exercise = await response.json();

    if (exercise.attributes.prompt_requirements) {
      console.log(
        "The read contains prompt instructions, turning into prompt mode"
      );
      set({ promptMode: true });
      set({ promptInstructions: exercise.attributes.prompt_requirements });
      set({ learnpackPurposeId: 38 });
    }

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

    const readme = replaceSlot(exercise.body, "{{publicUrl}}", HOST);

    set({ currentContent: readme });
    set({ currentReadme: readme });

    getConfigObject();
    fetchSingleExerciseInfo(currentExercisePosition);
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
      toast.error(
        "You are in incremental mode! Pass the tests for this exercise to continue with the next one!"
      );
      return;
    }
    setPosition(Number(desiredPosition));
  },

  toastFromStatus: (status) => {
    const [icon, message] = getStatus(status);
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
    const { setBuildButtonText, compilerSocket, getCurrentExercise } = get();
    setBuildButtonText(buildText, "");
    const [icon, message] = getStatus("compiling");
    toast.success(message, { icon: icon });

    const data = {
      exerciseSlug: getCurrentExercise().slug,
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
    } = get();

    const data = {
      exerciseSlug: getCurrentExercise().slug,
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

  // Turn the following property to true to easily test things using a button in the navbar
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
    const { openTerminal } = get();
    // disconnected();

    openTerminal();
  },
}));

export default useStore;
