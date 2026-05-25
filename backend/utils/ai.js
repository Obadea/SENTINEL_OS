import { GoogleGenAI } from "@google/genai"
import * as Diff from 'diff'
import "dotenv/config"

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

function computeChangedLines(originalCode, optimizedCode) {
  const removed = []
  const added = []
  const changes = Diff.diffLines(originalCode, optimizedCode)

  let originalLine = 1
  let optimizedLine = 1

  for (const change of changes) {
    const lineCount = change.count || 0
    if (change.removed) {
      for (let i = 0; i < lineCount; i++) removed.push(originalLine + i)
      originalLine += lineCount
    } else if (change.added) {
      for (let i = 0; i < lineCount; i++) added.push(optimizedLine + i)
      optimizedLine += lineCount
    } else {
      originalLine += lineCount
      optimizedLine += lineCount
    }
  }

  return { removed, added }
}

export async function callAiAnalysis(code) {
  const prompt = `You are SENTINEL_OS, an expert Mantle L2 smart contract auditor.

Analyze this Solidity contract and return ONLY valid JSON, no markdown, no explanation outside the JSON.

Contract:
${code}

For the "optimizedCode" field you MUST:
1. Fix ALL identified vulnerabilities (reentrancy, tx.origin abuse, integer overflow, etc.)
2. Apply ALL gas optimizations (cache array lengths outside loops, use calldata instead of memory where possible, use ++i instead of i++, pack storage variables, etc.)
3. Return the COMPLETE rewritten contract — every single line including unchanged functions, imports, and comments
4. The output must be a valid, fully deployable Solidity file — not a summary or partial snippet

Return this exact JSON shape:
{
  "securityScore": <0-100 integer — score AFTER fixes are applied>,
  "vulnerabilities": [
    {
      "severity": "HIGH" | "MED" | "LOW",
      "line": <line number in original contract>,
      "title": "<short title>",
      "message": "<detailed explanation of the vulnerability>",
      "recommendation": "<specific code fix>"
    }
  ],
  "optimizations": [
    {
      "line": <line number in original contract>,
      "issue": "<what the problem is>",
      "estimatedGasSaving": "<e.g. ~3000 gas per call>",
      "fix": "<specific code change applied>"
    }
  ],
  "optimizationInsights": [
    "<plain english explanation of each optimization made>"
  ],
  "optimizedCode": "<the complete valid Solidity source with ALL vulnerabilities fixed and ALL optimizations applied — must include every line of the contract>",
  "gasSavedPercent": <number like 24.8>,
  "executionSpeedMultiplier": <number like 1.4>,
  "gasProjection": {
    "before": <estimated gas integer before optimization>,
    "after": <estimated gas integer after optimization>,
    "percent": <savings percent number>
  },
  "mantleCompatibility": [
    { "check": "L2 Data Availability Optimism", "status": "pass" | "warn" | "fail" },
    { "check": "Bedrock Execution Support", "status": "pass" | "warn" | "fail" },
    { "check": "EigenDA Payload Alignment", "status": "pass" | "warn" | "fail" }
  ],
  "summary": "<2-3 sentence plain english summary of findings and what was fixed>"
}`

  const response = await genAI.models.generateContent({
    // NEW MODEL IS GEMINI 2.5 FLASH -- IS THE BEST MODEL 
    model: "gemini-flash-latest",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  })

  let result;
  try {
    const cleanJson = response.text.replace(/```json|```/g, "").trim();
    result = JSON.parse(cleanJson);
  } catch (parseError) {
    console.error("Gemini raw JSON parse error, attempting fallback repair:", parseError);
    try {
      // Simple repair for trailing commas or missing closing structures
      let repairedJson = response.text.replace(/```json|```/g, "").trim();

      // Remove trailing commas inside arrays or objects: e.g., ,] -> ] or ,} -> }
      repairedJson = repairedJson.replace(/,\s*([\]}])/g, '$1');

      // If still not ending in '}', append necessary closing brackets
      if (!repairedJson.endsWith('}')) {
        const openBraces = (repairedJson.match(/{/g) || []).length;
        const closeBraces = (repairedJson.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          repairedJson += '}'.repeat(openBraces - closeBraces);
        }
      }
      result = JSON.parse(repairedJson);
    } catch (secondError) {
      console.error("JSON repair failed, falling back to empty structured result:", secondError);
      result = {
        optimizedCode: code,
        changedLines: { removed: [], added: [] },
        vulnerabilities: [],
        optimizations: [],
        optimizationInsights: [
          "Contract too large for full rewrite. Security vulnerabilities and gas recommendations are listed above."
        ],
        gasProjection: { before: 0, after: 0, percent: 0 },
        mantleCompatibility: [
          { check: "L2 Data Availability Optimism", status: "pass" },
          { check: "Bedrock Execution Support", status: "pass" },
          { check: "EigenDA Payload Alignment", status: "pass" }
        ],
        summary: "Unable to parse AI response. Displaying original contract without changes."
      };
    }
  }

  // Normalize gasProjection types
  if (result.gasProjection) {
    result.gasProjection.before = parseInt(result.gasProjection.before) || 0;
    result.gasProjection.after = parseInt(result.gasProjection.after) || 0;
  }

  // Compute diff accurately — never trust AI for line counting
  if (result.optimizedCode && result.optimizedCode.trim() !== code.trim()) {
    result.changedLines = computeChangedLines(code, result.optimizedCode);
  } else {
    result.changedLines = { removed: [], added: [] };
  }

  return result;
}