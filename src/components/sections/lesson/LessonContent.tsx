import useStore from "../../../utils/store";
import { useEffect, useRef } from "react";
import { convertMarkdownToHTML } from "../../../utils/lib";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function LessonContent() {
  const { currentContent, openLink } = useStore((state) => ({
    currentContent: state.currentContent,
    openLink: state.openLink,
  }));

  const { t } = useTranslation();
  const lessonContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lessonContentDiv = lessonContentRef.current;
    if (!lessonContentDiv) return;

    const anchors = lessonContentDiv.getElementsByTagName("a");
    const codes = lessonContentDiv.getElementsByTagName("code");

    const handleClick = (event: any) => {
      event.preventDefault();
      openLink(event.target.href);
    };

    const handleCodeClick = (event: any) => {
      // Copy code text to clipboard
      const codeText = event.target.textContent;
      navigator.clipboard.writeText(codeText);
      toast.success(t("code-copied"));
    };

    for (let anchor of anchors) {
      anchor.addEventListener("click", handleClick);
    }
    for (let code of codes) {
      code.addEventListener("dblclick", handleCodeClick);
      code.title = t("double-click-to-copy");
    }

    // Cleanup event listeners on component unmount
    return () => {
      for (let anchor of anchors) {
        anchor.removeEventListener("click", handleClick);
      }
      for (let code of codes) {
        code.removeEventListener("dblclick", handleCodeClick);
      }
    };
  }, [currentContent]);

  return (
    <div
      className="lesson-content"
      ref={lessonContentRef}
      dangerouslySetInnerHTML={{
        __html: convertMarkdownToHTML(currentContent),
      }}
    ></div>
  );
}
