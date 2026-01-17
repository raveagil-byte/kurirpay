
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') }); // Assuming script is in backend/prisma

const prisma = new PrismaClient();

async function main() {
    const email = 'recovery@kurirpay.com';
    const password = 'recovery123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating Emergency Admin: ${email}...`);

    try {
        // Check if exists
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
            console.log("User exists, updating password...");
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword, role: Role.ADMIN }
            });
        } else {
            console.log("User creating...");
            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: "Emergency Admin",
                    role: Role.ADMIN
                }
            });
        }

        console.log(`SUCCESS: Emergency Admin created.`);
        console.log(`Email: ${email}`);
        console.log(`Pass : ${password}`);

    } catch (error) {
        console.error("FAILED to create admin:", error);
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
