import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./styles.css";
import { svgs } from "../../assets/svgs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface IModal {
  children: React.ReactNode;
  htmlId?: string;
  extraClass?: string;
  outsideClickHandler?: () => void;
  blockScroll?: boolean;
  minWidth?: string;
  showCloseButton?: boolean;
  addPadding?: boolean;
  zIndex?: number;
  resizable?: boolean;
}

export const Modal = ({
  children,
  outsideClickHandler,
  htmlId,
  extraClass,
  blockScroll = true,
  minWidth = "600px",
  showCloseButton = true,
  addPadding = true,
  zIndex = 1000,
  resizable = false,
}: IModal) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  // Helper para convertir vw/vh a píxeles
  const vwToPx = (vw: number) => (window.innerWidth * vw) / 100;
  const vhToPx = (vh: number) => (window.innerHeight * vh) / 100;

  const getInitialSize = () => ({
    width: vwToPx(80), // 50vw
    height: vhToPx(60), // 50vh
  });
  
  const [modalSize, setModalSize] = useState(getInitialSize);
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const MIN_WIDTH = 200;
  const MIN_HEIGHT = 150;

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

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!resizable || !modalContentRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = {
      width: modalContentRef.current.offsetWidth,
      height: modalContentRef.current.offsetHeight,
    };
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    setModalSize({
      width: Math.max(MIN_WIDTH, startSize.current.width + deltaX),
      height: Math.max(MIN_HEIGHT, startSize.current.height + deltaY),
    });
  };

  const handleResizeEnd = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
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

    // Inicializar tamaño cuando el modal se monta (solo si es resizable)
    if (resizable) {
      setModalSize(getInitialSize());
    }

    return () => {
      if (modalRef.current) {
        modalRef.current.removeEventListener("mousedown", handleClickOutside);
      }
      if (blockScroll) {
        document.body.style.overflow = originalOverflow;
      }
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [resizable]);

  return createPortal(
    <div
      ref={modalRef}
      className={`self-closing-modal ${addPadding ? "padding" : ""}`}
      id={htmlId}
      style={
        {
          "--modal-min-width": minWidth,
          zIndex: zIndex,
        } as React.CSSProperties
      }
    >
      <div
        ref={modalContentRef}
        className={`modal-content ${extraClass ? extraClass : ""} ${resizable ? "resizable" : ""}`}
        style={
          resizable
            ? {
                width: `${modalSize.width}px`,
                height: `${modalSize.height}px`,
                minWidth: `${MIN_WIDTH}px`,
                minHeight: `${MIN_HEIGHT}px`,
              }
            : undefined
        }
      >
        {outsideClickHandler && showCloseButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div onClick={outsideClickHandler} className="modal-closer">
                {svgs.closeX}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("close-modal")}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {children}
        {resizable && (
          <div className="resize-handle" onMouseDown={handleResizeStart} />
        )}
      </div>
    </div>,
    document.body
  );
};
