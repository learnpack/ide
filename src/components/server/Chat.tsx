import useStore from "../../utils/store";
import { useState, useEffect } from "react";
import { convertMarkdownToHTML } from "../../utils/lib";
import { svgs } from "../../resources/svgs";

const fakeMessages = [
    { "type": "bot", "text": "It appears that you need some help, ask me anything!" },
]

export default function Chat() {
    const { setShowChatModal, compilerSocket, exercises, currentExercisePosition, exerciseMessages, setExerciseMessages } = useStore();

    const [isGenerating, setIsGenerating] = useState(false);
    const [messages, setMessages] = useState(exerciseMessages[currentExercisePosition] || fakeMessages);
    const [userMessage, setUserMessage] = useState("");


    useEffect(()=>{
        const body = document.querySelector('body');
        if (body) body.style.overflow = "hidden";

        return () => {
            if (body) body.style.overflow = "auto";
        }
    }, [])

    useEffect(() => {
        compilerSocket.on("generation", (data: any) => {

            if (data.status == "completed") {
                setIsGenerating(false);
                setExerciseMessages(messages, currentExercisePosition);
            }
            let newMessages = [...messages];
            newMessages[newMessages.length - 1].text += data.logs;
            setMessages(newMessages);
        })
    }, [isGenerating])

    const trackUserMessage = (e: any) => {
        setUserMessage(e.target.value);

    }

    const getLastTwoMessages = () => {
        if (messages.length < 2) return "Conversation just started!";
        const lastMessages = messages.slice(-2).map((message) => `${message.type}: ${message.text}`).join("\n");
        return lastMessages;
    }

    const sendUserMessage = () => {
        if (Boolean(userMessage.trim() == "")) return;

        if (isGenerating) return;

        setMessages((prev) => [...prev, { "type": "user", "text": userMessage }]);

        setMessages((prev) => [...prev, { "type": "bot", "text": "" }]);

        console.log(getLastTwoMessages());
        
        const data = {
            exerciseSlug: exercises[currentExercisePosition].slug,
            userMessage: userMessage,
            entryPoint: exercises[currentExercisePosition].entry.split("/")[1],
            lastMessages: getLastTwoMessages()
        }
        compilerSocket.emit("generate", data);
        setUserMessage("");
        setIsGenerating(true);

    }

    const handleKeyUp = (event: any) => {
        if (event.key === "Enter" && !event.ctrlKey) {
            event.preventDefault();
            sendUserMessage();
        }
    }


    return <main className="chat-container">

        <div className="chat-modal">
            <section className="chat-header">
                <h3>Learnpack AI-tutor</h3>

            <button onClick={() => {
                setShowChatModal(false);
            }}>
                {svgs.closeIcon}
            </button>
            </section>
            <section className="chat-messages">
                {messages.map((message, index) => <Message key={index} {...message} />)}
            </section>
            <section className="chat-input">
                <textarea value={userMessage} placeholder="Ask me something here"
                    onChange={trackUserMessage}
                    onKeyUp={handleKeyUp} />
                <button onClick={sendUserMessage}>{svgs.sendSvg}</button>
            </section>
        </div>
    </main>
}

interface IMessage {
    type: string;
    text: string;
}

const Message = ({ type, text }: IMessage) => {
    return <div className={`message ${type}`}>
        <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(text) }}>
        </div>
    </div>
}