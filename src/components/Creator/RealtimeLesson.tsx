import { svgs } from "../../assets/svgs";
import { Loader } from "../composites/Loader/Loader";
import { useTranslation } from "react-i18next";
import CourseCreationSocket from "./CourseCreationSocket";
import { useState } from "react";
import useStore from "../../utils/store";

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
  const [updates, setUpdates] = useState<string[]>([
    `🚀 Generating lesson for ${getCurrentExercise()?.slug}`,
  ]);

  return (
    <div className="flex-y gap-big padding-big">
      <CourseCreationSocket
        onUpdate={(data) => {
          if (data.lesson === getCurrentExercise()?.slug) {
            setUpdates((prev) => [...prev, data.log]);
          }
        }}
      />
      <Loader text={t(getRandomGeneratingMessageKey())} svg={svgs.rigoSvg} />
      <div className="stdout rounded">
        {updates.map((update) => (
          <p key={update}>{update}</p>
        ))}
      </div>
    </div>
  );
}
