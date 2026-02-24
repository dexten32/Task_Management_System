import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const log = await prisma.taskLog.findFirst({
        where: {
            userId: { not: null }
        },
        include: {
            user: {
                select: { name: true, role: true }
            }
        }
    });
    console.log(JSON.stringify(log, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
