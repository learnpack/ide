import { useEffect, useRef } from "react";

export const Loader = ({
  text,
  svg,
  extraClass,
  size = "sm",
  color = "var(--color-active)",
}: {
  text?: string;
  svg?: React.ReactNode;
  extraClass?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}) => {
  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (loaderRef.current && color) {
      loaderRef.current.style.setProperty("--color-active", color);
    }
  }, [color]);
  return (
    <div ref={loaderRef} className={`loader ${extraClass} ${size}`}>
      <div className="loader-icon">{svg || ""}</div>
      {text && <div className="loader-text">{text}</div>}
    </div>
  );
};
