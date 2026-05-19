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
      resolve(NODE_MODULES, importPath.replace("@openzeppelin/contracts/", "")),
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

  if (!mainFile.content.includes("^0.8") && !mainFile.content.match(/pragma solidity .+0\.8\./)) {
    throw new Error("Currently supporting Solidity ^0.8.x only.");
  }

  // Build sources — each file separate, never concatenated
  const sources = {};
  const extraFiles = {};  // for import resolver

  files.forEach(f => {
    sources[f.name] = { content: f.content };
    // Also index by short name and full path for resolver
    extraFiles[f.name] = f.content;
    extraFiles[f.name.split('/').pop()] = f.content;
  });

  const input = {
    language: "Solidity",
    sources,
    settings: {
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
      optimizer: { enabled: true, runs: 200 }
    }
  };

  const output = JSON.parse(
    solc.compile(JSON.stringify(input), { import: buildImportResolver(extraFiles) })
  );

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
      `To compile this contract, please add these files in the editor using the + tab button.`
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
    contractName: targetKey
  };
}
