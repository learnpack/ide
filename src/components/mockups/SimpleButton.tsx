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
  type = "button",
}: ButtonProps) {
  return (
    <button
      id={id}
      disabled={Boolean(disabled)}
      className={`simple-button-svg ${extraClass} ${size}`}
      onClick={action}
      title={title}
      type={type}
    >
      {svg && <span className="d-flex align-center">{svg}</span>}
      {text && <span className="d-flex align-center">{text}</span>}
    </button>
  );
}
