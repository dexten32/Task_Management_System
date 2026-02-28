
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Prisma Client...');
        const task = await prisma.task.findFirst({
            select: {
                id: true,
                readableId: true,
                assignees: {
                    select: { id: true }
                }
            }
        });
        console.log('Prisma Client works. Task:', task);
    } catch (error) {
        console.error('Prisma Client failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
