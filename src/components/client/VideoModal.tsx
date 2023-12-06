import React from 'react';
import { svgs } from '../../resources/svgs';

interface IVideoModalProps {
    link: string;
    hideModal: () => void;
}

const VideoModal: React.FC<IVideoModalProps> = ({ link, hideModal }) => {

    return <section className='pos-absolute'>
        <div className="video-modal">
            <div className="modal-content">
                <span className="close" onClick={hideModal}>{svgs.closeIcon}</span>
                <iframe
                    title="Video Modal"
                    width="460"
                    height="315"
                    src={link}
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    </section>

};

export default VideoModal;
