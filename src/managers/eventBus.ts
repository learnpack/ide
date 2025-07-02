// eventBus.ts
import mitt, { Emitter } from "mitt";

type Events = {
  position_change: { position: number };
  position_changed: {};
};

export const eventBus: Emitter<Events> = mitt<Events>();
