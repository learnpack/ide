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
import { TeacherOnboarding } from "./TeacherOnboarding";
import { useEffect } from "react";
import { LocalStorage } from "../../../managers/localStorage";
import { getTeacherOnboardingKey } from "../../../utils/lib";

export const ModalsContainer = () => {
  const { openedModals, setOpenedModals, mode, teacherOnboardingClosed } =
    useStore((state) => ({
      openedModals: state.openedModals,
      setOpenedModals: state.setOpenedModals,
      mode: state.mode,
      teacherOnboardingClosed: state.teacherOnboardingClosed,
    }));

  useEffect(() => {
    if (
      mode === "creator" &&
      !openedModals.teacherOnboarding &&
      !teacherOnboardingClosed
    ) {
      setOpenedModals({ teacherOnboarding: true });
    }
  }, [mode]);

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
      {openedModals.teacherOnboarding && !LocalStorage.get(getTeacherOnboardingKey(), false) && <TeacherOnboarding />}
    </>
  );
};
