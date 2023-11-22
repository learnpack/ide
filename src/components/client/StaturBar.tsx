import useStore from "../../utils/store"
import { useEffect } from "react";
export function StatusBar() {
    const {compilerSocket, setPosition, setLanguage, exercises, currentExercisePosition, getConfigObject, setAllowedActions}  = useStore();

    useEffect(()=>{
        getConfigObject();
        
        const slug = exercises[currentExercisePosition]?.slug
      
        compilerSocket.whenUpdated((scope:any, data:any) => {
            scope;
            if (data.status && data.status == "ready") {                        setAllowedActions(data.allowed)

            }
        });

        compilerSocket.on("open_window", (data:any) => {
            console.log("Trying to pen window...", data);
        })


        compilerSocket.on("reload", (data:any) => {
            data;
            // console.log("Reloading...", data);
            window.location.reload();
        })

        compilerSocket.on("ask", async ({ inputs }:any) => {
            
            
            const inputsResponses = [];

            for (let i = 0; i < inputs.length; i++) {
                inputsResponses.push(await prompt(inputs[i] || `Please enter the ${i+1} input`));
            }
            
            compilerSocket.emit('input', {
                inputs: inputsResponses,
                exerciseSlug: slug
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
            

            setPosition(Number(position));
            setLanguage(language);
        }

    }, [currentExercisePosition, exercises])

    return <>
    <span className="status-bar">
    </span>
    </>
}