import VideoModal from "./VideoModal";
import { useEffect, useState } from "react";
import useStore from "../../utils/store";

export default function CheckVideo () {
    const [link, setLink] = useState("");
    const [showModal, setShowModal] = useState(true);

    const {configObject, currentExercisePosition} = useStore();
    useEffect(()=>{
        console.log("configObject", configObject);

        console.log("currentExercisePosition", currentExercisePosition);
        
        console.log(configObject.config.intro);

        if (configObject.config.intro && currentExercisePosition == 0) {
            let _link = configObject.config.intro
            const embedLink = _link.replace('watch?v=', 'embed/');
            setLink(embedLink);
        }
        
    }, [currentExercisePosition, configObject])


    const hideModal = () => {
        setShowModal(false);
    }
    return <>
    {link && showModal ? <VideoModal link={link} hideModal={hideModal} /> : null}
    </>
}