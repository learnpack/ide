import { useEffect, useState } from "react";
import axios from "axios";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import toast from "react-hot-toast";
import {
  getGithubStatus,
  createGithubRepo,
  checkGithubChanges,
  pullFromGithub,
  pushToGithub,
} from "../../../utils/creator";
import { Loader } from "../../composites/Loader/Loader";
import { Icon } from "@/components/Icon";
import { getSlugFromPath } from "../../../utils/lib";

type CheckChangesResponse = {
  hasChanges: boolean;
  currentSHA?: string;
  lastSyncSHA?: string;
  syncableChanges?: {
    lessons: Array<{
      slug: string;
      files: Array<{ filename: string; status: string }>;
    }>;
    assets: Array<{ filename: string; status: string }>;
    totalFiles: number;
  };
  skippedChanges?: {
    files: Array<{ filename: string; status: string; reason?: string }>;
    totalFiles: number;
  };
};

const buttonClass =
  "w-100 text-small text-yellow-800 bg-yellow-100 hover:bg-yellow-200 padding-small rounded";

const getRequestErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const responseData = err.response?.data as { message?: string } | undefined;
    if (typeof responseData?.message === "string" && responseData.message) {
      return responseData.message;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
};

export function GitHubActions() {
  const { token, configObject, fetchReadme } = useStore((state) => ({
    token: state.token,
    configObject: state.configObject,
    fetchReadme: state.fetchReadme,
  }));

  const [status, setStatus] = useState<{
    configured: boolean;
    linked: boolean;
    repository: string | null;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [changes, setChanges] = useState<CheckChangesResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const courseSlug =
    configObject?.config?.slug || getSlugFromPath() || "";

  const fetchStatus = async () => {
    if (!courseSlug) return;
    setStatusLoading(true);
    try {
      const data = await getGithubStatus(courseSlug);
      setStatus({
        configured: data.configured ?? false,
        linked: data.linked ?? false,
        repository: data.repository ?? null,
      });
    } catch {
      setStatus({ configured: false, linked: false, repository: null });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [courseSlug]);

  const handleCreateRepo = async () => {
    if (!courseSlug || !token) {
      toast.error("Course slug or token not available");
      return;
    }
    setActionLoading("create");
    const toastId = toast.loading("Creating GitHub repository...");
    try {
      await createGithubRepo(courseSlug, courseSlug, false, token);
      toast.success("Repository created successfully", { id: toastId });
      setChanges(null);
      await fetchStatus();
    } catch (err) {
      const msg = getRequestErrorMessage(err, "Failed to create repository");
      toast.error(msg, { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckChanges = async () => {
    if (!courseSlug) return;
    setActionLoading("check");
    const toastId = toast.loading("Checking for changes...");
    try {
      const data = await checkGithubChanges(courseSlug);
      setChanges(data);
      if (!data.hasChanges) {
        toast.success("No changes in GitHub", { id: toastId });
      } else {
        toast.success(
          `Found ${data.syncableChanges?.totalFiles ?? 0} syncable file(s)`,
          { id: toastId }
        );
      }
    } catch (err) {
      const msg = getRequestErrorMessage(err, "Failed to check changes");
      toast.error(msg, { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePull = async () => {
    if (!courseSlug || !changes?.currentSHA) return;
    setActionLoading("pull");
    const toastId = toast.loading("Pulling from GitHub...");
    try {
      const result = await pullFromGithub(courseSlug, changes.currentSHA);
      toast.success(
        `Synced ${result.syncedFiles ?? 0} file(s), ${result.removedFiles ?? 0} removed`,
        { id: toastId }
      );
      setChanges(null);
      await fetchStatus();
      await fetchReadme();
    } catch (err) {
      const msg = getRequestErrorMessage(err, "Failed to pull from GitHub");
      toast.error(msg, { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePush = async () => {
    if (!courseSlug) return;
    setActionLoading("push");
    const toastId = toast.loading("Pushing to GitHub...");
    try {
      const result = await pushToGithub(courseSlug);
      toast.success(
        `Pushed ${result.totalFiles ?? 0} file(s) to GitHub`,
        { id: toastId }
      );
      setChanges(null);
      await fetchStatus();
    } catch (err) {
      const msg = getRequestErrorMessage(err, "Failed to push to GitHub");
      toast.error(msg, { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  if (!courseSlug) return null;

  if (statusLoading) {
    return (
      <div className="flex-x gap-small align-center padding-small">
        <Loader color="gray" size="sm" />
        <span className="text-small">Verificando estado de GitHub...</span>
      </div>
    );
  }

  if (!status?.configured) {
    return (
      <div className="padding-small text-small text-yellow-800">
        Configura GITHUB_TOKEN y GITHUB_USERNAME en .env de learnpack-cli
      </div>
    );
  }

  if (!status?.linked) {
    return (
      <div className="flex-y gap-small padding-small">
        <SimpleButton
          extraClass={buttonClass}
          svg={<Icon name="GitBranch" size={16} />}
          text="Crear repo en GitHub"
          action={handleCreateRepo}
          disabled={!!actionLoading}
        />
      </div>
    );
  }

  return (
    <div className="flex-y gap-small padding-small">
      <SimpleButton
        extraClass={buttonClass}
        svg={<Icon name="Upload" size={16} />}
        text="Push Bucket -> GitHub"
        action={handlePush}
        disabled={!!actionLoading}
      />
      <SimpleButton
        extraClass={buttonClass}
        svg={<Icon name="RefreshCw" size={16} />}
        text="Verificar cambios en GitHub"
        action={handleCheckChanges}
        disabled={!!actionLoading}
      />

      {changes?.hasChanges && (
        <div className="flex-y gap-small padding-small border-t border-yellow-200">
          {changes.syncableChanges && changes.syncableChanges.totalFiles > 0 && (
            <div className="text-small text-yellow-800">
              <div className="font-medium margin-bottom-small">
                Cambios sincronizables:
              </div>
              {changes.syncableChanges.lessons?.map((l) => (
                <div key={l.slug} className="margin-bottom-small">
                  <span className="font-medium">{l.slug}:</span>{" "}
                  {l.files.map((f) => f.filename).join(", ")}
                </div>
              ))}
              {changes.syncableChanges.assets?.length > 0 && (
                <div className="margin-bottom-small">
                  <span className="font-medium">Assets:</span>{" "}
                  {changes.syncableChanges.assets
                    .map((a) => a.filename)
                    .join(", ")}
                </div>
              )}
            </div>
          )}

          {changes.skippedChanges &&
            changes.skippedChanges.files?.length > 0 && (
              <div className="text-small text-yellow-700">
                <div className="font-medium margin-bottom-small">
                  Archivos no sincronizados ({changes.skippedChanges.totalFiles}):
                </div>
                <ul className="list-style-disc padding-left-medium">
                  {changes.skippedChanges.files.slice(0, 5).map((f, i) => (
                    <li key={i}>
                      {f.filename}
                      {f.reason ? ` (${f.reason})` : ""}
                    </li>
                  ))}
                  {changes.skippedChanges.files.length > 5 && (
                    <li>...y {changes.skippedChanges.files.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}

          <SimpleButton
            extraClass={buttonClass}
            svg={<Icon name="Download" size={16} />}
            text="Pull GitHub -> Bucket"
            action={handlePull}
            disabled={!!actionLoading}
          />
        </div>
      )}
    </div>
  );
}
