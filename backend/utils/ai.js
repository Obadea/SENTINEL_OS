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
const AI_MODEL = "poolside/laguna-xs.2:free"

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

CRITICAL — OPENZEPPELIN V5 IMPORT PATHS (you MUST use these exact paths in optimizedCode):
The project uses @openzeppelin/contracts v5. Import paths changed significantly from v4.
Use ONLY these correct v5 paths:

SECURITY / UTILS:
  ✅ @openzeppelin/contracts/utils/ReentrancyGuard.sol        (NOT security/)
  ✅ @openzeppelin/contracts/utils/Pausable.sol               (NOT security/)
  ✅ @openzeppelin/contracts/utils/ReentrancyGuardTransient.sol (new in v5)

ACCESS CONTROL:
  ✅ @openzeppelin/contracts/access/Ownable.sol               (unchanged)
  ✅ @openzeppelin/contracts/access/Ownable2Step.sol          (unchanged)
  ✅ @openzeppelin/contracts/access/AccessControl.sol         (unchanged)
  ✅ @openzeppelin/contracts/access/manager/AccessManager.sol (new in v5)

TOKENS:
  ✅ @openzeppelin/contracts/token/ERC20/ERC20.sol            (unchanged)
  ✅ @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol  (unchanged)
  ✅ @openzeppelin/contracts/token/ERC721/ERC721.sol          (unchanged)
  ✅ @openzeppelin/contracts/token/ERC1155/ERC1155.sol        (unchanged)

UTILS:
  ✅ @openzeppelin/contracts/utils/Address.sol                (unchanged)
  ✅ @openzeppelin/contracts/utils/math/Math.sol              (unchanged)
  ✅ @openzeppelin/contracts/utils/math/SafeMath.sol          (removed in v5 — do NOT import, use native overflow checks)
  ✅ @openzeppelin/contracts/utils/Strings.sol                (unchanged)
  ✅ @openzeppelin/contracts/utils/cryptography/ECDSA.sol     (unchanged)

OPENZEPPELIN V5 BREAKING CHANGES YOU MUST APPLY:
1. SafeMath is REMOVED — never import it. Solidity ^0.8.x has built-in overflow protection
2. Ownable constructor now requires explicit owner address: constructor(address initialOwner) Ownable(initialOwner) {}
   NOT the old pattern: constructor() { _owner = msg.sender; } or just Ownable()
3. ERC20 constructor: constructor(string name, string symbol) ERC20(name, symbol)  — unchanged
4. _msgSender() and _msgData() are still available via Context but rarely needed directly
5. Custom errors are preferred over require strings: error Unauthorized(); revert Unauthorized();
6. ReentrancyGuard uses transient storage variant ReentrancyGuardTransient for chains that support EIP-1153

SOLIDITY VERSION:
- Latest supported version is 0.8.35 — use ^0.8.20 or higher, never flag it as an error
- Native overflow/underflow protection is built in — no SafeMath needed
- Use custom errors instead of revert strings for gas savings

For the "optimizedCode" field you MUST:
1. Fix ALL identified vulnerabilities (reentrancy, tx.origin abuse, integer overflow, etc.)
2. Apply ALL gas optimizations (cache array lengths outside loops, use calldata instead of memory where possible, use ++i instead of i++, pack storage variables, etc.)
3. Return the COMPLETE rewritten contract — every single line including unchanged functions, imports, and comments
4. The output must be a valid, fully deployable Solidity file — not a summary or partial snippet
5. Use ONLY the correct OpenZeppelin v5 import paths listed above
6. Never import SafeMath — use native arithmetic
7. Always pass initialOwner to Ownable constructor if the contract inherits Ownable

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
