import OpenAI from "openai"
import * as Diff from "diff"
import "dotenv/config"

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000",
    "X-OpenRouter-Title": "SENTINEL_OS",
  },
})

// const AI_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"
// const AI_MODEL = "deepseek/deepseek-v4-flash:free"
// const AI_MODEL = "poolside/laguna-xs.2:free"
// const AI_MODEL = "poolside/laguna-m.1:free"
const AI_MODEL = process.env.OPENROUTER_AI_MODEL || "poolside/laguna-m.1:free"

function getCompletionText(completion) {
  const choice = completion.choices?.[0]
  const message = choice?.message
  if (!message) return ""

  const content = message.content
  if (typeof content === "string" && content.trim()) {
    return content.trim()
  }
  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === "string") return part
        if (part?.type === "text" && part.text) return part.text
        return ""
      })
      .join("")
    if (text.trim()) return text.trim()
  }

  // Fallback when OpenRouter puts output only in reasoning fields
  const fallback = []
  if (typeof message.reasoning === "string" && message.reasoning.trim()) {
    fallback.push(message.reasoning)
  }
  if (typeof message.reasoning_content === "string" && message.reasoning_content.trim()) {
    fallback.push(message.reasoning_content)
  }
  const details = message.reasoning_details
  if (Array.isArray(details)) {
    for (const detail of details) {
      if (detail?.type === "reasoning.text" && detail.text) {
        fallback.push(detail.text)
      }
    }
  }
  if (typeof message.refusal === "string" && message.refusal.trim()) {
    fallback.push(message.refusal)
  }

  return fallback.join("\n").trim()
}

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
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in environment")
  }

  const prompt = `You are SENTINEL_OS, an expert Mantle L2 smart contract auditor.

Analyze this Solidity contract and return ONLY valid JSON, no markdown, no explanation outside the JSON.

Contract:
${code}


NOTE:The OPENZEPPELIN V5 the entire security directory no longer exists, it has been moved to utils directory

SOLIDITY VERSION:
- Latest supported version is 0.8.35 — use ^0.8.20 or higher, never flag it as an error
- Native overflow/underflow protection is built in — no SafeMath needed
- Use custom errors instead of revert strings for gas savings

For the "optimizedCode" field you MUST:
1. Fix ALL identified vulnerabilities (reentrancy, tx.origin abuse, integer overflow, etc.)
2. Apply ALL gas optimizations (cache array lengths outside loops, use calldata instead of memory where possible, use ++i instead of i++, pack storage variables, etc.)
3. Return the COMPLETE rewritten contract — every single line including unchanged functions, imports, and comments
4. The output must be a valid, fully deployable Solidity file — not a summary or partial snippet
6. Never import SafeMath — use native arithmetic
7. Always pass initialOwner to Ownable constructor if the contract inherits Ownable

CRITICAL CODE QUALITY RULES for optimizedCode:
- Every function, modifier, and identifier you reference MUST be declared or imported
- Do NOT call _setupRole() unless the contract explicitly imports and inherits AccessControl
- Do NOT call _transferOwnership(), _checkOwner(), or any internal OZ function unless you are certain it exists in the contract code itself
- Do NOT mix patterns from different contracts — only use what is imported in the contract code
- After writing optimizedCode, mentally verify: does every function call resolve to something declared or imported?
- If you are uncertain whether a function exists, use a simpler pattern you are confident about or dont add it at all
- The optimizedCode MUST compile with solc ^0.8.x with no errors and solidity syntax error — treat compilation errors as a critical failure

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

  let completion
  try {
    completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      // max_tokens: 16384,
      // Reasoning runs internally; exclude keeps the JSON answer in `content`
      reasoning: { enabled: true, exclude: true },
    })
  } catch (err) {
    const status = err?.status
    const hint =
      status === 404
        ? `Check OPENROUTER_API_KEY and model id (${AI_MODEL}).`
        : status === 401
          ? "Invalid or missing OPENROUTER_API_KEY."
          : err?.message || "OpenRouter request failed"
    throw new Error(`AI analysis failed (${status ?? "error"}): ${hint}`)
  }

  const rawText = getCompletionText(completion)
  if (!rawText) {
    const finishReason = completion.choices?.[0]?.finish_reason ?? "unknown"
    console.error("AI empty response:", {
      finishReason,
      model: completion.model,
      messageKeys: Object.keys(completion.choices?.[0]?.message ?? {}),
    })
    throw new Error(
      `AI analysis returned an empty response (finish_reason: ${finishReason}). Try a shorter contract or a different model.`
    )
  }

  let result
  try {
    const cleanJson = rawText.replace(/```json|```/g, "").trim()
    result = JSON.parse(cleanJson)
  } catch (parseError) {
    console.error("AI raw JSON parse error, attempting fallback repair:", parseError)
    try {
      let repairedJson = rawText.replace(/```json|```/g, "").trim()
      repairedJson = repairedJson.replace(/,\s*([\]}])/g, "$1")

      if (!repairedJson.endsWith("}")) {
        const openBraces = (repairedJson.match(/{/g) || []).length
        const closeBraces = (repairedJson.match(/}/g) || []).length
        if (openBraces > closeBraces) {
          repairedJson += "}".repeat(openBraces - closeBraces)
        }
      }
      result = JSON.parse(repairedJson)
    } catch (secondError) {
      console.error("JSON repair failed, falling back to empty structured result:", secondError)
      result = {
        optimizedCode: code,
        changedLines: { removed: [], added: [] },
        vulnerabilities: [],
        optimizations: [],
        optimizationInsights: [
          "Contract too large for full rewrite. Security vulnerabilities and gas recommendations are listed above.",
        ],
        gasProjection: { before: 0, after: 0, percent: 0 },
        mantleCompatibility: [
          { check: "L2 Data Availability Optimism", status: "pass" },
          { check: "Bedrock Execution Support", status: "pass" },
          { check: "EigenDA Payload Alignment", status: "pass" },
        ],
        summary: "Unable to parse AI response. Displaying original contract without changes.",
      }
    }
  }

  if (result.gasProjection) {
    result.gasProjection.before = parseInt(result.gasProjection.before) || 0
    result.gasProjection.after = parseInt(result.gasProjection.after) || 0
  }

  if (result.optimizedCode && result.optimizedCode.trim() !== code.trim()) {
    result.changedLines = computeChangedLines(code, result.optimizedCode)
  } else {
    result.changedLines = { removed: [], added: [] }
  }

  return result
}
