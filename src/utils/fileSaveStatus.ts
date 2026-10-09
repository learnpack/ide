export type TFileSaveStatus = "saving" | "saved" | "error";

/**
 * Tracks the save status of each file (key = `${slug}:${filename}`).
 * Each edit bumps a per-file counter, so a slow, older save that resolves
 * after a newer edit cannot overwrite the status of that newer edit.
 */
export function createSaveStatusTracker(
  onStatus: (key: string, status: TFileSaveStatus) => void
) {
  const latest = new Map<string, number>();

  return {
    /** Call on every edit: marks the file as saving. */
    begin(key: string) {
      latest.set(key, (latest.get(key) ?? 0) + 1);
      onStatus(key, "saving");
    },
    /** Runs the save and reports its result, unless a newer edit arrived meanwhile. */
    async run(key: string, save: () => Promise<boolean | void>) {
      const seq = latest.get(key) ?? 0;
      let ok: boolean;
      try {
        ok = (await save()) !== false;
      } catch (e) {
        console.error("Error saving file content", e);
        ok = false;
      }
      if (latest.get(key) === seq) {
        onStatus(key, ok ? "saved" : "error");
      }
    },
  };
}
