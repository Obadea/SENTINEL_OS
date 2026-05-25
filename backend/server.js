import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { clerkMiddleware } from '@clerk/express';
import { attachGeminiLiveProxy } from './ws/gemini-live-proxy.js';

import { inngest } from './inngest/client.js';


import {
    syncUser,
    updateUser,
    deleteUser,
} from "./inngest/functions.js";

import { serve } from "inngest/express";
import analysisRouter from './routes/analysis.js';
import geminiEditorRouter from './routes/gemini-editor.js';

const app = express();

// NOTE: Default is 100kb, user upload files up to 6000 code lines, so we need to increase the limit
// app.use(express.json());

//this was added so user upload large code files up to 6000 code lines
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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
app.use("/api/gemini-editor", geminiEditorRouter);

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
attachGeminiLiveProxy(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.GEMINI_API_KEY) {
        console.log('Gemini Live WebSocket: /api/gemini-live?channel=completion|lint');
    }
});
