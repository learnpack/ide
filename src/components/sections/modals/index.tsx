// import Chat from "./Chat";
import CheckVideo from "./CheckVideo";
import LoginModal from "./LoginModal";
import SocketDisconnectionModal from "./SocketDisconnectionModal";
import useStore from "../../../utils/store";
import { RigobotInviteModal } from "./RigobotInvite";

import { ResetModal } from "./Reset";
import { Presentator } from "../../composites/Presentator/Presentator";
import { DialogModal } from "./DialogModal";
import "./modals.css";
import { SessionModal } from "./ContinueSession";
import { MustLoginModal } from "./MustLogin";
import { CloseWindow } from "./CloseWindow";
import { TestStrugglesModal } from "./StreakStruggles";
import { LimitAiCompilations } from "./LimitAiCompilations";
import { AddVideoTutorial } from "./AddVideoTutorial";
import { NotAuthorModal } from "./NotAuthorModal";
import { PackageNotFoundModal } from "./PackageNotFound";
import { SyllabusFeedbackModal } from "./SyllabusFeedback";

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
      {openedModals.reset && <ResetModal />}
      {openedModals.tutorial && <Presentator />}
      {openedModals.dialog && <DialogModal />}
      {openedModals.session && <SessionModal />}
      {openedModals.mustLogin && <MustLoginModal />}
      {openedModals.closeWindow && <CloseWindow />}
      {openedModals.limitReached && <LimitAiCompilations />}
      {openedModals.testStruggles && <TestStrugglesModal />}
      {openedModals.addVideoTutorial && <AddVideoTutorial />}
      {openedModals.notAuthor && <NotAuthorModal />}
      {openedModals.packageNotFound && <PackageNotFoundModal />}
      {openedModals.syllabusFeedback && <SyllabusFeedbackModal />}
    </>
  );
};
