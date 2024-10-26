import { useState } from "react";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { FeedbackDropdown } from "./FeedbackDropdown";
import { useTranslation } from "react-i18next";

export default function FeedbackButton({
  direction = "down",
}: {
  direction: "down" | "up";
}): JSX.Element {
  const { t } = useTranslation();

  const [showFeedback, setShowFeedback] = useState(false);
  let hideFeedbackTimeout: ReturnType<typeof setTimeout>;

  const toggleFeedback = (): void => {
    setShowFeedback((prev) => !prev);
  };

  const handleMouseEnter = (): void => {
    clearTimeout(hideFeedbackTimeout);
    setShowFeedback(true);
  };
  const handleMouseLeave = (): void => {
    hideFeedbackTimeout = setTimeout(() => {
      setShowFeedback(false);
    }, 200);
  };

  return (
    <div
      id="feedback-button"
      className="pos-relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SimpleButton
        text={t("Get feedback")}
        svg={svgs.feedbackIcon}
        extraClass={`pill color-blue row-reverse`}
        action={toggleFeedback}
      />
      {showFeedback && (
        <FeedbackDropdown
          direction={direction}
          toggleFeedbackVisibility={toggleFeedback}
        />
      )}
    </div>
  );
}
