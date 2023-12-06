import VideoModal from "./VideoModal";
import { useEffect, useState } from "react";
import useStore from "../../utils/store";

export default function CheckVideo () {
    const [link, setLink] = useState(null as string | null);
    const {configObject, currentExercisePosition, videoTutorial, setShowVideoTutorial, showVideoTutorial} = useStore();

    useEffect(()=>{

        if (configObject.config.intro && currentExercisePosition == 0) {
            let _link = configObject.config.intro
            const embedLink = _link.replace('watch?v=', 'embed/');
            setLink(embedLink);
        }

        if (videoTutorial) {
            let _link = videoTutorial
            const embedLink = _link.replace('watch?v=', 'embed/');
            setLink(embedLink);
        }
        
    }, [currentExercisePosition, configObject, videoTutorial])


    const hideModal = () => {
        setShowVideoTutorial(false);
    }

    return <>
    {showVideoTutorial && link ? <VideoModal link={link} hideModal={hideModal} /> : null}
    </>
}