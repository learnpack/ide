import useStore from "../../utils/store";
import { useEffect } from "react";
import PublishButton from "./PublishButton";
import { ShareButton } from "./ShareButton";

export const PublishNavbar = () => {
  const isCreator = useStore((state) => state.isCreator);
  const lessonTitle = useStore((state) => state.lessonTitle);

  if (!isCreator) return null;

  useEffect(() => {
    document.documentElement.style.setProperty("--header-height", "150px");
  }, []);

  return (
    <div className="flex-x justify-between">
      <div></div>
      <p>{lessonTitle}</p>
      <div className="flex-x align-center gap-small">
        <ShareButton />
        <PublishButton />
      </div>
    </div>
  );
};
