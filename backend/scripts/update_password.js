const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('--- User Password Update Script ---');

    const email = await question('Enter user email: ');
    if (!email) {
        console.error('Email is required.');
        process.exit(1);
    }

    const user = await prisma.user.findUnique({
        where: { email: email.trim() }
    });

    if (!user) {
        console.error(`User with email "${email}" not found.`);
        process.exit(1);
    }

    console.log(`Found user: ${user.name} (Role: ${user.role})`);

    const newPassword = await question('Enter new password: ');
    if (!newPassword || newPassword.length < 6) {
        console.error('Password must be at least 6 characters long.');
        process.exit(1);
    }

    const confirmPassword = await question('Confirm new password: ');
    if (newPassword !== confirmPassword) {
        console.error('Passwords do not match.');
        process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });

    console.log(`\nSUCCESS: Password updated for ${user.email}`);
}

main()
    .catch((e) => {
        console.error('\nERROR:', e.message);
    })
    .finally(async () => {
        await prisma.$disconnect();
        rl.close();
    });
