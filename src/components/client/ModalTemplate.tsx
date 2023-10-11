import { ReactNode } from "react";

interface IModalTemplate {
    htmlId: string;
    header: ReactNode;
    content: ReactNode;
    footer: ReactNode;
}

export default function ModalTemplate({header, content, footer, htmlId}: IModalTemplate) {
    return <>
    <div id={htmlId} className="modal-container">
        <div>
            <div className="modal-header">
                {header}
            </div>
            <div className="modal-content">
                {content}
            </div>
            <div className="modal-footer">
                {footer}
            </div>
        </div>
    </div>
    </>
}