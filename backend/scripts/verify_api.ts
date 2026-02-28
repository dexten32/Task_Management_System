import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
// We try to use the secret from process.env if available, or a fallback that might work if the server uses default
// But usually server uses .env. 'dotenv' might be needed if not running with a runner that preloads it.
const secret = process.env.JWT_SECRET;

async function verify() {
    if (!secret) {
        console.warn("WARNING: JWT_SECRET not found in env. Token generation might fail validation on server.");
    }

    console.log("1. Checking DB directly...");
    const users = await prisma.user.findMany({ take: 1 });
    console.log("DB User count:", await prisma.user.count());

    let user = users[0];
    if (!user) {
        console.log("No users found. Creating one...");
        // user = await prisma.user.create({ ... }) // skipping for now, assuming users exist
        throw new Error("No users in DB to test with.");
    } else {
        console.log("Using user:", user.email);
    }

    try {
        console.log("2. Testing API /api/users...");
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, secret || "d4f82e93aca3d0ed76031d1c08495b00b8fde2cc9a8b0cc2aa9f8766d80d3a9a");
        // Using hardcoded secret from .env view earlier as fallback if env missing in script context

        const port = process.env.PORT || 5000;
        const url = `http://localhost:${port}/api/users`;
        console.log(`Fetching ${url}...`);

        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("API Success! Users found:", data.users?.length);
        } else {
            console.log("API Failed:", response.status, await response.text());
        }

    } catch (e) {
        console.error("API Fetch Error:", e);
    }
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
