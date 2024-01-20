import BuildButton from './BuildButton'
import FeedbackButton from './FeedbackButton'
import Sidebar from '../sidebar/Sidebar'
import ResetButton from './ResetButton'
import useStore from '../../../utils/store'

export default function Navbar() {
    const {displayTestButton} = useStore(state => ({displayTestButton: state.displayTestButton}));

    return <nav className="navbar-component">
        <section>
            <img src="/logo.png" alt='Learnpack' style={{ width: "40px", height: "auto" }} />
            <BuildButton />
            <FeedbackButton />
            <ResetButton />
            <TestButton display={displayTestButton} />
        </section>
        <Sidebar />
    </nav>
}

const TestButton = ({display}: {display: boolean}) => {
    const { test, shouldBeTested } = useStore(state => ({ test: state.test, shouldBeTested: state.shouldBeTested }));
    return (
        display &&
        <button onClick={test} className="test-button">
            <span>Test SBT: {shouldBeTested ? "true" : "false"}</span>
        </button>
    )
}