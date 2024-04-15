import React, { useRef } from "react";
// import { svgs } from '../../resources/svgs';
import useStore from "../../../utils/store";
interface IVideoModalProps {
  link: string;
  hideModal: () => void;
}

const VideoModal: React.FC<IVideoModalProps> = ({ link, hideModal }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { openLink } = useStore(store => ({
    openLink: store.openLink,
  }));

  const handleClickOutside = (event: any) => {
    if (modalRef.current == event.target) {
      hideModal();
    }
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenLink = () => {
    openLink(link);
    hideModal();
  }


  return (
    <section  onClick={handleClickOutside}>
      <div ref={modalRef} className="video-modal">
        <div className="modal-content">
          <div  className="iframe-zoomeable">
            <iframe
              title="Video Modal"
              width="100%"
              height="100%"
              src={link}
              allowFullScreen
            ></iframe>
          </div>
          <span className="close bg-gray"  onClick={handleOpenLink}>
            Open in Youtube
          </span>
          <span className="close" onClick={hideModal}>
            Close the video and start exercise
          </span>
        </div>
      </div>
    </section>
  );
};

export default VideoModal;
