// import Chat from "./Chat";
import CheckVideo from "./CheckVideo";
import LoginModal from "./LoginModal";
import SocketDisconnectionModal from "./SocketDisconnectionModal";
import useStore from "../../../utils/store";
import { RigobotInviteModal } from "./RigobotInvite";
import { SolutionModal } from "./Solution";
import { ResetModal } from "./Reset";
import { Presentator } from "../../composites/Presentator/Presentator";
import { DialogModal } from "./DialogModal";
import "./modals.css";
import { SessionModal } from "./ContinueSession";
import { MustLoginModal } from "./MustLogin";
import { CloseWindow } from "./CloseWindow";
import { LimitAiCompilations } from "./LimitAiCompilations";

export const ModalsContainer = () => {
  const { openedModals } = useStore((state) => ({
    openedModals: state.openedModals,
    token: state.token,
  }));
  return (
    <>
      <SocketDisconnectionModal />
      <CheckVideo />
      {openedModals.login && <LoginModal />}
      {/* {openedModals.chat && <Chat />} */}
      {openedModals.rigobotInvite && <RigobotInviteModal />}
      {openedModals.solution && <SolutionModal />}
      {openedModals.reset && <ResetModal />}
      {openedModals.tutorial && <Presentator />}
      {openedModals.dialog && <DialogModal />}
      {openedModals.session && <SessionModal />}
      {openedModals.mustLogin && <MustLoginModal />}
      {openedModals.closeWindow && <CloseWindow />}
      {openedModals.limitReached && <LimitAiCompilations />}
    </>
  );
};
