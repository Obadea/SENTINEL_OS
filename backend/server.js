import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { clerkMiddleware } from '@clerk/express';

import { inngest } from './inngest/client.js';


import {
    syncUser,
    updateUser,
    deleteUser,
} from "./inngest/functions.js";

import { serve } from "inngest/express";
import analysisRouter from './routes/analysis.js';

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: [
            process.env.ORIGIN_CORS || "http://localhost:3000",
        ],
        credentials: true,
    })
);

app.use(morgan("dev"));
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Cyber-Industrial Auditor Backend is live!'));

// Inngest
app.use("/api/inngest", serve({
    client: inngest, functions: [
        syncUser,
        updateUser,
        deleteUser,
    ],
}));

// Routes
app.use("/api/analysis", analysisRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
