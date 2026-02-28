
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const logs = await prisma.$queryRaw`SELECT * FROM "TaskLog" ORDER BY "createdAt" DESC LIMIT 1`;
        console.log("Last Log Raw:", logs);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
