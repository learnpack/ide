import SimpleButton from "../mockups/Button"
import useStore from "../../utils/store"
import { svgs } from "../../assets/svgs";

import { useState } from "react";
// import {useEffect, useState} from "react";

const svgsLanguageMap: any = {
    "es": svgs.spainFlag,
    "us": svgs.usaFlag
}

export default function LanguageButton() {
    const { language } = useStore();
    const [showDrop, setShowDropdown] = useState(false);

    const toggleDrop = () => {
        setShowDropdown(!showDrop)
    }
    return <>
        <div className="language-component">
            {/* <p>Hello</p> */}
            <SimpleButton action={toggleDrop} text={language} svg={svgsLanguageMap[language]} />
            {showDrop && <LanguageDropdown toggleDrop={toggleDrop} />}

        </div>
    </>
}

interface ILanguageDropdown {
    toggleDrop: () => void
}

const LanguageDropdown = ({ toggleDrop }: ILanguageDropdown) => {
    const { exercises, currentExercisePosition, language, setLanguage } = useStore();

    const languages = Object.keys(exercises[currentExercisePosition].translations);

    const setLang = (lang: string) => {
        setLanguage(lang);
        toggleDrop();
    }

    return <div className="language-dropdown">
        {languages.map((l) => l !== language ? <button onClick={() => setLang(l)} >{svgsLanguageMap[l]}{l}</button> : null)}
    </div>
}