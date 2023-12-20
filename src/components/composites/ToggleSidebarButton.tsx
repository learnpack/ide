// UNUSED

import SimpleButton from "../templates/Button";

import useStore from "../../utils/store";
interface ISvgProps {
    svg: any;
}


export default function ToggleSidebarButton({ svg }: ISvgProps) {
    const { toggleSidebar } = useStore();
    return <SimpleButton text="" svg={svg} action={toggleSidebar} />
}