import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function callAiAnalysis(code) {
  const prompt = `You are SENTINEL_OS, an expert Mantle L2 smart contract auditor.

Analyze this Solidity contract and return ONLY valid JSON, no markdown, no explanation outside the JSON.

Contract:
${code}

Return this exact shape:
{
  "securityScore": <0-100 integer>,
  "vulnerabilities": [
    {
      "severity": "HIGH" | "MED" | "LOW",
      "line": <line number>,
      "title": "<short title>",
      "message": "<detailed explanation>",
      "recommendation": "<specific fix>"
    }
  ],
  "optimizations": [
    {
      "line": <line number>,
      "issue": "<what the problem is>",
      "estimatedGasSaving": "<e.g. ~3000 gas per call>",
      "fix": "<specific code change>"
    }
  ],
  "optimizationInsights": [
    "<plain english explanation of each optimization made, highlight code/keywords using backticks like \`memory\` or \`uint256\`>"
  ],
  "originalCode": "<the input code. CRITICAL: Add a '|' character at the VERY START of every line that is removed or modified in the optimized version.>",
  "optimizedCode": "<the fully rewritten contract. CRITICAL: Add a '|' character at the VERY START of every line that is new or modified compared to the original version.>",
  "gasSavedPercent": <number like 24.8>,
  "executionSpeedMultiplier": <number like 1.4>,
  "gasProjection": {
    "before": "<total gas estimate before, e.g. 4200000>",
    "after": "<total gas estimate after, e.g. 3100000>",
    "percent": <savings percent, e.g. 24.8>
  },
  "mantleCompatibility": [
    { "check": "L2 Data Availability Optimism", "status": "pass" | "warn" | "fail" },
    { "check": "Bedrock Execution Support", "status": "pass" | "warn" | "fail" },
    { "check": "EigenDA Payload Alignment", "status": "pass" | "warn" | "fail" }
  ],
  "summary": "<2-3 sentence plain english summary of findings>"
}`;

  const response = await genAI.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text;

  // The new SDK usually returns text directly if mimeType is set, 
  // but let's be safe.
  const cleanJson = text.replace(/```json|```/g, "").trim();

  return JSON.parse(cleanJson);
}
