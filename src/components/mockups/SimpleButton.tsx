import { useRef } from "react";
import toast from "react-hot-toast";

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

  const handleClick = (e: any) => {
    if (!action) return;
    if (!confirmationMessage) {
      action(e);
      return;
    }

    if (timesClicked.current === 0) {
      toast.error(confirmationMessage || "Please confirm the action");
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
      {text && <span className="d-flex align-center">{text}</span>}
    </button>
  );
}
