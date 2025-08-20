import React, { useRef, useState } from "react";
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

const openedStyles = {
  width: "min(300px, 95vw)",
  position: "fixed",
  padding: "10px",
  borderRadius: "10px",
  right: "5vw",
  bottom: "10%",
  zIndex: 5,
  backgroundColor: "#D8E2F0",
  // cursor: "move",
  color: "black",
  boxShadow: "0px 0px 10px rgba(0,0,0,0.8)",
};

const closedStyles = {
  width: "min(600px, 95vw)",
  position: "fixed",
  padding: "10px",
  borderRadius: "10px",
  left: "5vw",
  top: "10%",
  zIndex: 5,
  color: "black",
  backgroundColor: "#D8E2F0",
  cursor: "move",
  boxShadow: "0px 0px 10px rgba(0,0,0,0.8)",
};

export const CustomPictureInPicture: React.FC<CustomPictureInPictureProps> = ({
  link,
  hide,
}) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { currentExercisePosition } = useStore((s) => ({
    currentExercisePosition: s.currentExercisePosition,
  }));
  const { t } = useTranslation();

  return (
    <>
      <Draggable cancel=".no-drag">
        <div
          ref={videoContainerRef}
          className={isOpen ? "no-drag" : ""}
          // @ts-ignore
          style={isOpen ? openedStyles : closedStyles}
        >
          <div className="flex-x justify-between align-center">
            <SimpleButton
              extraClass="no-drag svg-black"
              action={() => {
                setIsOpen(!isOpen);
              }}
              svg={isOpen ? svgs.expand : svgs.reduce}
            />

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
