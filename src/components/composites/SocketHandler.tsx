import useStore from "../../utils/store";
import { useEffect, useState } from "react";
import { InputModal } from "../sections/modals/InputModal";

import "./styles.css";
export function SocketHandler() {
  const {
    compilerSocket,
    exercises,

    setShouldBeTested,
    getCurrentExercise,
    currentExercisePosition,
  } = useStore((state) => ({
    compilerSocket: state.compilerSocket,
    exercises: state.exercises,
    setAllowedActions: state.setAllowedActions,
    setShouldBeTested: state.setShouldBeTested,
    getCurrentExercise: state.getCurrentExercise,
    currentExercisePosition: state.currentExercisePosition,
  }));

  const [inputsResponses, setInputsResponses] = useState([] as string[]);
  const [inputs, setInputs] = useState([] as string[]);
  const [shouldWeSend, setShouldWeSend] = useState(false);

  useEffect(() => {
    compilerSocket.on("file_change", (data: any) => {
      const current = getCurrentExercise();
      const fullpath = data.logs;

      const doesCurrentStepChange = fullpath.includes(current.path);

      if (!doesCurrentStepChange) return;

      setShouldBeTested(true);
    });
  }, []);

  useEffect(() => {
    compilerSocket.on("reload", (data: any) => {
      data;
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
        exerciseSlug: exercises[Number(currentExercisePosition)].slug,
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
    const newInputs = inputs.slice(1);
    setInputs(newInputs);

    if (newInputs.length === 0) {
      setShouldWeSend(true);
    }
  };

  const handleInputSubmit = (value: string) => {
    setInputsResponses((prev) => [...prev, value]);
    const newInputs = inputs.slice(1);
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
