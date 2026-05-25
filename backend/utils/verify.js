
import { AbiCoder } from "ethers";

/** Etherscan expects e.g. v0.8.35+commit.47b9dedd; solc-js adds .Emscripten.clang */
function formatCompilerVersion(version) {
  const raw = String(version).replace(/^v/, "");
  const match = raw.match(/^(\d+\.\d+\.\d+\+commit\.[a-f0-9]+)/);
  if (match) {
    return `v${match[1]}`;
  }
  const clean = raw.replace(/\.Emscripten.*$/, "");
  return `v${clean}`;
}

export async function verifyContract({
  address,
  contractName,
  compilerVersion,
  standardInput,
  constructorArgs = [],
  constructorArgValues = [],
  network = "testnet"
}) {
  const chainId = network === "testnet" ? "5003" : "5000";
  const apiKey = process.env.ETHERSCAN_API_KEY;

  // Format contractname as "filename.sol:ContractName" for standard-json-input
  const baseName = contractName.replace('.sol', '')
  const formattedName = `${baseName}.sol:${baseName}`


  let encodedArgs = "";
  if (constructorArgs.length > 0 && constructorArgValues.length > 0) {
    try {
      const coder = new AbiCoder();
      const types = constructorArgs.map(a => a.type);
      encodedArgs = coder.encode(types, constructorArgValues).slice(2);
    } catch (err) {
      console.warn("[VERIFY] Could not encode constructor args:", err.message);
    }
  }

  // chainid MUST be in the URL for V2, not the POST body
  const apiBase = `https://api.etherscan.io/v2/api?chainid=${chainId}`


  const params = new URLSearchParams({
    chainid: chainId,
    module: "contract",
    action: "verifysourcecode",
    apikey: apiKey,
    contractaddress: address,
    sourceCode: JSON.stringify(standardInput),
    codeformat: "solidity-standard-json-input",
    contractname: formattedName,
    compilerversion: formatCompilerVersion(compilerVersion),
    constructorArguements: encodedArgs
  });

  const response = await fetch(apiBase, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`Etherscan API returned status ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "1") {
    throw new Error(data.result || data.message || "Verification submission failed");
  }

  console.log(`[VERIFY] Submitted successfully. GUID: ${data.result}`)
  return { guid: data.result };
}

export async function checkVerificationStatus(guid, network = "testnet") {
  const chainId = network === "testnet" ? "5003" : "5000";

  const params = new URLSearchParams({
    chainid: chainId,
    module: "contract",
    action: "checkverifystatus",
    guid,
    apikey: process.env.ETHERSCAN_API_KEY
  });

  const response = await fetch(`https://api.etherscan.io/v2/api?${params}`);
  const data = await response.json();

  return {
    status: data.result,
    isPending: data.result === "Pending in queue",
    isVerified: data.result === "Pass - Verified",
    isFailed: data.result?.startsWith("Fail")
  };
}