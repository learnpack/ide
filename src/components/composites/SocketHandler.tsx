import useStore from "../../utils/store";
import { useEffect, useState } from "react";
import "./styles.css";
export function SocketHandler() {
  const {
    compilerSocket,
    exercises,
    currentExercisePosition,
    setAllowedActions,
  } = useStore((state) => ({
    compilerSocket: state.compilerSocket,
    exercises: state.exercises,
    currentExercisePosition: state.currentExercisePosition,
    setAllowedActions: state.setAllowedActions,
  }));

  const [inputsResponses, setInputsResponses] = useState([] as string[]);
  const [inputs, setInputs] = useState([] as string[]);
  const [shouldWeSend, setShouldWeSend] = useState(false);

  useEffect(() => {
    compilerSocket.whenUpdated((scope: any, data: any) => {
      scope;
      if (data.status && data.status == "ready") {
        setAllowedActions(data.allowed);
      }
    });

    compilerSocket.on("reload", (data: any) => {
      data;
      // console.log("Reloading...", data);
      window.location.reload();
    });

    compilerSocket.on("ask", async ({ inputs }: any) => {
      setInputs(inputs);
    });
  }, [currentExercisePosition, exercises]);

  useEffect(() => {
    if (inputsResponses.length === 0) return;

    const emitResponses = () => {
      compilerSocket.emit("input", {
        inputs: inputsResponses,
        exerciseSlug: exercises[currentExercisePosition].slug,
      });

      setInputsResponses([]);
    };

    if (shouldWeSend) {
      emitResponses();
      setShouldWeSend(false);
    }
  }, [shouldWeSend]);

  const handleCancel = () => {
    setInputsResponses((prev) => [...prev, ""]);
    const newInputs = inputs.slice(1)
    setInputs(newInputs);

    if (newInputs.length === 0) {
      setShouldWeSend(true);
    }
  };

  const handleInputSubmit = (value: string) => {
    setInputsResponses((prev) => [...prev, value]);
    const newInputs = inputs.slice(1)
    setInputs(newInputs);

    if (newInputs.length === 0) {
      setShouldWeSend(true);
    }
    
  };

  return (
    <>
      {inputs.length > 0 && (
        <InputModal
          name={inputs[0]}
          onCancel={handleCancel}
          onSubmit={handleInputSubmit}
        />
      )}
    </>
  );
}

type TInputModalProps = {
  name: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

const InputModal = ({ name, onCancel, onSubmit }: TInputModalProps) => {
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
