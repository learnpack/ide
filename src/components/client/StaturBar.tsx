import useStore from "../../utils/store"
import { useEffect } from "react";
export function StatusBar() {
    const {compilerSocket, setPosition, setLanguage, currentExercisePosition, exercises}  = useStore();

    useEffect(()=>{
        compilerSocket.on("reload", (data:any) => {
            console.log("Reloading...", data);
            window.location.reload();
        })

        compilerSocket.on("ask", async ({ inputs }:any) => {
            const inputsResponses = [];

            for (let i = 0; i < inputs.length; i++) {
                inputsResponses.push(await prompt(inputs[i] || `Please enter the ${i+1} input`));
            }
            
            console.log("inputsResponses", inputsResponses);
            
            console.log("exercises[currentExercisePosition]", exercises[currentExercisePosition]);
            
            compilerSocket.emit('input', {
                inputs: inputsResponses,
                exerciseSlug: exercises[currentExercisePosition].slug
            });
        });

        let params = window.location.hash.substring(1);
        if (params) {
            let paramsArray = params.split('&');
            let language = "";
            let position = "";
            if (paramsArray.length >= 1) {
                const langIndex = paramsArray.findIndex(item => item.includes("language"));
                if (langIndex != -1) {
                    language = paramsArray[langIndex].split("=")[1]
                }

                const posIndex = paramsArray.findIndex(item => item.includes("currentExercise"));
                if (posIndex != -1) {
                    position = paramsArray[posIndex].split("=")[1]
                }

            }
            

            setPosition(Number(position))
            setLanguage(language)
        }

    }, [])
    return <>
    <span className="status-bar">
        
    </span>
    </>
}