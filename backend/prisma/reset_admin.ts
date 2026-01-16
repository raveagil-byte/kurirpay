
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@kurirpay.com';
    const newPassword = '4dm1nkurirpay';

    console.log(`Resetting password for ${email}...`);

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        console.log(`SUCCESS: Password updated to '${newPassword}' for user ${user.email}`);
    } catch (error) {
        console.error("Error updating password:", error);
        console.log("Pastikan user admin@kurirpay.com sudah ada.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
