import SimpleButton from "../mockups/Button"
import useStore from "../../utils/store"
import { svgs } from "../../assets/svgs";
import { useState } from "react";

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
            <SimpleButton action={toggleDrop} text={language} svg={svgsLanguageMap[language]} />
            {showDrop && <LanguageDropdown toggleDrop={toggleDrop} />}

        </div>
    </>
}

interface ILanguageDropdown {
    toggleDrop: () => void
}

const LanguageDropdown = ({ toggleDrop }: ILanguageDropdown) => {
    const { language, setLanguage, getCurrentExercise } = useStore();

    const languages = Object.keys(getCurrentExercise().translations);    

    const setLang = (lang: string) => {
        setLanguage(lang);
        toggleDrop();
    }

    return <div className="language-dropdown">
        {languages.map((l, index) => l !== language ? <button key={index} onClick={() => setLang(l)} >{svgsLanguageMap[l]}{l}</button> : null)}
    </div>
}