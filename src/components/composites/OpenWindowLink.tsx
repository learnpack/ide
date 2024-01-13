import useStore from "../../utils/store";

type TOpenWindowLinkProps = {
    href: string;
    text: string;
}
export const OpenWindowLink = ({href, text}: TOpenWindowLinkProps) => {

    const compilerSocket = useStore(state => state.compilerSocket);
    const getCurrentExercise = useStore(state => state.getCurrentExercise);
    
    const handleRedirect = (e:any) => {
        e.preventDefault();
        const url = e.target.href;
        const data = {
            url,
            exerciseSlug: getCurrentExercise().slug,
        }
        compilerSocket.openWindow(data);  
    }

    return <a href={href} onClick={handleRedirect}>{text}</a>
}