import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
    console.log("Starting backfill of task assignees...");

    const tasks = await prisma.task.findMany({
        where: {
            assignedToId: { not: "" }, // Assuming empty string might be used, or just checking existence
        },
    });

    console.log(`Found ${tasks.length} tasks to backfill.`);

    let count = 0;
    for (const task of tasks) {
        if (task.assignedToId) {
            await prisma.task.update({
                where: { id: task.id },
                data: {
                    assignees: {
                        connect: { id: task.assignedToId },
                    },
                },
            });
            count++;
        }
    }

    console.log(`Successfully backfilled ${count} tasks.`);
}

backfill()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
