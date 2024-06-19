import { convertMarkdownToHTML } from "../../../utils/lib";
import useStore from "../../../utils/store";
import { Modal } from "../../mockups/Modal";

const formatMessage = (message: string) => {
  return message.replace("BAD_PROMPT", "Bad Prompt").replace("GOOD_PROMPT", "Good Prompt");
}


export const DialogModal = () => {
  const { setOpenedModals, dialogData } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
    dialogData: state.dialogData,
  }));

  return (
    <Modal outsideClickHandler={() => setOpenedModals({ dialog: false })}>
      <div
        dangerouslySetInnerHTML={{
          __html: convertMarkdownToHTML(formatMessage(dialogData.message)),
        }}
      ></div>
    </Modal>
  );
};
