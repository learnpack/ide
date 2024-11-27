import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";

export const ToggleSidebar = () => {
  const { setShowSidebar, showSidebar } = useStore((state) => ({
    setShowSidebar: state.setShowSidebar,
    showSidebar: state.showSidebar,
  }));

  return (
    <SimpleButton
      svg={svgs.dropdownButton}
      id="sidebar-toggle"
      extraClass={`padding-small rounded ${
        showSidebar ? "bg-rigo " : ""
      }`}
      action={() => {
        setShowSidebar(!showSidebar);
      }}
    />
  );
};
