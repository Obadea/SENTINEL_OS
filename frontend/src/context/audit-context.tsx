"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import api, { setAuthToken } from "@/lib/api"
import { useAuth } from "@clerk/nextjs"
import { sileo } from "sileo"

type ScanStatus = "IDLE" | "SCANNING" | "COMPLETE" | "FAILED"

export interface ContractTab {
    id: string
    code: string
    fileName: string
    contractAddress: string | null
    scanStatus: ScanStatus
    scanProgress: number
    analysis: any | null
    terminalLogs: string[]
}

interface AuditContextType {
    tabs: ContractTab[]
    activeTabId: string
    setActiveTabId: (id: string) => void
    addTab: (fileName?: string, code?: string, contractAddress?: string | null) => void
    removeTab: (id: string) => void
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

    const getInitialTabs = (): ContractTab[] => {
        if (typeof window === "undefined") {
            return []
        }
        const savedTabs = localStorage.getItem("sentinel_tabs")
        if (savedTabs) {
            try {
                return JSON.parse(savedTabs)
            } catch (e) {
                console.error("Failed to parse saved tabs", e)
            }
        }
        // Fallback / migration from legacy single-contract storage
        const legacyCode = localStorage.getItem("sentinel_code") || `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract SentinelSecurity {\n    address public owner;\n\n    constructor() {\n        owner = msg.sender;\n    }\n}`
        const legacyFileName = localStorage.getItem("sentinel_fileName") || "SentinelSecurity.sol"
        const legacyAddress = localStorage.getItem("sentinel_contractAddress") || null

        return [
            {
                id: "tab-1",
                code: legacyCode,
                fileName: legacyFileName,
                contractAddress: legacyAddress,
                scanStatus: "IDLE",
                scanProgress: 0,
                analysis: null,
                terminalLogs: ["sentinel@mantle:~/workspace$ "]
            }
        ]
    }

    const [tabs, setTabs] = useState<ContractTab[]>(getInitialTabs)
    const [activeTabId, setActiveTabId] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("sentinel_activeTabId")
            if (saved) return saved
        }
        const initialTabs = getInitialTabs()
        return initialTabs.length > 0 ? initialTabs[0].id : "tab-1"
    })

    // Persistence
    useEffect(() => {
        localStorage.setItem("sentinel_tabs", JSON.stringify(tabs))
    }, [tabs])

    useEffect(() => {
        localStorage.setItem("sentinel_activeTabId", activeTabId)
    }, [activeTabId])

    // Find the active tab, fallback to first tab or a default dummy tab if empty
    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0] || {
        id: "tab-1",
        code: "",
        fileName: "[untitled].sol",
        contractAddress: null,
        scanStatus: "IDLE" as const,
        scanProgress: 0,
        analysis: null,
        terminalLogs: ["sentinel@mantle:~/workspace$ "]
    }

    const setCode = useCallback((newCode: string) => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, code: newCode } : t))
    }, [activeTabId])

    const setFileName = useCallback((name: string) => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, fileName: name, contractAddress: null } : t))
    }, [activeTabId])

    const setContractAddress = useCallback((address: string | null) => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, contractAddress: address } : t))
    }, [activeTabId])

    const addLog = useCallback((message: string) => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, terminalLogs: [...t.terminalLogs, message] } : t))
    }, [activeTabId])

    const addTab = useCallback((fileName?: string, code?: string, contractAddress?: string | null) => {
        if (tabs.length >= 3) {
            sileo.warning({ title: "Max Tabs Reached", description: "You can open a maximum of 3 contracts at a time." })
            return
        }
        const nextIndex = tabs.length + 1
        const id = `tab-${Date.now()}`
        const newTab: ContractTab = {
            id,
            code: code || `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract NewContract {\n    // Add contract code here\n}`,
            fileName: fileName || `UntitledContract-${nextIndex}.sol`,
            contractAddress: contractAddress || null,
            scanStatus: "IDLE",
            scanProgress: 0,
            analysis: null,
            terminalLogs: code
                ? ["sentinel@mantle:~/workspace$ ", `SUCCESS: Loaded file: ${fileName}`]
                : ["sentinel@mantle:~/workspace$ "]
        }
        setTabs(prev => [...prev, newTab])
        setActiveTabId(id)
        sileo.success({ title: "New Workspace", description: `Created tab: ${newTab.fileName}` })
    }, [tabs])

    const removeTab = useCallback((idToRemove: string) => {
        if (tabs.length <= 1) {
            sileo.warning({ title: "Cannot Close", description: "You must keep at least one contract open." })
            return
        }
        
        // Find next active tab before filtering
        const remaining = tabs.filter(t => t.id !== idToRemove)
        setTabs(remaining)
        
        if (activeTabId === idToRemove) {
            setActiveTabId(remaining[remaining.length - 1].id)
        }
    }, [tabs, activeTabId])

    const mutation = useMutation({
        mutationFn: async (payload: { files: any[], address: string | null, tabId: string, fileName: string }) => {
            const token = await getToken()
            setAuthToken(token)
            const response = await api.post("/analysis/create", {
                files: payload.files,
                address: payload.address
            })
            return response.data
        },
        onSuccess: (data, variables) => {
            setTabs(prev => prev.map(t => t.id === variables.tabId ? {
                ...t,
                analysis: data,
                scanStatus: "COMPLETE",
                scanProgress: 100
            } : t))
            sileo.success({ title: "Scan Complete", description: `Audit for ${variables.fileName} is ready.` })
        },
        onError: (error, variables) => {
            setTabs(prev => prev.map(t => t.id === variables.tabId ? {
                ...t,
                scanStatus: "FAILED",
                scanProgress: 100,
                terminalLogs: [...t.terminalLogs, "ERROR: Analysis engine failed to process request."]
            } : t))
            sileo.error({ title: "Analysis Failed", description: `Scan for ${variables.fileName} failed.` })
        }
    })

    const analyze = useCallback(async (skipLog: boolean = false) => {
        const targetTabId = activeTabId
        const targetTab = tabs.find(t => t.id === targetTabId)
        if (!targetTab) return
        if (targetTab.scanStatus === "SCANNING") {
            sileo.warning({ title: "Scan in Progress", description: "An analysis is already running for this contract." })
            return
        }

        // Set status to SCANNING
        setTabs(prev => prev.map(t => t.id === targetTabId ? {
            ...t,
            scanStatus: "SCANNING",
            scanProgress: 0,
            analysis: null,
            terminalLogs: skipLog ? t.terminalLogs : [...t.terminalLogs, "sentinel@mantle:~/workspace$ analyze"]
        } : t))

        // Progress simulation
        const interval = setInterval(() => {
            setTabs(prev => prev.map(t => {
                if (t.id === targetTabId) {
                    if (t.scanProgress >= 95) {
                        clearInterval(interval)
                        return t
                    }
                    const increment = Math.random() * 5
                    return {
                        ...t,
                        scanProgress: Math.min(t.scanProgress + increment, 95)
                    }
                }
                return t
            }))
        }, 300)

        // Log simulation timeouts
        const addSimulatedLog = (msg: string) => {
            setTabs(prev => prev.map(t => t.id === targetTabId ? {
                ...t,
                terminalLogs: [...t.terminalLogs, msg]
            } : t))
        }

        setTimeout(() => addSimulatedLog("Compiling 1 file with 0.8.20..."), 500)
        setTimeout(() => addSimulatedLog("Compilation finished successfully."), 1200)
        setTimeout(() => addSimulatedLog("Starting vulnerability scan..."), 1800)
        setTimeout(() => addSimulatedLog(`Analyzing ${targetTab.fileName}...`), 2500)

        // Trigger actual API call
        mutation.mutate({
            files: [{ name: targetTab.fileName, content: targetTab.code }],
            address: targetTab.contractAddress,
            tabId: targetTabId,
            fileName: targetTab.fileName
        }, {
            onSettled: () => {
                clearInterval(interval)
            }
        })
    }, [activeTabId, tabs, mutation])

    const importContract = useCallback(async (address: string, network: string) => {
        if (tabs.length >= 3) {
            const errorMsg = "Max Tabs Reached. Please close an existing tab before importing a new contract."
            sileo.warning({
                title: "Max Tabs Reached",
                description: "You can open a maximum of 3 contracts at a time."
            })
            throw new Error(errorMsg)
        }

        try {
            const token = await getToken()
            setAuthToken(token)

            const response = await api.get("/analysis/import-contract", {
                params: { address, network }
            })

            const { files, contractName } = response.data

            if (files && files.length > 0) {
                // If there are multiple files, combine them
                const combinedCode = files.map((file: any) => `// File: ${file.name}\n\n${file.content}`).join("\n\n")

                // Open a new tab for this imported contract
                const id = `tab-${Date.now()}`
                const newTab: ContractTab = {
                    id,
                    code: combinedCode,
                    fileName: `${contractName}.sol`,
                    contractAddress: address,
                    scanStatus: "IDLE",
                    scanProgress: 0,
                    analysis: null,
                    terminalLogs: [
                        "sentinel@mantle:~/workspace$ ",
                        `sentinel@mantle:~/workspace$ import-contract ${address} --network ${network}`,
                        `INFO: Connecting to Mantle Blockscout Explorer (${network})...`,
                        `SUCCESS: Loaded contract source from Mantle Explorer.`,
                        `SUCCESS: File saved as ${contractName}.sol`
                    ]
                }

                setTabs(prev => [...prev, newTab])
                setActiveTabId(id)

                sileo.success({
                    title: "Import Successful",
                    description: `Contract ${contractName} imported and loaded.`
                })
            } else {
                throw new Error("No source code returned")
            }
        } catch (error: any) {
            console.error("Contract import error:", error)
            const errorMsg = error.response?.data?.error || error.message || "Failed to import contract"
            sileo.error({
                title: "Import Failed",
                description: errorMsg
            })
            throw error
        }
    }, [getToken, tabs])

    return (
        <AuditContext.Provider value={{
            tabs,
            activeTabId,
            setActiveTabId,
            addTab,
            removeTab,
            code: activeTab.code,
            setCode,
            fileName: activeTab.fileName,
            setFileName,
            contractAddress: activeTab.contractAddress,
            setContractAddress,
            scanStatus: activeTab.scanStatus,
            scanProgress: activeTab.scanProgress,
            analysis: activeTab.analysis,
            analyze,
            importContract,
            terminalLogs: activeTab.terminalLogs,
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

