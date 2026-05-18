# 🛡️ SENTINEL_OS — Cyber-Industrial Smart Contract Auditor

SENTINEL_OS is a high-fidelity, brutally industrial smart contract security workspace and analysis platform. It combines a real-time, interactive Next.js Solidity workspace with an event-driven Express/Inngest backend utilizing Google's Gemini Pro API to run deep, multi-pass security scans, gas optimizations, and L2 compatibility checks.

---

## 🏗️ Repository Architecture

This is a monorepo containing both the frontend client and the backend server modules:

```bash
SENTINEL_OS/
├── 📁 frontend/     # Next.js 16 App & Monaco Solidity Workspace
└── 📁 backend/      # Express.js, Prisma ORM, Inngest, & Gemini Engine
```

---

## 🚀 Quick Start Guide

To boot up the complete SENTINEL_OS platform on your local machine, follow these steps:

### 1. Configure the Backend
Navigate to the backend directory, install dependencies, configure your environment keys, run database synchronization, and launch the server.

*   **Setup Path:** [backend/README.md](file:///c:/Users/USER/Desktop/SENTINEL_OS/backend/README.md)
*   **Commands:**
    ```bash
    cd backend
    npm install
    # (Configure your .env file with Postgres, Clerk, Gemini, and Inngest keys)
    
    # Sync PostgreSQL schema & build Prisma client
    npx prisma db push
    npx prisma generate
    
    # Start local background job processor (In another terminal)
    npx inngest-cli dev -u http://localhost:5000/api/inngest
    
    # Run the server
    npm run dev
    ```

### 2. Configure the Frontend
In a new terminal window, navigate to the frontend directory, install dependencies, configure environment endpoints, and run the development app.

*   **Setup Path:** [frontend/README.md](file:///c:/Users/USER/Desktop/SENTINEL_OS/frontend/README.md)
*   **Commands:**
    ```bash
    cd frontend
    npm install
    # (Configure your .env.local file with Clerk keys and NEXT_PUBLIC_BACKEND_URL)
    
    # Start the dev client
    npm run dev
    ```

---

## ⚡ Key Workflows

### 🛡️ Smart Contract Auditing
1. Paste or import a Solidity smart contract into the **Monaco Editor** in the workspace.
2. Click **Run Scan**. The frontend schedules a background job by calling the backend API.
3. The backend dispatches an event to the **Inngest local server**, which kicks off a multi-stage audit using **Gemini Pro**.
4. The audit evaluates vulnerabilities (reentrancy, overflows), gas optimizations, and **Mantle Network L2 compatibility**.
5. Once complete, findings are logged to the PostgreSQL database, and the frontend updates the **Security Pulse Gauge** with charts and recommendations.

---

## 🔒 Security & Safe Credentials
*   **Environment variables** (`.env` & `.env.local`) are strictly excluded from git tracking through custom `.gitignore` policies in both frontend and backend directories.
*   Make sure never to commit private database keys, Gemini API keys, or Clerk secrets to production repositories.
