import useStore from "../../utils/store"
import { useEffect } from "react";
export function SocketHandler() {
    const { compilerSocket, exercises, currentExercisePosition, setAllowedActions } = useStore(state => ({
        compilerSocket: state.compilerSocket,
        exercises: state.exercises,
        currentExercisePosition: state.currentExercisePosition,
        setAllowedActions: state.setAllowedActions
    }));

    useEffect(() => {
        // const modal: HTMLElement | null = document.querySelector("#socket-disconnected");

        // if (modal) {
        //     modal.style.display = "none";
        // }
        // compilerSocket.whenUpdated((scope: any, data: any) => {
        //     console.log(data);
        //     console.log(scope);
        //   });

    }, [])

    useEffect(() => {

        const slug = exercises[currentExercisePosition]?.slug


        compilerSocket.whenUpdated((scope: any, data: any) => {
            scope;
            if (data.status && data.status == "ready") {
                setAllowedActions(data.allowed)
            }
        });

        compilerSocket.on("reload", (data: any) => {
            data;
            // console.log("Reloading...", data);
            window.location.reload();
        })

        compilerSocket.on("ask", async ({ inputs }: any) => {
            const inputsResponses = [];

            for (let i = 0; i < inputs.length; i++) {
                inputsResponses.push(await prompt(inputs[i] || `Please enter the ${i + 1} input`));
            }

            compilerSocket.emit('input', {
                inputs: inputsResponses,
                exerciseSlug: slug
            });
        });


    }, [currentExercisePosition, exercises])

    return <>
    </>
}