// UNUSED

import SimpleButton from "../../mockups/Button";

import useStore from "../../../utils/store";
interface ISvgProps {
    svg: any;
}


export default function ToggleSidebarButton({ svg }: ISvgProps) {
    const { toggleSidebar } = useStore(state => ({
        toggleSidebar: state.toggleSidebar
    }));
    return <SimpleButton text="" svg={svg} action={toggleSidebar} />
}