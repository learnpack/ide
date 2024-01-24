import useStore from "../../utils/store";
import { useEffect, useState } from "react";
import { InputModal } from "../sections/modals/InputModal";

import "./styles.css";
export function SocketHandler() {
  const {
    compilerSocket,
    exercises,
    currentExercisePosition,
    setShouldBeTested
  } = useStore((state) => ({
    compilerSocket: state.compilerSocket,
    exercises: state.exercises,
    currentExercisePosition: state.currentExercisePosition,
    setAllowedActions: state.setAllowedActions,
    setShouldBeTested: state.setShouldBeTested
  }));

  const [inputsResponses, setInputsResponses] = useState([] as string[]);
  const [inputs, setInputs] = useState([] as string[]);
  const [shouldWeSend, setShouldWeSend] = useState(false);


  useEffect(() => {
    compilerSocket.on("file_change", (data: any) => {
      const fullpath = data.logs
      const currentExercisePath = exercises[currentExercisePosition].path
      const doesCurrentStepChange = fullpath.includes(currentExercisePath)
      
      if (!doesCurrentStepChange) return;
      setShouldBeTested(true)
      console.log(`This file: ${fullpath} changed, we need to test again!`);
    })
  })

  useEffect(() => {
    // compilerSocket.whenUpdated((scope: any, data: any) => {
    //   scope;
    //   if (data.status && data.status == "ready") {
    //     setAllowedActions(data.allowed);
    //   }
    // });

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

