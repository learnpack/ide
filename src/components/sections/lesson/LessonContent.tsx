import useStore from "../../../utils/store";
import { useEffect } from "react";
import { convertMarkdownToHTML } from "../../../utils/lib";
export default function LessonContent() {
    const { currentContent, start } = useStore(state => ({
        currentContent: state.currentContent,
        start: state.start
    }));

    useEffect(() => {
        start();
    }, [])

    return <>
        <div className="lesson-content-component " dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(currentContent) }}>
        </div>
    </>
}