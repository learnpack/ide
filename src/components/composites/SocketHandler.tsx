import useStore from "../../utils/store";
import { useEffect, useState, useCallback } from "react";
import { InputModal } from "../sections/modals/InputModal";

import "./styles.css";
import { debounce } from "../../utils/lib";

export function SocketHandler() {
  const {
    compilerSocket,
    exercises,
    setShouldBeTested,
    getCurrentExercise,
    currentExercisePosition,
    // updateFileContent,
    setOpenedModals,
    refreshSession,
    updateDBSession,
    build,
    runExerciseTests,
    setUser,
    setAllowedActions,
  } = useStore((state) => ({
    compilerSocket: state.compilerSocket,
    exercises: state.exercises,
    setShouldBeTested: state.setShouldBeTested,
    getCurrentExercise: state.getCurrentExercise,
    currentExercisePosition: state.currentExercisePosition,
    // updateFileContent: state.updateFileContent,
    setOpenedModals: state.setOpenedModals,
    refreshSession: state.refreshDataFromAnotherTab,
    updateDBSession: state.updateDBSession,
    build: state.build,
    runExerciseTests: state.runExerciseTests,
    setUser: state.setUser,
    setAllowedActions: state.setAllowedActions,
  }));

  const [inputsResponses, setInputsResponses] = useState([] as string[]);
  const [inputs, setInputs] = useState([] as string[]);
  const [shouldWeSend, setShouldWeSend] = useState(false);
  const [nextAction, setNextAction] = useState("");

  const debouncedStore = useCallback(
    debounce(() => {
      updateDBSession();
    }, 4000),
    []
  );

  useEffect(() => {
    compilerSocket.on("file_change", async (data: any) => {
      const current = getCurrentExercise();
      const fullpath = data.logs;

      const doesCurrentStepChange = fullpath.includes(current.path);
      // const parts = fullpath.split("\\");
      // const fileName = parts[parts.length - 1];

      // const { fileContent } = await FetchManager.getFileContent(
      //   current.slug,
      //   fileName
      // );

      // const tab = {
      //   name: fileName,
      //   content: fileContent,
      //   isActive: false,
      //   id: fileName,
      //   modified: true,
      // };
      debouncedStore();
      // updateFileContent(current.slug, tab, true);

      if (!doesCurrentStepChange) return;
      setShouldBeTested(true);
    });

    compilerSocket.on("session-refreshed", function (data: any) {
      const _session = data.logs[0];

      setOpenedModals({ login: false });
      refreshSession({
        newToken: _session.rigobot.key,
        newTabHash: _session.tabHash,
        newBCToken: _session.token,
      });
      setUser(_session);
    });

    compilerSocket.onStatus("ready", (data: any) => {
      if (data.allowed) {
        // console.log("allowed", data.allowed);
        setAllowedActions(data.allowed);
      }
    });
  }, []);

  useEffect(() => {
    compilerSocket.on("reload", (data: any) => {
      data;
      window.location.reload();
    });

    compilerSocket.on("ask", async ({ inputs, nextAction }: any) => {
      setInputs(inputs);
      if (nextAction) {
        setNextAction(nextAction);
      }
    });
  }, [currentExercisePosition, exercises]);

  useEffect(() => {
    if (inputsResponses.length === 0) return;

    const emitResponses = () => {
      if (nextAction === "build") {
        build(
          exercises[Number(currentExercisePosition)].instructions,
          inputsResponses
        );
      }

      if (nextAction === "test") {
        runExerciseTests(
          {
            targetButton: "feedback",
            toast: true,
          },
          inputsResponses
        );
      }
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
