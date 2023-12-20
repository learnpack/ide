
interface IBuildProps {
    text: string
    className: string
}


interface ILanguageMap {
    [key: string]: string
}

interface IConfig {
    intro: any
    editor: any
    grading: string
}

interface IConfigObject {
    config: IConfig
}

type IMessage = {
    type: string
    text: string
}

interface IExerciseMessages {
    [key: number]: IMessage[]

}

export type TExercise = {
    slug: string
}


export type TNumberCache = {
    [key: number]: number
}


export interface IStore {
    exercises: any[]
    currentContent: string
    currentReadme: string
    currentExercisePosition: number
    language: string
    learnpackPurposeId: number
    status: string
    lessonTitle: string
    numberOfExercises: number
    feedback: string
    showFeedback: boolean
    buildbuttonText: IBuildProps
    feedbackbuttonProps: IBuildProps
    compilerSocket: any
    token: string
    solvedExercises: number
    languageMap: ILanguageMap
    configObject: IConfigObject
    allowedActions: string[]
    videoTutorial: string
    showVideoTutorial: boolean
    showChatModal: boolean
    exerciseMessages: IExerciseMessages
    host: string
    isTesteable: boolean
    isBuildable: boolean
    chatSocket: any
    conversationIdsCache: TNumberCache
    getContextFilesContent: () => string
    getCurrentExercise: () => TExercise
    setExerciseMessages: (messages: IMessage[], position: number) => void
    setShowChatModal: (show: boolean) => void
    setShowVideoTutorial: (show: boolean) => void
    setAllowedActions: (actions: string[]) => void
    getConfigObject: () => void
    increaseSolvedExercises: () => void
    setLanguage: (language: string) => void
    checkLoggedStatus: () => void
    storeFeedback: (feedback: string) => void
    setToken: (newToken: string) => void
    setBuildButtonText: (t: string, c: string) => void
    setFeedbackButtonProps: (t: string, c: string) => void
    fetchSingleExerciseInfo: (index: number) => void
    toggleFeedback: () => void
    fetchExercises: () => void
    setStatus: (newStatus: string) => void
    getLessonTitle: () => void
    setPosition: (position: number) => void
    fetchReadme: () => void
    toggleSidebar: () => void
    toggleLanguage: () => void
}