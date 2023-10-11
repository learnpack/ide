import BugButton from "../client/BugButton";
import SimpleButton from "../client/Button";
import ExercisesList from "../client/ExercisesList";
import useStore from "../../utils/store";
import { svgs } from "../../resources/svgs";
import {useState} from "react"

export default function Sidebar() {
    const {numberOfExercises} = useStore();
    const [showSidebar, setShowSidebar] = useState(false);

    const closeSidebar = () => {
        const sidebar: HTMLElement | null = document.querySelector(".sidebar-component");
        sidebar?.classList.add("sidebar-disappear");
        sidebar?.addEventListener("animationend", ()=>{
            setShowSidebar(false);
        })
    }

    const redirectTo = () => {
        // TODO: This needs to be done with the learnpack socket to do so!
        const docsUrl = "https://docs.learnpack.co/"
        window.location.href = docsUrl;
    }

    return showSidebar ? <div className="sidebar-component">
    <section className="">
        <SimpleButton action={closeSidebar} svg={svgs.closeIcon} />
    </section>

    <section className="">
        <p>0/{numberOfExercises} Solved exercises</p>

        <SimpleButton text="" svg={svgs.videoIcon} action={()=>{}}/>
        <SimpleButton text="" svg={svgs.bulbIcon} action={()=>{redirectTo()}}/>
    </section>
    
    <ExercisesList closeSidebar={closeSidebar} />
    
    <section className="p-4 footer">
        <BugButton />
        <div>{svgs.userIcon}</div>
    </section>

</div> : <SimpleButton svg={svgs.dropdownButton} action={()=>{setShowSidebar(true);}} />
}