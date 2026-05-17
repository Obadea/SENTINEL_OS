import { inngest } from "./client.js";
import prisma from "../prisma/client.js";

export const syncUser = inngest.createFunction(
    {
        id: "sync-user-from-clerk",
        triggers: [{ event: "clerk/user.created" }],
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses } = event.data;
        const email = email_addresses[0]?.email_address;
        const name = `${first_name || ""} ${last_name || ""}`.trim();

        await prisma.user.upsert({
            where: { clerkId: id },
            update: {
                email,
                name: name || undefined,
            },
            create: {
                clerkId: id,
                email,
                name: name || undefined,
            },
        });
    }
);

export const updateUser = inngest.createFunction(
    {
        id: "update-user-from-clerk",
        triggers: [{ event: "clerk/user.updated" }],
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses } = event.data;
        const email = email_addresses[0]?.email_address;
        const name = `${first_name || ""} ${last_name || ""}`.trim();

        await prisma.user.update({
            where: { clerkId: id },
            data: {
                email,
                name: name || undefined,
            },
        });
    }
);

export const deleteUser = inngest.createFunction(
    {
        id: "delete-user-from-clerk",
        triggers: [{ event: "clerk/user.deleted" }],
    },
    async ({ event }) => {
        const { id } = event.data;

        await prisma.user.delete({
            where: { clerkId: id },
        });
    }
);
