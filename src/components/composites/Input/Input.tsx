import { useRef } from "react";
import { svgs } from "../../../assets/svgs";
import SimpleButton from "../../mockups/SimpleButton";
import { RigoAI } from "../../Rigobot/AI";

type TInputProps = {
  placeholder: string;
  defaultValue: string;
  name: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  context?: string;
  useAI?: boolean;
};
export const Input = ({
  placeholder,
  defaultValue,
  name,
  className,
  onChange,
  onBlur,
  context,
  useAI,
}: TInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const fillWithAI = () => {
    if (inputRef.current && context) {
      console.log("context", context);

      RigoAI.useTemplate({
        slug: "fill-input",
        inputs: {
          input_info: context,
        },
        target: inputRef.current,
        onComplete: (success: boolean, data: any) => {
          if (success && inputRef.current) {
            inputRef.current.value = data.ai_response;
          }
        },
      });
    }
  };

  return (
    <div className="d-flex align-center gap-small w-100">
      <input
        ref={inputRef}
        type="text"
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        className={className}
      />
      {useAI && (
        <SimpleButton
          extraClass="active-on-hover"
          svg={svgs.random}
          action={fillWithAI}
        />
      )}
    </div>
  );
};
