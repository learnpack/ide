
import SimpleButton from "./Button";
import { svgs } from "../../resources/svgs";
import useStore from "../../utils/store";
import { useState, useEffect } from "react";
import { getStatus } from "../../utils/socket";
import { toast } from 'react-hot-toast';


export default function FeedbackButton() {
    const [showFeedback, setShowFeedback] = useState(false);

    const { feedbackbuttonProps }= useStore();
    const {checkLoggedStatus}=useStore();
    const toggleFeedback = () => {
        setShowFeedback((prev) => !prev);
    }

    useEffect(()=>{
        checkLoggedStatus()
    },[])

    return (<div className="pos-relative feedback-dropdown-container">
        <SimpleButton text={feedbackbuttonProps.text} svg={svgs.feedbackIcon} extraClass={`pill border-blue color-blue row-reverse ${feedbackbuttonProps.className}`} action={toggleFeedback} />
        {showFeedback && <FeedbackDropdown toggleFeedbackVisibility={toggleFeedback} />}
    </div>
    )
}

interface IFeedbackDropdown {
    toggleFeedbackVisibility: () => void;
}

function FeedbackDropdown({ toggleFeedbackVisibility }: IFeedbackDropdown) {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { storeFeedback, feedback, toggleFeedback, currentExercisePosition, exercises, compilerSocket, token, setFeedbackButtonProps, increaseSolvedExercises, fetchExercises, configObject,allowedActions, videoTutorial, setShowVideoTutorial, setShowChatModal, showChatModal } = useStore();


    const getFeedbackAndHide = () => {

        toast.success("Thinking...");
        setFeedbackButtonProps("Running...", "palpitate");
        toggleFeedbackVisibility();

        const data = {
            exerciseSlug: exercises[currentExercisePosition].slug,
            entryPoint: exercises[currentExercisePosition].entry.split("/")[1]
          }

        compilerSocket.emit("generate", data);

        compilerSocket.onStatus('compiler-success', (data:any) => {
            toast.success(getStatus("compiler-success"));
            
            storeFeedback(data.logs[0]);
            setFeedbackButtonProps("Feedback", "");
          })
     
        setTimeout(() => {
            toast.success("Wait a little more")
        }, 2432)
    }

    const toggleAndHide = () => {
        toggleFeedbackVisibility();
        toggleFeedback();
    }

    const runTests = () => {
        toggleFeedbackVisibility();
        setFeedbackButtonProps("Running...", "palpitate");
        toast.success(getStatus("testing"));

        const data = {
            exerciseSlug: exercises[currentExercisePosition].slug
        }

        compilerSocket.emit('test', data);

        let debounceSuccess = debounce(()=>{
            toast.success(getStatus("testing-success"));
            setFeedbackButtonProps("Succeded", "bg-success text-white");
            // exercises[currentExercisePosition].done = true;
            fetchExercises();
            increaseSolvedExercises();
        }, 100)

        compilerSocket.onStatus('testing-success',debounceSuccess);

        function debounce(func: any, wait: any) {
            let timeout: any;
            return function executedFunction(...args: any[]) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };

        let debouncedFunc = debounce((data: any) => {
            //   console.log(data);
            data;
            //   setBuildButtonText("Try again", "bg-fail");
            toast.error(getStatus("compiler-error"));
            setFeedbackButtonProps("Try again", "bg-fail text-white");
        }, 100);

        compilerSocket.onStatus('testing-error', debouncedFunc);

        compilerSocket.whenUpdated((scope: any, data: any) => {
            console.log(data);
            console.log(scope);
        });
    }

    const openLoginModal = () => {
        setShowLoginModal(true);
        // toggleFeedbackVisibility();
    }
    
    const openWindow = (e:any) => {
        e.preventDefault();
        const url = e.target.href

        if (configObject.config.editor.agent == "vscode") {
            const data = {
                url,
                exerciseSlug: exercises[currentExercisePosition].slug,
            }
            compilerSocket.openWindow(data);

        }

        else if (configObject.config.editor.agent == "standalone") {
            window.location.href = url
        }
        

    }
    
    const redirectToVideo = () => {
        setShowVideoTutorial(true);
        toggleFeedbackVisibility();
        
    }

    const showChat = () => {
        setShowChatModal(true);
        toggleFeedbackVisibility();
    }


    return (
        <div className="feedback-dropdown">
            {showLoginModal && <LoginModal toggleFeedbackVisibility={toggleFeedbackVisibility} />}
            {allowedActions.includes("test") ? <SimpleButton svg={svgs.testIcon} text="Run tests" action={runTests} /> : null}
            {/* {Boolean(token) ? <SimpleButton svg={svgs.brainIcon} text="Get AI Feedback" action={getFeedbackAndHide} /> : <SimpleButton svg={svgs.fourGeeksIcon} text="Login to use AI feedback" action={openLoginModal} />} */}
            {Boolean(token) ? <SimpleButton text="Open AI chat" svg={svgs.brainIcon} action={showChat} /> : <SimpleButton svg={svgs.fourGeeksIcon} text="Login to use AI feedback" action={openLoginModal} />}
            {feedback ? <SimpleButton action={toggleAndHide} text="Show stored feedback" svg={svgs.reminderSvg}/> : null}
            <SimpleButton text={`Video tutorial ${videoTutorial || configObject.config.intro ? "" : "(not available)"}`}  svg={svgs.videoIcon} action={redirectToVideo} />
            

            <p>Feedback plays an important role when learning technical skills. <a onClick={openWindow} href="https://4geeks.com/docs/learnpack">Learn why.</a></p>
        </div>
    )
}

function LoginModal({ toggleFeedbackVisibility }: IFeedbackDropdown) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { setToken } = useStore();
    const login = async (e: any) => {
        setIsLoading(true);
        e.preventDefault();
        const HOST = "http://localhost:3000"

        const data = {
            email: email,
            password: password
        }
        console.log(data);

        const config = {
            method: "post",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json" // Set the content type to JSON
            }
        }
        try {
            const res = await fetch(HOST + "/login", config);
            const json = await res.json();
            const token = json.rigobot.key;
            setToken(token);
            toast.success("Successfully logged in");
        }
        catch (error) {
            toast.error(String(error));
        }
        toggleFeedbackVisibility();

    }

    return <>
        <div className="modal">
            <div className="modal-content">
                <div><p>To use the AI services you must login with your <a href="https://4geeks.com/">4geeks</a> account</p>
                    <SimpleButton action={toggleFeedbackVisibility} svg={svgs.closeIcon} /></div>
                <form action="">
                    <input placeholder="Email" type="text" name="email" onChange={(e) => { setEmail(e.target.value) }} />
                    <input placeholder="Password" type="password" name="password" onChange={(e) => { setPassword(e.target.value) }} />
                    <SimpleButton text={isLoading ? "Loading..." : "Submit"} action={login} extraClass="bg-blue" />
                    <span>If you don't have an account sign up <a href="https://4geeks.com/pricing">here</a></span>
                </form>
            </div>
        </div>
    </>
}