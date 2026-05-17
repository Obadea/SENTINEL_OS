"use client"

import React, { useRef } from "react"
import { usePathname } from "next/navigation"
import { IconCirclePlusFilled, IconMail } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

function NavItem({ item, isActive }: { item: any; isActive: boolean }) {
    const iconRef = useRef<any>(null);

    return (
        <SidebarMenuItem className="mb-2">
            <SidebarMenuButton 
                tooltip={item.title} 
                asChild
                isActive={isActive}
                className={cn(
                    "font-mono uppercase tracking-widest text-xs rounded-none transition-all h-10",
                    isActive 
                        ? "bg-neon-green/10 text-neon-green border-l-2 border-neon-green font-bold"
                        : "text-on-surface-variant hover:text-neon-green hover:bg-neon-green/5 border-l-2 border-transparent"
                )}
                onPointerEnter={() => iconRef.current?.startAnimation?.()}
                onPointerLeave={() => iconRef.current?.stopAnimation?.()}
            >
                <a href={item.url} className="flex w-full items-center gap-2">
                    {item.icon && <item.icon ref={iconRef} className="text-current" />}
                    <span>{item.title}</span>
                </a>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: any
    }[]
}) {
    const pathname = usePathname();

    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col">
                <SidebarMenu>
                    {items.map((item) => {
                        const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url));
                        return <NavItem key={item.title} item={item} isActive={isActive} />
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
