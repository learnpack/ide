import "./_.css";
// import useStore from "../../../utils/store";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { defaultSteps } from "../../../utils/presentation";
import { Markdowner } from "../Markdowner/Markdowner";

type PresentatorProps = {};

export const Presentator = ({}: PresentatorProps) => {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = defaultSteps;

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
            position={steps[currentStep].position}
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
  position: any;
  handlePositionChange: (action: string) => void;
};

const Badge = ({
  text,
  title,
  handlePositionChange,
  element,
  numberOfSteps,
  currentStep,
  position,
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

  const handleClickBackdrop = (e: any) => {
    if (e.target.classList.contains("presentator")) {
      closeTutorial();
    }
  };

  return (
    <>
      <div onClick={handleClickBackdrop} className="presentator"></div>
      <div style={{ top: position[0], left: position[1] }} className="_badge">
        <h2>{t(title)}</h2>
        <Markdowner markdown={t(text)} />

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
