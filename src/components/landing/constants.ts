export const SITE_NAME = "Moodna";
export const SITE_LOGO_SVG: string = "";
export const SITE_LOGO_ALT = "Moodna";

export const ANNOUNCEMENT = {
  text: "New: receipt image viewer, card folders, month folders, and purchase-date sorting.",
  href: "/dashboard/scan",
  linkLabel: "Try Moodna",
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

export const FEATURE_ROWS = [
  {
    id: "scan",
    label: "RECEIPT SCANNING",
    title: "Upload expenses",
    highlight: "seamlessly",
    description:
      "Snap a photo or upload a file. Moodna reads merchant, amount, purchase date, card last four, line items, and work orders — then saves the original image for review.",
    primaryCta: { label: "Try Moodna", href: "/dashboard/scan" },
    secondaryCta: { label: "View dashboard", href: "/dashboard" },
    videoLabel: "Receipt scanning demo",
    reverse: false,
    icon: "scan",
  },
  {
    id: "folders",
    label: "CARD FOLDERS",
    title: "Verify billable client expenses",
    highlight: "on autopilot",
    description:
      "Every receipt lands in card folders with nested month dropdowns. Browse by purchase date, billable status, or AppFolio work order without digging through spreadsheets.",
    primaryCta: { label: "Open folders", href: "/dashboard/expenses" },
    secondaryCta: { label: "See live feed", href: "/dashboard" },
    videoLabel: "Card folder organization",
    reverse: true,
    icon: "folders",
  },
  {
    id: "review",
    label: "REVIEW & APPROVE",
    title: "Review expenses",
    highlight: "before export",
    description:
      "Open the saved receipt image, fix categories, flag missing work orders, and approve what should sync to accounting — all from one dashboard.",
    primaryCta: { label: "Review expenses", href: "/dashboard/expenses" },
    secondaryCta: { label: "Try it free", href: "/dashboard/scan" },
    videoLabel: "Expense review workflow",
    reverse: false,
    icon: "review",
  },
  {
    id: "export",
    label: "EXPORT",
    title: "Export clean reports",
    highlight: "in one click",
    description:
      "Send filtered receipt rows to Google Sheets or download CSV for your accountant. Dates, cards, work orders, and line items stay structured and ready to import.",
    primaryCta: { label: "Export expenses", href: "/dashboard/expenses" },
    secondaryCta: { label: "View integrations", href: "/#features" },
    videoLabel: "Google Sheets export",
    reverse: true,
    icon: "export",
  },
] as const;

export const PRICING_PLANS = [
  {
    name: "Starter",
    badge: "Most popular",
    description: "Best for solo operators and small teams",
    monthlyPrice: "Free",
    yearlyPrice: "Free",
    features: [
      "Unlimited receipt scans",
      "Purchase-date & card folders",
      "Receipt image viewer",
      "CSV export",
      "Local + cloud sync",
    ],
    href: "/dashboard/scan",
    featured: true,
  },
  {
    name: "Pro",
    badge: "Coming soon",
    description: "Best for multi-user bookkeeping teams",
    monthlyPrice: "$19",
    yearlyPrice: "$15",
    features: [
      "Everything in Starter",
      "Google Sheets auto-export",
      "Accounting webhook",
      "Shared team inbox",
      "Priority support",
    ],
    href: "/dashboard",
    featured: false,
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "What does Moodna do?",
    answer:
      "Moodna turns receipt photos into organized expenses. Scan a receipt, review the extracted data with the original image attached, file everything into card and date folders, then export to Sheets or CSV when you're ready.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "You can open the dashboard and start scanning right away. Sign in with your email to tie expenses to your account and sync across devices when Supabase is configured.",
  },
  {
    question: "What data gets extracted from a receipt?",
    answer:
      "Merchant name, total amount, purchase date, card last four, line items, categories, billable flags, and AppFolio work order numbers when present on the receipt.",
  },
  {
    question: "Can I export to Google Sheets?",
    answer:
      "Yes. Configure Google service account credentials on the server to export directly to a spreadsheet. Without that setup, Moodna falls back to CSV download.",
  },
  {
    question: "Will my receipt images be saved?",
    answer:
      "Yes. Every scan keeps the original receipt image attached so you can open it later from the expense list or folder views.",
  },
  {
    question: "Can my teammate see my receipts?",
    answer:
      "Expenses sync to the account email you sign in with. Share the same account email with teammates if you want shared data, or use separate emails for separate workspaces.",
  },
] as const;

export const FOOTER_COLUMNS = {
  links: [
    ["Features", "/#features"],
    ["Pricing", "/#pricing"],
    ["FAQ", "/#faq"],
    ["Scan receipts", "/dashboard/scan"],
  ],
  product: [
    ["Dashboard", "/dashboard"],
    ["Expenses", "/dashboard/expenses"],
    ["Integrations", "/#features"],
    ["Help", "mailto:hello@kaikj.app"],
  ],
} as const;
