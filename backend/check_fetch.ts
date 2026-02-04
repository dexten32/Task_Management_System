
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const taskId = 'cml7s39z30003ev680cqep25l'; // From previous log
    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                logs: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            }
        });
        console.log("Task fetched via Client:", JSON.stringify(task?.logs, null, 2));
    } catch (e) {
        console.error("Error fetching:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
