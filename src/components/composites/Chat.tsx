import useStore from "../../utils/store";
import { useState, useEffect, useRef } from "react";
import { convertMarkdownToHTML } from "../../utils/lib";
import { svgs } from "../../assets/svgs";

export default function Chat() {
    const backdropRef = useRef<HTMLDivElement>(null);

    const { setShowChatModal, currentExercisePosition, exerciseMessages, setExerciseMessages, chatSocket, conversationIdsCache, getContextFilesContent, learnpackPurposeId, token, chatInitialMessage } = useStore();


    const fakeMessages = [
        { "type": "bot", "text": chatInitialMessage },
    ]
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [messages, setMessages] = useState(exerciseMessages[currentExercisePosition] || fakeMessages);
    const [userMessage, setUserMessage] = useState("");

    useEffect(() => {
        const body = document.querySelector('body');
        if (body) body.style.overflow = "hidden";

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            if (body) body.style.overflow = "auto";
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    useEffect(() => {
        // @ts-ignore
        chatSocket.on("response", (message) => {
            let newMessages = [...messages];

            newMessages[newMessages.length - 1].text += message.chunk;
            setMessages(newMessages);
        });

        // @ts-ignore
        chatSocket.on("responseFinished", (data) => {
            if (data.status == "ok") {
                setIsGenerating(false);
                setExerciseMessages(messages, currentExercisePosition);
            }

        });

        return () => {
            chatSocket.off("response");
            chatSocket.off("responseFinished");
        }
    }, [messages]);

    const handleClickOutside = (event: any) => {
        if (event.target === backdropRef.current) {
            setShowChatModal(false);
        }
    }

    const trackUserMessage = (e: any) => {
        setUserMessage(e.target.value);
    }

    const sendUserMessage = async () => {
        if (Boolean(userMessage.trim() == "")) return;
        if (isGenerating) return;

        setMessages((prev) => [...prev, { "type": "user", "text": userMessage }]);
        setMessages((prev) => [...prev, { "type": "bot", "text": "" }]);

        const messageData = await getMessageData();
        
        chatSocket.emit("message", messageData);

        setUserMessage("");
        setIsGenerating(true);

    }

    const handleKeyUp = (event: any) => {
        if (event.key === "Enter" && !event.ctrlKey) {
            event.preventDefault();
            sendUserMessage();
        }
    }

    const getMessageData = async () => {
        const contextFilesContent = await getContextFilesContent();
        const data = {
            "message": {
                type: 'user',
                text: userMessage,
                purpose: learnpackPurposeId,
                context: contextFilesContent,
                imageB64: ""
            },
            "data": {
                "conversationID": conversationIdsCache[currentExercisePosition],
                "purpose": learnpackPurposeId,
                "token": token
            }
        }
        return data
    }

    //   const getImageDescription = () => {
    //     return chatMessage.text
    //   }



    return <main ref={backdropRef} className="chat-container">

        <div className="chat-modal">
            <section className="chat-header">
                <h3>Learnpack AI-Tutor</h3>

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
    context?: string;
}

const Message = ({ type, text }: IMessage) => {
    return <div className={`message ${type}`}>
        <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(text) }}>
        </div>
    </div>
}