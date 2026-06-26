# Kai KJ

Scan receipts with your phone and automatically categorize expenses.

Built with **Next.js** (App Router) and **React**.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) + TypeScript |
| Styling | Tailwind CSS |
| Receipt AI | Kie.ai Gemini 3 Flash (`/api/scan-receipt`) |
| Storage | Browser localStorage (device-only for now) |
| Mobile | PWA-ready for iPhone Safari |

## Project structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (server component)
│   ├── page.tsx            # Home route (server component)
│   ├── manifest.ts         # PWA manifest for iPhone install
│   ├── api/scan-receipt/   # Next.js API route
│   └── globals.css
├── components/             # React components
│   ├── HomePage.tsx        # Main app (client component)
│   ├── ReceiptScanner.tsx
│   ├── ExpenseList.tsx
│   └── ...
└── lib/                    # Types, hooks, utilities
```

## How it works

1. Open the app in Safari on iPhone (or any mobile browser)
2. Tap **Take photo** or **Choose from Photos**
3. React sends the image to the Next.js API route
4. Gemini 3 Flash extracts merchant, amount, date, and category
5. Save the expense — stored locally on the device

## Setup

```bash
npm install
cp .env.example .env.local
# Add your Kie API key to .env.local
npm run dev
```

- **Local:** http://localhost:3000
- **iPhone (same Wi‑Fi):** use your computer's network IP, e.g. `http://10.0.0.204:3000`

### Add to iPhone Home Screen

In Safari: **Share → Add to Home Screen**. The app runs fullscreen like a native app.

## Environment variables

| Variable | Description |
|----------|-------------|
| `KIE_API_KEY` | Kie.ai API token for Gemini 3 Flash receipt scanning |

## Expense categories

Groceries, Dining, Transportation, Shopping, Entertainment, Health, Utilities, Travel, Business, Other

## Roadmap

- [ ] User accounts and cloud sync (Supabase)
- [ ] Monthly spending reports and charts
- [ ] Custom categories and rules
- [ ] Export to CSV / QuickBooks
