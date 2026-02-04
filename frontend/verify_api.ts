import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const secret = process.env.JWT_SECRET || "default_secret"; // Fallback for script

async function verify() {
    console.log("1. Checking DB directly...");
    const users = await prisma.user.findMany({ take: 1 });
    console.log("DB User count:", await prisma.user.count());

    if (users.length === 0) {
        console.log("No users found. Creating one...");
        // Create logic here if needed, but I assume users exist from previous step output
    } else {
        console.log("First user:", users[0].email);
    }

    // Note: We can't easily test the HTTP endpoint from this script without 'fetch' in Node (available in Node 18+).
    // Assuming Node 18+:
    try {
        console.log("2. Testing API /api/users (using generic token)...");
        // Create a fake valid token since we have the secret locally (hopefully matches server)
        // CAUTION: If server uses a DIFFERENT secret (e.g. from .env file that is loaded differently), this won't work.
        // But we can try.

        // We need to load .env manually for the script if not auto-loaded by runner
        // The runner usually loads .env for us.

        if (!users[0]) {
            throw new Error("No user to sign token for");
        }

        const token = jwt.sign({ id: users[0].id, role: users[0].role, email: users[0].email }, secret);

        // Looking for the PORT.
        const port = process.env.PORT || 5000;
        const response = await fetch(`http://localhost:${port}/api/users`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            console.log("API /api/users Success!", await response.json());
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
