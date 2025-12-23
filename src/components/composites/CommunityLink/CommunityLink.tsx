import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";

export const CommunityLink = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { setOpenedModals } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
  }));

  return (
    <div
      onClick={() => {
        setOpenedModals({ community: true });
      }}
      className="d-inline-flex align-items-center gap-small padding-small rounded bg-blue-opaque fit-content active-on-hover"
    >
      <span style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <span style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {svgs.whatsapp}
        </span>
      </span>
      <span>{children}</span>
    </div>
  );
};

