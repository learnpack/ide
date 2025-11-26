import BuildButton from "./BuildButton";
import FeedbackButton from "./FeedbackButton";
import Sidebar from "../sidebar/Sidebar";
import ResetButton from "./ResetButton";
import useStore from "../../../utils/store";
import { SyncNotificationBadge } from "../../SyncNotifications/SyncNotificationBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { displayTestButton, environment } = useStore((state) => ({
    displayTestButton: state.displayTestButton,
    environment: state.environment,
  }));
  const { t } = useTranslation();

  return (
    <nav className="navbar-component">
      <section className="_navbar-buttons">
        <Tooltip>
          <TooltipTrigger asChild>
            <img
              src="/logo.png"
              alt="Learnpack"
              style={{ width: "40px", height: "auto" }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("learnpack-logo-tooltip")}</p>
          </TooltipContent>
        </Tooltip>
        <BuildButton extraClass="" />
        <FeedbackButton direction="down" />
        <ResetButton />
        <TestButton display={displayTestButton} />
        {environment === "creatorWeb" && <SyncNotificationBadge />}
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
