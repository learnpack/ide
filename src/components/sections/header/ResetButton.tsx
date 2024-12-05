import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";
import "./styles.css";

export default function ResetButton() {
  const { setOpenedModals } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
  }));
  const { t } = useTranslation();

  return (
    <SimpleButton
      extraClass="pill color-blue editor-footer-child opaque-blue-on-hover"
      svg={svgs.resetIcon}
      text={t("Reset")}
      id="reset-button"
      action={() => setOpenedModals({ reset: true })}
    />
  );
}
