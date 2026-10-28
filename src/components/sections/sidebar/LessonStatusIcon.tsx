import { useTranslation } from "react-i18next";
import { Icon, IconName } from "@/components/Icon";
import { TLessonKind } from "@/utils/lessonKind";

// Every icon takes the same box, so the column stays aligned
const SIZE = 28;
// The circle makes the symbol inside it look bigger, so the unfinished symbol
// is drawn smaller to look the same size as the finished one
const DONE_SYMBOL_SIZE = 18;
const PENDING_SYMBOL_SIZE = 15;
const CIRCLE_SIZE = 24;
// Heavier than Lucide's default (2) so the symbol holds up without the circle.
// It is in the icon's 24-unit space: 2.5 is about 1.9px at 18px.
const SYMBOL_STROKE = 2.5;
const CIRCLE_STROKE = 1.75;

const ICONS: Record<TLessonKind, IconName> = {
  reading: "Book",
  questions: "ListChecks",
  code: "Code",
};

const LABELS: Record<TLessonKind, { pending: string; done: string }> = {
  reading: { pending: "reading-lesson", done: "reading-lesson-completed" },
  questions: { pending: "questions-lesson", done: "questions-lesson-completed" },
  code: { pending: "code-lesson", done: "code-lesson-completed" },
};

type TLessonStatusIconProps = {
  /** Null while the kind can't be told yet: only the circle is shown */
  kind: TLessonKind | null;
  done: boolean;
};

/**
 * The lesson's type and progress in one icon: gray inside a circle until the
 * lesson is finished, then green without the circle.
 */
export const LessonStatusIcon = ({ kind, done }: TLessonStatusIconProps) => {
  const { t } = useTranslation();
  const label = kind ? t(done ? LABELS[kind].done : LABELS[kind].pending) : undefined;
  const symbolSize = done ? DONE_SYMBOL_SIZE : PENDING_SYMBOL_SIZE;
  const symbolOffset = (SIZE - symbolSize) / 2;

  return (
    <span
      className={`lesson-status-icon ${done ? "text-green-500" : "text-gray-500"}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      title={label}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        {!done && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={(CIRCLE_SIZE - CIRCLE_STROKE) / 2}
            fill="none"
            stroke="currentColor"
            strokeWidth={CIRCLE_STROKE}
          />
        )}
        {kind && (
          <Icon
            name={ICONS[kind]}
            size={symbolSize}
            strokeWidth={SYMBOL_STROKE}
            x={symbolOffset}
            y={symbolOffset}
          />
        )}
      </svg>
    </span>
  );
};
