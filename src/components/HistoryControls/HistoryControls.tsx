import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../Icon";
import useStore from "../../utils/store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const HistoryControls = () => {
  const { t } = useTranslation();
  const {
    canUndo,
    canRedo,
    performUndo,
    performRedo,
    isUndoRedoInProgress,
    mode,
  } = useStore((state) => ({
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    performUndo: state.performUndo,
    performRedo: state.performRedo,
    isUndoRedoInProgress: state.isUndoRedoInProgress,
    mode: state.mode,
  }));

  // Detect if user is on Mac
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl/Cmd + Z = Undo
      if (cmdOrCtrl && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        if (canUndo && !isUndoRedoInProgress) {
          performUndo();
        }
      }

      // Ctrl/Cmd + Shift + Z = Redo
      if (cmdOrCtrl && event.key === "z" && event.shiftKey) {
        event.preventDefault();
        if (canRedo && !isUndoRedoInProgress) {
          performRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canUndo, canRedo, isUndoRedoInProgress, performUndo, performRedo, isMac]);

    // Only show in creator mode
    if (mode !== "creator") {
        return null;
    }

  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={performUndo}
            disabled={!canUndo || isUndoRedoInProgress}
            className="flex items-center justify-center"
            aria-label={t("undo-tooltip")}
          >
            <Icon
              name="Undo2"
              size={18}
              className={
                !canUndo || isUndoRedoInProgress
                  ? "opacity-50"
                  : "opacity-100"
              }
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {canUndo
              ? isMac
                ? t("undo-tooltip-mac")
                : t("undo-tooltip")
              : t("no-undo-available")}
          </p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={performRedo}
            disabled={!canRedo || isUndoRedoInProgress}
            className="flex items-center justify-center"
            aria-label={t("redo-tooltip")}
          >
            <Icon
              name="Redo2"
              size={18}
              className={
                !canRedo || isUndoRedoInProgress
                  ? "opacity-50"
                  : "opacity-100"
              }
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {canRedo
              ? isMac
                ? t("redo-tooltip-mac")
                : t("redo-tooltip")
              : t("no-redo-available")}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

