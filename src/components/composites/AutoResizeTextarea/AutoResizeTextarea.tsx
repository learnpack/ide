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
    const textarea = ref.current;
    if (!textarea) return;

    // Measuring requires collapsing the textarea to its natural height, which
    // makes the browser scroll the focused caret back into view and drags every
    // scrollable ancestor with it. Snapshot those offsets and put them back
    // before the browser paints, so the measurement stays invisible.
    const scrollers: [Element, number][] = [];
    for (let node = textarea.parentElement; node; node = node.parentElement) {
      scrollers.push([node, node.scrollTop]);
    }
    const windowScrollY = window.scrollY;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;

    for (const [node, scrollTop] of scrollers) node.scrollTop = scrollTop;
    window.scrollTo(window.scrollX, windowScrollY);
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
