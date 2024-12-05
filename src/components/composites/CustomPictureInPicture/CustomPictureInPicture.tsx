import React, { useRef } from "react";
import Draggable from "react-draggable";
import { VideoPlayer } from "../VideoPlayer/VideoPlayer";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";

interface CustomPictureInPictureProps {
  link: string;
  hide: () => void;
}

export const CustomPictureInPicture: React.FC<CustomPictureInPictureProps> = ({
  link,
  hide,
}) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const { currentExercisePosition } = useStore((s) => ({
    currentExercisePosition: s.currentExercisePosition,
  }));
  const { t } = useTranslation();

  return (
    <>
      <Draggable cancel=".no-drag">
        <div
          ref={videoContainerRef}
          style={{
            width: "min(500px, 95vw)",
            position: "fixed",
            padding: "10px",
            borderRadius: "10px",
            left: "5vw",
            top: "20%",
            transform: "translateX(-50vw) translateY(-50vh)",
            zIndex: 5,
            backgroundColor: "#D8E2F0",
            cursor: "move",
            boxShadow: "0px 0px 10px rgba(0,0,0,0.8)",
          }}
        >
          <div className="flex-x justify-between">
            <SimpleButton />

            <span className="padding-small">
              {currentExercisePosition === 0
                ? t("video-introduction")
                : t("video-solution")}
            </span>
            <SimpleButton
              extraClass="no-drag"
              action={hide}
              svg={svgs.redClose}
            />
          </div>
          <VideoPlayer link={link} />
        </div>
      </Draggable>
    </>
  );
};
