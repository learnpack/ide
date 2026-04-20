import { useEffect } from "react";
import useStore from "../utils/store";

/**
 * When Rigobot token and package slug are available, fetches package id from Rigobot
 * and merges package_id into local telemetry if missing (see store.fetchPackageMetadata).
 */
export default function PackageMetadataListener() {
  const token = useStore((s) => s.token);
  const slug = useStore((s) => s.configObject?.config?.slug ?? "");

  useEffect(() => {
    if (!token?.trim() || !slug.trim()) {
      return;
    }
    void useStore.getState().fetchPackageMetadata();
  }, [token, slug]);

  return null;
}
