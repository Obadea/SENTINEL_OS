"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import api, { setAuthToken } from "@/lib/api"
import { useAuth } from "@clerk/nextjs"
import { sileo } from "sileo"

type ScanStatus = "IDLE" | "SCANNING" | "COMPLETE" | "FAILED"

interface AuditContextType {
    code: string
    setCode: (code: string) => void
    fileName: string
    setFileName: (name: string) => void
    contractAddress: string | null
    setContractAddress: (address: string | null) => void
    scanStatus: ScanStatus
    scanProgress: number
    analysis: any | null
    analyze: (skipLog?: boolean) => Promise<void>
    importContract: (address: string, network: string) => Promise<void>
    terminalLogs: string[]
    addLog: (message: string) => void
}

const AuditContext = createContext<AuditContextType | undefined>(undefined)


export function AuditProvider({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth()
    const [code, setCode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("sentinel_code") || ""
        }
        return ""
    })
    const [fileName, setFileNameState] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("sentinel_fileName") || "[untitled].sol"
        }
        return "[untitled].sol"
    })
    const setFileName = useCallback((name: string) => {
        setFileNameState(name)
        setContractAddress(null)
    }, [])
    const [scanStatus, setScanStatus] = useState<ScanStatus>("IDLE")
    const [scanProgress, setScanProgress] = useState(0)
    const [analysis, setAnalysis] = useState<any | null>(null)
    const [terminalLogs, setTerminalLogs] = useState<string[]>([])
    const [contractAddress, setContractAddress] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("sentinel_contractAddress") || null
        }
        return null
    })

    // Persistence
    useEffect(() => {
        localStorage.setItem("sentinel_code", code)
    }, [code])

    useEffect(() => {
        localStorage.setItem("sentinel_fileName", fileName)
    }, [fileName])

    useEffect(() => {
        if (contractAddress) {
            localStorage.setItem("sentinel_contractAddress", contractAddress)
        } else {
            localStorage.removeItem("sentinel_contractAddress")
        }
    }, [contractAddress])

    const addLog = (message: string) => {
        setTerminalLogs(prev => [...prev, message])
    }

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            const token = await getToken()
            setAuthToken(token)
            const response = await api.post("/analysis/create", payload)
            return response.data
        },
        onSuccess: (data) => {
            setAnalysis(data)
            setScanStatus("COMPLETE")
            setScanProgress(100)
            sileo.success({ title: "Scan Complete", description: "Audit results are ready." })
        },
        onError: (error) => {
            setScanStatus("FAILED")
            setScanProgress(100)
            sileo.error({ title: "Analysis Failed", description: "An error occurred during the scan." })
            addLog("ERROR: Analysis engine failed to process request.")
        }
    })

    const analyze = useCallback(async (skipLog: boolean = false) => {
        if (scanStatus === "SCANNING") return

        setScanStatus("SCANNING")
        setScanProgress(0)
        setAnalysis(null)

        if (!skipLog) {
            addLog("sentinel@mantle:~/workspace$ analyze")
        }

        // Progress simulation
        const interval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 95) {
                    clearInterval(interval)
                    return prev
                }
                const increment = Math.random() * 5
                return Math.min(prev + increment, 95)
            })
        }, 300)

        setTimeout(() => addLog("Compiling 1 file with 0.8.20..."), 500)
        setTimeout(() => addLog("Compilation finished successfully."), 1200)
        setTimeout(() => addLog("Starting vulnerability scan..."), 1800)
        setTimeout(() => addLog(`Analyzing ${fileName}...`), 2500)

        // Trigger actual API call
        mutation.mutate({
            files: [{ name: fileName, content: code }],
            address: contractAddress
        }, {
            onSettled: () => {
                clearInterval(interval)
            }
        })
    }, [code, fileName, scanStatus, mutation, contractAddress])

    const importContract = useCallback(async (address: string, network: string) => {
        addLog(`sentinel@mantle:~/workspace$ import-contract ${address} --network ${network}`);
        addLog(`INFO: Connecting to Mantle Blockscout Explorer (${network})...`);
        
        try {
            const token = await getToken();
            setAuthToken(token);
            
            const response = await api.get("/analysis/import-contract", {
                params: { address, network }
            });
            
            const { files, contractName } = response.data;
            
            if (files && files.length > 0) {
                // If there are multiple files, combine them with file headers for the Monaco Editor
                const combinedCode = files.map((file: any) => `// File: ${file.name}\n\n${file.content}`).join("\n\n");
                setCode(combinedCode);
                setFileName(`${contractName}.sol`);
                setContractAddress(address);
                addLog(`SUCCESS: Loaded contract source from Mantle Explorer.`);
                addLog(`SUCCESS: File saved as ${contractName}.sol`);
                sileo.success({ 
                    title: "Import Successful", 
                    description: `Contract ${contractName} imported and loaded.` 
                });
            } else {
                throw new Error("No source code returned");
            }
        } catch (error: any) {
            console.error("Contract import error:", error);
            const errorMsg = error.response?.data?.error || error.message || "Failed to import contract";
            addLog(`ERROR: ${errorMsg}`);
            sileo.error({ 
                title: "Import Failed", 
                description: errorMsg 
            });
            throw error;
        }
    }, [getToken, setCode, setFileName, setContractAddress]);

    return (
        <AuditContext.Provider value={{
            code,
            setCode,
            fileName,
            setFileName,
            contractAddress,
            setContractAddress,
            scanStatus,
            scanProgress,
            analysis,
            analyze,
            importContract,
            terminalLogs,
            addLog
        }}>
            {children}
        </AuditContext.Provider>
    )
}

export function useAudit() {
    const context = useContext(AuditContext)
    if (context === undefined) {
        throw new Error("useAudit must be used within an AuditProvider")
    }
    return context
}
