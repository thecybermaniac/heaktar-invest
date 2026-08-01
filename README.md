# Heaktar Invest

Build: Heaktar — Investment PWA (Mobile-Only)

Build a mobile-only Progressive Web App called Heaktar, an investment platform. Design for a single mobile viewport (max-w-md, centered on larger screens) — no desktop layout needed.

Stack & Global Rules

React + TailwindCSS, PWA-ready (manifest + service worker)

Font: Poppins (all weights)

Border radius: Tailwind rounded scale everywhere (cards, buttons, inputs, modals)

All inputs: h-12, left-side icon, fully custom-styled (no native browser UI — date pickers, selects, dropdowns must be custom components, not native <input type="date">/<select>)

Theme: Light (#ffffff bg) and Dark (#1a1a1a bg) modes, toggle in Settings, green (#16a34a-ish) as the single accent color across both modes

Bottom tab navigation, fixed, 5 items: Dashboard, My Investments, central raised Invest button, Referral, Profile

Use mock/placeholder data with realistic structure for anything not specified (e.g. transaction history, notifications)

Auth Flow

Login (landing/root page): email, password inputs, "Continue with Google" button, link to Register, forgot password link.

Register: first name, last name, email, password, referral code (optional). Link back to Login.

Onboarding (post-register, multi-step wizard with progress indicator, custom back/next nav):

Personal: date of birth (custom date picker), gender, nationality (default "Nigeria", dropdown)

Location: state, city, residential address

Identity: ID type (National ID / Passport / Driver's License — segmented control), ID number

Financial profile: occupation, employment status, primary source of funds, investment experience, risk tolerance (each as custom select/chip options)

Final step: summary + terms/agreement checkbox confirmation → submit → Dashboard

Dashboard

Top bar: profile avatar (left, tappable → Profile), notification bell icon (right, tappable → Notifications, with unread badge)

Balance card: total balance (large), eye icon to toggle visibility (mask with ••••), net investment amount, net profit amount (green if positive)

Market strip: below balance card, horizontal-scroll row of small cards labeled "Market" showing real-time price + % change for Apple, Nvidia, and 4 more "Big 5" large-cap tickers. Fetch from Twelve Data API (use a placeholder TWELVE_DATA_API_KEY env var + fetch hook; mock data as fallback)

Performance chart: line chart of investment performance over the trailing 1 month

Activity history: recent transactions/list feed below the chart

Invest Flow (3 separate pages + success)

Select Plan: list of selectable plan cards (see Plan schema below); tapping selects then continues

Investment Details: shows selected plan's terms, amount input (validated against min/max), computed service fee (2%) and computed returns

Success: confirmation screen with summary, CTA back to Dashboard / My Investments

Plan Card Schema

name: string
dailyInterest: percentage
term: number (days)
minAmount: number
maxAmount: number
depositReturned: boolean (default true)
totalReturn: number


Plans (seed data)

Plan Starter Silver Diamond Platinum (populate each with sample dailyInterest/term/min/max/totalReturn values)

Note: Investment Details page must display a 2% service fee applied to the entered amount.

My Investments (2 separate pages)

Active Investments: list of ongoing investments, each showing plan, amount, daily return, days remaining, progress bar

History: completed/past investments, filterable list

Other Screens

Deposit: amount input, payment method selection, confirm

Withdrawal: amount input, destination/bank selection, balance check, confirm

Referral: referral code display + copy/share, referral stats, referred users list

Profile & Settings: avatar, personal info (from onboarding), theme toggle, security (change password), logout

Notifications: list of notifications, read/unread states

Build all screens with real navigation between them (not just Dashboard). Prioritize a cohesive, polished, fintech-grade visual style — generous spacing, subtle shadows/borders, clear hierarchy.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8404b5a0-18cf-4eda-8262-2628d516f8d0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
