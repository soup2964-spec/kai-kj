export const SITE_NAME = "Kai KJ";
export const SITE_LOGO_SVG: string = "";
export const SITE_LOGO_ALT = "Kai KJ";

export const ANNOUNCEMENT = {
  text: "New: receipt image viewer, card folders, month folders, and purchase-date sorting.",
  href: "/dashboard/scan",
  linkLabel: "Scan a receipt",
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
    title: "Capture the paper trail",
    description:
      "Upload a receipt photo and keep the original image attached for later review.",
    stat: "Image",
    statLabel: "viewer included",
  },
  {
    title: "File every receipt automatically",
    description:
      "Group expenses by purchase date, card number, month, billable status, and work order.",
    stat: "5 ways",
    statLabel: "to organize",
  },
  {
    title: "Track billable work",
    description:
      "Flag missing AppFolio work orders before billable receipts go to accounting.",
    stat: "WO",
    statLabel: "missing alerts",
  },
  {
    title: "Export clean reports",
    description:
      "Send filtered receipt data to Google Sheets or download CSV for your books.",
    stat: "1 click",
    statLabel: "exports",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Scan the receipt",
    description: "Take a photo or upload a file. Kai KJ reads merchant, amount, date, card, and line items.",
  },
  {
    step: "02",
    title: "Organize by the receipt",
    description: "Receipts file into purchase-date folders, card folders, month folders, and work-order views.",
  },
  {
    step: "03",
    title: "Review and export",
    description: "Open the original image, check billable details, then export to Sheets or CSV.",
  },
] as const;

export const PLATFORM_TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "A live workspace for receipts",
    description: "Watch scans arrive, open card folders, and jump into review without digging through files.",
  },
  {
    id: "scanner",
    label: "Scanner",
    title: "AI extraction with the image saved",
    description: "Merchant, total, purchase date, line items, card last four, and work orders are extracted from the receipt.",
  },
  {
    id: "expenses",
    label: "Expenses",
    title: "Folders that match bookkeeping",
    description: "Browse by month, date, card, nested card-month folders, billable status, and AppFolio work order.",
  },
  {
    id: "export",
    label: "Export",
    title: "Reports ready for your accountant",
    description: "Export structured rows to Google Sheets or CSV with dates, cards, work orders, and receipt details.",
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
