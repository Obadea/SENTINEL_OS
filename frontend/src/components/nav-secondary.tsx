"use client"

import React, { useRef } from "react"
import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"

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
                asChild 
                isActive={isActive}
                className={cn(
                    "font-mono uppercase tracking-widest text-xs rounded-none transition-all h-10",
                    isActive 
                        ? "bg-neon-violet/10 text-neon-violet border-l-2 border-neon-violet font-bold"
                        : "text-on-surface-variant hover:text-neon-violet hover:bg-neon-violet/5 border-l-2 border-transparent"
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

export function NavSecondary({
    items,
    ...props
}: {
    items: {
        title: string
        url: string
        icon?: any
    }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    const pathname = usePathname();

    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        const isActive = pathname === item.url || (item.url !== "/dashboard" && item.url !== "#" && pathname.startsWith(item.url));
                        return <NavItem key={item.title} item={item} isActive={isActive} />
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
