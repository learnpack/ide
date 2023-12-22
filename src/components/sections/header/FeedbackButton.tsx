import  { useState, useEffect } from "react";
import SimpleButton from "../../mockups/Button";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { FeedbackDropdown } from "./FeedbackDropdown";

export default function FeedbackButton(): JSX.Element {
    const [showFeedback, setShowFeedback] = useState(false);
    const { feedbackbuttonProps, checkLoggedStatus } = useStore();
    let hideFeedbackTimeout: ReturnType<typeof setTimeout>;

    const toggleFeedback = (): void => {
        setShowFeedback((prev) => !prev);
    }

    useEffect(() => {
        checkLoggedStatus();
    }, [])

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

            <SimpleButton text={feedbackbuttonProps.text} svg={svgs.feedbackIcon} extraClass={`pill border-blue color-blue row-reverse ${feedbackbuttonProps.className}`} action={toggleFeedback} />
        </div>
    )
}
