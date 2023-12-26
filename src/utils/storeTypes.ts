
interface IBuildProps {
    text: string
    className: string
}


interface ILanguageMap {
    [key: string]: string
}

type TTitle = {
    [key: string]: string

}

interface IConfig {
    title: TTitle
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
    translations: object
}


export type TNumberCache = {
    [key: number]: number
}


type TCheckParamsOptions = {
    justReturn: boolean 
}

type TOpenedModals = {
    [key: string]: boolean

}

type TCheckLoggedStatusOptions = {
    startConversation: boolean
}

type TLoginInfo = {
    email: string
    password: string
}


export interface IStore {
    exercises: any[]
    chatInitialMessage: string
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
    openedModals: TOpenedModals

    start: () => void
    checkParams: (opts: TCheckParamsOptions) => void
    handlePositionChange: (desiredPosition: number) => void
    setOpenedModals: (modals: Partial<TOpenedModals>) => void
    startConversation: (exercisePosition:number)=> void
    getContextFilesContent: () => Promise<string>
    loginToRigo: (loginInfo: TLoginInfo) => void
    getCurrentExercise: () => TExercise
    setExerciseMessages: (messages: IMessage[], position: number) => void
    setShowChatModal: (show: boolean) => void
    setShowVideoTutorial: (show: boolean) => void
    setAllowedActions: (actions: string[]) => void
    getConfigObject: () => void
    setLanguage: (language: string, fetchExercise?: boolean) => void
    checkLoggedStatus: (opts?: TCheckLoggedStatusOptions) => void
    setToken: (newToken: string) => void
    setBuildButtonText: (t: string, c: string) => void
    setFeedbackButtonProps: (t: string, c: string) => void
    fetchSingleExerciseInfo: (index: number) => void
    toggleFeedback: () => void
    fetchExercises: () => void
    getLessonTitle: () => void
    setPosition: (position: number) => void
    fetchReadme: () => void
    toggleSidebar: () => void
    displayTestButton: boolean
    test: () => void
}