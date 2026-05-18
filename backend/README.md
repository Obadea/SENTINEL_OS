# 🛡️ SENTINEL OS — Cyber-Industrial Security Backend

Welcome to the backend engine of **Sentinel OS**, a high-fidelity smart contract security auditing and analytics platform. This backend is responsible for running deep static analysis on Solidity smart contracts using Google's Gemini Pro API, managing database records via Prisma, handling authentication callbacks with Clerk, and orchestrating asynchronous analysis pipelines with Inngest.

---

## ⚡ Tech Stack

*   **Runtime & Server:** Node.js (ES Modules) & Express.js
*   **Database ORM:** Prisma Client with Neon Serverless PostgreSQL
*   **Background Jobs:** Inngest Event-Driven Orchestration
*   **AI Engine:** Google `@google/genai` (Gemini API)
*   **Web3 Integration:** Ethers (v6) & Etherscan API (for contract importing)
*   **Authentication:** Clerk Express Integration (`@clerk/express`)

---

## 🚀 Prerequisites

Before you start, make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [npm](https://www.npmjs.com/) (installed with Node.js)
*   [Inngest Dev Server](https://www.inngest.com/docs/local-development) (for running local background jobs)

---

## 🛠️ Step-by-Step Setup

### 1. Install Dependencies
Navigate to the `backend` directory and install the required npm packages:
```bash
npm install
```

### 2. Environment Variables Configuration
Create a `.env` file in the root of your `backend` directory by copying the structure below:
```env
# Server Configuration
PORT=5000
ORIGIN_CORS=http://localhost:3000

# Neon PostgreSQL Database Connections
# (Required: Pools for queries, Direct for migrations)
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=verify-full&channel_binding=require"
DIRECT_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=verify-full&channel_binding=require"

# Clerk Authentication (Match keys with Frontend)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Inngest Background Jobs
# (Keys obtained from Inngest Dashboard or automatic for local development)
INNGEST_EVENT_KEY=Vb...
INNGEST_SIGNING_KEY=signkey-prod-...

# AI & Web3 APIs
GEMINI_API_KEY=AIzaSy...
ETHERSCAN_API_KEY=Q7...
```

### 3. Database Schema Sync & Prisma Client Generation
Before starting the server, run the Prisma sync commands to set up the Postgres tables and generate the local custom ESM Prisma client:

```bash
# Push schema changes to Neon PostgreSQL database
npx prisma db push

# Generate the custom ESM client
npx prisma generate
```

### 4. Launch Inngest local development server
Sentinel OS relies on **Inngest** to process multi-pass contract audits in the background. In a separate terminal, launch the local Inngest developer server:
```bash
npx inngest-cli dev -u http://localhost:5000/api/inngest
```

### 5. Start the Dev Server
Start the Express server with automatic hot-reloading using Nodemon:
```bash
npm run dev
```
The server will boot up by default on `http://localhost:5000`.

---

## 📂 Backend Structure
```bash
backend/
├── inngest/            # Inngest background event handlers and pipelines
│   ├── client.js       # Inngest Client initialization
│   └── functions.js    # Security auditing background jobs
├── prisma/             # Database Schemas & Generated Clients
│   ├── schema.prisma   # PostgreSQL prisma schemas (User, Audit, Finding, Analysis)
│   └── generated/      # Custom ESM generated Prisma client
├── routes/             # Express route controllers
│   ├── analysis.js     # Smart contract scans, imports, and audit history
│   └── users.js        # User profile registration / Clerk synchronization
├── utils/              # Utility helpers (Gemini API integration, Solidity parser)
├── server.js           # Server entry point & Express configuration
└── package.json        # Dependencies & Nodemon scripts
```

---

## 🛡️ Security Auditing Pipeline Details
When a user uploads a smart contract for scanning:
1. **Analysis Request:** The frontend issues a `POST` request to `/api/analysis/scan`.
2. **Event Dispatch:** The backend triggers an `audit.requested` event via Inngest.
3. **Inngest Processing:** Inngest picks up the event asynchronously. It contacts the Gemini API using custom system instructions to check:
    *   **Vulnerability Detection:** Reentrancy, overflow, unchecked send, access control, etc.
    *   **Gas Optimizations:** Unused variables, packing storage, memory vs storage, calldata vs memory.
    *   **Mantle L2 Compatibility:** Inspects codes against EVM differences on Mantle Network.
4. **Database Write:** Results are structured into `Audit`, `Finding`, and `Analysis` models and saved to PostgreSQL.
5. **Real-time completion:** The frontend pulls or updates the dashboard once the job changes state in database.
