import Chat from "./Chat"
import CheckVideo from "./CheckVideo"
import LoginModal from "./LoginModal"
import SocketDisconnectionModal from "./SocketDisconnectionModal"
import useStore from "../../../utils/store"

export const ModalsContainer = () => {
    const { openedModals } = useStore()
    return (
        <>
            <SocketDisconnectionModal />
            <CheckVideo />
            {
                openedModals.login && <LoginModal />
            }
            {
                openedModals.chat && <Chat />
            }
        </>

    )
}