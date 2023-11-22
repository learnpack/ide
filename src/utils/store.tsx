// The store is responsible for managing the state of the application
// This store was created with Zustand

import { create } from 'zustand';
import { convertMarkdownToHTML, changeSidebarVisibility, getRigobotFeedback } from './lib';
import Socket from './socket';
import { getHost } from './lib';

const HOST = getHost();

Socket.start(HOST, disconnected);
    
function disconnected() {
  const modal:HTMLElement|null = document.querySelector("#socket-disconnected");

  if (modal) {
    modal.style.display = "block";
  }
}

interface IBuildProps {
  text: string;
  className: string;
}


interface ILanguageMap {
    [key: string]: string;
}

interface IConfig {
  intro: any;
  editor: any;
  grading: string;
}

interface IConfigObject {
  config: IConfig
}


interface IStore {
  exercises: any[];
  currentContent: string;
  currentExercisePosition: number;
  language: string;
  status: string;
  lessonTitle: string;
  numberOfExercises: number;
  feedback: string;
  showFeedback: boolean;
  buildbuttonText: IBuildProps;
  feedbackbuttonProps: IBuildProps;
  compilerSocket: any;
  token: string;
  solvedExercises: number;
  languageMap: ILanguageMap;
  configObject: IConfigObject;
  allowedActions: string[];
  videoTutorial: string;
  showVideoTutorial: boolean;

  setShowVideoTutorial: (show:boolean) => void;
  setAllowedActions: (actions:string[])=> void;
  getConfigObject: () => void;
  increaseSolvedExercises: () => void;
  setLanguage: (language: string) => void;
  checkLoggedStatus: () => void;
  storeFeedback: (feedback:string) => void;
  setToken: (newToken: string) => void;
  setBuildButtonText: (t:string, c:string) => void;
  setFeedbackButtonProps: (t:string, c:string) => void;
  toggleFeedback: ()=>void;
  fetchExercises: () => void;
  setStatus: (newStatus:string) => void;
  getLessonTitle: () => void;
  setPosition: (position: number, showVideo: boolean) => void;
  fetchReadme: () => void;
  toggleSidebar: () => void;
  toggleLanguage: () => void;
  getAIFeedback: () => void;
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
      intro:"",
      grading: "",
      editor: {
        agent: "",
      }
      
    }
  },
  videoTutorial: "",
  allowedActions: [],

  showVideoTutorial: true,

  setShowVideoTutorial: (show:boolean) => {
    set({showVideoTutorial: show});
  },
  setAllowedActions:(actions)=>{
    set({allowedActions: actions});
  },
  // functions
  increaseSolvedExercises: () => {
    const {solvedExercises} = get();
    set({solvedExercises:solvedExercises+1 });

  },
  setBuildButtonText: (t, c="") => {
    set({buildbuttonText: {text: t, className: c}})
  },
  setFeedbackButtonProps: (t, c="") => {
    set({feedbackbuttonProps: {text: t, className: c}})
  },
  toggleFeedback: () => {
    const {showFeedback} = get();
    set({showFeedback: !showFeedback})
  },
  setStatus: (newStatus) => {
    set({status: newStatus});
    setTimeout(()=>{
      set({status: ""});
    },5000)
  },
  setToken: (newToken) => {
    set({token: newToken});
  },
  checkLoggedStatus:async () => {
    try {
      const res = await fetch(`${HOST}/check/rigo/status`)
      const json = await res.json();
      set({token: json.rigoToken})

    }
    catch (err) {
      set({token:""})
    }
  },

  getConfigObject: async () => {
    const res = await fetch(`${HOST}/config`)
    const config= await res.json();
    set({configObject: config})
  },

  fetchExercises: async () => {
    const { fetchReadme, getLessonTitle } = get();
    const res = await fetch(`${HOST}/config`)
    const config = await res.json();
    set({ exercises: config.exercises });
    set({numberOfExercises: config.exercises.length})
    fetchReadme();
    getLessonTitle();

  },
  storeFeedback: (feedback) => {
    const {toggleFeedback} = get();
    const htmlFeedback = convertMarkdownToHTML(feedback);
    set({feedback: htmlFeedback})
    toggleFeedback();

  },
  getAIFeedback: async () => {
    const {currentExercisePosition, exercises, currentContent, toggleFeedback, token} = get();

    const slug = exercises[currentExercisePosition].slug;
    let entryPoint = exercises[currentExercisePosition].entry.split("/")[1]

    const response = await fetch(`${HOST}/exercise/${slug}/file/${entryPoint}`);
    let currentCode;

    // Check if the content type is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      currentCode =  await response.json();
    } else {
      // Handle non-JSON responses, like reading as text
      currentCode = await response.text();
    }
    // console.log("currentContent", currentContent);
    // console.log("currentCode", currentCode);
    
    const feedback = await getRigobotFeedback(currentContent, currentCode, token)
    const htmlFeedback = convertMarkdownToHTML(feedback);
    set({feedback: htmlFeedback})
    toggleFeedback();
  },

  getLessonTitle: async () => {
    const res = await fetch(`${HOST}/config`);
    const {config} = await res.json();
    set({ lessonTitle: config.title });
  },

  setPosition: (newPosition, showVideo) => {
    const { fetchReadme } = get();
    let params = window.location.hash.substring(1);
    let paramsArray = params.split('&');
    let language = "";
    if (paramsArray.length >1 ) {
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
    set({ currentExercisePosition: newPosition });

},

  fetchReadme: async () => {
    const { language, exercises, currentExercisePosition, getConfigObject } = get();
    const slug = await exercises[currentExercisePosition]?.slug;
    if (!slug) {
      return;
    }
    
    const response = await fetch(`${HOST}/exercise/${slug}/readme?lang=${language}`);
    const exercise = await response.json();
    if (exercise.attributes.tutorial) {
      set({videoTutorial: exercise.attributes.tutorial})
      set({showVideoTutorial: true})
    }
    else {
      set({videoTutorial: ""})
    }
    
    set({ currentContent: convertMarkdownToHTML(exercise.body) })
    getConfigObject();
  },

  toggleSidebar: () => {
    changeSidebarVisibility()
  },

  setLanguage: (language) => {
    const { fetchReadme } = get();
    set({ language: language});

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

  compilerSocket: Socket.createScope('compiler'),

})
);

export default useStore;