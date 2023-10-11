
import SimpleButton from "./Button";
import { svgs } from "../../resources/svgs";
import useStore from "../../utils/store";
import { useState } from "react";
import { getStatus } from "../../utils/socket";
import { toast } from 'react-hot-toast';

export default function FeedbackButton() {
    const [showFeedback, setShowFeedback] = useState(false);

    const toggleFeedback = () => {
        setShowFeedback((prev) => !prev);
    }

    return (<div className="pos-relative">
        <SimpleButton text="Feedback" svg={svgs.feedbackIcon} extraClass="pill border-blue color-blue row-reverse" action={toggleFeedback} />
        {showFeedback && <FeedbackDropdown toggleFeedbackVisibility={toggleFeedback} />}
    </div>
    )
}

interface IFeedbackDropdown {
    toggleFeedbackVisibility: () => void;
}



function FeedbackDropdown({ toggleFeedbackVisibility }: IFeedbackDropdown) {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { getAIFeedback, feedback, toggleFeedback,currentExercisePosition, exercises, compilerSocket, token } = useStore();


    const getFeedbackAndHide = () => {

        toast.success("Thinking...")
        toggleFeedbackVisibility();
        getAIFeedback();
        setTimeout(()=>{
            toast.success("Wait a little more")
        }, 2000)
    }

    const toggleAndHide = () => {
        toggleFeedbackVisibility();
        toggleFeedback();
    }

    const runTests = () => {

        toggleFeedbackVisibility();

        toast.success(getStatus("testing"));

        const data = {
            exerciseSlug: exercises[currentExercisePosition].slug
        }

        compilerSocket.emit('test', data);

        compilerSocket.onStatus('testing-success', () => {
            toast.success(getStatus("testing-success"));
        })

        function debounce(func:any, wait:any) {
            let timeout:any;
            return function executedFunction(...args:any[]) {
                    const later = () => {
                            clearTimeout(timeout);
                            func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                  };
          };
          
          let debouncedFunc = debounce((data:any) => {
                //   console.log(data);
                //   setBuildButtonText("Try again", "bg-fail");
                  toast.error(getStatus("compiler-error"));
          }, 100);
  
          compilerSocket.onStatus('testing-error', debouncedFunc);



        // compilerSocket.onStatus('testing-error', (data: any) => {
        //     data;
        //     toast.error(getStatus("testing-error"));
        // })

        compilerSocket.whenUpdated((scope: any, data: any) => {
            console.log(data);
            console.log(scope);


        });
    }

    const openLoginModal = () => {
        setShowLoginModal(true);
        // toggleFeedbackVisibility();
        
    }

    return (
        <div className="feedback-dropdown">
            {showLoginModal && <LoginModal toggleFeedbackVisibility={toggleFeedbackVisibility} />}
            { Boolean(token) ? <SimpleButton svg={svgs.brainIcon} text="Get AI Feedback" action={getFeedbackAndHide} /> : <SimpleButton svg={svgs.fourGeeksIcon} text="Login to use AI feedback" action={openLoginModal} /> }
            {feedback ? <SimpleButton action={toggleAndHide} text="Show stored feedback" /> : null}

            <SimpleButton svg={svgs.testIcon} text="Run tests" action={runTests} />
            <p>Feedback plays an important role when learning technical skills. <a>Learn why.</a></p>
        </div>
    )
}



function LoginModal ({toggleFeedbackVisibility}: IFeedbackDropdown) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const {setToken} = useStore();
    const login = async (e:any) => {
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
            const res = await fetch(HOST+"/login", config);
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
        <div  className="modal-content">
            <div><p>To use the AI services you must login with your <a href="https://4geeks.com/">4geeks</a> account</p>
            <SimpleButton action={toggleFeedbackVisibility} svg={svgs.closeIcon} /></div>
            <form action="">
                <input placeholder="Email" type="text" name="email" onChange={(e)=>{setEmail(e.target.value)}} />
                <input placeholder="Password" type="password" name="password"  onChange={(e)=>{setPassword(e.target.value)}} />
                <SimpleButton text={isLoading ? "Loading..." : "Submit" } action={login} extraClass="bg-blue" />
                <span>If you don't have an account sign up <a href="https://4geeks.com/pricing">here</a></span>
            </form>
        </div>
    </div>
    </>
}