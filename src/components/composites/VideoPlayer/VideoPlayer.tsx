import React, { useRef } from "react";
import { useTranslation } from "react-i18next";

interface IVideoPlayerProps {
  link: string;
}

interface VideoService {
  type: "youtube" | "loom" | "dailymotion" | "raw";
  embedUrl?: string;
  videoId?: string;
  rawUrl?: string;
}

export const VideoPlayer: React.FC<IVideoPlayerProps> = ({ link }) => {
  const videoRef = useRef<HTMLIFrameElement>(null);
  const { t } = useTranslation();

  const parseVideoUrl = (url: string): VideoService | null => {
    // YouTube
    const youtubeRegex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&\n]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return {
        type: "youtube",
        videoId: youtubeMatch[1],
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&enablejsapi=1`,
      };
    }

    // Loom
    const loomRegex =
      /(?:https?:\/\/)?(?:www\.)?(?:loom\.com\/share\/|loom\.com\/embed\/)([a-zA-Z0-9-]+)/;
    const loomMatch = url.match(loomRegex);
    if (loomMatch) {
      return {
        type: "loom",
        videoId: loomMatch[1],
        embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
      };
    }

    // Daily Motion
    const dailymotionRegex =
      /(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/;
    const dailymotionMatch = url.match(dailymotionRegex);
    if (dailymotionMatch) {
      return {
        type: "dailymotion",
        videoId: dailymotionMatch[1],
        embedUrl: `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}?autoplay=1`,
      };
    }

    // Raw video URLs (MP4, WebM, OGV, etc.)
    const rawVideoRegex =
      /\.(mp4|webm|ogg|ogv|mov|avi|wmv|flv|mkv|m4v|3gp)(\?.*)?$/i;
    if (rawVideoRegex.test(url)) {
      return {
        type: "raw",
        rawUrl: url,
      };
    }

    return null;
  };

  const videoService = parseVideoUrl(link);

  if (!videoService) {
    return (
      <div className="video-player-error">
        {t("error-video-url-unsupported") || "Unsupported video URL format"}
      </div>
    );
  }

  const renderVideoPlayer = () => {
    switch (videoService.type) {
      case "youtube":
      case "loom":
      case "dailymotion":
        return (
          <iframe
            ref={videoRef}
            width="100%"
            style={{ aspectRatio: "16/9" }}
            src={videoService.embedUrl}
            title={`${
              videoService.type.charAt(0).toUpperCase() +
              videoService.type.slice(1)
            } Video Player`}
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        );

      case "raw":
        return (
          <video
            ref={videoRef as any}
            width="100%"
            style={{ aspectRatio: "16/9" }}
            controls
            autoPlay
            muted
            playsInline
          >
            <source
              src={videoService.rawUrl}
              type={`video/${
                videoService.rawUrl?.split(".").pop()?.split("?")[0]
              }`}
            />
            {t("error-video-not-supported") ||
              "Your browser does not support the video tag."}
          </video>
        );

      default:
        return null;
    }
  };

  return <div className="video-player pos-relative">{renderVideoPlayer()}</div>;
};
