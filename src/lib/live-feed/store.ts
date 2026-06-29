export type LiveFeedEventKind =
  | "scan_started"
  | "ocr_complete"
  | "agent_started"
  | "agent_step"
  | "agent_complete"
  | "scan_complete"
  | "scan_failed"
  | "expense_saved"
  | "expense_updated"
  | "bulk_started"
  | "bulk_item_queued"
  | "bulk_item_processing"
  | "bulk_item_complete"
  | "bulk_item_error"
  | "bulk_complete";

export type PipelineJobStatus = "queued" | "processing" | "complete" | "error";

export type PipelineJobSource = "scan" | "bulk" | "agent";

export interface PipelineJob {
  id: string;
  label: string;
  source: PipelineJobSource;
  status: PipelineJobStatus;
  stage: string;
  merchant?: string;
  amount?: number;
  expenseId?: string;
  startedAt: string;
  updatedAt: string;
  error?: string;
}

export interface LiveFeedEvent {
  id: string;
  kind: LiveFeedEventKind;
  message: string;
  timestamp: string;
  jobId?: string;
  expenseId?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface LiveFeedState {
  jobs: PipelineJob[];
  events: LiveFeedEvent[];
}

export type LiveFeedListener = (state: LiveFeedState) => void;

const MAX_EVENTS = 150;

let state: LiveFeedState = {
  jobs: [],
  events: [],
};

const listeners = new Set<LiveFeedListener>();

function notify() {
  for (const listener of listeners) {
    listener(state);
  }
}

function pushEvent(event: Omit<LiveFeedEvent, "id" | "timestamp">) {
  const entry: LiveFeedEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  state = {
    ...state,
    events: [entry, ...state.events].slice(0, MAX_EVENTS),
  };
  notify();
  return entry;
}

export function getLiveFeedState(): LiveFeedState {
  return state;
}

export function subscribeLiveFeed(listener: LiveFeedListener): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function upsertPipelineJob(
  job: Omit<PipelineJob, "startedAt" | "updatedAt"> & {
    startedAt?: string;
    updatedAt?: string;
  },
) {
  const now = new Date().toISOString();
  const existing = state.jobs.find((entry) => entry.id === job.id);

  const nextJob: PipelineJob = {
    ...existing,
    ...job,
    startedAt: existing?.startedAt ?? job.startedAt ?? now,
    updatedAt: now,
  } as PipelineJob;

  state = {
    ...state,
    jobs: existing
      ? state.jobs.map((entry) => (entry.id === job.id ? nextJob : entry))
      : [nextJob, ...state.jobs],
  };
  notify();
}

export function completePipelineJob(
  jobId: string,
  patch: Partial<Pick<PipelineJob, "merchant" | "amount" | "expenseId" | "stage">> = {},
) {
  upsertPipelineJob({
    id: jobId,
    label: state.jobs.find((job) => job.id === jobId)?.label ?? "Receipt",
    source: state.jobs.find((job) => job.id === jobId)?.source ?? "scan",
    status: "complete",
    stage: patch.stage ?? "Complete",
    ...patch,
  });

  setTimeout(() => {
    state = {
      ...state,
      jobs: state.jobs.filter((job) => job.id !== jobId || job.status !== "complete"),
    };
    notify();
  }, 8000);
}

export function failPipelineJob(jobId: string, error: string) {
  const job = state.jobs.find((entry) => entry.id === jobId);
  if (!job) return;

  upsertPipelineJob({
    ...job,
    status: "error",
    stage: "Failed",
    error,
  });

  pushEvent({
    kind: "scan_failed",
    message: error,
    jobId,
  });
}

export function emitLiveFeedEvent(
  event: Omit<LiveFeedEvent, "id" | "timestamp">,
) {
  return pushEvent(event);
}

export function clearCompletedPipelineJobs() {
  state = {
    ...state,
    jobs: state.jobs.filter(
      (job) => job.status === "queued" || job.status === "processing",
    ),
  };
  notify();
}

export function syncBulkPipelineJobs(
  items: Array<{
    id: string;
    label: string;
    status: "pending" | "processing" | "done" | "error";
    result?: { merchant: string; amount: number };
    error?: string;
  }>,
) {
  const bulkJobs: PipelineJob[] = items
    .filter((item) => item.status !== "done")
    .map((item) => ({
      id: item.id,
      label: item.label,
      source: "bulk" as const,
      status:
        item.status === "processing"
          ? ("processing" as const)
          : item.status === "error"
            ? ("error" as const)
            : ("queued" as const),
      stage:
        item.status === "processing"
          ? "Scanning receipt"
          : item.status === "error"
            ? "Failed"
            : "Queued",
      merchant: item.result?.merchant,
      amount: item.result?.amount,
      error: item.error,
      startedAt:
        state.jobs.find((job) => job.id === item.id)?.startedAt ??
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  const nonBulkJobs = state.jobs.filter((job) => job.source !== "bulk");
  state = {
    ...state,
    jobs: [...bulkJobs, ...nonBulkJobs],
  };
  notify();
}
