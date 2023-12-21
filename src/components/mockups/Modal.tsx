import { useEffect, useRef } from "react"
import { createPortal } from "react-dom";
import "./styles.css";

interface IModal {
    children: React.ReactNode;
    htmlId?: string;
    extraClass?: string;
    outsideClickHandler: () => void;
}

export const Modal = ({ children, outsideClickHandler, htmlId, extraClass }: IModal) => {
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
                className="self-closing-modal"
                id={htmlId}
            >

                <div className={`modal-content ${extraClass}`}>
                    {children}
                </div>
            </div>,
            document.body

        )
    )
}