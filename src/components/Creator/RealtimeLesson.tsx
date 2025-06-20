import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import ProgressBar from "../composites/ProgressBar/ProgressBar";
import { DEV_MODE } from "../../utils/lib";
const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

export default function RealtimeLesson() {
  const { t } = useTranslation();
  const getCurrentExercise = useStore((state) => state.getCurrentExercise);
  const config = useStore((state) => state.configObject);
  const fetchReadme = useStore((state) => state.fetchReadme);
  const fetchExercises = useStore((state) => state.fetchExercises);
  const [updates, setUpdates] = useState<string[]>([
    `🚀 Generating lesson for ${getCurrentExercise()?.slug}`,
  ]);

  const handleUpdate = (data: any) => {
    if (data.status === "done") {
      fetchExercises();
      fetchReadme();
    }
    if (data.lesson === getCurrentExercise()?.slug) {
      setUpdates((prev) => [...prev, data.log]);
    }
  };

  useEffect(() => {
    if (!config?.config?.slug) return;

    socketClient.connect();
    socketClient.on("course-creation", handleUpdate);

    socketClient.emit("register", { courseSlug: config.config.slug });

    return () => {
      socketClient.off("course-creation", handleUpdate);
      socketClient.disconnect();
    };
  }, []);

  return (
    <div className="flex-y gap-big padding-big">
      <div className=" d-flex align-center gap-small justify-between">
        <span>
          {t("this-lesson-is-being-processed-and-will-be-ready-soon")}
        </span>
        <div
          style={{
            background: "#9FBDD0",
            color: "01455E",
            width: "fit-content",
            borderRadius: "50vh",
            padding: "2px 10px",
            fontSize: "16px",
          }}
        >
          {t("processing")}
        </div>
      </div>
      <ProgressBar duration={20} height={4} />
      {/* <Loader text={t(getRandomGeneratingMessageKey())} svg={svgs.rigoSvg} /> */}
      <div
        style={{ background: "#FAFDFF", border: "1px solid #C8DBFC" }}
        className=" rounded padding-small"
      >
        {updates.map((update) => (
          <p key={update}>{update}</p>
        ))}
      </div>
    </div>
  );
}
