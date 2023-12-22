import { LessonOptions } from "./LessonOptions"
import Navbar from "./Navbar"

export const Header = () => {
    return (
        <section className="app-header">
            <Navbar />
            <LessonOptions />
        </section>
    )
}