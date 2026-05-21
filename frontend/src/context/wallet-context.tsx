"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { sileo } from "sileo"

interface WalletContextType {
    walletAddress: string | null
    isMetaMaskAvailable: boolean
    connectMetaMask: () => Promise<void>
    disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false)

    useEffect(() => {
        const checkMetaMask = async () => {
            await new Promise(resolve => setTimeout(resolve, 200))
            if (typeof window !== "undefined" && !!(window as any).ethereum) {
                setIsMetaMaskAvailable(true)
                try {
                    const accounts = await (window as any).ethereum.request({ method: "eth_accounts" })
                    if (accounts && accounts.length > 0) {
                        setWalletAddress(accounts[0])
                    }
                } catch (e) {
                    console.error(e)
                }
            }
        }
        checkMetaMask()
    }, [])

    const connectMetaMask = async () => {
        if (!isMetaMaskAvailable || typeof window === "undefined" || !(window as any).ethereum) {
            sileo.error({ title: "MetaMask Missing", description: "MetaMask is not detected in your browser." })
            return
        }

        try {
            const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" })
            if (accounts && accounts.length > 0) {
                setWalletAddress(accounts[0])
                sileo.success({ title: "Wallet Connected", description: `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` })
            }
        } catch (err: any) {
            if (err.code === 4001) {
                sileo.error({ title: "Connection Rejected", description: "You rejected the MetaMask connection request." })
            } else {
                sileo.error({ title: "Connection Failed", description: err.message || "Failed to connect wallet." })
            }
        }
    }

    const disconnect = () => {
        setWalletAddress(null)
    }

    return (
        <WalletContext.Provider value={{ walletAddress, isMetaMaskAvailable, connectMetaMask, disconnect }}>
            {children}
        </WalletContext.Provider>
    )
}

export function useWallet() {
    const context = useContext(WalletContext)
    if (!context) throw new Error("useWallet must be used within WalletProvider")
    return context
}
