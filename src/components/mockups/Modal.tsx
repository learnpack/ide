import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./styles.css";

interface IModal {
  children: React.ReactNode;
  htmlId?: string;
  extraClass?: string;
  outsideClickHandler: () => void;
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
    if (modalRef.current === event.target) {
      outsideClickHandler();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    const originalOverflow = document.body.style.overflow;
    
    if (blockScroll) {
      // Set overflow to hidden when the modal is opened
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (blockScroll) {
        document.body.style.overflow = originalOverflow;
      }
      // Reset overflow to initial value when the modal is closed
    };
  }, []);

  return createPortal(
    <div ref={modalRef} className="self-closing-modal" id={htmlId}>
      <div className={`modal-content ${extraClass}`}>{children}</div>
    </div>,
    document.body
  );
};
