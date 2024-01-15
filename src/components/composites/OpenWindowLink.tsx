import useStore from "../../utils/store";

type TOpenWindowLinkProps = {
    href: string;
    text: string;
}
export const OpenWindowLink = ({href, text}: TOpenWindowLinkProps) => {

    const openLink = useStore(state => state.openLink);
    
    const handleRedirect = (e:any) => {
        e.preventDefault();
        openLink(e.target.href)
    }

    return <a href={href} onClick={handleRedirect}>{text}</a>
}