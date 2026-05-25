import express from "express";
import { requireAuth } from "@clerk/express";
import {
  geminiEditorComplete,
  geminiEditorLint,
} from "../utils/gemini-editor.js";

const router = express.Router();

router.post("/complete", requireAuth(), async (req, res) => {
  try {
    const { code, line, column, fileName } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "code is required" });
    }
    const text = await geminiEditorComplete({
      code,
      line: Number(line) || 1,
      column: Number(column) || 1,
      fileName: fileName || "Contract.sol",
    });
    res.json({ text });
  } catch (err) {
    console.error("Gemini editor complete error:", err?.message ?? err);
    res.status(500).json({ error: err?.message || "Completion failed" });
  }
});

router.post("/lint", requireAuth(), async (req, res) => {
  try {
    const { code, fileName } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "code is required" });
    }
    const text = await geminiEditorLint({
      code,
      fileName: fileName || "Contract.sol",
    });
    res.json({ text });
  } catch (err) {
    console.error("Gemini editor lint error:", err?.message ?? err);
    res.status(500).json({ error: err?.message || "Lint failed" });
  }
});

export default router;
