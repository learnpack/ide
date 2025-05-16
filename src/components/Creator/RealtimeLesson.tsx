import { svgs } from "../../assets/svgs";
import { Loader } from "../composites/Loader/Loader";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
const socketClient = new CreatorSocket("");

function getRandomGeneratingMessageKey(): string {
  const keys: string[] = [
    "generatingMessage1",
    "generatingMessage2",
    "generatingMessage3",
    "generatingMessage4",
    "generatingMessage5",
    "generatingMessage6",
    "generatingMessage7",
    "generatingMessage8",
    "generatingMessage9",
    "generatingMessage10",
  ];

  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
}
export default function RealtimeLesson() {
  const { t } = useTranslation();
  const getCurrentExercise = useStore((state) => state.getCurrentExercise);
  const config = useStore((state) => state.configObject);
  const fetchReadme = useStore((state) => state.fetchReadme);
  const [updates, setUpdates] = useState<string[]>([
    `🚀 Generating lesson for ${getCurrentExercise()?.slug}`,
  ]);

  const handleUpdate = (data: any) => {
    console.log(data, "data");
    if (data.status === "done") {
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
      <Loader text={t(getRandomGeneratingMessageKey())} svg={svgs.rigoSvg} />
      <div className="stdout rounded">
        {updates.map((update) => (
          <p key={update}>{update}</p>
        ))}
      </div>
    </div>
  );
}
