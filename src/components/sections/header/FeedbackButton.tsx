import  { useState } from "react";
import SimpleButton from "../../mockups/Button";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { FeedbackDropdown } from "./FeedbackDropdown";
import { useTranslation } from "react-i18next";
export default function FeedbackButton(): JSX.Element {
    const feedbackbuttonProps = useStore(state => state.feedbackbuttonProps);
    const { t } = useTranslation();

    const [showFeedback, setShowFeedback] = useState(false);
    let hideFeedbackTimeout: ReturnType<typeof setTimeout>;

    const toggleFeedback = (): void => {
        setShowFeedback((prev) => !prev);
    }

    const handleMouseEnter = (): void => {
        clearTimeout(hideFeedbackTimeout);
        setShowFeedback(true);
    }
    const handleMouseLeave = (): void => {
        hideFeedbackTimeout = setTimeout(() => {
            setShowFeedback(false);
        }, 200); // 0.5 seconds delay
    }

    return (
        <div className="pos-relative feedback-dropdown-container" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {showFeedback && <FeedbackDropdown toggleFeedbackVisibility={toggleFeedback} />}

            <SimpleButton text={
                <span>{t(feedbackbuttonProps.text)}</span>
            } svg={svgs.feedbackIcon} extraClass={`pill border-blue color-blue row-reverse ${feedbackbuttonProps.className}`} action={toggleFeedback} />
        </div>
    )
}
