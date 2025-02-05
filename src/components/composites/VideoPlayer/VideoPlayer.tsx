import React, { useRef } from "react";
import { useTranslation } from "react-i18next";

interface IVideoPlayerProps {
  link: string;
}

export const VideoPlayer: React.FC<IVideoPlayerProps> = ({ link }) => {
  const videoRef = useRef<HTMLIFrameElement>(null);

  const { t } = useTranslation();

  //   const handlePictureInPicture = async () => {
  //     if (videoRef.current) {
  //       // Verificar si actualmente está en modo Picture-in-Picture
  //       if (document.pictureInPictureElement) {
  //         await document.exitPictureInPicture();
  //       } else {
  //         try {
  //           // @ts-ignore
  //           await videoRef.current.requestPictureInPicture();
  //         } catch (error) {
  //           console.error("Error al entrar en Picture-in-Picture:", error);
  //         }
  //       }
  //     }
  //   };

  // Extraer el ID del video de YouTube a partir del enlace
  const getYouTubeVideoId = (url: string): string | null => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&\n]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(link);

  if (!videoId) {
    return <div>{t("error-video-id-invalid")}</div>;
  }

  return (
    <div className="video-player pos-relative">
      <iframe
        ref={videoRef}
        width="100%"
        style={{ aspectRatio: "16/9" }}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
        title="YouTube Video Player"
        frameBorder="0"
        allowFullScreen
      />
    </div>
  );
};
