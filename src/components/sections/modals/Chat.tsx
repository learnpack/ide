import useStore from "../../../utils/store";
import { AgentTab } from "../../Rigobot/Agent";

export default function Chat() {
  const { isRigoOpened } = useStore((state) => ({
    isRigoOpened: state.isRigoOpened,
  }));

  return (
    <>
      {isRigoOpened && (
        <div className="chat-modal">
          <AgentTab />
        </div>
      )}
    </>
  );
}
