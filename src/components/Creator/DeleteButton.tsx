import SimpleButton from "../mockups/SimpleButton";
import { deleteTutorial } from "../../utils/creator";
import useStore from "../../utils/store";
import { svgs } from "../../assets/svgs";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
export const DeleteButton = () => {
  const { t } = useTranslation();
  const breathecodeToken = useStore((state) => state.bc_token);
  const rigoToken = useStore((state) => state.token);

  const handleDelete = async () => {
    const toastId = toast.loading(t("deleting-tutorial"));
    const response = await deleteTutorial(breathecodeToken, rigoToken);
    console.log(response);
    toast.success(t("tutorial-deleted-successfully"), { id: toastId });
  };
  return (
    <SimpleButton
      svg={svgs.trash}
      action={handleDelete}
      text={t("delete")}
      title={t("delete-tutorial-tooltip")}
      confirmationMessage={t("sure?")}
      extraClass="danger-on-hover w-100 rounded padding-small text-danger"
    />
  );
};
