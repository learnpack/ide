// eventBus.ts
import mitt, { Emitter } from "mitt";
import { TMode } from "../utils/storeTypes";

type Events = {
  position_change: { position: number };
  position_changed: {};
  assessment_completed: {
    status: "SUCCESS" | "ERROR";
    ended_at: number;
    type: "code" | "open-question" | "fill-in-the-blank" | "select-the-blank" | "ordering" | "multiple-choice"
    score: number;
  };
  last_lesson_finished: {};
  // `mode` lets telemetry skip read-only completion while an instructor edits
  // the lesson, without the manager having to import the store (circular dep).
  lesson_rendered: { stepPosition: number; mode?: TMode };
  step_completed: number;
  // Emitted when a step that was auto-completed as read-only turns out to still
  // have live testeable content (a quiz component registered late).
  step_uncompleted: number;
};

export const eventBus: Emitter<Events> = mitt<Events>();
