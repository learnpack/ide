import { useEffect } from "react";
import CreatorSocket from "../../managers/creatorSocket";
import useStore from "../../utils/store";

type Props = {
  onUpdate: (data: any) => void;
};

const socketClient = new CreatorSocket("");

const CourseCreationSocket = ({ onUpdate }: Props) => {
  const config = useStore((state) => state.configObject);

  useEffect(() => {
    if (!config?.config?.slug) return;

    socketClient.connect();
    socketClient.on("course-creation", onUpdate);

    socketClient.emit("register", { courseSlug: config.config.slug });

    return () => {
      socketClient.off("course-creation", onUpdate);
      socketClient.disconnect();
    };
  }, [onUpdate]);

  return null;
};

export default CourseCreationSocket;
