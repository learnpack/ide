import React, { useRef } from "react";
// import { svgs } from '../../resources/svgs';

interface IVideoModalProps {
  link: string;
  hideModal: () => void;
}

const VideoModal: React.FC<IVideoModalProps> = ({ link, hideModal }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: any) => {
    if (modalRef.current == event.target) {
      console.log("Clicked outsid");
      hideModal();
    }
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <section className="pos-absolute" onClick={handleClickOutside}>
      <div ref={modalRef} className="video-modal">
        <div className="modal-content">
          <div className="iframe-zoomeable">
            <iframe
              title="Video Modal"
              width="100%"
              height="100%"
              src={link}
              allowFullScreen
            ></iframe>
            {/* <div className="resizer"></div> */}
          </div>
          <span className="close" onClick={hideModal}>
            Close the video and start exercise
          </span>
        </div>
      </div>
    </section>
  );
};

export default VideoModal;
