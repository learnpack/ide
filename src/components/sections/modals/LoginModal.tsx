import SimpleButton from "../../mockups/Button";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { useState, useRef, useEffect } from "react";
import { toast } from 'react-hot-toast';
import { OpenWindowLink } from "../../composites/OpenWindowLink";

export default function LoginModal() {
    const backdropRef = useRef<HTMLDivElement>(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);

    const { setToken, host, setOpenedModals } = useStore();

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
        }
        catch (error) {
            toast.error(String(error));
        }
        setOpenedModals({ login: false, chat: true })
    }

    return <>
        <div ref={backdropRef} className="login-modal">
            <div className="modal-content">
                <h2>Login</h2>
                <div><p>To use the AI services you must login with your <a href="https://4geeks.com/">4geeks</a> account</p>
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