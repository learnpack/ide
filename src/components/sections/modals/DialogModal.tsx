import { convertMarkdownToHTML } from "../../../utils/lib";
import useStore from "../../../utils/store";
import { Modal } from "../../mockups/Modal";

export const DialogModal = () => {
  const { setOpenedModals, dialogData } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
    dialogData: state.dialogData,
  }));

  return (
    <Modal outsideClickHandler={() => setOpenedModals({ dialog: false })}>
      <div
        dangerouslySetInnerHTML={{
          __html: convertMarkdownToHTML(dialogData.message),
        }}
      ></div>
    </Modal>
  );
};
