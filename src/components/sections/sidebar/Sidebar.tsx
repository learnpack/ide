import BugButton from "./BugButton";
import SimpleButton from "../../mockups/Button";
import ExercisesList from "./ExercisesList";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import { useState } from "react"
import { createPortal } from "react-dom";
import packageInfo from '../../../../package.json';
import { useTranslation } from "react-i18next";
import "./styles.css"
const version = packageInfo.version;
let versionSections = version.split(".");
versionSections[2] = String(parseInt(versionSections[2]) + 1);



export default function Sidebar() {
    const { t } = useTranslation();
    const { numberOfExercises, solvedExercises, configObject, language, lessonTitle } = useStore(state => ({
        numberOfExercises: state.numberOfExercises,
        solvedExercises: state.solvedExercises,
        configObject: state.configObject,
        language: state.language,
        lessonTitle: state.lessonTitle
    }));
    const [showSidebar, setShowSidebar,] = useState(false);

    let title = lessonTitle
    if (configObject && typeof configObject.config.title === "object") {
        if (Object.keys(configObject.config.title).includes(language)) {
            title = configObject.config.title[language];
        }
    }

    const closeSidebar = () => {
        const sidebar: HTMLElement | null = document.querySelector(".sidebar-component");
        sidebar?.classList.add("sidebar-disappear");
        sidebar?.addEventListener("animationend", () => {
            setShowSidebar(false);
        })
    }

    return showSidebar ?
        createPortal(
            <>
                <div className="sidebar-component">
                    <section>
                        <h2>{title}</h2>
                    </section>
                    <section className="">
                        <p>{solvedExercises}/{numberOfExercises} {t("Solved exercises")}</p>
                        <SimpleButton action={closeSidebar} svg={svgs.closeIcon} />
                    </section>
                    <ExercisesList closeSidebar={closeSidebar} />

                    <section className="p-4 footer">
                        <BugButton />
                        <span><strong>{t("Current version")}</strong>: {versionSections.join(".")}</span>
                    </section>

                </div>
            </>,
            document.body
        ) :
        <SimpleButton svg={svgs.dropdownButton} action={() => { setShowSidebar(true); }} />
}