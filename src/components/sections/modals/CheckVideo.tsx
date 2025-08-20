// import VideoModal from "./VideoModal";
import { useEffect, useState } from "react";
import useStore from "../../../utils/store";
// import { VideoPlayer } from "../../composites/VideoPlayer/VideoPlayer";
import { CustomPictureInPicture } from "../../composites/CustomPictureInPicture/CustomPictureInPicture";

export default function CheckVideo() {
  const [link, setLink] = useState(null as string | null);
  const {
    configObject,
    currentExercisePosition,
    videoTutorial,
    setShowVideoTutorial,
    showVideoTutorial,
  } = useStore((state) => ({
    configObject: state.configObject,
    currentExercisePosition: state.currentExercisePosition,
    videoTutorial: state.videoTutorial,
    setShowVideoTutorial: state.setShowVideoTutorial,
    showVideoTutorial: state.showVideoTutorial,
  }));

  useEffect(() => {
    if (!configObject || !configObject.config) return;
    if (configObject.config.intro && currentExercisePosition == 0) {
      let _link = configObject.config.intro;
      const embedLink = _link.replace("watch?v=", "embed/");
      setLink(embedLink);
    }

    if (videoTutorial) {
      let _link = videoTutorial;
      const embedLink = _link.replace("watch?v=", "embed/");
      setLink(embedLink);
    }
  }, [currentExercisePosition, configObject, videoTutorial]);

  const hideModal = () => {
    setShowVideoTutorial(false);
  };

  return (
    <>
      {showVideoTutorial && link ? (
        
        <CustomPictureInPicture hide={hideModal} link={link} />
      ) : null}
    </>
  );
}

