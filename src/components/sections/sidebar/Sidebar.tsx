import BugButton from "./BugButton";
import SimpleButton from "../../mockups/Button";
import ExercisesList from "./ExercisesList";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import { useState } from "react"
import { createPortal } from "react-dom";

import "./styles.css"

export default function Sidebar() {
    const { numberOfExercises, solvedExercises, configObject, language, lessonTitle } = useStore();
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
                        <p>{solvedExercises}/{numberOfExercises} Solved exercises</p>
                        <SimpleButton action={closeSidebar} svg={svgs.closeIcon} />
                    </section>
                    <ExercisesList closeSidebar={closeSidebar} />

                    <section className="p-4 footer">
                        <BugButton />
                        <div>{svgs.userIcon}</div>
                    </section>

                </div>
            </>,
            document.body
        ) :
        <SimpleButton svg={svgs.dropdownButton} action={() => { setShowSidebar(true); }} />
}