import express from "express";
import { requireAuth, clerkClient } from "@clerk/express";
import prisma from "../prisma/client.js";
import { callAiAnalysis } from "../utils/ai.js";
import { estimateGas } from "../utils/gas.js";
import { compileContract } from "../utils/compiler.js";
import { verifyContract } from "../utils/verify.js";

const router = express.Router();

// Helper to get or create user
async function getOrCreateUser(clerkUserId) {
    let user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId }
    });

    if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        user = await prisma.user.create({
            data: {
                clerkId: clerkUserId,
                email: clerkUser.emailAddresses[0].emailAddress,
                name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Auditor"
            }
        });
    }

    return user;
}


// 1. GET /api/analysis/latest
router.get("/latest", requireAuth(), async (req, res) => {
    try {
        const user = await getOrCreateUser(req.auth().userId);
        const latest = await prisma.analysis.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" }
        });

        res.json(latest);
    } catch (error) {
        console.error("Latest analysis error:", error);
        res.status(500).json({ error: "Failed to fetch latest analysis" });
    }
});

// Helper to parse Etherscan/Blockscout SourceCode (handles Standard JSON inputs)
function parseSourceCode(rawSource, contractName) {
    // Format 2: double-wrapped JSON (most common for verified contracts)
    if (rawSource.startsWith('{{')) {
        try {
            const json = JSON.parse(rawSource.slice(1, -1)) // strip outer { }
            return Object.entries(json.sources).map(([filename, { content }]) => ({
                name: filename.split('/').pop(), // just the filename, not full path
                content
            }))
        } catch { }
    }

    // Format 3: standard JSON
    if (rawSource.startsWith('{')) {
        try {
            const json = JSON.parse(rawSource)
            if (json.sources) {
                return Object.entries(json.sources).map(([filename, { content }]) => ({
                    name: filename.split('/').pop(),
                    content
                }))
            }
        } catch { }
    }

    // Format 1: plain Solidity string — wrap it as a single file
    return [{ name: `${contractName}.sol`, content: rawSource }]
}

// 1.5 GET /api/analysis/import-contract
router.get("/import-contract", requireAuth(), async (req, res) => {
    try {
        const { address, network = 'mainnet' } = req.query

        if (!address) {
            return res.status(400).json({ error: "Contract address is required" })
        }

        const addressRegex = /^0x[a-fA-F0-9]{40}$/
        if (!addressRegex.test(address)) {
            return res.status(400).json({ error: "Invalid contract address format" })
        }

        // Mantle chainids on Etherscan V2
        const chainId = network === 'testnet' ? '5003' : '5000'

        const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${process.env.ETHERSCAN_API_KEY}`

        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Etherscan API returned status ${response.status}`)
        }

        const data = await response.json()

        if (data.status !== "1" || !data.result?.length) {
            const raw = data.result || data.message || "Failed to fetch source code"
            const errorMsg = typeof raw === 'string' && raw.includes("not verified")
                ? "Contract is not verified. Only verified contracts can be imported."
                : raw
            return res.status(400).json({ error: errorMsg })
        }

        const contractInfo = data.result[0]
        const {
            SourceCode: rawSourceCode,
            ContractName: contractName = "ImportedContract",
            CompilerVersion: compilerVersion,
            OptimizationUsed: optimizationUsed,
            Runs: runs
        } = contractInfo

        if (!rawSourceCode) {
            return res.status(400).json({ error: "Source code is empty or missing." })
        }

        const files = parseSourceCode(rawSourceCode, contractName)

        res.json({ success: true, contractName, files, compilerVersion, optimizationUsed, runs })

    } catch (error) {
        console.error("Import contract error:", error)
        res.status(500).json({ error: "Failed to import contract. Please try again." })
    }
});

router.post("/create", requireAuth(), async (req, res) => {
    try {
        const { files, address, network } = req.body;
        const normalizedNetwork =
            network === "testnet" || network === "mainnet" ? network : null;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files provided" });
        }

        const mainFile = files[0]; // Assuming first file is the target
        const user = await getOrCreateUser(req.auth().userId);

        // Call AI for analysis
        const aiResult = await callAiAnalysis(mainFile.content);

        // Fallback if AI returns incomplete optimizedCode
        const originalLines = mainFile.content.split('\n').length;
        const optimizedLines = aiResult.optimizedCode?.split('\n').length || 0;

        if (optimizedLines < originalLines * 0.4) {
            aiResult.optimizedCode = mainFile.content;
            aiResult.changedLines = { removed: [], added: [] };
            aiResult.optimizationInsights = [
                "Contract too large for full rewrite. Security vulnerabilities and gas recommendations are listed below."
            ];
        }

        // Clean up gas projection to guarantee integer values (avoiding string inputs)
        if (aiResult.gasProjection) {
            aiResult.gasProjection.before = parseInt(aiResult.gasProjection.before) || 0;
            aiResult.gasProjection.after = parseInt(aiResult.gasProjection.after) || 0;
        }

        // Estimate Gas
        const gasProjection = await estimateGas(aiResult.optimizedCode || mainFile.content);

        // Severity Tag logic
        let severityTag = "CRITICAL_PASS";
        if (aiResult.securityScore < 50) severityTag = "CRITICAL";
        else if (aiResult.securityScore < 70) severityTag = "HIGH_RISK";
        else if (aiResult.securityScore < 85) severityTag = "MEDIUM_RISK";
        else if (aiResult.securityScore < 95) severityTag = "LOW_RISK";

        // Save to DB
        const analysis = await prisma.analysis.create({
            data: {
                userId: user.id,
                filename: mainFile.name,
                originalCode: mainFile.content,
                optimizedCode: aiResult.optimizedCode,
                changedLines: aiResult.changedLines || { removed: [], added: [] },
                securityScore: aiResult.securityScore,
                severityTag: severityTag,
                vulnerabilities: aiResult.vulnerabilities,
                optimizations: aiResult.optimizations,
                optimizationInsights: aiResult.optimizationInsights,
                gasSavedPercent: aiResult.gasSavedPercent,
                gasProjection: gasProjection,
                mantleCompatibility: aiResult.mantleCompatibility,
                summary: aiResult.summary,
                address: address || null,
                network: normalizedNetwork
            }
        });

        res.json(analysis);
    } catch (error) {
        console.error("Create analysis error:", error?.message ?? error);
        const message =
            error instanceof Error && error.message.startsWith("AI analysis failed")
                ? error.message
                : "Analysis failed";
        res.status(500).json({ error: message });
    }
});

// 3. GET /api/analysis/history
router.get("/history", requireAuth(), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const user = await getOrCreateUser(req.auth().userId);

        const [total, records] = await Promise.all([
            prisma.analysis.count({ where: { userId: user.id } }),
            prisma.analysis.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    filename: true,
                    createdAt: true,
                    securityScore: true,
                    severityTag: true,
                    gasSavedPercent: true,
                    vulnerabilities: true,
                    address: true,
                    network: true,
                    originalCode: true,
                    optimizedCode: true
                }
            })
        ]);

        // Transform for frontend
        const formattedRecords = records.map(r => ({
            id: r.id,
            filename: r.filename,
            createdAt: r.createdAt,
            securityScore: r.securityScore,
            severityTag: r.severityTag,
            gasEfficiency: r.gasSavedPercent,
            vulnerabilityCount: Array.isArray(r.vulnerabilities) ? r.vulnerabilities.length : 0,
            address: r.address,
            network: r.network,
            originalCode: r.originalCode,
            optimizedCode: r.optimizedCode
        }));

        res.json({
            total,
            records: formattedRecords
        });
    } catch (error) {
        console.error("History fetch error:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// 3.5 POST /api/analysis/compile
router.post("/compile", requireAuth(), async (req, res) => {
    try {
        const { analysisId, useOptimized, extraFiles } = req.body;

        console.log("\n🛰️  [SENTINEL COMPILE SERVICE] INCOMING COMPILATION TRIGGERED:");
        console.log(`   🔸 Analysis ID : ${analysisId}`);
        console.log(`   🔸 Select Type : ${useOptimized ? "OPTIMIZED (AI)" : "ORIGINAL CODE"}`);
        console.log(`   🔸 Extra Files : ${extraFiles ? extraFiles.length : 0} dependency files`);
        if (extraFiles && Array.isArray(extraFiles)) {
            extraFiles.forEach((f, idx) => {
                console.log(`      📁 [File #${idx + 1}] -> "${f.name}" (${f.content ? f.content.length : 0} chars)`);
            });
        }
        console.log("=====================================================================\n");

        if (!analysisId) {
            return res.status(400).json({ error: "Analysis ID is required" });
        }

        const user = await getOrCreateUser(req.auth().userId);

        const analysis = await prisma.analysis.findFirst({
            where: {
                id: analysisId,
                userId: user.id
            }
        });

        if (!analysis) {
            return res.status(404).json({ error: "Analysis not found" });
        }

        const code = useOptimized ? analysis.optimizedCode : analysis.originalCode;
        if (!code) {
            return res.status(400).json({ error: "No Solidity code found in this analysis" });
        }

        // Clean filename for compilation (remove .sol extension)
        const contractName = analysis.filename.replace(/\.sol$/i, "");

        // Build standard files collection for the compiler, merging only extraFiles from request body
        const filesInput = [{ name: analysis.filename, content: code }];
        if (extraFiles && Array.isArray(extraFiles)) {
            extraFiles.forEach(f => {
                if (f.name && f.content && f.name !== analysis.filename) {
                    filesInput.push({ name: f.name, content: f.content });
                }
            });
        }

        const result = compileContract(filesInput, contractName);

        res.json({
            success: true,
            abi: result.abi,
            bytecode: result.bytecode,
            constructorArgs: result.abi.find((item) => item.type === "constructor")?.inputs || [],
            standardInput: result.standardInput,
            compilerVersion: result.compilerVersion
        });

    } catch (error) {
        console.error("Compilation error:", error);
        res.status(400).json({ error: error.message });
    }
});



// 4. GET /api/analysis/public/:id (Public, no auth required)
router.get("/public/:id", async (req, res) => {
    try {
        const analysis = await prisma.analysis.findUnique({
            where: {
                id: req.params.id
            }
        });

        if (!analysis) {
            return res.status(404).json({ error: "Analysis not found" });
        }

        res.json(analysis);
    } catch (error) {
        console.error("Public analysis fetch error:", error);
        res.status(500).json({ error: "Failed to fetch analysis" });
    }
});

// 5. GET /api/analysis/:id
router.get("/:id", requireAuth(), async (req, res) => {
    try {
        const user = await getOrCreateUser(req.auth().userId);
        const analysis = await prisma.analysis.findFirst({
            where: {
                id: req.params.id,
                userId: user.id
            }
        });

        if (!analysis) {
            return res.status(404).json({ error: "Analysis not found" });
        }

        res.json(analysis);
    } catch (error) {
        console.error("Single analysis fetch error:", error);
        res.status(500).json({ error: "Failed to fetch analysis" });
    }
});

// 6. PATCH /api/analysis/:id/address
router.patch("/:id/address", requireAuth(), async (req, res) => {
    try {
        const { address, network } = req.body;
        if (!address) {
            return res.status(400).json({ error: "Address is required" });
        }
        const normalizedNetwork =
            network === "testnet" || network === "mainnet" ? network : undefined;

        const user = await getOrCreateUser(req.auth().userId);
        const analysis = await prisma.analysis.findFirst({
            where: {
                id: req.params.id,
                userId: user.id
            }
        });

        if (!analysis) {
            return res.status(404).json({ error: "Analysis not found" });
        }

        const updated = await prisma.analysis.update({
            where: { id: analysis.id },
            data: {
                address,
                ...(normalizedNetwork ? { network: normalizedNetwork } : {})
            }
        });

        res.json(updated);
    } catch (error) {
        console.error("Update address error:", error);
        res.status(500).json({ error: "Failed to update contract address" });
    }
});

// 7. POST /api/analysis/verify
router.post("/verify", requireAuth(), async (req, res) => {
    try {
        const { address, contractName, compilerVersion, standardInput, constructorArgs, network } = req.body;

        const result = await verifyContract({
            address,
            contractName,
            compilerVersion,
            standardInput,
            constructorArgs,
            network
        });

        res.json({ success: true, result });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(400).json({ error: error.message });
    }
});

export default router;