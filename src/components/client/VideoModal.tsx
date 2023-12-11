import React, {useRef} from 'react';
// import { svgs } from '../../resources/svgs';

interface IVideoModalProps {
    link: string;
    hideModal: () => void;
}

const VideoModal: React.FC<IVideoModalProps> = ({ link, hideModal }) => {

    const modalRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event:any) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
            console.log("Clicked outsid");
            
        }
        hideModal();
    }

    React.useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    return <section ref={modalRef} className='pos-absolute' onClick={handleClickOutside}>
        <div className="video-modal">
            <div className="modal-content">
                <iframe
                    title="Video Modal"
                    width="460"
                    height="315"
                    src={link}
                    allowFullScreen
                ></iframe>
                <span className="close" onClick={hideModal}>Close the video and start exercise</span>
            </div>
        </div>
    </section>
};

export default VideoModal;
