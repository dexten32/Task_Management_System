const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.update({
        where: { email: 'employee@tms.local' },
        data: { password: hashedPassword }
    });
    console.log('Password reset successfully for employee@tms.local');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
