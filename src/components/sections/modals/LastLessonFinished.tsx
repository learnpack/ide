import { Modal } from "../../mockups/Modal";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import "./modals.css";
import { svgs } from "@/assets/svgs";
import { useMemo } from "react";

const randomFrom0to9 = () => {
    return Math.floor(Math.random() * 10);
};

export const LastLessonFinishedModal = () => {
    const { t } = useTranslation();
    const setOpenedModals = useStore((s) => s.setOpenedModals);
    const lessonTitle = useStore((s) => s.lessonTitle);
    const configObject = useStore((s) => s.configObject);
    const language = useStore((s) => s.language);
    const isIframe = useStore((s) => s.isIframe);

    const sendMessageToParent = () => {
        if (isIframe && window.parent && window.parent !== window) {
            try {
                window.parent.postMessage(
                    {
                        event: "lesson-finished",
                        timestamp: Date.now(),
                    },
                    "*"
                );
            } catch (error) {
                console.error("Error sending message to parent:", error);
            }
        }
    };

    const handleContinue = () => {
        sendMessageToParent();
        setOpenedModals({ lastLessonFinished: false });
    };

    // Calculate progress (100% since it's the last lesson)
    const progress = 100;

    // Get course title - try lessonTitle first, then config title
    const courseTitle = useMemo(() => {
        if (lessonTitle) return lessonTitle;
        if (configObject?.config?.title) {
            // Try current language first, then 'us' as fallback
            return configObject.config.title[language] || 
                   configObject.config.title.us || 
                   configObject.config.title.en || 
                   "";
        }
        return "";
    }, [lessonTitle, configObject, language]);

    // Get random success message
    const successMessage = useMemo(() => {
        const randomIndex = randomFrom0to9();
        return t(`perfectSuccess.${randomIndex}`);
    }, [t]);

    const handleClose = () => {
        sendMessageToParent();
        setOpenedModals({ lastLessonFinished: false });
    };

    return (
        <Modal
            outsideClickHandler={handleClose}
            extraClass="last-lesson-finished-modal"
            minWidth="500px"
            showCloseButton={false}
        >
            <div className="last-lesson-finished-content">
                {/* Celebration Icon */}
                <div className="celebration-icon">
                    <div className="celebration-emoji">{svgs.congratsRigo}</div>
                    <div className="celebration-crown">👑</div>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar-container">
                    <div 
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Main Message - Random Success Message */}
                <h2 className="congratulations-message">
                    {successMessage}
                </h2>

                {/* Course Title Section */}
                {courseTitle && (
                    <div className="course-title-section">
                        <div className="course-title-item">
                            <span className="course-title-label">
                                {t("lesson-complete") || "Lesson Complete!"}
                            </span>
                            <span className="course-title-value">{courseTitle}</span>
                        </div>
                    </div>
                )}

                {/* Continue Button */}
                <div className="continue-button-container">
                    <SimpleButton
                        text={t("continue") || "Continue"}
                        action={handleContinue}
                        extraClass="bg-success text-white big rounded continue-button-green"
                        svg={svgs.sendSvg}
                    />
                </div>
            </div>
        </Modal>
    );
};