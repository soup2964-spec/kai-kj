const STORAGE_KEY = "kai-kj-use-agent-pipeline";

export function getUseAgentPipeline(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setUseAgentPipeline(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}
