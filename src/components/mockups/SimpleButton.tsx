import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ButtonProps {
  id?: string;
  text?: JSX.Element | string;
  svg?: any;
  extraClass?: string;
  action?: ((e: any) => void) | (() => void);
  disabled?: boolean;
  size?: "small" | "big" | "mini";
  title?: string;
  type?: "button" | "submit";
  confirmationMessage?: string;
}

export default function SimpleButton({
  text,
  action,
  svg,
  extraClass,
  disabled,
  id,
  size,
  title,
  confirmationMessage,
  type = "button",
}: ButtonProps) {
  const timesClicked = useRef(0);
  const [currentText, setCurrentText] = useState(text);

  const handleClick = (e: any) => {
    if (!action) return;
    if (!confirmationMessage) {
      action(e);
      return;
    }

    if (timesClicked.current === 0) {
      setCurrentText(confirmationMessage);
      timesClicked.current++;
    } else {
      action(e);
    }
  };

  useEffect(() => {
    setCurrentText(text);
  }, [text]);

  const buttonElement = (
    <button
      id={id}
      disabled={Boolean(disabled)}
      className={`simple-button-svg ${extraClass} ${size}`}
      onClick={handleClick}
      type={type}
    >
      {svg && <span className="d-flex align-center">{svg}</span>}
      {currentText && (
        <span className="d-flex align-center">{currentText}</span>
      )}
    </button>
  );

  // Si hay title, envolver con Tooltip, sino devolver el botón directamente
  if (title) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonElement}
          </TooltipTrigger>
          <TooltipContent>
            <p>{title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonElement;
}
