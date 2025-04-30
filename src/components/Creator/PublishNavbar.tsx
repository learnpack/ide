import useStore from "../../utils/store";
import { useEffect } from "react";
import PublishButton from "./PublishButton";
import { ShareButton } from "./ShareButton";

export const PublishNavbar = () => {
  const isCreator = useStore((state) => state.isCreator);
  const lessonTitle = useStore((state) => state.lessonTitle);

  useEffect(() => {
    document.documentElement.style.setProperty("--header-height", "150px");
  }, []);

  if (!isCreator) return null;
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
