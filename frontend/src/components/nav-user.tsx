"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import {
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavUser() {
    const { isLoaded, user } = useUser()

    if (!isLoaded || !user) return null

    return (
        <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-3 p-2 font-mono uppercase tracking-widest text-xs text-on-surface-variant border-t border-wireframe mt-auto pt-4">
                <UserButton 
                    appearance={{
                        elements: {
                            userButtonAvatarBox: "w-8 h-8 rounded-none border border-neon-green/30",
                            userButtonTrigger: "focus:shadow-none"
                        }
                    }}
                />
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-neon-green font-bold">
                        {user.fullName || user.username || "Operator"}
                    </span>
                    <span className="truncate text-[9px] opacity-70 tracking-widest">
                        {user.primaryEmailAddress?.emailAddress}
                    </span>
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
