import SimpleButton from "./Button";
import { svgs } from "../../resources/svgs";
import useStore from "../../utils/store";
import { useState } from "react";
import { toast } from 'react-hot-toast';
import { OpenWindowLink } from "./OpenWindowLink";

interface ILoginModal {
    toggleFeedbackVisibility: () => void;
}

export default function LoginModal({ toggleFeedbackVisibility }: ILoginModal) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [openaiToken, setOpenaiToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { setToken, host } = useStore();

    const sendOpenaiToken = async () => {
        const data = {
            token: openaiToken
        }

        const config = {
            method: "post",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json" // Set the content type to JSON
            }
        }
        try {
            const res = await fetch(host + "/set-openai-token", config);
            const json = await res.json();
            console.log(json);
            ;
            toast.success("Successfully set OpenAI token");
        }
        catch (error) {
            toast.error(String(error));
        }
        toggleFeedbackVisibility();
    }

    const login = async (e: any) => {
        setIsLoading(true);
        e.preventDefault();
        

        const data = {
            email: email,
            password: password
        }

        const config = {
            method: "post",
            body: JSON.stringify(data),
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
            // getOpenAITokenFromRigobot(token);

            if (openaiToken) sendOpenaiToken();
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
                    <span>If you don't have an account sign up <OpenWindowLink text="here" href="https://4geeks.com/pricing"/> </span>
                    <input placeholder="Set an OpenAI token if you prefer" type="token" name="token" onChange={(e) => { setOpenaiToken(e.target.value) }} />
                </form>
            </div>
        </div>
    </>
}