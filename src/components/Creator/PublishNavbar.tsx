import useStore from "../../utils/store";
import { useEffect } from "react";
import PublishButton from "./PublishButton";
import { ShareButton } from "./ShareButton";

const slugToTitle = (slug: string) => {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const PublishNavbar = () => {
  const isCreator = useStore((state) => state.isCreator);
  const lessonTitle = useStore((state) => state.lessonTitle);

  useEffect(() => {
    if (isCreator) {
      document.documentElement.style.setProperty("--header-height", "150px");
    } else {
      document.documentElement.style.setProperty("--header-height", "80px");
    }
  }, [isCreator]);

  if (!isCreator) return null;
  return (
    <div className="flex-x justify-between padding-medium">
      <div className="w-100 flex-x justify-center">
        <p className=" m-0 padding-small">{slugToTitle(lessonTitle)}</p>
      </div>
      <div className="flex-x align-center gap-small">
        <ShareButton />
        <PublishButton />
      </div>
    </div>
  );
};
