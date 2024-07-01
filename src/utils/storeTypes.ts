
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
    extraClass?: string
    type: string
    text: string
}

interface IExerciseMessages {
    [key: number]: IMessage[]

}

export type TExercise = {
    path: any
    files: any
    slug: string
    translations: object
    done: boolean
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
type TTestStatus = "successful" | "failed" | ""

type TTestResult = {
    status: TTestStatus
    logs: string
}
type TTranslations = {
    testButtonSuccess: string
    testButtonFailed: string
    testButtonRunning: string
}
export interface IStore {
    showTutorial: any
    exercises: any[]
    chatInitialMessage: string
    currentContent: string
    currentReadme: string
    currentExercisePosition: number
    language: string
    learnpackPurposeId: number
    status: string
    dialogData: any //TODO: add type
    lessonTitle: string
    numberOfExercises: number
    showFeedback: boolean
    buildbuttonText: IBuildProps
    feedbackbuttonProps: IBuildProps
    compilerSocket: any
    user_id: number | null
    token: string
    bc_token: string
    solvedExercises: number
    languageMap: ILanguageMap
    configObject: IConfigObject
    allowedActions: string[]
    videoTutorial: string
    showVideoTutorial: boolean
    exerciseMessages: IExerciseMessages
    host: string
    isTesteable: boolean
    isBuildable: boolean
    hasSolution: boolean
    currentSolution: string
    chatSocket: any
    conversationIdsCache: TNumberCache
    openedModals: TOpenedModals
    lastTestResult: TTestResult
    translations: TTranslations
    shouldBeTested: boolean
    promptMode: boolean
    promptInstructions: string
    targetButtonForFeedback: "build" | "feedback"
    start: () => void
    setListeners: ()=>void
    checkRigobotInvitation: () => void
    clearBcToken: () => void
    openLink: (url: string) => void
    setTestResult: (status: TTestStatus, logs: string) => void
    checkParams: (opts: TCheckParamsOptions) => void
    handlePositionChange: (desiredPosition: number) => void
    setOpenedModals: (modals: Partial<TOpenedModals>) => void
    startConversation: (exercisePosition:number)=> void
    getContextFilesContent: () => Promise<string>
    loginToRigo: (loginInfo: TLoginInfo) => Promise<void | false>
    getCurrentExercise: () => TExercise
    setExerciseMessages: (messages: IMessage[], position: number) => void
    setShowVideoTutorial: (show: boolean) => void
    setAllowedActions: (actions: string[]) => void
    getConfigObject: () => void
    setLanguage: (language: string, fetchExercise?: boolean) => void
    checkLoggedStatus: (opts?: TCheckLoggedStatusOptions) => void
    setToken: (newToken: string) => void
    setBuildButtonText: (t: string, c: string) => void
    setFeedbackButtonProps: (t: string, c: string) => void
    fetchSingleExerciseInfo: (index: number) => TExercise
    toggleFeedback: () => void
    fetchExercises: () => void
    getLessonTitle: () => void
    build: (buildText: string) => void
    setPosition: (position: number) => void
    fetchReadme: () => void
    toggleSidebar: () => void
    toastFromStatus: (status:string) => void
    setShouldBeTested: (value: boolean) => void
    openTerminal: () => void
    runExerciseTests: (opts?: TRunExerciseTestsOptions) => void
    registerAIInteraction: (setPosition: number, interaction: object) => void
    displayTestButton: boolean
    test: () => void
}

type TRunExerciseTestsOptions = {
    toast: boolean
    setFeedbackButton: boolean
    feedbackButtonText: string
    targetButton: "build" | "feedback"
}