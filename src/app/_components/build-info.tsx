const APP_VERSION = "v2.2-q12-diagnostic-stage-hotfix";

function formatBuildTime(value: string | undefined) {
  if (!value) return "unknown";
  try {
    return new Intl.DateTimeFormat("zh-TW", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Taipei", hour12: false }).format(new Date(value));
  } catch {
    return value;
  }
}

export function BuildInfo() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const vercelEnvironment = process.env.VERCEL_ENV ?? "development";
  const environment = vercelEnvironment === "production" ? "production" : vercelEnvironment === "preview" ? "staging" : vercelEnvironment;
  return <aside className="build-info" aria-label="目前網站版本">
    <span>Build: {APP_VERSION}</span><span>Commit: {commit}</span>
    <span>Env: {environment}</span><span>Built at: {formatBuildTime(process.env.NEXT_PUBLIC_APP_BUILT_AT)}</span>
  </aside>;
}
