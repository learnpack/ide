import { useEffect } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import { DEV_MODE } from "../../utils/lib";
import toast from "react-hot-toast";

const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

export default function MiniLessonListener() {
  const config = useStore((state) => state.configObject);
  const fetchReadme = useStore((state) => state.fetchReadme);
  const fetchExercises = useStore((state) => state.fetchExercises);
  const getSyllabus = useStore((state) => state.getSyllabus);

  useEffect(() => {
    if (!config?.config?.slug) return;

    const handleUpdate = async (data: any) => {
      if (data.status === "done") {
        toast.success("lessonGenerated");
        await fetchExercises();
        await fetchReadme();
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
