import React, { useRef } from "react";
import useStore from "../../../utils/store";

interface IVideoModalProps {
  link: string;
  hideModal: () => void;
}

const VideoModal: React.FC<IVideoModalProps> = ({ link, hideModal }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { openLink } = useStore((store) => ({
    openLink: store.openLink,
  }));

  const fetchPreview = (link: string) => {
    let videoId: string | null;
    if (link.includes("/embed/")) {
      videoId = link.split("/embed/")[1].split("?")[0];
    } else {
      const params = new URLSearchParams(link.split("?")[1]);
      videoId = params.get("v");
    }

    if (!videoId) {
      console.error("Invalid YouTube link: missing video ID");
      return;
    }

    const previewSrc = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return previewSrc;
  };

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
  };

  return (
    <section onClick={handleClickOutside}>
      <div ref={modalRef} className="video-modal">
        <div className="modal-content">
          <div className="preview-card">
            <img src={fetchPreview(link)} alt="" />
            <span className="click bg-gray" onClick={handleOpenLink}>
              👀
            </span>
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
