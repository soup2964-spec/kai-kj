export const SITE_NAME = "Kai KJ";
export const SITE_LOGO_SVG: string = "";
export const SITE_LOGO_ALT = "Kai KJ";

export const ANNOUNCEMENT = {
  text: "Receipt scanning and Google Sheets export are live.",
  href: "/dashboard/scan",
  linkLabel: "Try it free",
};

export const NAV_PRODUCT_LINKS = [
  {
    title: "Receipt scanner",
    desc: "Snap or upload receipts — AI extracts every line item.",
    href: "/dashboard/scan",
  },
  {
    title: "Expense dashboard",
    desc: "Review, filter, and approve expenses in one place.",
    href: "/dashboard/expenses",
  },
  {
    title: "Accounting sync",
    desc: "Approve or reject expenses before they hit your books.",
    href: "/dashboard/expenses",
  },
  {
    title: "Google Sheets export",
    desc: "One-click export for your accountant or finance team.",
    href: "/dashboard/expenses",
  },
] as const;

export const NAV_INTEGRATION_LINKS = [
  { title: "Google Sheets", href: "/dashboard/expenses" },
  { title: "Supabase sync", href: "/dashboard" },
  { title: "CSV fallback", href: "/dashboard/expenses" },
] as const;

export const BENEFIT_CARDS = [
  {
    title: "Capture receipts in seconds",
    description:
      "Stop losing paper receipts. Scan from your phone or bulk-upload PDFs and photos.",
    stat: "90% faster",
    statLabel: "than manual entry",
  },
  {
    title: "Stay audit-ready",
    description:
      "Every expense is categorized, dated, and stored with card and billable tags.",
    stat: "100%",
    statLabel: "searchable history",
  },
  {
    title: "Approve before accounting sync",
    description:
      "Review each receipt and approve or reject before it syncs to your workflow.",
    stat: "Zero",
    statLabel: "surprise line items",
  },
  {
    title: "Export on your schedule",
    description:
      "Push to Google Sheets or download CSV — filter by month, card, or billable status.",
    stat: "1-click",
    statLabel: "exports",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Scan",
    description: "Upload a receipt photo or PDF. Kai KJ reads merchant, amount, date, and line items.",
  },
  {
    step: "02",
    title: "Organize",
    description: "Expenses auto-group by month, card, billable status, and date — sort any way you need.",
  },
  {
    step: "03",
    title: "Sync",
    description: "Approve expenses, export to Sheets, and keep everything tied to your account email.",
  },
] as const;

export const PLATFORM_TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "Your expense command center",
    description: "Overview of recent receipts, quick actions, and totals at a glance.",
  },
  {
    id: "scanner",
    label: "Scanner",
    title: "AI receipt extraction",
    description: "Point, shoot, done. Merchant, amount, category, and card last four — extracted automatically.",
  },
  {
    id: "expenses",
    label: "Expenses",
    title: "Folders, filters, and approvals",
    description: "Browse by month or card, filter by billable, and approve accounting sync with one tap.",
  },
  {
    id: "export",
    label: "Export",
    title: "Google Sheets & CSV",
    description: "Send filtered expense data to your spreadsheet or download for your bookkeeper.",
  },
] as const;

export const FEATURE_PILLS = [
  { title: "Fast setup", description: "Save your email and start scanning in under 2 minutes." },
  { title: "No spreadsheets", description: "Replace manual receipt logs with structured, searchable data." },
  { title: "Pay as you go", description: "Use the free tier — only add integrations when you need them." },
  { title: "Always available", description: "Expenses sync to your account and stay accessible across devices." },
] as const;

export const INTEGRATIONS = [
  {
    name: "Google Sheets",
    description: "Export filtered expenses directly to a shared spreadsheet.",
    status: "Available",
    href: "/dashboard/expenses",
  },
  {
    name: "Supabase",
    description: "Structured expense storage synced to your account email.",
    status: "Available",
    href: "/dashboard",
  },
  {
    name: "CSV download",
    description: "Fallback export when Google credentials aren't configured.",
    status: "Available",
    href: "/dashboard/expenses",
  },
  {
    name: "Accounting webhook",
    description: "Push approved expenses to your accounting system.",
    status: "Coming soon",
    href: "/dashboard/expenses",
  },
] as const;

export const BLOG_POSTS = [
  {
    category: "Guides",
    date: "Jun 2026",
    title: "Why receipt photos beat spreadsheet rows",
    excerpt: "Structured receipt data saves hours at tax time and cuts reconciliation errors.",
    readMinutes: 4,
  },
  {
    category: "Product",
    date: "May 2026",
    title: "How to filter expenses by month and card",
    excerpt: "Use folders and period filters to find any receipt in seconds.",
    readMinutes: 3,
  },
  {
    category: "Workflow",
    date: "Apr 2026",
    title: "Approve expenses before they hit accounting",
    excerpt: "Review each receipt and control what syncs to your books.",
    readMinutes: 5,
  },
] as const;

export const FOOTER_COLUMNS = {
  solutions: [
    ["Receipt scanner", "/dashboard/scan"],
    ["Expense dashboard", "/dashboard/expenses"],
    ["Accounting approval", "/dashboard/expenses"],
    ["Google Sheets export", "/dashboard/expenses"],
  ],
  resources: [
    ["How it works", "/#how-it-works"],
    ["Integrations", "/#integrations"],
    ["Pricing", "/dashboard"],
    ["Help", "/dashboard"],
  ],
  company: [
    ["About", "/"],
    ["Dashboard", "/dashboard"],
    ["Scan receipts", "/dashboard/scan"],
    ["Contact", "mailto:hello@kaikj.app"],
  ],
} as const;
