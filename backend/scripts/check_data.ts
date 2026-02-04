import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkData() {
    const userCount = await prisma.user.count();
    const deptCount = await prisma.department.count();
    console.log(`Users: ${userCount}`);
    console.log(`Departments: ${deptCount}`);
}

checkData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
