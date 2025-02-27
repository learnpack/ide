import useStore from "../../../utils/store";
import { Markdowner } from "../../composites/Markdowner/Markdowner";
import { Modal } from "../../mockups/Modal";

const formatMessage = (message: string) => {
  return message
    .replace("BAD_PROMPT", "Bad Prompt")
    .replace("GOOD_PROMPT", "Good Prompt");
};

export const DialogModal = () => {
  const { setOpenedModals, dialogData } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
    dialogData: state.dialogData,
  }));

  return (
    <Modal outsideClickHandler={() => setOpenedModals({ dialog: false })}>
      <Markdowner markdown={formatMessage(dialogData.message)} />
    </Modal>
  );
};
