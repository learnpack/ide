import SimpleButton from "../../mockups/SimpleButton";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import { useState, useEffect } from "react";
import i18n from "../../../utils/i18n";

const svgsLanguageMap: any = {
  es: svgs.spainFlag,
  us: svgs.usaFlag,
};

export default function LanguageButton() {
  const { language } = useStore((state) => ({
    language: state.language,
  }));

  useEffect(() => {
    i18n.changeLanguage(language);
  }, []);
  const [showDrop, setShowDropdown] = useState(false);

  const toggleDrop = () => {
    setShowDropdown(!showDrop);
  };

  return (
    <>
      <div id="language-component" className="language-component">
        <SimpleButton
          action={toggleDrop}
          text={language}
          svg={svgsLanguageMap[language]}
        />
        {showDrop && <LanguageDropdown toggleDrop={toggleDrop} />}
      </div>
    </>
  );
}

interface ILanguageDropdown {
  toggleDrop: () => void;
}

const LanguageDropdown = ({ toggleDrop }: ILanguageDropdown) => {
  const { language, setLanguage, getCurrentExercise } = useStore((state) => ({
    language: state.language,
    setLanguage: state.setLanguage,
    getCurrentExercise: state.getCurrentExercise,
  }));

  const languages = Object.keys(getCurrentExercise().translations);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  const setLang = (lang: string) => {
    setLanguage(lang);
    changeLanguage(lang);
    toggleDrop();
  };

  return (
    languages.length > 1 && (
      <div className="language-dropdown">
        {languages.map((l, index) =>
          l !== language ? (
            <button key={index} onClick={() => setLang(l)}>
              {svgsLanguageMap[l]}
              {l}
            </button>
          ) : null
        )}
      </div>
    )
  );
};
