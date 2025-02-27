import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./styles.css";
import { svgs } from "../../assets/svgs";

interface IModal {
  children: React.ReactNode;
  htmlId?: string;
  extraClass?: string;
  outsideClickHandler?: () => void;
  blockScroll?: boolean;
}

export const Modal = ({
  children,
  outsideClickHandler,
  htmlId,
  extraClass,
  blockScroll = true,
}: IModal) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: any) => {
    
    if (
      modalRef.current === event.target ||
      (typeof event.target.classList === "function" &&
        event.target.classList &&
        event.target.classList.contains("modal-closer"))
    ) {
      if (outsideClickHandler) {
        outsideClickHandler();
      }
    }
  };

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.addEventListener("mousedown", handleClickOutside);
    }
    const originalOverflow = document.body.style.overflow;

    if (blockScroll) {
      // Set overflow to hidden when the modal is opened
      document.body.style.overflow = "hidden";
    }

    return () => {
      if (modalRef.current) {
        modalRef.current.removeEventListener("mousedown", handleClickOutside);
      }
      if (blockScroll) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, []);

  return createPortal(
    <div ref={modalRef} className="self-closing-modal" id={htmlId}>
      <div className={`modal-content ${extraClass ? extraClass : ""}`}>
        {outsideClickHandler && (
          <div onClick={outsideClickHandler} className="modal-closer">
            {svgs.closeIcon}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};
