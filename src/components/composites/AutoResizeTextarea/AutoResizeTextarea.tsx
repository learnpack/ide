import { useEffect, useRef } from "react";

export const AutoResizeTextarea = ({
  // value,
  defaultValue,
  onChange,
  placeholder,
  className = "",
  rows = 1,
  minHeight,
  style = {},
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  defaultValue: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  minHeight?: string | number;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
      ref.current.value = defaultValue;
    }
  }, [defaultValue]);

  return (
    <textarea
      {...props}
      ref={ref}
      // value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`textarea ${className}`}
      style={{
        overflow: "hidden",
        resize: "none",
        minHeight,
        ...style,
      }}
    />
  );
};
