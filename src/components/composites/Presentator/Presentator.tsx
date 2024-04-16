import "./_.css";
// import useStore from "../../../utils/store";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { convertMarkdownToHTML } from "../../../utils/lib";

type PresentatorProps = {};

const defaultSteps = [
  {
    title: "Welcome to LearnPack!",
    text: `This is a quick tutorial to help you get started. Click next to continue.`,
    id: null,
  },
  {
    title: "If you prefer, you can change the language!",
    text: `Click on the flag to change the language.`,
    id: "language-component",
  },
  {
    title: "The run button",
    text: `Use this button to compile or run your code. The behavior depends of the files in the exercise directory. You can also use the shortcut \`Ctrl\` + \`Enter\` to run the code.`,
    id: "build-button",
  },
  {
    title: "Options to get feedback",
    text: "Within this dropdown you can get feedback on your code. Let's try the available ones! You can use the following shortcuts:\n\n`Ctrl` + `Shift` + `Enter`: Run the tests if available. \n\n`Ctrl` + `Alt` + `Enter`: Open the chat with Rigobot",
    id: "feedback-button",
  },
  {
    title: "Reset button",
    text: "Sometimes you want to start over, use this button to `reset` the code to its original state.",
    id: "reset-button",
  },
  {
    title: "Open the sidebar",
    text: "Inside the sidebar you can go through the exercises and see your progress. Also you can report a bug.",
    id: "sidebar-toggle",
  },
];
export const Presentator = ({}: PresentatorProps) => {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = defaultSteps;
  //   const [steps, setSteps] = useState(defaultSteps);

  useEffect(() => {
    // Ensure all content is loaded
    const idToSearch = steps[currentStep].id;
    const element = document.getElementById(
      idToSearch ? idToSearch : "no-element"
    );

    if (element) {
      setElement(element);
    }
  }, [currentStep]);

  const handlePositionChange = (action: string) => {
    if (action === "next") {
      setCurrentStep((prev) => prev + 1);
    }
    if (action === "prev") {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <>
      <div id="no-element"></div>
      {element &&
        createPortal(
          <Badge
            currentStep={currentStep}
            element={element}
            title={steps[currentStep].title}
            text={steps[currentStep].text}
            handlePositionChange={handlePositionChange}
            numberOfSteps={steps.length}
          />,
          //   @ts-ignore
          element.parentNode
        )}
    </>
  );
};

type BadgeProps = {
  text: string;
  title: string;
  element: HTMLElement;
  color?: string;
  currentStep: number;
  numberOfSteps: number;
  handlePositionChange: (action: string) => void;
};

const Badge = ({
  text,
  title,
  handlePositionChange,
  element,
  numberOfSteps,
  currentStep,
}: BadgeProps) => {
  const { t } = useTranslation();
  const { setOpenedModals } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
  }));

  let cachedStyles = element
    ? {
        border: element.style.border,
        zIndex: element.style.zIndex,
        background: element.style.background,
        borderRadius: element.style.borderRadius,
      }
    : {
        border: "",
        zIndex: "",
        background: "",
        borderRadius: "",
      };

  useEffect(() => {
    if (!element) return;

    if (element.id !== "no-element") {
      element.style.border = "2px solid red";
    }
    element.style.zIndex = "1";
    element.style.borderRadius = "10px";
    element.style.background = "white";
    return () => {
      element.style.border = cachedStyles.border;
      element.style.zIndex = "0";
      element.style.borderRadius = cachedStyles.borderRadius;
      element.style.background = cachedStyles.background;
    };
  }, [element]);

  const next = () => {
    handlePositionChange("next");
  };
  const prev = () => {
    handlePositionChange("prev");
  };

  const closeTutorial = () => {
    setOpenedModals({ tutorial: false });
  };

  // Get the bounding rectangle
const rect = element.getBoundingClientRect();

// Calculate the distance from the top of the screen to the bottom of the element
const distance = rect.bottom + window.scrollY;
  return (
    <>
      <div className="presentator"></div>
      <div style={{top: distance + 200}} className="_badge">
        <h2>{t(title)}</h2>
        <div className="_content"
          dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(t(text)) }}
        ></div>

        <div className="_footer">
          {!(currentStep === 0) && (
            <SimpleButton
              extraClass="pill"
              svg={svgs.prevArrowButton}
              action={prev}
            />
          )}
          {!(currentStep === numberOfSteps - 1) && (
            <SimpleButton
              extraClass="pill"
              svg={svgs.nextArrowButton}
              action={next}
            />
          )}
          {currentStep === numberOfSteps - 1 && (
            <SimpleButton
              extraClass="pill border-blue color-blue on-hover-active"
              text={"Finish!"}
              //   svg={svgs.closeIcon}
              action={closeTutorial}
            />
          )}
        </div>
      </div>
    </>
  );
};
