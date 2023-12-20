// @ts-nocheck
import io from 'socket.io-client'
import { create } from 'zustand';
import { convertMarkdownToHTML, changeSidebarVisibility, getExercise, getFileContent } from './lib';
import Socket from './socket';
import { getHost } from './lib';
import { IStore } from './storeTypes';

const HOST = getHost();
Socket.start(HOST, disconnected);

const FASTAPI_HOST = "http://localhost:8000";

// const chatSocket = io(`${FASTAPI_HOST}`)

// chatSocket.on("connect", () => {
//   console.log("We are fucking connected to the chatSocket: ", chatSocket.connected, "in: ", FASTAPI_HOST); // true

// });

function disconnected() {
  const modal: HTMLElement | null = document.querySelector("#socket-disconnected");

  if (modal) {
    modal.style.display = "block";
  }
}

const useStore = create<IStore>((set, get) => ({
  language: 'us',
  languageMap: {
    "us": "ENG",
    "es": "SPA"
  },
  exercises: [],
  currentContent: "",
  currentExercisePosition: 0,
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
  // chatSocket: chatSocket,
  compilerSocket: Socket.createScope('compiler'),
  showVideoTutorial: false,
  showChatModal: false,
  exerciseMessages: {},
  host: HOST,
  // setters
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
  increaseSolvedExercises: () => {
    const { solvedExercises } = get();
    set({ solvedExercises: solvedExercises + 1 });

  },
  setBuildButtonText: (t, c = "") => {
    set({ buildbuttonText: { text: t, className: c } })
  },
  setFeedbackButtonProps: (t, c = "") => {
    set({ feedbackbuttonProps: { text: t, className: c } })
  },
  toggleFeedback: () => {
    const { showFeedback } = get();
    set({ showFeedback: !showFeedback })
  },
  setStatus: (newStatus) => {
    set({ status: newStatus });
    setTimeout(() => {
      set({ status: "" });
    }, 5000)
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
    const { exercises, currentExercisePosition } = get();
    const slug = exercises[currentExercisePosition].slug;

    let notHiddenFiles = exercises[currentExercisePosition].files.filter((file) => !file.hidden);

    let filePromises = notHiddenFiles.map(async (file) => {
      let fileContent = await getFileContent(slug, file.name);
      return `File: ${file.name}\nContent: \`${fileContent}\``;
    });

    Promise.all(filePromises).then((filesContext) => {
      let context = filesContext.join('\n---\n');
      console.log(context);
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
      const modal: HTMLElement | null = document.querySelector("#socket-disconnected");

      if (modal && modal.style) {
        modal.style.display = "block";
      }
    }
  },

  fetchExercises: async () => {
    const { fetchReadme, getLessonTitle } = get();

    try {
      const res = await fetch(`${HOST}/config`)
      const config = await res.json();
      set({ exercises: config.exercises });
      set({ numberOfExercises: config.exercises.length })
      fetchReadme();
      getLessonTitle();
    }
    catch (err) {
      const modal: HTMLElement | null = document.querySelector("#socket-disconnected");

      if (modal && modal.style) {
        modal.style.display = "block";
      }
    }

  },
  storeFeedback: (feedback) => {
    const { toggleFeedback } = get();
    const htmlFeedback = convertMarkdownToHTML(feedback);
    set({ feedback: htmlFeedback })
    toggleFeedback();

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

  getLessonTitle: async () => {
    const res = await fetch(`${HOST}/config`);
    const { config } = await res.json();
    set({ lessonTitle: config.title });
  },

  setPosition: (newPosition) => {
    const { fetchSingleExerciseInfo: fetchSingleExercise } = get();

    let params = window.location.hash.substring(1);
    let paramsArray = params.split('&');
    let language = "";
    if (paramsArray.length > 1) {
      // get the index of the item that includes "language"
      const langIndex = paramsArray.findIndex(item => item.includes("language"));
      // retrieve the item and save it in a variable
      language = paramsArray[langIndex]
    }
    let hash = `currentExercise=${newPosition}`
    if (language) {
      hash += `&${language}`
    }
    window.location.hash = hash;
    fetchSingleExercise(newPosition);

    set({ currentExercisePosition: newPosition });

  },

  fetchReadme: async () => {
    const { language, exercises, currentExercisePosition, getConfigObject, setShowVideoTutorial } = get();
    const slug = await exercises[currentExercisePosition]?.slug;
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
    getConfigObject();
  },

  toggleSidebar: () => {
    changeSidebarVisibility()
  },

  setLanguage: (language) => {
    const { fetchReadme } = get();
    set({ language: language });

    let params = window.location.hash.substring(1);
    let paramsArray = params.split('&');
    let position = "";
    // console.log(paramsArray);

    if (paramsArray) {
      // get the index of the item that includes "language"
      const posIndex = paramsArray.findIndex(item => item.includes("currentExercise"));
      // retrieve the item and save it in a variable
      position = paramsArray[posIndex]
    }
    let hash = `language=${language}`
    if (position) {
      hash += `&${position}`
    }
    window.location.hash = hash;

    fetchReadme();
  },

  toggleLanguage: () => {
    const { language, fetchReadme } = get();
    const newLang = language === 'us' ? 'es' : 'us';
    set({ language: newLang });


    let params = window.location.hash.substring(1);
    let paramsArray = params.split('&');
    let position = "";

    if (paramsArray) {
      // get the index of the item that includes "language"
      const posIndex = paramsArray.findIndex(item => item.includes("currentExercise"));
      // retrieve the item and save it in a variable
      position = paramsArray[posIndex]
    }
    let hash = `language=${newLang}`
    if (position) {
      hash += `&${position}`
    }
    window.location.hash = hash;
    fetchReadme();
  },


})
);

export default useStore;