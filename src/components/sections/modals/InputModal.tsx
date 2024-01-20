import { useState } from "react";
type TInputModalProps = {
    name: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
  };
  
  export const InputModal = ({ name, onCancel, onSubmit }: TInputModalProps) => {
    const [value, setValue] = useState("");
    const handleSubmit = () => {
      onSubmit(value);
      setValue("");
    };
  
    return (
      <div className="input-modal">
        <h3>{name}</h3>
        <input
          onKeyUp={(e) => {
              if (e.key === "Enter") {
                  handleSubmit();
              }
          }}
          onChange={(e) => setValue(e.target.value)}
          type="text"
          value={value}
          placeholder="Enter your value here"
        />
        <div>
          <button onClick={handleSubmit} className="bg-blue">
            Submit
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    );
  };
  