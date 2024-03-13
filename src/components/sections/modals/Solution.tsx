import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import toast from "react-hot-toast";
export const SolutionModal = () => {
    const {setOpenedModals, currentSolution} = useStore(state => ({
        setOpenedModals: state.setOpenedModals,
        currentSolution: state.currentSolution
    }))

    const copyCode = () => {
        navigator.clipboard.writeText(currentSolution);
        toast.success("Code copied to clipboard")
        setOpenedModals({solution: false})
    }
    return (
        <Modal outsideClickHandler={()=>setOpenedModals({solution: false})}>
            <h1>This is just one solution, can you find another one?</h1>
            <pre style={{textAlign: "left", minWidth: "100%"}}>
                <code>
                    {currentSolution}
                </code>
            </pre>
            <button onClick={copyCode} className="button">Copy code</button>
        </Modal>
    )
}