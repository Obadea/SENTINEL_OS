"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sileo"
import { useState } from "react"
import { AuditProvider } from "@/context/audit-context"

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                retry: 1,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            <AuditProvider>
                <Toaster
                    position="top-center"
                    theme="light"
                    options={{
                        styles: {
                            description: "font-mono",
                        }
                    }}
                />
                {children}
            </AuditProvider>
        </QueryClientProvider>
    )
}

