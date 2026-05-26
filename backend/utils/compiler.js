import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const solc = require("solc");

const __dirname = dirname(fileURLToPath(import.meta.url));
const NODE_MODULES = resolve(__dirname, "../node_modules");

function buildImportResolver(extraFiles = {}) {
  return function findImport(importPath) {
    // Redirect OpenZeppelin v4 security paths to v5 utils paths
    const ozV4Redirects = {
      '@openzeppelin/contracts/security/ReentrancyGuard.sol': '@openzeppelin/contracts/utils/ReentrancyGuard.sol',
      '@openzeppelin/contracts/security/Pausable.sol': '@openzeppelin/contracts/utils/Pausable.sol',
    }
    if (ozV4Redirects[importPath]) {
      importPath = ozV4Redirects[importPath]
    }

    // Tier 1 — check files the user provided (multi-file upload)
    if (extraFiles[importPath]) {
      return { contents: extraFiles[importPath] };
    }

    // Also check by filename only (handles relative imports)
    const filename = importPath.split('/').pop();
    const matchByName = Object.entries(extraFiles).find(([k]) => k.endsWith(filename));
    if (matchByName) {
      return { contents: matchByName[1] };
    }

    // Tier 2 — check node_modules (handles @openzeppelin etc.)
    const searchPaths = [
      resolve(NODE_MODULES, importPath),
      resolve(NODE_MODULES, "@openzeppelin", importPath),
    ];

    for (const fullPath of searchPaths) {
      if (existsSync(fullPath)) {
        try {
          return { contents: readFileSync(fullPath, "utf8") };
        } catch {
          return { error: `Could not read: ${fullPath}` };
        }
      }
    }

    // Tier 3 — not found, return clear error
    return { error: `Import not found: ${importPath}` };
  };
}

export function compileContract(files, contractName) {
  // files = [{ name: "MyContract.sol", content: "..." }, ...]
  const mainFile = files[0];

  // if (!mainFile.content.match(/pragma\s+solidity\s+[^;]*0\.[6-9]|pragma\s+solidity\s+[^;]*[1-9]\./)) {
  //   throw new Error("Currently supporting Solidity ^0.8.x only.");
  // }

  // Build sources — each file separate, never concatenated
  const sources = {};
  const extraFiles = {};  // for import resolver

  files.forEach(f => {
    sources[f.name] = { content: f.content };
    // Also index by short name and full path for resolver
    extraFiles[f.name] = f.content;
    extraFiles[f.name.split('/').pop()] = f.content;
  });

  const compilationInput = {
    language: "Solidity",
    sources,
    settings: {
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
      optimizer: { enabled: true, runs: 200 }
    }
  };

  const verificationInput = {
    language: "Solidity",
    sources,
    settings: {
      outputSelection: { "*": { "*": ["*"] } },
      optimizer: { enabled: true, runs: 200 }
    }
  };

  const output = JSON.parse(
    solc.compile(JSON.stringify(compilationInput), { import: buildImportResolver(extraFiles) })
  );

  const warnings = output.errors?.filter(e => e.severity === "warning") || [];
  if (warnings.length > 0) {
    console.warn(`[COMPILER WARNINGS] ${contractName}:`);
    warnings.forEach(w => console.warn(' ⚠', w.message));
  }

  // Separate fatal errors from missing-import errors
  const errors = output.errors?.filter(e => e.severity === "error") || [];
  const missingImports = errors.filter(e => e.message.includes("not found"));
  const fatalErrors = errors.filter(e => !e.message.includes("not found"));

  // If ONLY missing import errors — give a helpful message
  if (missingImports.length > 0 && fatalErrors.length === 0) {
    const missing = missingImports
      .map(e => e.message.match(/Source "(.+)" not found/)?.[1])
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    throw new Error(
      `Missing imported files:\n${missing.map(m => `  • ${m}`).join('\n')}\n\n` +
      `Add these files as additional contract files in the deploy panel.`
    );
  }

  // Fatal compiler errors
  if (fatalErrors.length > 0) {
    throw new Error(fatalErrors.map(e => e.formattedMessage || e.message).join("\n"));
  }

  // Find compiled contract
  let targetContract = null;
  let targetKey = null;

  for (const [, contracts] of Object.entries(output.contracts || {})) {
    for (const [name, contract] of Object.entries(contracts)) {
      if (name.toLowerCase() === contractName.toLowerCase()) {
        targetContract = contract;
        targetKey = name;
        break;
      }
    }
    if (targetContract) break;
  }

  // Fallback to first contract found
  if (!targetContract) {
    const firstFile = Object.values(output.contracts || {})[0];
    if (firstFile) {
      targetKey = Object.keys(firstFile)[0];
      targetContract = firstFile[targetKey];
    }
  }

  if (!targetContract?.evm?.bytecode?.object) {
    throw new Error(`Could not extract bytecode for: ${contractName}`);
  }

  return {
    abi: targetContract.abi,
    bytecode: targetContract.evm.bytecode.object,
    contractName: targetKey,
    standardInput: verificationInput,
    compilerVersion: solc.version()
  };
}
