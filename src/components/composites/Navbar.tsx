import BuildButton from './BuildButton'
import FeedbackButton from './FeedbackButton'
import Sidebar from './Sidebar'
import ResetButton from './ResetButton'
// import useStore from '../../utils/store'
export default function Navbar() {
    return <nav className="navbar-component">
        <section>
            <img src="/logo.png" alt='Learnpack' style={{ width: "40px", height: "auto" }} />
            <BuildButton />
            <FeedbackButton />
            <ResetButton />
            {/* <TestButton /> */}
        </section>
        <Sidebar />
    </nav>
}

// const TestButton = () => {
//     const { getContextFilesContent}=useStore();

//     return <button onClick={getContextFilesContent} className="test-button">Test Button</button>
// }