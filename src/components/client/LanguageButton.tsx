import SimpleButton from "./Button"
import useStore from "../../utils/store"
import { svgs } from "../../resources/svgs";

export default function LanguageButton() {
    const { language, toggleLanguage, languageMap } = useStore();
    
    return <>
        <div className="language-component">
            <SimpleButton svg={language == "us" ? svgs.usaFlag : svgs.spainFlag} action={toggleLanguage} text={languageMap[language]} />
        </div>
    </>
}