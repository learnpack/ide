import SimpleButton from "./Button"
import useStore from "../../utils/store"
import { useState } from "react"
import { svgs } from "../../resources/svgs";

export default function LanguageButton() {
    const { language, toggleLanguage, languageMap } = useStore();
    const [showMenu, setShowMenu] = useState(false);
    
    return <>
        <div className="language-component">
            <SimpleButton svg={language == "us" ? svgs.usaFlag : svgs.spainFlag} action={toggleLanguage} text={languageMap[language]} />
            {/* <span onClick={()=>setShowMenu(true)}>{languageMap[language]}</span>
            {showMenu && <div className="dropdown-menu">
                {language == "us" ? <SimpleButton action={toggleLanguage} text={languageMap["es"]} /> : <SimpleButton action={toggleLanguage} text={languageMap["us"]} />}
            </div>} */}

        </div>
    </>
}