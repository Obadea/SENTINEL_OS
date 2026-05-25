"use client"

import React, { useRef } from "react"
import { usePathname } from "next/navigation"

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type NavSecondaryItem = {
    title: string
    url?: string
    /** Animated sidebar icons (SettingsIcon, CircleHelpIcon, etc.) */
    icon?: React.ComponentType<any>
    action?: "settings" | "help"
}

function NavItem({
    item,
    isActive,
    onAction,
}: {
    item: NavSecondaryItem
    isActive: boolean
    onAction?: (action: "settings" | "help") => void
}) {
    const iconRef = useRef<{ startAnimation?: () => void; stopAnimation?: () => void }>(null)
    const buttonClass = cn(
        "font-mono uppercase tracking-widest text-xs rounded-none transition-all h-10 w-full",
        isActive
            ? "bg-neon-violet/10 text-neon-violet border-l-2 border-neon-violet font-bold"
            : "text-on-surface-variant hover:text-neon-violet hover:bg-neon-violet/5 border-l-2 border-transparent"
    )
    const iconHandlers = {
        onPointerEnter: () => iconRef.current?.startAnimation?.(),
        onPointerLeave: () => iconRef.current?.stopAnimation?.(),
    }

    if (item.action) {
        return (
            <SidebarMenuItem className="mb-2">
                <SidebarMenuButton
                    isActive={isActive}
                    className={buttonClass}
                    onClick={() => onAction?.(item.action!)}
                    {...iconHandlers}
                >
                    <span className="flex w-full items-center gap-2">
                        {item.icon && <item.icon ref={iconRef} className="text-current" />}
                        <span>{item.title}</span>
                    </span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }

    return (
        <SidebarMenuItem className="mb-2">
            <SidebarMenuButton
                asChild
                isActive={isActive}
                className={buttonClass}
                {...iconHandlers}
            >
                <a href={item.url ?? "#"} className="flex w-full items-center gap-2">
                    {item.icon && <item.icon ref={iconRef} className="text-current" />}
                    <span>{item.title}</span>
                </a>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

export function NavSecondary({
    items,
    onAction,
    ...props
}: {
    items: NavSecondaryItem[]
    onAction?: (action: "settings" | "help") => void
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    const pathname = usePathname()

    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        const isActive =
                            !item.action &&
                            (pathname === item.url ||
                                (!!item.url &&
                                    item.url !== "/dashboard" &&
                                    item.url !== "#" &&
                                    pathname.startsWith(item.url)))
                        return (
                            <NavItem
                                key={item.title}
                                item={item}
                                isActive={!!isActive}
                                onAction={onAction}
                            />
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
