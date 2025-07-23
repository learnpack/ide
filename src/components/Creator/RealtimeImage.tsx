import { useEffect } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import { DEV_MODE } from "../../utils/lib";
import { Loader } from "../composites/Loader/Loader";
import { svgs } from "../../assets/svgs";
import { useTranslation } from "react-i18next";
const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

export default function RealtimeImage({ imageId }: { imageId: string }) {
  const { t } = useTranslation();
  const config = useStore((state) => state.configObject);
  const fetchReadme = useStore((state) => state.fetchReadme);
  const reportEnrichDataLayer = useStore(
    (state) => state.reportEnrichDataLayer
  );

  const handleUpdate = () => {
    fetchReadme();
    reportEnrichDataLayer("creator_image_generation_completed", {
      image_id: imageId,
    });
  };

  useEffect(() => {
    if (!config?.config?.slug) return;

    socketClient.connect();
    socketClient.on(imageId, handleUpdate);

    socketClient.emit("registerNotification", {
      notificationId: imageId,
    });
    return () => {
      socketClient.off(imageId, handleUpdate);
      socketClient.disconnect();
    };
  }, []);

  return (
    <div className="flex-y gap-big padding-big">
      <Loader text={t("imageGenerationInProcess")} svg={svgs.rigoSvg} />
      {/* <ProgressBar duration={20} height={4} /> */}
    </div>
  );
}
