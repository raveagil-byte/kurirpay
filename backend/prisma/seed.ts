import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@kurirpay.com';
    const password = 'password123';
    const name = 'Super Admin';

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (!existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: Role.ADMIN,
            },
        });
        console.log(`Admin created: ${email}`);
    } else {
        console.log(`Admin already exists: ${email}`);
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
