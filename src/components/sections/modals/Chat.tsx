import useStore from "../../../utils/store";
import { ChatTab } from "../../Rigobot/Rigobot";

export default function Chat() {
  const { isRigoOpened } = useStore((state) => ({
    isRigoOpened: state.isRigoOpened,
  }));

  return (
    <>
      {isRigoOpened && (
        <div className="chat-modal">
          <ChatTab />
        </div>
      )}
    </>
  );
}
