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

  const resizeTextarea = () => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (ref.current && defaultValue !== undefined) {
      ref.current.value = defaultValue;
      resizeTextarea();
    }
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    resizeTextarea();
  };

  return (
    <textarea
      {...props}
      ref={ref}
      // value={value}
      onChange={handleChange}
      onInput={resizeTextarea}
      placeholder={placeholder}
      rows={rows}
      className={`auto-resize-textarea ${className}`}
      style={{
        overflow: "hidden",
        resize: "none",
        minHeight,
        ...style,
      }}
    />
  );
};
