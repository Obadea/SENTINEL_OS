# 🛡️ SENTINEL OS — Cyber-Industrial Security Frontend

Welcome to the frontend application of **Sentinel OS**, a high-fidelity, brutally industrial smart contract security workspace. Built using Next.js 16 and Tailwind CSS v4, this dashboard provides web3 developers with real-time Solidity syntax highlighting via Monaco Editor, a dedicated code compiler dashboard, interactive gas/compatibility charts, and live security audit logs.

---

## ⚡ Tech Stack

*   **Framework:** Next.js 16 (App Router, React 19)
*   **Styling & UI:** Tailwind CSS v4 (Custom Brutalist Theme)
*   **Animations:** Motion (Framer Motion v12) & custom CSS Micro-animations
*   **Code Workspace:** Monaco Editor (`@monaco-editor/react`) with live tab renaming
*   **Visual Analytics:** Recharts (Custom Security Pulse radial charts and compatibility metrics)
*   **Authentication:** Clerk Next.js SDK (`@clerk/nextjs`)
*   **State & API Fetching:** TanStack React Query (v5) & Axios

---

## 🚀 Prerequisites

Make sure you have the following installed locally:
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [npm](https://www.npmjs.com/) (bundled with Node.js)
*   A running **Sentinel OS Backend** (running on `http://localhost:5000`)

---

## 🛠️ Step-by-Step Setup

### 1. Install Dependencies
Navigate to the `frontend` directory and install the package dependencies:
```bash
npm install
```

### 2. Environment Variables Configuration
Create a `.env.local` file in the root of your `frontend` directory:
```env
# Clerk Authentication Keys (Must match Backend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Backend Connection Endpoint
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### 3. Start the Development Server
Launch the local Next.js development server:
```bash
npm run dev
```

### 4. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your web browser. You'll be presented with the Sentinel OS main screen, where you can log in, open the Solidity editor workspace, and start auditing smart contracts.

---

## 📂 Frontend Architecture & Modules
```bash
frontend/
├── src/
│   ├── app/                    # Next.js App Router Pages
│   │   ├── dashboard/          # Auditing & Analytics Dashboard
│   │   │   ├── history/        # Previous audit scans history
│   │   │   └── page.tsx        # Main Solidity Editor & Pulse Gauge workspace
│   │   ├── layout.tsx          # Root theme provider & layouts
│   │   └── page.tsx            # Branded Brutalist landing page
│   ├── components/             # Reusable UI Components
│   │   ├── security-pulse-chart.tsx # Radial & Line charts for security health
│   │   └── animate-ui/         # Customized micro-animated components (tabs, tooltips)
│   ├── lib/                    # Global utility files
│   │   └── utils.ts            # Classnames merger helper (clsx + tailwind-merge)
│   └── styles/                 # Tailwind CSS directives & global animations
├── public/                     # Static media files and loaders
├── tailwind.config.js          # Extended brutalist design system token configurations
└── package.json                # Frontend package configurations & scripts
```

---

## 🎨 Design System & Aesthetics
Sentinel OS uses a curated, premium **Cyber-Industrial Brutalist Theme**:
*   **Palette:** Deep terminal grays (`#0d0e12`), high-contrast electric warning colors (Mantle Green, Amber Warning, Critical Crimson), and glassmorphism panel backdrops.
*   **Typography:** Strict geometric fonts (Inter, Outfit) to match real-time industrial terminal interfaces.
*   **Interactivity:** Smooth micro-animations for tabs, active state glow indices, hover state transformations, and seamless transitions to convey high-fidelity data reporting.
