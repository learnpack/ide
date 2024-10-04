import BuildButton from "./BuildButton";
import FeedbackButton from "./FeedbackButton";
import Sidebar from "../sidebar/Sidebar";
import ResetButton from "./ResetButton";
import useStore from "../../../utils/store";

export default function Navbar() {
  const { displayTestButton } = useStore((state) => ({
    displayTestButton: state.displayTestButton,
  }));

  return (
    <nav className="navbar-component">
      <section className="_navbar-buttons">
        <img
          src="/logo.png"
          alt="Learnpack"
          style={{ width: "40px", height: "auto" }}
        />
        <BuildButton extraClass="" />
        <FeedbackButton direction="down" />
        <ResetButton />
        <TestButton display={displayTestButton} />
      </section>
      <Sidebar />
    </nav>
  );
}

const TestButton = ({ display }: { display: boolean }) => {
  const { test } = useStore((state) => ({ test: state.test }));
  return (
    display && (
      <button onClick={test} className="test-button">
        <span>Test</span>
      </button>
    )
  );
};
