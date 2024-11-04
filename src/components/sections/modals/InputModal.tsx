import { useState } from "react";
import { Modal } from "../../mockups/Modal";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";
type TInputModalProps = {
  name: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export const InputModal = ({ name, onCancel, onSubmit }: TInputModalProps) => {
  const { t } = useTranslation();

  const [value, setValue] = useState("");
  const handleSubmit = () => {
    onSubmit(value);
    setValue("");
  };

  return (
    <Modal outsideClickHandler={onCancel}>
      <div className="input-modal">
        <h3>{name}</h3>
        <input
          className="input"
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          type="text"
          value={value}
          placeholder="Enter your value here"
        />
        <div className="d-flex justify-center gap-small">
          <SimpleButton
            extraClass="bg-blue text-white big rounded"
            action={handleSubmit}
            text={t("Submit")}
          />
          <SimpleButton
            action={onCancel}
            text={t("cancel")}
            extraClass="border-blue text-blue big rounded"
          />
        </div>
      </div>
    </Modal>
  );
};
