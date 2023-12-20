import { useEffect, useRef } from "react"
import { createPortal } from "react-dom";

interface IModal {
    children: React.ReactNode;
    outsideClickHandler: () => void;
}

export const Modal = ({ children, outsideClickHandler }: IModal) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const handleClickOutside = (event: any) => {
        if (modalRef.current === event.target) {
            outsideClickHandler()
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        createPortal(
        <div
            ref={modalRef}
            className="self-closing-modal">
            <div className="modal-content">
                {children}
            </div>
        </div>,
        document.body

        )
    )
}