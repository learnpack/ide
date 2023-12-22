import BugButton from "./BugButton";
import SimpleButton from "../mockups/Button";
import ExercisesList from "./ExercisesList";
import useStore from "../../utils/store";
import { svgs } from "../../assets/svgs";
import { useState } from "react"

export default function Sidebar() {
    const { numberOfExercises, solvedExercises } = useStore();
    const [showSidebar, setShowSidebar] = useState(false);

    const closeSidebar = () => {
        const sidebar: HTMLElement | null = document.querySelector(".sidebar-component");
        sidebar?.classList.add("sidebar-disappear");
        sidebar?.addEventListener("animationend", () => {
            setShowSidebar(false);
        })
    }

    // const redirectTo = () => {
    //     // TODO: This needs to be done with the learnpack socket to do so!
    //     const url = "https://4geeks.com/docs/learnpack/what-is-learnpack"
    //     const data = {
    //         url,
    //         exerciseSlug: exercises[currentExercisePosition].slug
    //     }
    //     compilerSocket.openWindow(data);
    // }

    return showSidebar ? <div className="sidebar-component">
        <section className="">
            <SimpleButton action={closeSidebar} svg={svgs.closeIcon} />
        </section>

        <section className="">
            <p>{solvedExercises}/{numberOfExercises} Solved exercises</p>

            {/* <SimpleButton text="" svg={svgs.videoIcon} action={()=>{}}/> */}
            {/* <SimpleButton text="" svg={svgs.bulbIcon} action={()=>{redirectTo()}}/> */}
        </section>

        <ExercisesList closeSidebar={closeSidebar} />

        <section className="p-4 footer">
            <BugButton />
            <div>{svgs.userIcon}</div>
        </section>

    </div> : <SimpleButton svg={svgs.dropdownButton} action={() => { setShowSidebar(true); }} />
}