
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const userId = 'cmkmb5rbi0001evy4bataxx4p';
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    console.log("User:", user);

    const harsh = await prisma.user.findFirst({
        where: { name: { contains: 'Harsh', mode: 'insensitive' } }
    });
    console.log("Harsh User:", harsh);
}

main();
