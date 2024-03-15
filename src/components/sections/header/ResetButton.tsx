import SimpleButton from "../../mockups/Button";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import { useState, useEffect } from "react";
import { Modal } from "../../mockups/Modal";
import { useTranslation } from "react-i18next";
import "./styles.css"

export default function ResetButton() {

    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const toggleModal = () => {
        // First I need to show a modal to ensure the ensure wants to reset the exercise
        setShowModal(!showModal);
    }

    return <>
        <SimpleButton extraClass="pill border-blue color-blue" svg={svgs.resetIcon} text={t("Reset")} action={toggleModal} />
        {showModal && <ResetModal toggleModal={toggleModal} />}
    </>
}

interface IResetModal {
    toggleModal: () => void
}


const ResetModal = ({ toggleModal }: IResetModal) => {
    const { t } = useTranslation();
    const { compilerSocket, exercises, currentExercisePosition } = useStore(state => ({
        compilerSocket: state.compilerSocket,
        exercises: state.exercises,
        currentExercisePosition: state.currentExercisePosition
    
    }));

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    })

    const handleReset = () => {
        const data = {
            exerciseSlug: exercises[currentExercisePosition].slug
        }

        compilerSocket.emit("reset", data);

        toggleModal();
    }
    return <Modal extraClass="reset-modal" outsideClickHandler={toggleModal}>
        <h2>{t("Reset")}</h2>
        <p>{t("Are you sure you want to reset the exercise? You will lose all your progress")}</p>
        <section >
            <SimpleButton text={t("Reset")} extraClass="pill bg-blue" action={handleReset} />
            <SimpleButton text={t("Cancel")} extraClass="pill border-blue color-blue" action={toggleModal} />
        </section>

    </Modal>
}