import Chat from "./Chat"
import CheckVideo from "./CheckVideo"
import LoginModal from "./LoginModal"
import SocketDisconnectionModal from "./SocketDisconnectionModal"
import useStore from "../../../utils/store"
import { RigobotInviteModal } from "./RigobotInvite"
import { SolutionModal } from "./Solution"
import { ResetModal } from "./Reset"
import { Presentator } from "../../composites/Presentator/Presentator"
import { DialogModal } from "./DialogModal"
import "./modals.css"

export const ModalsContainer = () => {
    const { openedModals, token } = useStore(state => ({
        openedModals: state.openedModals,
        token: state.token
    }))
    return (
        <>
            <SocketDisconnectionModal />
            <CheckVideo />
            {
                openedModals.login && <LoginModal />
            }
            {
                openedModals.chat && token && <Chat />
            }
            {
                openedModals.rigobotInvite && <RigobotInviteModal />
            }
            {
                openedModals.solution && <SolutionModal />
            }
            {
                openedModals.reset && <ResetModal />
            }
            {
                openedModals.tutorial && <Presentator />
            }
            {
                openedModals.dialog && <DialogModal />
            }
        </>

    )
}