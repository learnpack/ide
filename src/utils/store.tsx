// @ts-nocheck
import io from 'socket.io-client'
import { create } from 'zustand';
import { convertMarkdownToHTML, changeSidebarVisibility, getExercise, getFileContent, startChat, disconnected, getHost, getParamsObject } from './lib';
import Socket from './socket';
import { IStore } from './storeTypes';
import toast from 'react-hot-toast';

import { DEV_MODE } from './lib';

const HOST = getHost();
Socket.start(HOST, disconnected);

const FASTAPI_HOST = "https://chat.4geeks.com";
// const FASTAPI_HOST = "http://localhost:8000";
const chatSocket = io(`${FASTAPI_HOST}`);

chatSocket.on('connect', () => {
  // console.log("connected to chat socket in ", FASTAPI_HOST);
});

const defaultParams = getParamsObject()
const useStore = create<IStore>((set, get) => ({
  language: defaultParams.language || "us",
  languageMap: {
    "us": "en",
    "es": "sp"
  },
  // Could be cool if we can choose the mentor, give each mentor a personality

  learnpackPurposeId: defaultParams.purpose || 26,
  exercises: [],
  currentContent: "",
  chatSocket: chatSocket,
  currentExercisePosition: defaultParams.currentExercise || 0,
  chatInitialMessage: "Hello! I'm the Learnpack tutor, I can help you if you feel stuck, ask me anything about this exercise!",
  conversationIdsCache: {},
  lessonTitle: "",
  numberOfExercises: 0,
  solvedExercises: 0,
  status: "",
  feedback: "",
  showFeedback: false,
  token: "",
  buildbuttonText: {
    text: "Run",
    className: ""
  },
  feedbackbuttonProps: {
    text: "Feedback",
    className: ""
  },
  configObject: {
    config: {
      intro: "",
      grading: "",
      editor: {
        agent: "",
      }

    }
  },
  videoTutorial: "",
  allowedActions: [],
  compilerSocket: Socket.createScope('compiler'),
  showVideoTutorial: false,
  showChatModal: false,
  exerciseMessages: {},
  host: HOST,
  openedModals: {
    chat: false,
    login: false,
    video: false,
    reset: false,
  },

  // setters
  start: () => {
    const { fetchExercises, fetchReadme, checkParams, startConversation, token, checkLoggedStatus, currentExercisePosition } = get();
    fetchExercises()
      .then(() => {
        return checkParams({ justReturn: false })
      })
      .then((params) => {
        if (Object.keys(params).length === 0) {
          fetchReadme()
        }
      })
      .then(() => {
        checkLoggedStatus({ startConversation: true });
      })
  },

  getCurrentExercise: () => {
    const { exercises, currentExercisePosition } = get();
    return exercises[currentExercisePosition];
  },

  setExerciseMessages: (messages, position) => {
    set({ exerciseMessages: { ...get().exerciseMessages, [position]: messages } })
  },

  setShowChatModal: (show: boolean) => {
    set({ showChatModal: show });
  },

  setShowVideoTutorial: (show: boolean) => {
    set({ showVideoTutorial: show });
  },
  setAllowedActions: (actions) => {
    set({ allowedActions: actions });
  },

  // functions
  setBuildButtonText: (t, c = "") => {
    set({ buildbuttonText: { text: t, className: c } })
  },

  setFeedbackButtonProps: (t, c = "") => {
    set({ feedbackbuttonProps: { text: t, className: c } })
  },

  setOpenedModals: (modals) => {
    const { openedModals } = get();
    set({ openedModals: { ...openedModals, ...modals } })
  },

  setToken: (newToken) => {
    set({ token: newToken });
  },
  checkLoggedStatus: async (opts) => {
    const { startConversation, currentExercisePosition } = get();
    try {
      const res = await fetch(`${HOST}/check/rigo/status`)
      const json = await res.json();
      set({ token: json.rigoToken })

      if (opts.startConversation) {
        startConversation(currentExercisePosition);
      }
    }
    catch (err) {
      set({ token: "" })
      console.log("error in checkLoggedStatus", err);

    }
  },
  getContextFilesContent: async () => {
    const { exercises, currentExercisePosition, currentReadme, isBuildable, isTesteable, configObject } = get();

    const slug = exercises[currentExercisePosition].slug;
    let mode = configObject.config.grading;
    let extractor = (file) => !file.hidden

    if (mode == "incremental" && isTesteable) {
      extractor = (file) => file
    }

    let notHiddenFiles = exercises[currentExercisePosition].files.filter(extractor);

    let filePromises = notHiddenFiles.map(async (file) => {
      let fileContent = await getFileContent(slug, file.name);

      if (file.name.includes("test") || file.name.includes("tests")) {
        return `The following is a test file that includes some tests that the students needs to pass in order to continue with the exercises: \n---\n${fileContent}\n---`
      }

      return `File: ${file.name}\nContent: \`${fileContent}\``;
    });

    return Promise.all(filePromises).then((filesContext) => {
      let context = "The following is the student's code file(s) and t: \n---"

      if (isTesteable) context = "The following is the student's code file(s) and tests files to pass: \n---"

      context += filesContext.join('\n');
      context += "---";
      context += `This is the current exercise instructions, use this to guide the student in the right direction:
      ---
      ${currentReadme}
      ---`;

      return context;
    });
  },

  getConfigObject: async () => {
    if (!HOST) {
      return;
    }
    try {
      const res = await fetch(`${HOST}/config`)
      const config = await res.json();
      set({ configObject: config })
    }
    catch (err) {
      console.log("error in getConfigObject", err);

      const modal: HTMLElement | null = document.querySelector("#socket-disconnected");

      if (modal && modal.style) {
        modal.style.display = "block";
      }
    }
  },

  fetchExercises: async () => {
    const { getLessonTitle, fetchReadme } = get();

    try {
      const res = await fetch(`${HOST}/config`)
      const config = await res.json();

      set({ exercises: config.exercises });
      set({ numberOfExercises: config.exercises.length })
      set({ lessonTitle: config.config.title.us })
    }
    catch (err) {
      const modal: HTMLElement | null = document.querySelector("#socket-disconnected");

      if (modal && modal.style) {
        modal.style.display = "block";
      }
    }

  },
  checkParams: ({ justReturn }) => {
    const { setLanguage, setPosition, currentExercisePosition, language } = get();

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
      setPosition(Number(position))
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

    let isTesteable = false;
    let isBuildable = false;

    exercise.files.forEach((file) => {
      if (file.name.includes("tests") || file.name.includes("test")) {
        isTesteable = true;
      }
      if (file.name.includes("app")) {
        isBuildable = true;
      }
    });


    set({ isTesteable: isTesteable, isBuildable: isBuildable })


  },

  setPosition: (newPosition) => {
    const { fetchSingleExerciseInfo, startConversation, fetchReadme, token, setBuildButtonText, setFeedbackButtonProps, checkParams } = get();

    let params = checkParams({ justReturn: true })

    let hash = `currentExercise=${newPosition}${params.language ? "&language=" + params.language : ""}`

    window.location.hash = hash;

    set({ currentExercisePosition: newPosition });

    if (token) {
      startConversation(newPosition);
    }
    setBuildButtonText("Run", "");
    setFeedbackButtonProps("Feedback", "");

    fetchReadme()
    fetchSingleExerciseInfo(newPosition);
  },
  startConversation: async (exercisePosition) => {
    const { token, learnpackPurposeId, conversationIdsCache } = get();

    let conversationId = null;
    let initialData = null;

    if (!token) {
      return;
    }

    try {
      conversationId = conversationIdsCache[exercisePosition]
      if (!conversationId) {
        throw new Error("ConversationID not found in cache");
      }
    }
    catch (err) {
      initialData = await startChat(learnpackPurposeId, token);
      conversationId = initialData.conversation_id;
    }

    if (initialData && initialData.salute) {
      set({ chatInitialMessage: initialData.salute })
    }

    set({ conversationIdsCache: { ...conversationIdsCache, [exercisePosition]: conversationId } })

    chatSocket.emit("start", {
      token: token,
      purpose: learnpackPurposeId,
      conversationId: conversationId
    })

  },

  loginToRigo: async (loginInfo) => {
    const { host, setToken, startConversation, currentExercisePosition, setOpenedModals } = get();

    const config = {
      method: "post",
      body: JSON.stringify(loginInfo),
      headers: {
        "Content-Type": "application/json" // Set the content type to JSON
      }
    }

    try {
      const res = await fetch(host + "/login", config);
      const json = await res.json();
      const token = json.rigobot.key;
      setToken(token);
      toast.success("Successfully logged in");
    }
    catch (error) {
      toast.error(String(error));
    }

    startConversation(currentExercisePosition)

    setOpenedModals({ login: false, chat: true  })

  },
  fetchReadme: async () => {
    const { language, exercises, currentExercisePosition, getConfigObject, setShowVideoTutorial, fetchSingleExerciseInfo } = get();

    const slug = exercises[currentExercisePosition]?.slug;
    if (!slug) {
      return;
    }

    const response = await fetch(`${HOST}/exercise/${slug}/readme?lang=${language}`);
    const exercise = await response.json();

    if (exercise.attributes.tutorial) {
      set({ videoTutorial: exercise.attributes.tutorial })
    }
    else if (exercise.attributes.intro) {
      set({ videoTutorial: exercise.attributes.intro, showVideoTutorial: true })
    }
    else {
      set({ videoTutorial: "" })
      setShowVideoTutorial(false);
    }

    set({ currentContent: exercise.body })
    set({ currentReadme: exercise.body })

    getConfigObject();
    fetchSingleExerciseInfo()
  },

  toggleSidebar: () => {
    changeSidebarVisibility()
  },

  setLanguage: (language, fetchExercise = true) => {
    const { fetchReadme, checkParams } = get();
    set({ language: language });

    let params = checkParams({ justReturn: true })
    let hash = `language=${language}${params.currentExercise ? "&currentExercise=" + params.currentExercise : ""}`
    window.location.hash = hash;

    if (fetchExercise) {
      fetchReadme();
    }
  },

  handlePositionChange: async (desiredPosition) => {
    const { configObject, currentExercisePosition, exercises, setPosition, isTesteable } = get();

    const gradingMode = configObject.config.grading
    const lastExercise = exercises.length - 1;

    if (desiredPosition > lastExercise || desiredPosition < 0) {
      toast.error("The exercise you are looking for does not exist!");
      return
    }

    if (desiredPosition == currentExercisePosition) {
      return
    }

    let letPass = true;

    if (desiredPosition > currentExercisePosition) {
      letPass = !isTesteable || gradingMode === "isolated" || (gradingMode === "incremental" && exercises[currentExercisePosition].done);
    }

    if (!letPass) {
      toast.error("You are in incremental mode! Pass the tests for this exercise to continue with the next one!")
      return
    }

    setPosition(Number(desiredPosition));
  },


  // Turn the following property to true to easily test things using a button in the navbar
  displayTestButton: DEV_MODE,
  test: async () => {
    toast.success("Test button pressed!")
  }

})
);

export default useStore;