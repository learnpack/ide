import useStore from "../../utils/store"
import { useEffect } from "react";
export function SocketHandler() {
    const { compilerSocket, exercises, currentExercisePosition, setAllowedActions } = useStore();

    useEffect(() => {
        const modal: HTMLElement | null = document.querySelector("#socket-disconnected");

        if (modal) {
            modal.style.display = "none";
        }
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