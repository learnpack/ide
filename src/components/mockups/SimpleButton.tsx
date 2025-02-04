interface ButtonProps {
  id?: string;
  text?: JSX.Element | string;
  svg?: any;
  extraClass?: string;
  action?: ((e: any) => void) | (() => void);
  disabled?: boolean;
  size?: "small" | "big" | "mini";
  title?: string;
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
}: ButtonProps) {
  return (
    <button
      id={id}
      disabled={Boolean(disabled)}
      className={`simple-button-svg ${extraClass} ${size}`}
      onClick={action}
      title={title}
    >
      {svg && <span className="d-flex align-center">{svg}</span>}
      {text && <span className="d-flex align-center">{text}</span>}
    </button>
  );
}
