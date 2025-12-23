// eventBus.ts
import mitt, { Emitter } from "mitt";

type Events = {
  position_change: { position: number };
  position_changed: {};
  assessment_completed: {
    status: "SUCCESS" | "ERROR";
    ended_at: number;
    type: "code" | "open-question" | "fill-in-the-blank" | "multiple-choice"
    score: number;
  };
  last_lesson_finished: {};
};

export const eventBus: Emitter<Events> = mitt<Events>();
