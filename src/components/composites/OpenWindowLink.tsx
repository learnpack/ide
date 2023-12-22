import useStore from "../../utils/store";

type TOpenWindowLinkProps = {
    href: string;
    text: string;
}
export const OpenWindowLink = ({href, text}: TOpenWindowLinkProps) => {

    const compilerSocket = useStore(state => state.compilerSocket);
    const exercises = useStore(state => state.exercises);
    const currentExercisePosition = useStore(state => state.currentExercisePosition);
    
    const handleRedirect = (e:any) => {
        e.preventDefault();
        const url = e.target.href;
        const data = {
            url,
            exerciseSlug: exercises[currentExercisePosition].slug,
        }
        compilerSocket.openWindow(data);  
    }

    return <a href={href} onClick={handleRedirect}>{text}</a>
}