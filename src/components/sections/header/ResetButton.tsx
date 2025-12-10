import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { useTranslation } from "react-i18next";
import "./styles.css";

export default function ResetButton({ onReset }: { onReset?: () => void }) {
  const { t } = useTranslation();

  return (
    <SimpleButton
      extraClass="pill color-blue editor-footer-child opaque-blue-on-hover"
      svg={svgs.resetIcon}
      text={t("Reset")}
      id="reset-button"
      action={() => {
        onReset?.();
      }}
    />
  );
}
