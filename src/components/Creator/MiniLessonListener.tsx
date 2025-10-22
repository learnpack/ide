import { useEffect } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import { DEV_MODE } from "../../utils/lib";

const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

export default function MiniLessonListener() {
  const config = useStore((state) => state.configObject);
  const getSyllabus = useStore((state) => state.getSyllabus);
  const getCurrentExercise = useStore((state) => state.getCurrentExercise);

  useEffect(() => {
    if (!config?.config?.slug) return;

    const handleUpdate = async (data: any) => {
      const currentExercise = getCurrentExercise();
      
      if (data.status === "done" && data.lesson === currentExercise.slug) {
        getSyllabus();
      }
    };

    socketClient.connect();
    socketClient.on("course-creation", handleUpdate);
    socketClient.emit("register", { courseSlug: config.config.slug });

    return () => {
      socketClient.off("course-creation", handleUpdate);
      socketClient.disconnect();
    };
    // eslint-disable-next-line
  }, [config?.config?.slug]);

  return <></>;
}
