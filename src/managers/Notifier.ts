import toast from "react-hot-toast";
import { randomInRange } from "../utils/lib";

export const Notifier = {
  id: "",
  success: (message: string) => {
    if (Notifier.id) {
      toast.success(message, { id: Notifier.id });
    } else {
      Notifier.id = toast.success(message);
    }
  },
  loading: (message: string) => {
    if (Notifier.id) {
      toast.loading(message, { id: Notifier.id });
    } else {
      Notifier.id = toast.loading(message);
    }
  },
  error: (message: string) => {
    if (Notifier.id) {
      toast.error(message, { id: Notifier.id });
    } else {
      Notifier.id = toast.error(message);
    }
  },
  dismiss: () => {
    if (Notifier.id) {
      toast.dismiss(Notifier.id);
      Notifier.id = "";
    }
  },
  confetti: () => {
    // @ts-ignore
    if (typeof window.confetti === "function") {
      // @ts-ignore
      window.confetti({
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        particleCount: randomInRange(50, 100),
        origin: { y: 0.6 },
        zIndex: 10000,
      });
    }
  },
};
