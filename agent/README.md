# Moodna LangGraph Receipt Agent

Implements the **agent framework flowchart** (`Downloads/agent framework.png`) for property-management receipt processing.

## Flowchart (implemented 1:1)

```
Receipt Received (OCR)
        │
    Billable?
    ┌───┴───┐
   NO      YES
    │        │
    │    Work Order # on Receipt?
    │    ┌───┴───┐
    │   YES      NO
    │    │        ├── Research Needed Folder
    │    │        ├── Google Sheet Status = ORANGE
    │    │        ├── Slack/email → Maintenance or Renee
    │    │        └── Wait for human work order (ORANGE)
    │    └────────┬───────────────────┘
    │             │
    │        Scan Receipt to VA
    │             │
    │        VA uploads CC transaction → Google Sheets
    │             │
    │        Accountant uses WO# from Google Sheets
    │             │
    │        Upload to QuickBooks with Work Order #
    │             │
    │        Google Sheet Status = GREEN
    │             │
    │        Reconcile Credit Card
    │             │
    │        Store Receipt Monthly Folder
    │
    ├── Enter Google Sheets (correct CC tab)
    ├── Upload QuickBooks (correct CC account)
    └── Store Receipt Monthly Folder
```

## Setup

```bash
cd agent
python -m venv .venv
.venv\Scripts\activate
pip install -e .
```

Environment (from kai-kj root `.env.local`):

| Variable | Purpose |
|----------|---------|
| `KIE_API_KEY` | Cheap OCR extraction (required) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Platform service account (Next.js app) |
| `GOOGLE_SHEET_APPEND_URL` | Legacy webhook fallback for sheet append |
| `KAI_KJ_API_URL` | Next.js — Sheets, reconcile, per-user `/api/agent/notify-work-order` |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | Platform Slack app (users click **Add to Slack**) |
| Per-user SMTP | Each user connects their mailbox in the app (no platform email API key) |
| `AGENT_RECONCILE_WEBHOOK_URL` | Credit card reconciliation |
| `AGENT_STORAGE_WEBHOOK_URL` | Monthly folder storage |

## Run

```bash
kai-agent-serve          # HTTP on :8000
kai-agent receipt.jpg      # CLI test
```

Next.js: set `AGENT_SERVICE_URL=http://localhost:8000` and `POST /api/process-receipt`.

## Shared with Next.js

- OCR prompts: same as `src/lib/kie.ts`
- Billable rules: `src/config/billable-rules.json`
- Work order format: AppFolio `xx-xxxx`
