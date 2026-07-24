import { useEffect } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import { DEV_MODE } from "../../utils/lib";

const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

export default function MiniLessonListener() {
  const config = useStore((state) => state.configObject);
  const getSyllabus = useStore((state) => state.getSyllabus);

  useEffect(() => {
    if (!config?.config?.slug) return;

    const handleUpdate = async (data: any) => {
      // Refresh the syllabus whenever any lesson reaches a terminal state, not
      // just the one currently being viewed. Generation runs in the background
      // for lessons other than the current one, and the sidebar loading state
      // is driven entirely by the syllabus store, so it must be refreshed on
      // every completion to reflect the real generation state.
      if (data.status === "done" || data.status === "error") {
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
