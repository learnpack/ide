import { useRef, useState } from "react";

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

  return (
    <button
      id={id}
      disabled={Boolean(disabled)}
      className={`simple-button-svg ${extraClass} ${size}`}
      onClick={handleClick}
      title={title}
      type={type}
    >
      {svg && <span className="d-flex align-center">{svg}</span>}
      {currentText && (
        <span className="d-flex align-center">{currentText}</span>
      )}
    </button>
  );
}
