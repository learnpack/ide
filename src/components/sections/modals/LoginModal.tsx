import SimpleButton from "../../mockups/Button";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { useState, useRef, useEffect } from "react";
import { OpenWindowLink } from "../../composites/OpenWindowLink";

export default function LoginModal() {
    const { setOpenedModals, loginToRigo } = useStore(state => ({
        setToken: state.setToken,
        host: state.host,
        setOpenedModals: state.setOpenedModals,
        startConversation: state.startConversation,
        currentExercisePosition: state.currentExercisePosition,
        loginToRigo: state.loginToRigo
    }));

    const backdropRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleClickOutside = (event: any) => {
        if (backdropRef.current === event.target) {
            setOpenedModals({ login: false })
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const login = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);

        loginToRigo({
            email: email,
            password: password
        })
    }

    return <>
        <div ref={backdropRef} className="login-modal">
            <div className="modal-content">
                <h2>Login</h2>
                <div><p>To use the AI services you must login with your <strong>4geeks</strong> account, and you have been accepted <strong>Rigobot</strong></p>
                    <SimpleButton action={() => {
                        setOpenedModals({ login: false })
                    }} svg={svgs.closeIcon} />
                </div>
                <form action="">
                    <input placeholder="Email" type="text" name="email" onChange={(e) => { setEmail(e.target.value) }} />
                    <input placeholder="Password" type="password" name="password" onChange={(e) => { setPassword(e.target.value) }} />

                    <SimpleButton text={isLoading ? "Loading..." : "Submit"} action={login} extraClass="bg-blue" />
                    <span>If you don't have an account sign up <OpenWindowLink text="here" href="https://4geeks.com/pricing" /> </span>
                </form>
            </div>
        </div>
    </>
}