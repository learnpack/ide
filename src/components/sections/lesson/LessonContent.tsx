import useStore from "../../../utils/store";
import { useEffect, useRef } from "react";
import { convertMarkdownToHTML } from "../../../utils/lib";

export default function LessonContent() {
    const { currentContent, start, openLink } = useStore(state => ({
        currentContent: state.currentContent,
        start: state.start,
        openLink: state.openLink
    }));

    const lessonContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        start();
    }, []);

    useEffect(() => {
        const lessonContentDiv = lessonContentRef.current;
        if (!lessonContentDiv) return;

        const anchors = lessonContentDiv.getElementsByTagName('a');

        const handleClick = (event: any) => {
            event.preventDefault();
            openLink(event.target.href);
        };

        for (let anchor of anchors) {
            anchor.addEventListener('click', handleClick);
        }

        // Cleanup event listeners on component unmount
        return () => {
            for (let anchor of anchors) {
                anchor.removeEventListener('click', handleClick);
            }
        };
    }, [currentContent]);

    return (
        <div ref={lessonContentRef} dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(currentContent) }}>
        </div>
    );
}
