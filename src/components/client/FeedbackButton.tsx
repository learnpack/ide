
import SimpleButton from "../mockups/Button";
import { svgs } from "../../assets/svgs";
import useStore from "../../utils/store";
import { useState, useEffect } from "react";
import { getStatus } from "../../utils/socket";
import { toast } from 'react-hot-toast';
import LoginModal from "./LoginModal";

export default function FeedbackButton() {
    const [showFeedback, setShowFeedback] = useState(false);

    const { feedbackbuttonProps, allowedActions } = useStore();
    const { checkLoggedStatus } = useStore();
    const toggleFeedback = () => {
        setShowFeedback((prev) => !prev);
    }

    useEffect(() => {
        checkLoggedStatus();
    }, [])

    useEffect(() => {
        // console.log(allowedActions, "allowedActions");
    }, [allowedActions])

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
    const { feedback, toggleFeedback, currentExercisePosition, exercises, compilerSocket, token, setFeedbackButtonProps, increaseSolvedExercises, fetchExercises, configObject, videoTutorial, setShowVideoTutorial, setShowChatModal, getCurrentExercise, isTesteable } = useStore();


    const toggleAndHide = () => {
        toggleFeedbackVisibility();
        toggleFeedback();
    }

    const runTests = () => {
        toggleFeedbackVisibility();
        setFeedbackButtonProps("Running...", "palpitate");
        toast.success(getStatus("testing"));

        const data = {
            exerciseSlug: getCurrentExercise().slug
        }

        compilerSocket.emit('test', data);

        let debounceSuccess = debounce(() => {
            toast.success(getStatus("testing-success"));
            setFeedbackButtonProps("Succeded", "bg-success text-white");
            // exercises[currentExercisePosition].done = true;
            fetchExercises();
            increaseSolvedExercises();
        }, 100)

        compilerSocket.onStatus('testing-success', debounceSuccess);

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

    const openWindow = (e: any) => {
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
            {isTesteable ? <SimpleButton svg={svgs.testIcon} text="Run tests" action={runTests} /> : <SimpleButton svg={svgs.testIcon} text="Run tests" disabled={true} />}
            {Boolean(token) ? <SimpleButton text="Open AI chat" svg={svgs.brainIcon} action={showChat} /> : <SimpleButton svg={svgs.fourGeeksIcon} text="Login to use AI feedback" action={openLoginModal} />}
            {feedback ? <SimpleButton action={toggleAndHide} text="Show stored feedback" svg={svgs.reminderSvg} /> : null}
            <SimpleButton text={`Video tutorial ${videoTutorial ? "" : "(not available)"}`} disabled={!videoTutorial} svg={svgs.videoIcon} action={redirectToVideo} />


            <p>Feedback plays an important role when learning technical skills. <a onClick={openWindow} href="https://4geeks.com/docs/learnpack">Learn why.</a></p>
        </div>
    )
}
