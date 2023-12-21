// @ts-nocheck
import io from 'socket.io-client'
import { create } from 'zustand';
import { convertMarkdownToHTML, changeSidebarVisibility, getExercise, getFileContent, startChat, disconnected, getHost, getParamsObject } from './lib';
import Socket from './socket';
import { IStore } from './storeTypes';


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
  chatInitialMessage: "## Hello! How can I help you?",
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

  // setters
  start: () => {
    const { fetchExercises, fetchReadme, checkParams } = get();
    fetchExercises()
      .then(() => {
        checkParams({ justReturn: false })
      })
      .then(() => {
        fetchReadme()
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

  setToken: (newToken) => {
    set({ token: newToken });
  },
  checkLoggedStatus: async () => {
    try {
      const res = await fetch(`${HOST}/check/rigo/status`)
      const json = await res.json();
      set({ token: json.rigoToken })

    }
    catch (err) {
      set({ token: "" })
    }
  },
  getContextFilesContent: async () => {
    const { exercises, currentExercisePosition, currentReadme } = get();

    const slug = exercises[currentExercisePosition].slug;

    let notHiddenFiles = exercises[currentExercisePosition].files.filter((file) => !file.hidden);

    let filePromises = notHiddenFiles.map(async (file) => {
      let fileContent = await getFileContent(slug, file.name);
      return `File: ${file.name}\nContent: \`${fileContent}\``;
    });

    return Promise.all(filePromises).then((filesContext) => {
      let context = "The following is the student code file(s): \n---"
      context += filesContext.join('\n');
      context += "---";
      context += `This is the current exercise instructions that the student needs to make:
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
    let isChatable = true;
    let isBuildable = exercise.language === null ? false : true;

    exercise.files.forEach((file) => {
      if (file.name.includes("tests") || file.name.includes("test")) {
        isTesteable = true;
      }
      return !file.hidden
    });

    set({ isTesteable: isTesteable, isBuildable: isBuildable })


  },

  setPosition: async (newPosition) => {
    const { fetchSingleExerciseInfo, startConversation, fetchReadme, token } = get();

    let params = get().checkParams({ justReturn: true })
    
    let hash = `currentExercise=${newPosition}${params.language ? "&language="+params.language : ""}`

    window.location.hash = hash;

    set({ currentExercisePosition: newPosition });


    if (token) {
      startConversation(newPosition);
    }

    fetchReadme()
    fetchSingleExerciseInfo(newPosition);
  },
  startConversation: async (exercisePosition) => {
    const { token, learnpackPurposeId, conversationIdsCache } = get();

    let conversationId = null;
    let initialData = null;

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

  fetchReadme: async () => {
    const { language, exercises, currentExercisePosition, getConfigObject, setShowVideoTutorial, fetchSingleExerciseInfo } = get();

    const slug = exercises[currentExercisePosition]?.slug;
    if (!slug) {
      return;
    }

    const response = await fetch(`${HOST}/exercise/${slug}/readme?lang=${language}`);
    const exercise = await response.json();

    // console.log("exercise.attributes", exercise.attributes);

    if (exercise.attributes.tutorial) {
      set({ videoTutorial: exercise.attributes.tutorial })
    }
    else if (exercise.attributes.intro) {
      set({ videoTutorial: exercise.attributes.tutorial })
      set({ showVideoTutorial: true })
    }
    else {
      set({ videoTutorial: "" })
      setShowVideoTutorial(false);
    }

    set({ currentContent: convertMarkdownToHTML(exercise.body) })
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
    let hash = `language=${language}${params.currentExercise ? "&currentExercise="+params.currentExercise: ""}`
    window.location.hash = hash;

    if (fetchExercise) {
      fetchReadme();
    }
  },

})
);

export default useStore;